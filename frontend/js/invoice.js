let invoices = [];
let currentPage = 1;
const rowsPerPage = 8;

let toDelete = null;
let invoiceToEdit = null;
let invoiceDetails = null;
let filteredInvoices = []; // Danh sách sản phẩm đã lọc

// Định dạng giá
function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,  // Không hiển thị số lẻ
        maximumFractionDigits: 0
    }).format(price);
}

fetchInvoices();

async function fetchInvoices() {
    try {
        let response = await fetch("http://127.0.0.1:5001/invoices");
        invoices = await response.json();
        displayInvoices(invoices);
        renderPagination();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hóa đơn:", error);
    }
}

// Hàm hiển thị hóa đơn lên bảng
function displayInvoices(invoicesToDisplay, page, totalPages) {
    const tbody = document.getElementById("invoice-list");
    tbody.innerHTML = "";

    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let paginatedInvoices = invoicesToDisplay.slice(start, end);

    paginatedInvoices.forEach(invoice => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="invoice-id">${invoice.id}</td>
            <td class="customer-name">${invoice.customer_name}</td>
            <td class="created-at">${invoice.created_at}</td>
            <td class="total-amount">${formatPrice(invoice.total_amount)}</td>
            <td class="actions">
                <div class="action-buttons">
                    <button class="view-btn" data-id="${invoice.id}" onclick="viewInvoiceDetails(${invoice.id})">
                        Xem chi tiết
                    </button>
                    <button class="delete-btn" data-id="${invoice.id}" onclick="showDeleteModal(${invoice.id},'invoice')">
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

    let totalPages = Math.ceil(invoices.length / rowsPerPage);

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
    let totalPages = Math.ceil(invoices.length / rowsPerPage);
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    displayInvoices();
    renderPagination();
};

// Hàm hiển thị modal xóa
function showDeleteModal(id, type) {
    toDelete = { id, type };

    const messageElement = document.getElementById("deleteMessage");
    if (type === 'invoice') {
        messageElement.textContent = "Bạn có chắc chắn muốn xóa hóa đơn này?";
    } else if (type === 'detail') {
        messageElement.textContent = "Bạn có chắc chắn muốn xóa chi tiết hóa đơn này?";
    }

    document.getElementById("deleteModal").style.display = "block";
}

// Hàm đóng modal xóa
function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}

// Hàm xóa hóa đơn hoặc chi tiết hóa đơn
async function deleteItem() {
    if (!toDelete) return;

    const { id, type } = toDelete;
    let apiUrl = '';

    if (type === 'invoice') {
        apiUrl = `http://127.0.0.1:5001/invoices/${id}`;
    } else if (type === 'detail') {
        apiUrl = `http://127.0.0.1:5001/invoices/${id}/details`;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            if (type === 'invoice') {
                fetchInvoices();
            } else if (type === 'detail') {
                document.querySelector(`tr[data-detail-id="${id}"]`).remove();
            }
            closeDeleteModal();
        } else {
            const errorData = await response.json();
            alert(`Lỗi: ${errorData.message}`);
        }
    } catch (error) {
        alert(`Đã xảy ra lỗi khi xóa ${type === 'invoice' ? 'hóa đơn' : 'chi tiết hóa đơn'}.`);
    }
}

// Đảm bảo modal ẩn khi tải trang
window.onload = function() {
    document.getElementById('viewModal').style.display = 'none';
};


async function viewInvoiceDetails(invoiceId) {
    const apiUrl = `http://localhost:5001/invoices/${invoiceId}/details`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Kiểm tra dữ liệu chi tiết hóa đơn
        if (response.ok) {
            const data = await response.json();
            document.getElementById('viewModal').style.display = 'block';
            const invoiceDetailsContainer = document.getElementById('invoiceDetails');
            invoiceDetailsContainer.innerHTML = '';

            // Tạo bảng và thêm tiêu đề cột
            const table = document.createElement('table');
            table.classList.add('invoice-detail-table');

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Số Thứ Tự</th> 
                    <th>Tên Sản Phẩm</th>
                    <th>Số Lượng</th>
                    <th>Giá Tiền</th>
                    <th>Thao Tác</th> 
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            data.forEach((detail, index) => {
                const row = document.createElement('tr');
                row.setAttribute('data-detail-id', detail.id);

                row.innerHTML = `
                    <td>${index + 1}</td> 
                    <td>${detail.product_name || 'Không có tên sản phẩm'}</td>
                    <td>${detail.quantity}</td>
                    <td>${formatPrice(detail.price)}</td>
                    <td>
                        <button class="edit-btn">
                            <img src="../img/edit.png" width="20">
                        </button>
                        <button class="delete-btn" data-id="${detail.id}" onclick="showDeleteModal(${detail.id}, 'detail')">
                            <img src="../img/delete.png" width="20">
                        </button>
                    </td>
                `;

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            invoiceDetailsContainer.appendChild(table);
        } else {
            alert('Không tìm thấy hóa đơn');
        }
    } catch (error) {
        alert('Đã xảy ra lỗi khi lấy chi tiết hóa đơn.');
    }
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

function searchInvoice() {
    let searchValue = document.getElementById("search").value.trim().toLowerCase();

    if (!searchValue) {
        // Nếu ô tìm kiếm rỗng -> giữ nguyên danh sách đang hiển thị
        displayInvoices(invoices, currentPage, Math.ceil(invoices.length / rowsPerPage));
        return;
    }

    // Tìm kiếm trên toàn bộ hóa đơn theo tên khách hàng
    let searchFilteredInvoices = invoices.filter(invoice =>
        invoice.customer_name.toLowerCase().includes(searchValue) ||
        invoice.customer_name.toLowerCase().replace(/\s+/g, '').includes(searchValue)
    );

    if (searchFilteredInvoices.length === 0) {
        alert("Không tìm thấy hóa đơn nào tương ứng!");
        return;
    }

    // Cập nhật lại filteredInvoices để chỉ chứa những hóa đơn trùng với tìm kiếm
    filteredInvoices = searchFilteredInvoices;
    currentPage = 1; // Đặt lại trang hiện tại về trang đầu khi tìm kiếm

    // Hiển thị lại tất cả các hóa đơn trùng khớp với tìm kiếm
    displayInvoices(filteredInvoices, currentPage, Math.ceil(filteredInvoices.length / rowsPerPage));
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

    // Trả lại danh sách hóa đơn đầy đủ khi xóa tìm kiếm
    filteredInvoices = invoices; // Đặt lại filteredInvoices về danh sách ban đầu
    currentPage = 1; // Đặt lại trang về trang đầu tiên

    displayInvoices(filteredInvoices, currentPage, Math.ceil(filteredInvoices.length / rowsPerPage)); // Hiển thị lại tất cả hóa đơn
}






