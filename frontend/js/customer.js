let allCustomers = [];      // Dữ liệu gốc từ API
let filteredCustomers = []; // Dữ liệu sau khi tìm kiếm
let currentPage = 1;
const rowsPerPage = 8;
let id_ToEdit = null;
fetchCustomers()

async function fetchCustomers() {
    try {
        let response = await fetch("http://127.0.0.1:5001/customers");
        allCustomers = await response.json();
        filteredCustomers = allCustomers; 
        
        currentPage = 1;
        displayCustomers();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách khách hàng:", error);
    }
}

window.filterCustomers = function() {
    const query = document.getElementById("search").value.toLowerCase().trim();
    
    filteredCustomers = allCustomers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(query);
        const phoneMatch = (customer.phone || "").includes(query);
        return nameMatch || phoneMatch;
    });

    currentPage = 1; // Reset về trang 1 khi search
    displayCustomers();
};

function displayCustomers() {
    const tbody = document.getElementById("customer-list");
    tbody.innerHTML = "";

    // Tính toán cắt mảng (Sửa lỗi logic start/end)
    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let paginatedData = filteredCustomers.slice(start, end);

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Không tìm thấy khách hàng nào!</td></tr>`;
        updatePaginationUI(0);
        return;
    }

    paginatedData.forEach(customer => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="customer-name">${customer.name}</td>
            <td class="customer-phone">${customer.phone || '---'}</td>
            <td class="customer-point">${customer.points}</td>
            <td class="actions">
                <button class="view-btn" onclick="viewEditCustomer(${customer.customer_id})">
                    Chỉnh Sửa
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePaginationUI(filteredCustomers.length);
}

function updatePaginationUI(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const trangHienTaiTxt = document.getElementById("trang_hien_tai");
    const btnTruoc = document.getElementById("trang_truoc");
    const btnSau = document.getElementById("trang_sau");

    if (trangHienTaiTxt) {
        trangHienTaiTxt.innerText = currentPage;
    }

    // 2. Xử lý nút TRƯỚC: Luôn hiện, chỉ khóa khi ở trang 1
    if (btnTruoc) {
        btnTruoc.style.visibility = "visible"; // Đảm bảo luôn hiện
        btnTruoc.classList.toggle("disabled", currentPage === 1);
    }

    // 3. Xử lý nút SAU: Luôn hiện, chỉ khóa khi ở trang cuối hoặc không có dữ liệu
    if (btnSau) {
        btnSau.style.visibility = "visible"; // Đảm bảo luôn hiện
        btnSau.classList.toggle("disabled", currentPage >= totalPages || totalPages === 0);
    }
}

window.trangSau = function() {
    const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayCustomers();
    }
}

// Hàm nút Trang Trước (Khớp với HTML của ông)
window.trangTruoc = function() {
    if (currentPage > 1) {
        currentPage--;
        displayCustomers();
    }
}

window.changePage = function (direction) {
    const data = filterCustomer.length ? filterCustomer : customers;
    const totalPages = Math.ceil(data.length / rowsPerPage);

    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    displayCustomers(data, currentPage, totalPages);
    renderPagination();
};function renderPagination() {
    const container = document.getElementById("pagination");
    container.innerHTML = ""; // Xóa nội dung cũ

    const data = filterCustomer.length ? filterCustomer : customers;
    const totalPages = Math.ceil(data.length / rowsPerPage);

    if (totalPages > 1) {
        container.innerHTML = `
            <img id="prev" class="btn-pagination" src="../img/prev.png" onclick="changePage(-1)">
            <img id="next" class="btn-pagination" src="../img/next.png" onclick="changePage(1)">
        `;

        const prevButton = document.getElementById("prev");
        const nextButton = document.getElementById("next");

        // Vô hiệu hóa nút "Previous" nếu ở trang đầu
        prevButton.classList.toggle("disabled", currentPage === 1);
        prevButton.style.pointerEvents = currentPage === 1 ? 'none' : 'auto';

        // Vô hiệu hóa nút "Next" nếu ở trang cuối
        nextButton.classList.toggle("disabled", currentPage === totalPages);
        nextButton.style.pointerEvents = currentPage === totalPages ? 'none' : 'auto';

        // Hiển thị các nút phân trang nếu có nhiều trang
        prevButton.style.display = "inline-block";
        nextButton.style.display = "inline-block";
    } else {
        // Nếu không có trang, ẩn các nút phân trang
        const prevButton = document.getElementById("prev");
        const nextButton = document.getElementById("next");
        prevButton.style.display = "none";
        nextButton.style.display = "none";
    }
}

window.changePage = function (direction) {
    const data = filterCustomer.length ? filterCustomer : customers;
    const totalPages = Math.ceil(data.length / rowsPerPage);

    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    displayCustomers(data, currentPage, totalPages);
    renderPagination();
};

// Đảm bảo modal ẩn khi tải trang
window.onload = function() {
    document.getElementById('viewModal').style.display = 'none';
};


function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

window.filterCustomers = function() {
    let searchValue = document.getElementById("search").value.toLowerCase().trim();
    if (!searchValue) {
        filteredCustomers = allCustomers;
        currentPage = 1;
        displayCustomers();
        return;
    }
    let keywords = searchValue.split(/\s+/);
    filteredCustomers = allCustomers.filter(customer => {
        let customerInfo = `${customer.name} ${customer.phone || ""}`.toLowerCase();
        return keywords.every(word => customerInfo.includes(word));
    });

    currentPage = 1;
    displayCustomers();
};


function toggleClearButton() {
    let input = document.getElementById("search");
    let clearBtn = document.getElementById("clear-btn");

    // Nếu input có chữ thì hiển thị nút X, ngược lại thì ẩn đi
    clearBtn.style.display = input.value.trim() !== "" ? "block" : "none";
}

function clearSearch() {
    let input = document.getElementById("search");
    let clearBtn = document.getElementById("clear-btn");

    input.value = ""; // Xóa nội dung input
    clearBtn.style.display = "none"; // Ẩn nút X

    
    filterCustomer = customers; 
    currentPage = 1; // Đặt lại trang về trang đầu tiên

    displayCustomers(filterCustomer, currentPage, Math.ceil(filterCustomer.length / rowsPerPage)); 
}

function viewEditCustomer(id) {
    const customer = allCustomers.find(c => c.customer_id === id);
    var edit = document.getElementById("editCustomerModal");
    
    if (customer) {
        // Điền thông tin vào các trường trong modal
        edit.querySelector("#customerName").value = customer.name;
        edit.querySelector("#customerPhone").value = customer.phone;

        edit.style.display = "flex"; // Hiển thị modal
        id_ToEdit=id;
    }
}
function closeEditCustomerModal() {
    document.getElementById('editCustomerModal').style.display = "none";
}

async function updateCustomer() {
    const editModal = document.getElementById("editCustomerModal");
    const name = editModal.querySelector("#customerName").value.trim();
    const phoneInput = editModal.querySelector("#customerPhone");
    const phone = phoneInput.value.trim();

    // 🛡️ BỘ LỌC RÀNG BUỘC SĐT
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone)) {
        showStatus("SĐT không hợp lệ! Phải bắt đầu bằng 0 và có 10-11 số.", "error");
        phoneInput.focus();
        return;
    }

    if (!name) {
        showStatus("Tên khách hàng không được để trống!", "error");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5001/customers/${id_ToEdit}`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone }),
        });

        if (response.ok) {
            showStatus("Cập nhật thông tin khách hàng thành công!", "success");
            await fetchCustomers(); // Load lại danh sách mới
            closeEditCustomerModal();
        } else {
            const errorData = await response.json();
            showStatus("Lỗi: " + errorData.message, "error");
        }
    } catch (error) {
        showStatus("Lỗi kết nối máy chủ!", "error");
    }
}

/** 5. TIỆN ÍCH THÔNG BÁO (TOAST 3S) **/
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
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};
