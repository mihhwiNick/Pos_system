let customers = [];
let currentPage = 1;
const rowsPerPage = 8;

let id_delete = null;
let id_ToEdit = null;
let filterCustomer = []; 

fetchCustomers()

async function fetchCustomers() {
    try {
        let response = await fetch("http://127.0.0.1:5001/customers");
        customers = await response.json();
        displayCustomers(customers);
        renderPagination();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hóa đơn:", error);
    }
}


function displayCustomers(CustomerToDisplay, page, totalPages) {
    const tbody = document.getElementById("customer-list");
    tbody.innerHTML = "";

    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let paginatedInvoices = CustomerToDisplay.slice(start, end);

    paginatedInvoices.forEach(customer => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="customer-id">${customer.id}</td>
            <td class="customer-name">${customer.name}</td>
            <td class="customer-phone">${customer.phone}</td>
            <td class="customer-type">${customer.membership_level}</td>
            <td class="customer-point">${customer.points}</td>
            <td class="actions">
                <div class="action-buttons">
                    <button class="view-btn" data-id="${customer.id}" onclick="viewEditCustomer(${customer.id})">
                        Chỉnh Sửa
                    </button>
                    <button class="delete-btn" data-id="${customer.id}" onclick="showDeleteModal(${customer.id})">
                        <img src="../img/delete.png" width="20">
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    renderPagination();
}


function renderPagination() {
    const container = document.getElementById("pagination");
    container.innerHTML = ""; // Xóa nội dung cũ

    let totalPages = Math.ceil(customers.length / rowsPerPage);

    if (totalPages > 1) {
        container.innerHTML = `
            <img id="prev" class="btn-pagination" src="../img/prev.png" onclick="changePage(-1)">
            <img id="next" class="btn-pagination" src="../img/next.png" onclick="changePage(1)">
        `;

        let prevButton = document.getElementById("prev");
        let nextButton = document.getElementById("next");

        // Vô hiệu hóa nút "Previous" nếu ở trang đầu
        prevButton.classList.toggle("disabled", currentPage === 1);
        prevButton.style.pointerEvents = currentPage === 1 ? 'none' : 'auto';

        // Vô hiệu hóa nút "Next" nếu ở trang cuối
        nextButton.classList.toggle("disabled", currentPage === totalPages);
        nextButton.style.pointerEvents = currentPage === totalPages ? 'none' : 'auto';
    }
}

window.changePage = function (direction) {
    let totalPages = Math.ceil(customers.length / rowsPerPage);
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    displayCustomers(customers);
    renderPagination();
};

// Hàm hiển thị modal xóa
function showDeleteModal(id) {
    id_delete = id
    const messageElement = document.getElementById("deleteMessage");
    messageElement.textContent = "Bạn có chắc chắn muốn xóa ?";
    document.getElementById("deleteModal").style.display = "block";
}
// Hàm đóng modal xóa
function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}

// Hàm xóa hóa đơn hoặc chi tiết hóa đơn
async function deleteItem() {
    let id=id_delete
    apiUrl = `http://127.0.0.1:5001/customers/${id}`;
    try {
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) { 
            fetchCustomers()
            closeDeleteModal();
        } else {
            const errorData = await response.json();
            alert(`Lỗi: ${errorData.message}`);
        }
    } catch (error) {
        alert(`Đã xảy ra lỗi khi xóa .`);
    }
}

// Đảm bảo modal ẩn khi tải trang
window.onload = function() {
    document.getElementById('viewModal').style.display = 'none';
};


function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

function searchCustomers() {
    let searchValue = document.getElementById("search").value.trim().toLowerCase();

    if (!searchValue) {
        // Nếu ô tìm kiếm rỗng -> giữ nguyên danh sách đang hiển thị
        displayCustomers(customers, currentPage, Math.ceil(customers.length / rowsPerPage));
        return;
    }

    let searchFilteredCustomer = customers.filter(customers =>
        customers.name.toLowerCase().includes(searchValue) ||
        customers.name.toLowerCase().replace(/\s+/g, '').includes(searchValue)
    );

    if (searchFilteredCustomer.length === 0) {
        alert("Không tìm thấy hóa đơn nào tương ứng!");
        return;
    }

    
    filterCustomer = searchFilteredCustomer;
    currentPage = 1; 

    
    displayCustomers(filterCustomer, currentPage, Math.ceil(filterCustomer.length / rowsPerPage));
}



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
function openAddCustomerModal() {
    document.getElementById("addCustomerModal").style.display = "flex";
}
function closeAddCustomerModal() {
    document.getElementById("addCustomerModal").style.display = "none";
}
async function addCustomer() {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const membership_level = document.getElementById("customer-type").value.trim();
    const points = document.getElementById("customerPoint").value.trim();
    const newCustomer = {
        name: name,
        phone: phone,
        membership_level: membership_level,
        points: points
    };

    try {
        const response = await fetch("http://127.0.0.1:5001/customers/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCustomer),
        });

        if (response.ok) {
            // Nếu thêm thành công, cập nhật danh sách khách hàng
            fetchCustomers();
            closeAddCustomerModal();
        } else {
            const errorData = await response.json();
            alert(`Lỗi: ${errorData.message}`);
        }
    } catch (error) {
        alert(`Đã xảy ra lỗi khi thêm khách hàng.`);
    }
}
function viewEditCustomer(id) {
    // Tìm khách hàng theo ID
    const customer = customers.find(c => c.id === id);
    var edit = document.getElementById("editCustomerModal");
    
    if (customer) {
        // Điền thông tin vào các trường trong modal
        edit.querySelector("#customerName").value = customer.name;
        edit.querySelector("#customerPhone").value = customer.phone;
        edit.querySelector("#customer-type").value = customer.membership_level;
        edit.querySelector("#customerPoint").value = customer.points;

        edit.style.display = "flex"; // Hiển thị modal
        id_ToEdit=id;
    }
}
function closeEditCustomerModal() {
    document.getElementById('editCustomerModal').style.display = "none";
}

async function updateCustomer() {
    let id = id_ToEdit
    var edit = document.getElementById("editCustomerModal");
    const name = edit.querySelector("#customerName").value;
    const phone = edit.querySelector("#customerPhone").value;
    const membership_level = edit.querySelector("#customer-type").value;
    const points = edit.querySelector("#customerPoint").value;

    const updatedCustomer = {
        name: name,
        phone: phone,
        membership_level: membership_level,
        points: points
    };

    try {
        const response = await fetch(`http://127.0.0.1:5001/customers/${id}`, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedCustomer),
        });
        if (response.ok) {
            // Nếu cập nhật thành công, cập nhật danh sách khách hàng
            fetchCustomers();
            closeEditCustomerModal();
        } else {
            const errorData = await response.json();
            alert(`Lỗi: ${errorData.message}`);
        }
    } catch (error) {
        alert(`Đã xảy ra lỗi khi cập nhật khách hàng.`);
    }
}

