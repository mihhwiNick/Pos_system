let allInvoices = []; // Dữ liệu gốc từ server
let filteredInvoices = []; // Dữ liệu sau khi lọc
let currentPage = 0;
const rowsPerPage = 8;

// Định dạng giá
function formatVND(amount) {
    return Math.round(Number(amount) || 0).toLocaleString('vi-VN') + " VNĐ";
}

// Lấy dữ liệu từ Server
async function fetchInvoices() {
    try {
        let response = await fetch("http://127.0.0.1:5001/invoices");
        allInvoices = await response.json();
        filteredInvoices = allInvoices; 
        displayInvoices();
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// Hàm hiển thị hóa đơn lên bảng
function displayInvoices() {
    const tbody = document.getElementById("invoice-list");
    tbody.innerHTML = "";

    let start = currentPage * rowsPerPage;
    let end = start + rowsPerPage;
    let paginatedInvoices = filteredInvoices.slice(start, end);

    if (paginatedInvoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">Không tìm thấy hóa đơn nào!</td></tr>`;
        return;
    }

    paginatedInvoices.forEach(inv => {
        // Lấy dữ liệu và làm tròn kkk
        const original = Math.round(Number(inv.original_subtotal) || 0);
        const points = Math.round(Number(inv.used_points) || 0);
        const final = Math.round(Number(inv.total_amount) || 0);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-size: 14px;">#${inv.invoice_id}</td>
            <td style="font-size: 14px;">${inv.customer_name || 'Khách vãng lai'}</td>
            <td style="font-size: 14px;">${inv.customer_phone || '---'}</td>
            <td style="font-size: 11px; color: #666;">${inv.created_at}</td>
            <td style="font-size: 14px;">${inv.employee_name}</td>
            
            <td style="color: #7f8c8d; font-style: italic; font-size: 14px;">${formatVND(original)}</td>
            <td style="color:#e67e22; font-weight: 600; font-size: 14px;">${points.toLocaleString()} VNĐ</td>
            <td style="font-weight: 700; color: #2ecc71; font-size: 14px;">${formatVND(final)}</td>

            <td>
                <button class="view-btn" onclick="viewInvoiceDetails(${inv.invoice_id})">Chi tiết</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById("trang_hien_tai").innerHTML = currentPage + 1;
}

function trangSau() {
    if ((currentPage + 1) * rowsPerPage < filteredInvoices.length) {
        currentPage++; 
        displayInvoices();
    }
}

function trangTruoc() {
    if (currentPage > 0) {
        currentPage--; 
        displayInvoices();
    }
}


window.applyFilters = function() {
    // 1. Lấy tất cả giá trị đầu vào
    const query = document.getElementById("search").value.toLowerCase().trim();
    const startDateVal = document.getElementById("start-date").value; // YYYY-MM-DD
    const endDateVal = document.getElementById("end-date").value;     // YYYY-MM-DD
    const keywords = query.split(/\s+/);
    const startDate = startDateVal ? new Date(startDateVal) : null;
    const endDate = endDateVal ? new Date(endDateVal) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    filteredInvoices = allInvoices.filter(invoice => {
        const customerInfo = `${invoice.customer_name || ""} ${invoice.customer_phone || ""}`.toLowerCase();
        const isMatchKeyword = keywords.every(key => customerInfo.includes(key));
        const invoiceDate = stringToDate(invoice.created_at.substring(0, 10));
        
        let isMatchDate = true;
        if (startDate && invoiceDate < startDate) isMatchDate = false;
        if (endDate && invoiceDate > endDate) isMatchDate = false;
        return isMatchKeyword && isMatchDate;
    });

    currentPage = 0; 
    displayInvoices();
};

function stringToDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day); 
}

// Cập nhật hàm Reset
window.resetFilters = function() {
    document.getElementById("search").value = "";
    document.getElementById("start-date").value = "";
    document.getElementById("end-date").value = "";
    filteredInvoices = allInvoices;
    currentPage = 0;
    displayInvoices();
};

// Xóa tìm kiếm
window.clearSearch = function() {
    document.getElementById("search").value = "";
    filteredInvoices = allInvoices;
    currentPage = 1;
    displayInvoices();
};

// Xem chi tiết hóa đơn
async function viewInvoiceDetails(invoice_id) {
    try {
        const response = await fetch(`http://localhost:5001/invoices/${invoice_id}/details`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('viewModal').style.display = 'flex';
            const container = document.getElementById('invoiceDetails');
            
            let html = `<table class="invoice-detail-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Giá</th>
                                </tr>
                            </thead>
                            <tbody>`;
            data.forEach((d, i) => {
                html += `<tr>
                            <td>${i + 1}</td>
                            <td>${d.product_name}</td>
                            <td>${d.quantity}</td>
                            <td>${formatVND(d.price)}</td>
                         </tr>`;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

window.filterByDate = function() {
    const selectedDate = document.getElementById("filter-date").value; // Định dạng: YYYY-MM-DD
    
    if (!selectedDate) {
        filteredInvoices = allInvoices;
    } else {
        filteredInvoices = allInvoices.filter(invoice => {
            // invoice.created_at có dạng: "2026-04-01 20:12:54"
            // Cắt lấy 10 ký tự đầu để so sánh: "2026-04-01"
            const invoiceDatePart = invoice.created_at.substring(0, 10);
            return invoiceDatePart === selectedDate;
        });
    }

    currentPage = 0; // Reset về trang đầu tiên
    displayInvoices();
    
    if (filteredInvoices.length === 0) {
        showStatus("Không có hóa đơn nào trong ngày này!", "error");
    }
};

// 2. Hàm reset để quay lại danh sách tổng
window.resetInvoices = function() {
    document.getElementById("filter-date").value = "";
    filteredInvoices = allInvoices;
    currentPage = 0;
    displayInvoices();
};

// Hàm thông báo nhẹ (Tùy chọn nếu ông có hàm toast)
function showStatus(msg, type) {
    console.log(`${type}: ${msg}`);
}

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};

// Khởi chạy lấy dữ liệu
fetchInvoices();