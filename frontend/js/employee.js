let employees = [];
let currentPage = 1;
const rowsPerPage = 8;
let currentViewingEmpId = null;
let id_ToEdit = null;
let allEmployees = [];
let filterEmployee = []; 

// Lấy danh sách nhân viên từ Backend
fetchEmployees();

async function fetchEmployees() {
    try {
        let response = await fetch("http://127.0.0.1:5001/employees/");
        allEmployees = await response.json();
        filteredEmployees = allEmployees; // Ban đầu chưa lọc
        displayEmployees(filteredEmployees);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nhân viên:", error);
    }
}

window.filterEmployees = function() {
    const query = document.getElementById("search").value.toLowerCase().trim();
    
    // Lọc trực tiếp trên mảng allEmployees
    filteredEmployees = allEmployees.filter(emp => {
        const nameMatch = emp.full_name.toLowerCase().includes(query);
        const phoneMatch = emp.phone_number.includes(query);
        return nameMatch || phoneMatch;
    });

    currentPage = 1; // Luôn quay về trang 1 khi tìm kiếm
    displayEmployees(filteredEmployees);
};

// Hiển thị dữ liệu lên bảng
function displayEmployees(dataToDisplay = filteredEmployees, page = currentPage) {
    const tbody = document.getElementById("employee-list");
    tbody.innerHTML = "";

    let start = (page - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let paginatedData = dataToDisplay.slice(start, end);

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Không tìm thấy nhân viên nào!</td></tr>`;
        return;
    }

    paginatedData.forEach(emp => {
        const row = document.createElement("tr");
        const formattedDate = new Date(emp.start_date).toLocaleDateString('vi-VN');
        const statusVn = emp.status === 1 ? 'Đang làm việc' : 'Đã nghỉ việc';
        const statusClass = emp.status === 1 ? 'status-1' : 'status-0';

        row.innerHTML = `
            <td>${emp.full_name}</td>
            <td>${emp.phone_number}</td>
            <td>${emp.employee_type}</td>
            <td>${Number(emp.base_salary).toLocaleString()} VNĐ</td>
            <td>${formattedDate}</td> 
            <td><span class="${statusClass}">${statusVn}</span></td>
            <td class="actions">
                <button class="view-btn" onclick="openEditEmployeeModal(${emp.employee_id})">
                    Chỉnh Sửa
                </button>
                <button class="view-btn" onclick="openSalesHistory(${emp.employee_id}, '${emp.full_name}')" 
                    style="background-color: #f39c12; margin-left: 5px;">
                Lịch sử
            </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(dataToDisplay);
}

// Phân trang
function renderPagination(data) {
    const container = document.getElementById("pagination");
    container.innerHTML = ""; 
    const totalPages = Math.ceil(data.length / rowsPerPage);

    if (totalPages > 1) {
        container.innerHTML = `
            <img id="prev" class="btn-pagination" src="../img/prev.png" onclick="changePage(-1)">
            <img id="next" class="btn-pagination" src="../img/next.png" onclick="changePage(1)">
        `;
        const prevButton = document.getElementById("prev");
        const nextButton = document.getElementById("next");

        prevButton.classList.toggle("disabled", currentPage === 1);
        prevButton.style.pointerEvents = currentPage === 1 ? 'none' : 'auto';

        nextButton.classList.toggle("disabled", currentPage === totalPages);
        nextButton.style.pointerEvents = currentPage === totalPages ? 'none' : 'auto';
    }
}

window.changePage = function (direction) {
    const data = filterEmployee.length ? filterEmployee : employees;
    const totalPages = Math.ceil(data.length / rowsPerPage);

    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    displayEmployees(data);
};

window.filterEmployees = function() {
    // 1. Lấy giá trị nhập vào, chuyển về chữ thường và cắt bỏ khoảng trắng thừa
    let searchValue = document.getElementById("search").value.toLowerCase().trim();

    // 2. Nếu ô tìm kiếm rỗng -> Quay về danh sách gốc
    if (!searchValue) {
        filteredEmployees = allEmployees;
        currentPage = 1;
        displayEmployees();
        return;
    }

    // 3. Tách chuỗi tìm kiếm thành mảng các từ khóa (Ví dụ: "Huy 09" -> ["huy", "09"])
    let keywords = searchValue.split(/\s+/);

    // 4. Thực hiện lọc dữ liệu trên mảng gốc allEmployees
    filteredEmployees = allEmployees.filter(emp => {
        // Gom các trường quan trọng vào một "nồi lẩu" văn bản để soi kkk
        let empInfo = `
            ${emp.full_name} 
            ${emp.phone_number} 
            ${emp.employee_type}
        `.toLowerCase();

        // LOGIC: Trả về true nếu TẤT CẢ các từ khóa đều xuất hiện trong empInfo
        return keywords.every(word => empInfo.includes(word));
    });

    // 5. Cập nhật giao diện
    currentPage = 1; // Luôn reset về trang 1 khi tìm kiếm
    displayEmployees();
};

function openEditEmployeeModal(id) {
    const emp = allEmployees.find(e => e.employee_id === id);
    if (!emp) return;

    id_ToEdit = id;
    document.getElementById("editFullName").value = emp.full_name;
    document.getElementById("editPhone").value = emp.phone_number;
    document.getElementById("editStatus").value = emp.status;

    // 🚀 XỬ LÝ LOẠI NHÂN VIÊN
    const typeSelect = document.getElementById("editEmployeeType");
    const typeNote = document.getElementById("type-note");
    typeSelect.value = emp.employee_type;

    if (emp.employee_type === "Chính thức") {
        typeSelect.disabled = true; // Đã chính thức rồi thì không cho "xuống" thử việc
        typeNote.style.display = "none";
    } else {
        typeSelect.disabled = false; // Đang thử việc thì cho phép thăng chức
        typeNote.style.display = "block";
    }

    document.getElementById("editEmployeeModal").style.display = "flex";
}

function showStatus(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Thêm icon cho xịn kkk
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Sau 2.5 giây thì bắt đầu mờ dần, tổng cộng 3 giây là biến mất
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

async function updateEmployee() {
    // 1. Tìm thông tin nhân viên đang sửa trong bộ nhớ local
    const currentEmp = allEmployees.find(e => e.employee_id === id_ToEdit);
    if (!currentEmp) return;

    const newType = document.getElementById("editEmployeeType").value;
    const phoneInput = document.getElementById("editPhone");
    const phone = phoneInput.value.trim();
    const newStatus = parseInt(document.getElementById("editStatus").value); // Trạng thái mới: 1 hoặc 0

    // 🛡️ BỘ LỌC SĐT (Giữ nguyên cho sạch dữ liệu)
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone)) {
        showStatus("SĐT không hợp lệ! Phải bắt đầu bằng 0 và có 10-11 số.", "error");
        phoneInput.focus();
        return;
    }

    // Tự động thăng lương
    let finalSalary = currentEmp.base_salary;
    if (currentEmp.employee_type === "Thử việc" && newType === "Chính thức") {
        finalSalary = 10000000;
    }

    const updatedData = {
        full_name: document.getElementById("editFullName").value.trim(),
        phone_number: phone,
        status: newStatus,
        employee_type: newType,
        base_salary: finalSalary
    };

    try {
        // --- BƯỚC A: CẬP NHẬT THÔNG TIN NHÂN VIÊN ---
        const resEmp = await fetch(`http://127.0.0.1:5001/employees/${id_ToEdit}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        if (resEmp.ok) {
            // --- 🚀 BƯỚC B: ĐỒNG BỘ TRẠNG THÁI TÀI KHOẢN (QUAN TRỌNG) ---
            // Nếu nhân viên có user_id (tức là có tài khoản)
            if (currentEmp.user_id) {
                await fetch(`http://127.0.0.1:5001/accounts/users/${currentEmp.user_id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });
                console.log(`>>> Đã đồng bộ trạng thái tài khoản ID ${currentEmp.user_id} về ${newStatus}`);
            }

            showStatus("Cập nhật thông tin nhân viên thành công!", "success");
            fetchEmployees();
            closeModal();
        } else {
            const err = await resEmp.json();
            showStatus("Lỗi: " + err.message, "error");
        }
    } catch (error) {
        console.error("Lỗi thực thi:", error);
        showStatus("Lỗi kết nối máy chủ!", "error");
    }
}

function closeModal() {
    document.getElementById('editEmployeeModal').style.display = "none";
}

// Bổ trợ
function toggleClearButton() {
    let input = document.getElementById("search");
    let clearBtn = document.getElementById("clear-btn");
    clearBtn.style.display = input.value.trim() !== "" ? "block" : "none";
}

function clearSearch() {
    document.getElementById("search").value = "";
    document.getElementById("clear-btn").style.display = "none";
    filterEmployee = employees;
    currentPage = 1;
    displayEmployees(employees);
}

function openAddEmployeeModal() {
    document.getElementById("addEmployeeModal").style.display = "flex";
}

function closeAddModal() {
    document.getElementById("addEmployeeModal").style.display = "none";
}

function showError(inputId, message) {
    const inputField = document.getElementById(inputId);
    const errorSpan = document.getElementById("error-" + inputId);
    
    if (inputField && errorSpan) {
        inputField.classList.add("input-error"); // Thêm class viền đỏ (định nghĩa ở CSS)
        errorSpan.innerText = message;           // Gán nội dung lỗi
    }
}

function clearErrors() {
    // Tìm tất cả các span báo lỗi để xóa chữ
    const errorSpans = document.querySelectorAll(".error-text");
    errorSpans.forEach(span => span.innerText = "");

    // Tìm tất cả input bị đỏ để trả về bình thường
    const inputs = document.querySelectorAll(".edit-form input, .edit-form select");
    inputs.forEach(input => input.classList.remove("input-error"));
}

function resetAddForm() {
    const ids = ["addFullName", "addPhone", "addSalary", "addUsername", "addPassword", "addConfirmPassword"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    clearErrors(); // Xóa luôn các dòng báo lỗi nếu có
}

async function saveEmployeeWithAccount() {
    clearErrors();
    
    // 1. Lấy dữ liệu từ form
    const fullName = document.getElementById("addFullName").value.trim();
    const phone = document.getElementById("addPhone").value.trim();
    const empType = document.getElementById("addEmpType").value;
    const salaryClean = document.getElementById("addSalary").value.replace(/\D/g, '');
    const username = document.getElementById("addUsername").value.trim();
    const password = document.getElementById("addPassword").value;
    const confirm = document.getElementById("addConfirmPassword").value;
    const role = "Nhân viên";

    // 🛡️ Validation (Hợp lệ hóa dữ liệu)
    let hasError = false;
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

    if (!fullName) { showError("addFullName", "Họ tên không được để trống."); hasError = true; }
    else if (!nameRegex.test(fullName)) { showError("addFullName", "Họ tên không hợp lệ!"); hasError = true; }

    if (!/^0\d{9,10}$/.test(phone)) { showError("addPhone", "SĐT phải 10-11 số, bắt đầu bằng 0."); hasError = true; }
    if (!salaryClean) { showError("addSalary", "Lương chưa được thiết lập!"); hasError = true; }
    if (!/^[a-zA-Z0-9_]{5,20}$/.test(username)) { showError("addUsername", "Username 5-20 ký tự."); hasError = true; }
    if (password.length < 5) { showError("addPassword", "Mật khẩu tối thiểu 5 ký tự."); hasError = true; }
    if (password !== confirm) { showError("addConfirmPassword", "Mật khẩu xác nhận không khớp."); hasError = true; }

    if (hasError) return;

    try {
        // 🚀 BƯỚC 1: TẠO TÀI KHOẢN
        const resAccount = await fetch("http://127.0.0.1:5001/accounts/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role }),
        });

        const accountResult = await resAccount.json();

        if (!resAccount.ok) {
            // Nếu username đã tồn tại
            showStatus(accountResult.message || "Lỗi tạo tài khoản", "error");
            return;
        }

        const newUserId = accountResult.user_id; // Lấy ID tài khoản vừa tạo

        // 🚀 BƯỚC 2: TẠO THÔNG TIN NHÂN VIÊN (Dựa trên UserId vừa lấy)
        const employeeData = {
            full_name: fullName,
            phone_number: phone,
            employee_type: empType,
            base_salary: salaryClean,
            start_date: new Date().toISOString().split('T')[0],
            user_id: newUserId
        };

        const resEmployee = await fetch("http://127.0.0.1:5001/employees/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employeeData),
        });

        if (resEmployee.ok) {
            showStatus("Thêm nhân viên và tài khoản thành công!", "success");
            closeAddModal();
            resetAddForm();
            fetchEmployees(); // Load lại bảng
        } else {
            const empErr = await resEmployee.json();
            showStatus("Tài khoản đã tạo nhưng lỗi hồ sơ: " + empErr.message, "error");
        }

    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        showStatus("Lỗi kết nối máy chủ!", "error");
    }
}

function formatVND(amount) {
    return amount.toLocaleString('vi-VN') + " VND";
}

function autoFillSalary() {
    const empType = document.getElementById("addEmpType").value;
    const salaryInput = document.getElementById("addSalary");

    if (empType === "Chính thức") {
        salaryInput.value = formatVND(10000000); // Hiện: 10,000,000 VND
    } else if (empType === "Thử việc") {
        salaryInput.value = formatVND(8500000);  // Hiện: 8,500,000 VND
    }
}

function openAddEmployeeModal() {
    document.getElementById("addEmployeeModal").style.display = "flex";
    autoFillSalary(); 
}

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};

async function openSalesHistory(id, name) {
    currentViewingEmpId = id;
    document.getElementById("historyTitle").innerText = "Lịch Sử Bán Hàng: " + name;
    
    // Set mặc định tháng/năm hiện tại
    const filterInput = document.getElementById("history-filter-month");
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    filterInput.value = currentMonthStr;

    document.getElementById("salesHistoryModal").style.display = "flex";
    reloadSalesHistory(); // Tải dữ liệu tháng hiện tại
}

// 2. Tải/Lọc dữ liệu
async function reloadSalesHistory() {
    if (!currentViewingEmpId) return;
    const filterValue = document.getElementById("history-filter-month").value;
    const [year, month] = filterValue.split("-");
    const tbody = document.getElementById("history-list");
    const footer = document.getElementById("history-footer-summary");

    try {
        const res = await fetch(`http://127.0.0.1:5001/employees/${currentViewingEmpId}/sales?month=${month}&year=${year}`);
        const data = await res.json();
        tbody.innerHTML = "";
        let totalMonth = 0;

        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='8'>Nhân viên chưa thực hiện bán hàng trong tháng này.</td></tr>"; // 🚀 Chỉnh lại thành 8 cột
            footer.innerHTML = ""; return;
        }

        data.forEach(item => {
            const original = Math.round(Number(item.original_subtotal) || 0);
            const points = Math.round(Number(item.used_points) || 0);
            const final = Math.round(Number(item.total_amount) || 0);
            const baseComm = Math.round(Number(item.base_comm_fixed) || 0);
            const extraComm = Math.round(Number(item.extra_comm_fixed) || 0);
            const rowTotal = baseComm + extraComm;
            totalMonth += rowTotal;

            tbody.innerHTML += `
                <tr>
                    <td>#${item.invoice_id}</td>
                    <td style="font-size:11px;">${item.created_at}</td>
                    <td style="color:#888; font-style:italic;">${original.toLocaleString()} VNĐ</td>
                    <td style="color:#e67e22; font-weight: 600;">${points.toLocaleString()} VNĐ</td>
                    <td style="font-weight:700;">${final.toLocaleString()} VNĐ</td>
                    <td>${baseComm.toLocaleString()} VNĐ</td>
                    
                    <td>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span style="color:#3498db;">${extraComm.toLocaleString()} VNĐ</span>
                            <button class="eye-btn-small" onclick="viewInvoiceDetail(${item.invoice_id})" title="Xem chi tiết đơn">
                                👁️
                            </button>
                        </div>
                    </td>

                    <td style="font-weight:800; color:#2ecc71;">${rowTotal.toLocaleString()} VNĐ</td>
                </tr>`;
        });
        footer.innerHTML = `<div class="summary-content"><span>TỔNG HOA HỒNG:</span> <span class="total-value">${totalMonth.toLocaleString()} VNĐ</span></div>`;
    } catch (e) { tbody.innerHTML = "Lỗi Server"; }
}

async function viewInvoiceDetail(invoiceId) {
    document.getElementById("invoiceDetailTitle").innerText = "Sản phẩm trong đơn #" + invoiceId;
    const tbody = document.getElementById("invoice-item-list");
    
    // Hiện thông báo đang tải (colspan đổi thành 6 vì mình có 6 cột kkk)
    tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Đang tải...</td></tr>";
    document.getElementById("invoiceDetailModal").style.display = "flex";

    try {
        const response = await fetch(`http://127.0.0.1:5001/employees/invoice/${invoiceId}/details`);
        const items = await response.json();
        tbody.innerHTML = "";
        let subTotalExtra = 0;

        items.forEach(p => {
            // 🚀 LÀM TRÒN VÀ ĐỊNH DẠNG DỮ LIỆU
            const extra = Math.round(parseFloat(p.extra_comm) || 0);
            const rate = (parseFloat(p.extra_commission_rate) * 100).toFixed(1) + "%";
            subTotalExtra += extra;

            tbody.innerHTML += `
                <tr>
                    <td class="text-left"><strong>${p.name}</strong></td>
                    <td>${p.brand || '---'}</td>
                    <td style="color: #e67e22; font-weight: 600;">${rate}</td>
                    <td class="text-center">${p.quantity}</td>
                    <td class="text-right">${Math.round(Number(p.price)).toLocaleString()} VNĐ</td>
                    <td class="text-right" style="color: #3498db; font-weight: 600;">+${extra.toLocaleString()} VNĐ</td>
                </tr>
            `;
        });

        // Dòng tổng kết cuối bảng
        tbody.innerHTML += `
            <tr class="row-footer" style="background: #f0f8ff;">
                <td colspan="5" class="text-right">Tổng thưởng thêm đơn này:</td>
                <td class="text-right" style="color: #3498db; font-weight: bold;">${subTotalExtra.toLocaleString()} VNĐ</td>
            </tr>
        `;
    } catch (e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan='6' style='color:red;'>Lỗi tải chi tiết đơn hàng!</td></tr>";
    }
}

function closeHistoryModal() { document.getElementById("salesHistoryModal").style.display = "none"; }
function closeInvoiceDetailModal() { document.getElementById("invoiceDetailModal").style.display = "none"; }