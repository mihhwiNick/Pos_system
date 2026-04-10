let allPayrollData = []; // Lưu trữ để lọc nhanh (Client-side filtering)

document.addEventListener("DOMContentLoaded", () => {
    // 1. Khởi tạo mặc định: Chọn tháng hiện tại
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filterInput = document.getElementById("filter-period");
    
    if (filterInput) {
        filterInput.value = currentMonthStr;
    }

    // 2. Tải dữ liệu lần đầu
    fetchPayroll();
});

// Hàm lấy dữ liệu từ Backend
async function fetchPayroll() {
    const period = document.getElementById("filter-period").value;
    if (!period) return;
    const [year, month] = period.split("-");

    const tbody = document.getElementById("payroll-list");
    tbody.innerHTML = "<tr><td colspan='7' class='text-center'>Đang tính toán lương tháng " + month + "...</td></tr>";

    try {
        const response = await fetch(`http://127.0.0.1:5001/payroll/?month=${parseInt(month)}&year=${year}`);
        allPayrollData = await response.json();

        renderPayroll(allPayrollData);
    } catch (e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan='7' style='color:red;' class='text-center'>Lỗi kết nối Server!</td></tr>";
    }
}

function renderPayroll(data) {
    const tbody = document.getElementById("payroll-list");
    tbody.innerHTML = "";

    data.forEach((item, index) => { // Thêm index ở đây
        const finalTotal = parseFloat(item.final_salary) || 0;
        
        // 🚀 TRUYỀN index CỦA MẢNG VÀO ĐỂ LẤY FULL DỮ LIỆU
        const actionHtml = item.status === 1 
            ? `<span class="status-published">✅ Đã công bố</span>` 
            : `<button class="btn-publish" onclick="publishPayroll(${index})">Công bố</button>`;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.full_name}</td>
            <td>${item.actual_workdays || 0} / ${item.standard_workdays || 26}</td>
            <td class="text-right">
                ${Math.round(item.base_actual || 0).toLocaleString()} / ${Math.round(item.base_salary || 0).toLocaleString()} VNĐ
            </td>
            <td class="text-right" style="color: #3498db; font-weight: 600;">
                ${Math.round(item.total_commission || 0).toLocaleString()} VNĐ
            </td>
            <td class="text-right" style="color: #e74c3c; font-weight: bold">
                ${Math.round(finalTotal).toLocaleString()} VNĐ
            </td>
            <td>${actionHtml}</td> `;
        tbody.appendChild(row);
    });
}

let currentPublishItem = null;

function showStatus(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

function publishPayroll(index) {
    // Lấy đúng object nhân viên từ mảng dữ liệu dựa trên index
    currentPublishItem = allPayrollData[index]; 
    
    const period = document.getElementById("filter-period").value;
    const [year, month] = period.split("-");

    // Đổ dữ liệu vào Modal
    document.getElementById("confirm-emp-name").innerText = currentPublishItem.full_name;
    document.getElementById("confirm-period-text").innerText = `Kỳ lương: Tháng ${month}/${year}`;
    
    // Gán sự kiện click
    document.getElementById("final-confirm-btn").onclick = executePublish;

    // Hiện Modal
    document.getElementById("publishModal").style.display = "flex";
}

// 2. Hàm đóng Modal
function closeConfirmModal() {
    document.getElementById("publishModal").style.display = "none";
    currentPublishItem = null;
}

// 3. Hàm thực thi (gọi API)
async function executePublish() {
    if (!currentPublishItem) return;
    
    const item = currentPublishItem;
    const payload = {
        employee_id: item.employee_id,
        period_id: item.period_id, // Lấy từ object mà Backend vừa trả về kkk
        base_salary_snapshot: item.base_salary,
        actual_base_salary: item.base_actual,
        total_commission: item.total_commission,
        total_workdays: item.actual_workdays || 0,
        final_salary: item.final_salary || 0
    };

    console.log("🚀 Đang gửi dữ liệu công bố:", payload); // Kiểm tra xem period_id có bị null không kkk

    try {
        const response = await fetch(`http://127.0.0.1:5001/payroll/publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeConfirmModal();
            fetchPayroll();
            showStatus("Đã công bố bảng lương cho nhân viên thành công!", "success");
        } else {
            const err = await response.json();
            alert("Lỗi: " + err.message);
        }
    } catch (e) { 
        alert("Lỗi kết nối máy chủ."); 
    }
}

// Hàm lọc nhanh theo tên (Client-side)
function filterPayroll() {
    const query = document.getElementById("search-name").value.toLowerCase().trim();
    
    if (!query) {
        renderPayroll(allPayrollData);
        return;
    }
    const keywords = query.split(/\s+/);

    const filtered = allPayrollData.filter(item => {
        const fullName = (item.full_name || "").toLowerCase();
        return keywords.every(key => fullName.includes(key));
    });
    renderPayroll(filtered);
}

// Placeholder cho hàm xuất Excel
function exportExcel() {
    if (!allPayrollData || allPayrollData.length === 0) {
        alert("Không có dữ liệu!");
        return;
    }

    const period = document.getElementById("filter-period").value;
    const [year, month] = period.split("-");

    // 1. Chuẩn bị dữ liệu (Lưu ý: Để là Number để Excel tự tính toán được)
    const dataForExcel = allPayrollData.map(item => ({
        "Họ và Tên": item.full_name,
        // Đưa Công chuẩn lên trước Công thực để sếp so sánh cho dễ
        "Ngày công chuẩn": item.standard_workdays || 26,
        "Ngày công thực tế": item.actual_workdays || 0,
        
        "Lương gốc": Math.round(item.base_salary || 0),
        
        // Đổi tên "Lương thực nhận" thành "Lương theo công" để phân biệt với Tổng cuối
        "Lương theo công": Math.round(item.base_actual || 0), 
        
        "Hoa hồng": Math.round(item.total_commission || 0),
        "Tổng thực nhận": Math.round(item.final_salary || 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const currencyFormat = '#,##0 "VNĐ"';
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        [3, 4, 5, 6].forEach(C => {
            const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
            if (worksheet[cell_ref]) {
                worksheet[cell_ref].t = 'n';
                worksheet[cell_ref].z = currencyFormat;
            }
        });
    }

    // Chỉnh lại độ rộng cột cho khớp thứ tự mới
    worksheet['!cols'] = [
        { wch: 22 }, // Họ tên
        { wch: 15 }, // Công chuẩn
        { wch: 15 }, // Công thực
        { wch: 18 }, // Lương gốc
        { wch: 18 }, // Lương theo công
        { wch: 15 }, // Hoa hồng
        { wch: 20 }, // Tổng nhận
    ];

    // 5. Xuất file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bang Luong");
    XLSX.writeFile(workbook, `Bang_Luong_Thang_${month}_${year}.xlsx`);
}

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};