document.addEventListener("DOMContentLoaded", () => {
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    if (!data || !data.employee_id) return window.location.href = "index.html";

    document.getElementById("user-name-display").innerText = data.full_name || data.username;

    const filterInput = document.getElementById("income-filter-month");
    if (filterInput) {
        // Set mặc định là tháng hiện tại
        filterInput.value = new Date().toISOString().slice(0, 7);
        filterInput.addEventListener("change", fetchIncomeData);
    }
    fetchIncomeData();
});

function formatVND(amount) {
    return new Intl.NumberFormat("vi-VN").format(Math.round(Number(amount) || 0)) + " VNĐ";
}

async function fetchIncomeData() {
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    const myEmpId = parseInt(data.employee_id); // Ép kiểu để so sánh chuẩn
    
    const filterInput = document.getElementById("income-filter-month");
    const [year, month] = filterInput.value.split("-");

    const payslipUI = document.getElementById("payslip-real-content");
    const lockUI = document.getElementById("payslip-lock-content");

    try {
        // --- 1. LẤY LỊCH SỬ HOA HỒNG ---
        const resSales = await fetch(`http://127.0.0.1:5001/employees/${myEmpId}/sales?month=${month}&year=${year}`);
        const sales = await resSales.json();

        let totalCommMonth = 0;
        let html = "";

        if (!sales || sales.length === 0) {
            html = "<tr><td colspan='8'>Không có dữ liệu đơn hàng trong tháng này</td></tr>";
        } else {
            sales.forEach(s => {
                const originalSubtotal = Number(s.original_subtotal) || 0;
                const finalAmount = Number(s.total_amount) || 0;
                const points = Number(s.used_points) || 0;
                const baseComm = Number(s.base_comm_fixed) || 0;
                const extraComm = Number(s.extra_comm_fixed) || 0;
                const rowTotal = baseComm + extraComm;

                // 🚀 TÍCH LŨY TỔNG: Sửa lỗi hiển thị 0 VNĐ ở thanh tổng
                totalCommMonth += rowTotal;

                html += `<tr>
                    <td>#${s.invoice_id}</td>
                    <td style="color: #6a737d; font-size: 13px;">${s.created_at}</td>
                    <td style="color: #6a737d; font-style: italic;">${formatVND(originalSubtotal)}</td>
                    <td style="color: #e67e22; font-weight: 600;">${points.toLocaleString()}đ</td>
                    <td style="font-weight: 700; color: #1a1d23;">${formatVND(finalAmount)}</td>
                    <td>${formatVND(baseComm)}</td>
                    <td>
                        <div class="comm-flex">
                            <span>${formatVND(extraComm)}</span>
                            <button class="eye-btn" onclick="viewInvoice(${s.invoice_id})" title="Xem chi tiết đơn">
                                👁️
                            </button>
                        </div>
                    </td>
                    <td class="txt-bold">${formatVND(rowTotal)}</td>
                </tr>`;
            });
        }
        document.getElementById("sales-list").innerHTML = html;
        document.getElementById("sales-summary").innerText = "Tổng hoa hồng tháng: " + formatVND(totalCommMonth);

        // --- 2. KIỂM TRA VÀ HIỂN THỊ PHIẾU LƯƠNG ---
        const resPayroll = await fetch(`http://127.0.0.1:5001/payroll/?month=${parseInt(month)}&year=${year}`);
        const allPayroll = await resPayroll.json();

        const myPayroll = allPayroll.find(p => p.employee_id == myEmpId);

        // 🚀 THÊM DÒNG NÀY ĐỂ SOI: Ông giáo nhấn F12, vào tab Console để xem tên cột đúng là gì
        console.log("Dữ liệu lương của tui:", myPayroll);

        if (myPayroll && parseInt(myPayroll.status) === 1) {
            payslipUI.style.display = "flex"; 
            lockUI.style.display = "none";
            
            // Thử lấy theo các tên cột phổ biến, cái nào có thì dùng cái đó kkk
            const salaryToDisplay = myPayroll.actual_base_salary || myPayroll.base_actual || myPayroll.base_salary || 0;
            
            updateSummary(totalCommMonth, salaryToDisplay, sales);
        } else {
            // 🚀 TRƯỜNG HỢP: Chưa có hoặc chưa chốt -> Hiện cái KHÓA 🔒
            payslipUI.style.display = "none"; 
            lockUI.style.display = "block";
        }

    } catch (e) { 
        console.error("Lỗi thực thi hệ thống:", e);
        document.getElementById("sales-list").innerHTML = "<tr><td colspan='8' style='color:red'>Lỗi kết nối máy chủ!</td></tr>";
    }
}

function updateSummary(totalComm, baseFromDB, salesData = []) {
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    const base = Number(baseFromDB) || 0;
    
    let totalBase05 = 0;
    let totalExtra = 0;
    salesData.forEach(s => {
        totalBase05 += (Number(s.base_comm_fixed) || 0);
        totalExtra += (Number(s.extra_comm_fixed) || 0);
    });

    const [y, m] = document.getElementById("income-filter-month").value.split("-");
    document.getElementById("payslip-dynamic-title").innerText = `PHIẾU LƯƠNG THÁNG ${m}/${y}`;
    document.getElementById("payslip-employee-display").innerText = `Nhân viên: ${data.full_name || data.username}`;

    document.getElementById("lb-base").innerText = formatVND(base);
    document.getElementById("lb-comm-fixed").innerText = formatVND(totalBase05);
    document.getElementById("lb-comm-extra").innerText = formatVND(totalExtra);
    document.getElementById("lb-comm-total").innerText = formatVND(totalComm);
    document.getElementById("lb-total").innerText = formatVND(base + totalComm);
}

function switchTab(type) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('content-' + type).classList.add('active');
    event.currentTarget.classList.add('active');
}

async function viewInvoice(invoiceId) {
    const modal = document.getElementById("detail-modal");
    const tableContainer = document.getElementById("dt-table");
    modal.style.display = "flex";
    document.getElementById("dt-id").innerText = "#" + invoiceId;

    try {
        const res = await fetch(`http://127.0.0.1:5001/employees/invoice/${invoiceId}/details`);
        const items = await res.json();

        let html = `<thead>
            <tr>
                <th>Sản phẩm</th>
                <th>Hãng</th>
                <th>Hệ số</th>
                <th>Số lượng</th>
                <th>Giá</th>
                <th>Thưởng</th>
            </tr>
        </thead><tbody>`;

        items.forEach(item => {
            const displayRate = (Number(item.extra_commission_rate) * 100).toFixed(1) + "%";
            html += `<tr>
                <td style="text-align: left;"><strong>${item.name}</strong></td>
                <td>${item.brand}</td>
                <td style="color: #e67e22; font-weight: 600;">${displayRate}</td>
                <td>${item.quantity}</td>
                <td>${formatVND(item.price)}</td>
                <td style="font-weight: 600; color: #3498db;">${formatVND(item.extra_comm)}</td>
            </tr>`;
        });

        tableContainer.innerHTML = html + "</tbody>";
    } catch (e) { console.error(e); }
}

// Gán vào window để HTML onclick luôn nhận được
window.closeModal = function() {
    document.getElementById("detail-modal").style.display = "none";
};