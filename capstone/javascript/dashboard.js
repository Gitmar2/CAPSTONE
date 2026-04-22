// ── Days remaining calc ──
async function fetchEmployees(page=0,size=1000){
    try {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`http://192.168.206.1:5500/api/employee?page=${page}&size=${size}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });
        if (!res.ok) throw new Error("Failed to get employee");
        const data = await res.json();
        return {
            items: data.content || [],
            totalCount: data.totalElements || 0
        };
    } catch (err) {
        console.error(err);
        return { items: [], totalCount: 0 };    }
}

async function fetchPayroll() {
    try {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch("http://localhost:8081/payroll/cutoff", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });
        if (!res.ok) throw new Error("Failed to get payroll data");
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }       
}

function groupByDepartment(employees) {
    const deptCount = {};

    employees.forEach(emp => {
        const dept = emp.employeeDepartment ?? "Unknown";
        deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    return deptCount;
}
function renderPercentPanel(sorted, total) {
    const panel = document.querySelector('.percent-panel');

    panel.querySelectorAll('.percent-item').forEach(el => el.remove());

    sorted.forEach(([dept, count]) => {
        const pct = Math.round((count / total) * 100);
        const color = stringToColor(dept);

        const item = document.createElement('div');
        item.className = 'percent-item';
        item.innerHTML = `
            <div class="dept-name">${dept}</div>
            <div class="bar-row">
                <div class="bar-bg">
                    <div class="bar-fill" style="width:${pct}%; background:${color};"></div>
                </div>
                <div class="pct-label" style="color:#3d4142;">${pct}%</div>
            </div>
        `;
        panel.appendChild(item);
    });
}
// ── Build Chart ──
const ctx = document.getElementById('deptChart').getContext('2d');
let deptChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
        datasets: []
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display:false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x}`
                }
            }
        },
        scales: {
            x: {
                min: 0,
                ticks: { stepSize: 1, precision: 0, font: { size: 12 } },
                grid: { color: 'rgba(0,0,0,0.06)' },
                title: {
                    display: true,
                    text: 'Number of Employees',
                    font: { size: 13 }
                }
            },
            y: {
                ticks: { font: { size: 13 }, color: '#333' },
                grid: { display: false }
            }
        },
        layout: { padding: { right: 8 } }
    }
});

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 50%)`; 
}

async function init() {
    const { items: employees, totalCount } = await fetchEmployees();
    const payrollData = await fetchPayroll();

    if(payrollData && payrollData.length > 0){
        const payroll = payrollData[0];
        const startDate = payroll.startDate ? new Date(payroll.startDate) : null;
        const endDate = payroll.endDate ? new Date(payroll.endDate) : null;
        const fmt = d => d ? `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}` : 'N/A';
        document.querySelector('.stat-main').textContent = `${fmt(startDate)} - ${fmt(endDate)}`;
        if (endDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffMs = endDate - today;
            const daysLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            document.getElementById('daysRemaining').textContent = daysLeft;
        }
        const generated = payrollData.filter(p => p.dateProcessed !== null).length;
        document.getElementById('payrollGenerated').textContent = generated;
    }

    if (!employees || employees.length === 0) {
        console.warn("No employees returned from API.");
        return;
    }

    document.getElementById('totalEmployee').textContent = totalCount;

    const deptCount = groupByDepartment(employees);
    const sorted = Object.entries(deptCount).sort((a, b) => b[1] - a[1]);
    const total = totalCount;

    const labels = sorted.map(([dept]) => dept);
    const counts = sorted.map(([, count]) => count);
    const colors = labels.map(dept => stringToColor(dept));
    const maxVal = Math.max(...counts, 1);

    deptChart.data.labels = labels;
    deptChart.data.datasets = [{
        label: 'Employees',
        data: counts,
        backgroundColor: colors,
        borderRadius: 5,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8
    }];

    deptChart.options.scales.x.max = Math.ceil((maxVal + 1) / 5) * 5;
    deptChart.options.scales.x.ticks.stepSize = Math.max(1, Math.floor(maxVal / 5));

    deptChart.update();
    renderPercentPanel(sorted, total);
}
function handleLogOut(){
    localStorage.removeItem('jwtToken')
    sessionStorage.clear();
    window.location.href = "./html/login.html"
}
init();