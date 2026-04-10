document.addEventListener("DOMContentLoaded", () => {
    // 1. Khởi tạo mặc định: Chọn tháng/năm hiện tại cho ô input filter
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const filterMonthInput = document.getElementById("filter-month");
    if (filterMonthInput) {
        filterMonthInput.value = currentMonth;
    }

    // 2. Tải dữ liệu tổng hợp lần đầu
    loadAttendanceSummary();
});

// --- CÁC HÀM XỬ LÝ DỮ LIỆU TỔNG HỢP ---

async function loadAttendanceSummary() {
    const filterMonth = document.getElementById("filter-month").value;
    const searchInput = document.getElementById("search-name");
    const searchValue = searchInput.value.toLowerCase().trim(); // 🚀 Cắt tỉa và đưa về chữ thường
    
    if (!filterMonth) return; 

    const [year, month] = filterMonth.split("-");

    try {
        const response = await fetch(`http://127.0.0.1:5001/attendance/summary?month=${month}&year=${year}`);
        const data = await response.json();

        const tableBody = document.getElementById("attendance-summary-list");
        tableBody.innerHTML = "";

        // 🚀 BỘ LỌC THÔNG MINH (TOKENIZE SEARCH) KKK
        let filteredData = data;
        if (searchValue) {
            // Tách chuỗi sếp gõ thành mảng các từ khóa: "Bảo Gia" -> ["bảo", "gia"]
            const keywords = searchValue.split(/\s+/); 

            filteredData = data.filter(item => {
                const fullName = (item.full_name || "").toLowerCase();
                // LOGIC: Trả về true nếu MỌI từ khóa sếp gõ đều nằm trong tên nhân viên
                return keywords.every(key => fullName.includes(key));
            });
        }

        // Hiển thị kết quả sau lọc
        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">Không tìm thấy nhân viên phù hợp.</td></tr>`;
            return;
        }

        filteredData.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.full_name}</td>
                <td>${item.standard_workdays || 26}</td>
                <td class="total-work">${item.actual_workdays || 0}</td>
                <td>
                    <button class="view-btn" onclick="viewDetails(${item.employee_id}, '${item.full_name}')">
                        Xem chi tiết
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Lỗi tải dữ liệu tổng hợp:", error);
        document.getElementById("attendance-summary-list").innerHTML = `<tr><td colspan="4" style="color:red">Lỗi kết nối Server!</td></tr>`;
    }
}
// --- CÁC HÀM XỬ LÝ CHI TIẾT (MODAL) ---

async function viewDetails(empId, empName) {
    const filterMonthInput = document.getElementById("filter-month").value;
    const [year, month] = filterMonthInput.split("-");

    document.getElementById("detail-employee-name").textContent = empName;
    const detailList = document.getElementById("attendance-detail-list");
    detailList.innerHTML = `<tr><td colspan="5" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;

    try {
        const response = await fetch(`http://127.0.0.1:5001/attendance/details/${empId}?month=${month}&year=${year}`);
        let details = await response.json();

        // --- BỔ SUNG: SẮP XẾP THEO NGÀY TĂNG DẦN ---
        details.sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

        detailList.innerHTML = "";

        if (details.length === 0) {
            detailList.innerHTML = `<tr><td colspan="5" style="text-align:center;">Không có lịch sử tháng này.</td></tr>`;
        } else {
            details.forEach(record => {
                let statusClass = "status-0";
                let statusText = "Không tính công";
                if (record.work_value >= 1) {
                    statusClass = "status-1";
                    statusText = "Đủ công";
                } else if (record.work_value > 0) {
                    statusClass = "status-05";
                    statusText = "Nửa công";
                }

                const workDate = new Date(record.work_date).toLocaleDateString('vi-VN');

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${record.check_in || '--:--'}</td>
                    <td>${record.check_out || '--:--'}</td>
                    <td>${workDate}</td>
                    <td class="${statusClass}" style="font-weight:bold;">${record.work_value}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                `;
                detailList.appendChild(row);
            });
        }
        document.getElementById("attendanceDetailModal").style.display = "flex";
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

function closeDetailModal() {
    document.getElementById("attendanceDetailModal").style.display = "none";
}

// --- CÁC TIỆN ÍCH GIAO DIỆN ---

function toggleClearButton() {
    // Nếu bạn muốn xử lý logic tìm kiếm ngay khi đang gõ, gọi loadAttendanceSummary() ở đây
    loadAttendanceSummary();
}

function logout() {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
}

// Đóng modal khi click ra ngoài vùng nội dung
window.onclick = function(event) {
    const modal = document.getElementById("attendanceDetailModal");
    if (event.target == modal) {
        closeDetailModal();
    }
}