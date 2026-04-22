let currentPage = 0;

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('show');
    m && m.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('show');
    m && m.setAttribute('aria-hidden', 'true');
}

const addBtn = document.getElementById('addEmployeeBtn');
if (addBtn) addBtn.addEventListener('click', () => openModal('addModal'));

const editBtn = document.getElementById('editEmployeeBtn');
if (editBtn) editBtn.addEventListener('click', () => openModal('editModal'));

document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
        const id = el.getAttribute('data-close');
        closeModal(id);
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        e.target.setAttribute('aria-hidden', 'true');
    }
});

function appendEmployeeRow(emp, table) {
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    
    const displayType = emp.employeeEmploymentType ? emp.employeeEmploymentType.replaceAll("_", " ") : "N/A";

    tr.innerHTML = `
        <td>${emp.employeeFirstName} ${emp.employeeLastName}</td>
        <td>${emp.employeeContactNumber || "N/A"}</td>
        <td>${emp.employeeEmail || "N/A"}</td>
        <td>${emp.employeeGender || "N/A"}</td>
        <td>${displayType}</td>
        <td>${emp.employeeDepartment || "N/A"}</td>
    `;

    const actionTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.classList.add("emp-more-btn");
    btn.textContent = "View";
    btn.addEventListener("click", () => openEmployeeDetails(emp));
    
    actionTd.appendChild(btn);
    tr.appendChild(actionTd);

    tbody.prepend(tr);

    if (tbody.children.length > 10) {
        tbody.removeChild(tbody.lastElementChild);
    }
}

function connectAddEmployeeForm() {
    const addEmployeeForm = document.getElementById("addEmployeeForm");

    if (!addEmployeeForm) {
        console.error("Add Employee form not found!");
        return;
    }

    addEmployeeForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(addEmployeeForm);
        const employmentType = formData.get("employeeEmploymentType");

        const data = {
            employeeFirstName: formData.get("firstName"),
            employeeLastName: formData.get("lastName"),
            employeeAddress: formData.get("address"),
            employeeEmail: formData.get("email"),
            employeeContactNumber: formData.get("contact"),
            employeeGender: formData.get("gender")?.toUpperCase(),
            employeeEmploymentType: formData.get("employeeEmploymentType"),
            dateOfHire: formData.get("dateofhire"),
            employeeDepartment: formData.get("department"),
        };
        
        if(employmentType === "Regular"){
            data.monthlySalary = Number(formData.get("rate"));
        }else{
            data.employeeRate = Number(formData.get("rate"));
        }

        try {
            const token = localStorage.getItem("jwtToken");

            const res = await fetch("http://localhost:8081/api/employee", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error("Failed to add employee");

            const result = await res.json();
            console.log(result);

            const table = document.querySelector(".emp-table");
            if (table) appendEmployeeRow(result, table);

            addEmployeeForm.reset();

        } catch (err) {
            console.error(err);
            alert("Error adding employee: " + err.message);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    connectAddEmployeeForm();
});


//EMPLOYEE DIALOG
async function openEmployeeDetails(emp) {
    if (!window.employeeDialog) return;

    document.getElementById("emp-first-name").textContent = emp.employeeFirstName;
    document.getElementById("emp-last-name").textContent = emp.employeeLastName;
    document.getElementById("emp-address").textContent = emp.employeeAddress || "N/A";
    document.getElementById("emp-contact").textContent = emp.employeeContactNumber || "N/A";
    document.getElementById("emp-email").textContent = emp.employeeEmail;

    document.getElementById("doj").textContent = emp.dateOfHire || "N/A";
    document.getElementById("emp-type").textContent = emp.employeeEmploymentType ? emp.employeeEmploymentType.replaceAll("_"," ") : "N/A";
    document.getElementById("emp-dep").textContent = emp.employeeDepartment || "N/A";
    
    const rateDisplay = emp.employeeEmploymentType === "REGULAR" ? emp.monthlySalary : emp.employeeRate;
    document.getElementById("emp-rate").textContent = rateDisplay || "0";

    // Set up delete button naka link sa employee-details.html button id="dialog-button-delete"
    const deleteDialogBtn = document.getElementById("dialog-button-delete");
    deleteDialogBtn.onclick = () => deleteEmployee(emp.employeeId, emp);
    // =============================================

    window.employeeDialog.showModal();
}

async function loadIntoTable(url, table,page=0) {
    currentPage = page;
    const tableBody = table.querySelector("tbody");
    const token = localStorage.getItem("jwtToken");
    
    tableBody.innerHTML = Array(10).fill(`
        <tr class="skeleton-row">
            <td><div class="skeleton"></div></td>
            <td><div class="skeleton"></div></td>
            <td><div class="skeleton"></div></td>
            <td><div class="skeleton"></div></td>
            <td><div class="skeleton"></div></td>
            <td><div class="skeleton"></div></td>
            <td><div class="skeleton skeleton-badge"></div></td>
        </tr>
    `).join("");

    try {
        const response = await fetch(`${url}?page=${page}&size=10`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
    
        if (!response.ok) throw new Error("Failed to fetch employees");
        const pageData = await response.json();
        const employees = pageData.content;

        if (!employees || employees.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center">No employees found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = "";

        employees.forEach(emp => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${emp.employeeFirstName} ${emp.employeeLastName}</td>
                <td>${emp.employeeContactNumber || "N/A"}</td>
                <td>${emp.employeeEmail}</td>
                <td>${emp.employeeGender || "N/A"}</td>
                <td>${emp.employeeEmploymentType ? emp.employeeEmploymentType.replaceAll("_"," ") : "N/A"}</td>
                <td>${emp.employeeDepartment || "N/A"}</td>
            `;

            const actionTd = document.createElement("td");
            const btn = document.createElement("button");
            btn.classList.add("emp-more-btn");
            btn.textContent = "View";
            btn.addEventListener("click", () => openEmployeeDetails(emp));
            
            actionTd.appendChild(btn);
            tr.appendChild(actionTd);
            tableBody.appendChild(tr);
        });
        renderPagination(pageData.number,pageData.totalPages,url,table)
    } catch (error) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="7">Error loading data</td></tr>`;
    }
    
}

async function loadDialog() {
    const res = await fetch("../html/employee-details.html");
    const html = await res.text();
    document.getElementById("dialog-container")
        .insertAdjacentHTML("beforeend", html);

    const dialog = document.getElementById("employee-dialog");

    dialog.addEventListener("click", (event) => {
        const rect = dialog.getBoundingClientRect();
        const inside =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;

        if (!inside) dialog.close();
    });

    window.employeeDialog = dialog;
}

function renderPagination(current, totalPages,url,table) {
    let pagination = document.querySelector(".pagination");
    if (!pagination) {
        pagination = document.createElement("div");
        pagination.className = "pagination";
        document.querySelector(".emp-table").after(pagination);
    }

    const prevBtn = `<button id="prevBtn" ${current === 0 ? "disabled" : ""}>← Prev</button>`;
    const nextBtn = `<button id="nextBtn" ${current + 1 >= totalPages ? "disabled" : ""}>Next →</button>`;

    pagination.innerHTML = `
        ${prevBtn}
        <span>Page ${current + 1} of ${totalPages}</span>
        ${nextBtn}
    `;

    document.getElementById("prevBtn").addEventListener("click", () => populatePayrollTable(currentPage - 1));
    document.getElementById("nextBtn").addEventListener("click", () => populatePayrollTable(currentPage + 1));

}

function changePage(page) {
    currentPage = page;
    populatePayrollTable(currentPage);
}

document.addEventListener("DOMContentLoaded", async () => {
    loadDialog();  // wait for dialog to laod
    loadIntoTable("http://localhost:8081/api/employee", document.querySelector(".emp-table"),0);
});

// Delete Employee function  
async function deleteEmployee(employeeId, emp) {
    const confirmed = confirm(`Are you sure you want to delete ${emp.employeeFirstName} ${emp.employeeLastName}?`);
    if (!confirmed) return;

    try {
        const token = localStorage.getItem("jwtToken");

        const res = await fetch(`http://localhost:8081/api/employee/${employeeId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to delete employee");

        // Close dialog
        window.employeeDialog.close();

        // Reload the table
        loadIntoTable("http://localhost:8081/api/employee", document.querySelector(".emp-table"), currentPage);

        alert("Employee deleted successfully!");

    } catch (err) {
        console.error(err);
        alert("Error deleting employee: " + err.message);
    }
}
// =============================================