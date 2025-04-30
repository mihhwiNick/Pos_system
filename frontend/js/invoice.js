let invoices = [];
let currentPage = 1;
const rowsPerPage = 8;

let toDelete = null;
let invoiceToEdit = null;
let invoiceDetails = null;
let filteredInvoices = []; // Danh sách hóa đơn đã lọc
let currentInvoiceId = null;

let currentPageProduct = 1;
const productsPerPage = 4;
let allProducts = []; // Lưu tất cả sản phẩm
let filteredProducts = []; // Danh sách sản phẩm đã lọc


// Định dạng giá
function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,  // Không hiển thị số lẻ
        maximumFractionDigits: 0
    }).format(price);
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);  // Tạo đối tượng Date từ chuỗi ngày giờ
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,  // Giữ 24 giờ
        timeZone: 'Asia/Ho_Chi_Minh'  // Cài đặt múi giờ là Việt Nam
    };
    return date.toLocaleString('vi-VN', options).replace(',', '');
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
function displayInvoices(invoicesToDisplay = invoices, page = currentPage) {
    const tbody = document.getElementById("invoice-list");
    tbody.innerHTML = "";

    let start = (page - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let paginatedInvoices = invoicesToDisplay.slice(start, end);

    paginatedInvoices.forEach(invoice => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="invoice-id">${invoice.id}</td>
            <td class="customer-name">${invoice.customer_name}</td>
            <td class="created-at">${formatDateTime(invoice.created_at)}</td>
            <td class="total-amount" id="total-amount-${invoice.id}">${formatPrice(invoice.total_amount)}</td>
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

    renderPagination(invoicesToDisplay);
}



function renderPagination(invoicesToDisplay = invoices) {
    const container = document.getElementById("pagination");
    container.innerHTML = "";

    let totalPages = Math.ceil(invoicesToDisplay.length / rowsPerPage);

    if (totalPages > 1) {
        container.innerHTML = `
            <img id="prev" class="btn-pagination" src="../img/prev.png" onclick="changePage(-1)">
            <img id="next" class="btn-pagination" src="../img/next.png" onclick="changePage(1)">
        `;

        let prevButton = document.getElementById("prev");
        let nextButton = document.getElementById("next");

        prevButton.classList.toggle("disabled", currentPage === 1);
        prevButton.style.pointerEvents = currentPage === 1 ? 'none' : 'auto';

        nextButton.classList.toggle("disabled", currentPage === totalPages);
        nextButton.style.pointerEvents = currentPage === totalPages ? 'none' : 'auto';
    }
}


window.changePage = function (direction) {
    let totalPages = Math.ceil(invoices.length / rowsPerPage);
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    displayInvoices(invoices, currentPage);
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
                fetchInvoices();
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

async function viewInvoiceDetails(invoiceId) {
    currentInvoiceId = invoiceId;
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

            // Tạo nút thêm chi tiết đặt TRÊN bảng
            const addButton = document.createElement('button');
            addButton.textContent = 'Thêm chi tiết hóa đơn';
            addButton.className = 'add-btn';
            addButton.onclick = () => openAddDetailModal();
            invoiceDetailsContainer.appendChild(addButton);

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
                        <button class="edit-btn" data-id="${detail.id}" onclick="showEditModal(${detail.id}, 'detail')">
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

function showEditModal(id, type) {
    if (type !== 'detail') return;

    // Tìm dòng tương ứng trong bảng
    const row = document.querySelector(`tr[data-detail-id="${id}"]`);
    if (!row) return; // Nếu không tìm thấy row, thoát hàm

    const name = row.children[1].textContent;
    const quantity = parseInt(row.children[2].textContent);
    const price = parseInt(row.children[3].textContent.replace(/[^\d]/g, ""));

    // Cập nhật giá trị vào modal
    document.getElementById("editDetailId").value = id;
    document.getElementById("editProductName").value = name;
    document.getElementById("editQuantity").value = quantity;
    document.getElementById("editPrice").value = price;

    // Hiển thị modal
    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

// Hàm lưu thay đổi khi nhấn nút "Lưu thay đổi"
function saveChanges(event) {
    event.preventDefault(); // Ngăn không cho form tự động submit và reload trang

    const id = document.getElementById("editDetailId").value;
    const newQuantity = parseInt(document.getElementById("editQuantity").value);

    if (newQuantity <= 0) {
        alert("Số lượng không hợp lệ!");
        return;
    }

    // Gọi API để cập nhật chi tiết hóa đơn
    updateInvoiceDetail(id, newQuantity);
}

// Hàm để cập nhật tổng tiền sau khi thay đổi chi tiết hóa đơn
function updateTotalAmount(invoiceId, newTotal) {
    // Thêm kiểm tra số lần nữa để đảm bảo
    if (isNaN(newTotal)) {
        console.error("Giá trị tổng tiền không hợp lệ:", newTotal);
        return;
    }

    const totalAmountCell = document.getElementById(`total-amount-${invoiceId}`);
    if (totalAmountCell) {
        totalAmountCell.textContent = formatPrice(newTotal);
    } else {
        console.error("Không tìm thấy phần tử tổng tiền cho invoiceId:", invoiceId);
    }
}

async function updateInvoiceDetail(id, newQuantity) {
    const url = `http://localhost:5001/invoices/${id}/details`; // Đảm bảo URL đúng
    const data = { quantity: newQuantity };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            // Nếu response không thành công, log chi tiết
            console.error("API trả về lỗi:", response.status, response.statusText);
            alert(`Cập nhật thất bại: ${response.status} ${response.statusText}`);
            return;
        }

        const result = await response.json();
        console.log("API Result:", result); // Log kết quả API trả về

        if (result.message === "Cập nhật thành công") {
            const row = document.querySelector(`tr[data-detail-id="${id}"]`);
            row.children[2].textContent = newQuantity; // Cập nhật quantity

            // Cập nhật tổng tiền cho hóa đơn
            updateTotalAmount(result.invoice_id, result.new_total); // Cập nhật tổng tiền của hóa đơn
            fetchInvoices();
            closeEditModal(); // Đóng modal sau khi lưu thay đổi
        } else {
            alert("Cập nhật thất bại: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi khi kết nối đến API:", error);
        alert("Lỗi khi kết nối đến API");
    }
}

function openAddDetailModal() {
    document.getElementById("invoice_id").value = currentInvoiceId;
    document.getElementById("addDetailModal").style.display = "flex"; // Hiển thị modal
}

// Đóng modal thêm chi tiết hóa đơn
function closeAddDetailModal() {
    document.getElementById("addDetailModal").style.display = "none"; // Ẩn modal
    document.getElementById("addDetailForm").reset();

    // Reset thêm các input readonly bằng tay (vì reset() không reset được chúng)
    document.getElementById("product_id").value = "";
    document.getElementById("product_name").value = "";
    document.getElementById("price").value = "";
}

function openProductSelectionModal() {
    // Hiển thị giao diện chọn sản phẩm
    document.getElementById('productSelectPanel').style.display = 'block';
}

function closeProductSelectionModal() {
    document.getElementById('productSelectPanel').style.display = 'none';
}

// Lấy danh sách sản phẩm từ API
async function fetchProducts() {
    try {
        let response = await fetch("http://127.0.0.1:5001/products");
        allProducts = await response.json();
        filteredProducts = allProducts; // Ban đầu hiển thị tất cả

        updatePagination(); // Cập nhật phân trang
        displayProducts();
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
}

// Hiển thị danh sách sản phẩm theo trang
function displayProducts() {
    let productContainer = document.querySelector(".product-selection #product-list");
    let prevButton = document.getElementById("prevProduct");
    let nextButton = document.getElementById("nextProduct");

    productContainer.innerHTML = ""; // Xóa danh sách sản phẩm cũ

    if (filteredProducts.length === 0) {
        productContainer.innerHTML = `<p class="no-products">Không có sản phẩm nào tương ứng!</p>`;
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        return;
    }


    let startIndex = (currentPageProduct - 1) * productsPerPage;
    let endIndex = startIndex + productsPerPage;
    let pageProducts = filteredProducts.slice(startIndex, endIndex);

    pageProducts.forEach(product => {
        let productItem = `
            <div class="product" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image_url}">
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${formatPrice(product.price)}</p>
            </div>
        `;
        productContainer.innerHTML += productItem;
    });

    updatePagination();
}

// Cập nhật trạng thái phân trang
function updatePagination() {
    let totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    let prevButton = document.getElementById("prevProduct");
    let nextButton = document.getElementById("nextProduct");

    // Giữ vị trí của nút, chỉ làm nó ẩn đi nếu không cần thiết
    prevButton.style.visibility = totalPages > 1 ? "visible" : "hidden";
    nextButton.style.visibility = totalPages > 1 ? "visible" : "hidden";

    prevButton.classList.toggle("disabled", currentPageProduct === 1);
    nextButton.classList.toggle("disabled", currentPageProduct === totalPages);
}

// Chuyển trang
function changePageProduct(offset) {
    let totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    currentPageProduct = Math.min(Math.max(currentPageProduct + offset, 1), totalPages);
    displayProducts();
}

// Lần đầu tiên gọi hàm fetch khi trang tải
fetchProducts();

// Ẩn box lọc giá và lọc hãng khi vừa nhấn lọc
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".dropdown").forEach(dropdown => {
        const button = dropdown.querySelector(".dropdown-btn");
        const menu = dropdown.querySelector(".dropdown-content");

        // Ẩn menu ban đầu
        menu.style.opacity = "0";
        menu.style.pointerEvents = "none";

        // Xử lý sự kiện click vào các tùy chọn trong dropdown
        menu.querySelectorAll("a").forEach(option => {
            option.addEventListener("click", function (event) {
                event.preventDefault();
                if (dropdown.id === "brand-options") {
                    filterByBrand(this.innerText);
                } else {
                    const ranges = {
                        "Dưới 2 triệu": [0, 2000000], "Từ 2 - 4 triệu": [2000000, 4000000],
                        "Từ 4 - 7 triệu": [4000000, 7000000], "Từ 7 - 12 triệu": [7000000, 12000000],
                        "Từ 12 - 20 triệu": [12000000, 20000000], "Trên 20 triệu": [20000000, Infinity]
                    };
                    filterByPrice(...(ranges[this.innerText] || [0, Infinity]));
                }
                menu.style.opacity = "0";
                menu.style.pointerEvents = "none";
            });
        });
        // Hiện menu khi hover vào button
        button.addEventListener("mouseenter", () => { menu.style.opacity = "1"; menu.style.pointerEvents = "auto"; });
        // Ẩn menu khi rời chuột khỏi dropdown
        dropdown.addEventListener("mouseleave", () => { menu.style.opacity = "0"; menu.style.pointerEvents = "none"; });
    });
});


let brandFilteredProducts = []; // Lưu sản phẩm đã lọc theo hãng
let searchFilteredProducts = []; // Lưu kết quả tìm kiếm gần nhất

function filterByBrand(brand) {
    let normalizedBrand = brand.trim().toUpperCase(); // Xóa khoảng trắng & chuyển thành chữ in hoa

    brandFilteredProducts = allProducts.filter(product => {
        return product.brand.trim().toUpperCase() === normalizedBrand;
    });

    filteredProducts = [...brandFilteredProducts]; // Cập nhật danh sách sản phẩm đã lọc
    searchFilteredProducts = []; // Xóa bộ lọc tìm kiếm

    currentPageProduct = 1;
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    displayProducts();
}


function filterByPrice(minPrice, maxPrice) {
    // Kiểm tra xem có kết quả tìm kiếm trước đó không
    let sourceProducts = searchFilteredProducts.length > 0
        ? searchFilteredProducts // Nếu đã tìm kiếm, chỉ lọc trên danh sách đã tìm
        : (brandFilteredProducts.length > 0 ? brandFilteredProducts : allProducts); // Nếu không, tiếp tục lọc theo hãng hoặc toàn bộ sản phẩm

    filteredProducts = sourceProducts.filter(product => {
        let price = Number(product.price);
        return price >= minPrice && price <= maxPrice;
    });

    currentPageProduct = 1;
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    displayProducts();
}

function searchProduct() {
    let searchValue = document.getElementById("search-input").value.trim().toLowerCase();

    if (!searchValue) {
        // Nếu ô tìm kiếm rỗng -> giữ nguyên danh sách đang hiển thị
        displayProducts(filteredProducts, currentPage, Math.ceil(filteredProducts.length / productsPerPage));
        return;
    }

    // Luôn tìm kiếm trên toàn bộ sản phẩm
    searchFilteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchValue) ||
        product.name.toLowerCase().replace(/\s+/g, '').includes(searchValue)
    );

    if (searchFilteredProducts.length === 0) {
        alert("Không tìm thấy sản phẩm nào tương ứng!");
        return;
    }

    // Hiển thị kết quả tìm kiếm
    brandFilteredProducts = [...searchFilteredProducts];
    filteredProducts = [...searchFilteredProducts];
    currentPageProduct = 1;

    displayProducts(filteredProducts, currentPage, Math.ceil(filteredProducts.length / productsPerPage));
}

function goBackToMainPage() {
    document.getElementById('productSelectPanel').style.display = 'none';
    document.getElementById('viewModal').style.display = 'block';
}

document.addEventListener("click", function (event) {
    // Kiểm tra có nhấn vào sản phẩm không
    let product = event.target.closest(".product");
    if (!product) return; // Nếu không phải sản phẩm thì bỏ qua

    let productId = product.getAttribute("data-id");
    let name = product.getAttribute("data-name");
    let price = parseInt(product.getAttribute("data-price"));

    // Điền thông tin vào modal
    document.getElementById("product_name").value = name; // Tên sản phẩm vào input
    document.getElementById("product_id").value = productId;
    document.getElementById("price").value = formatPrice(price); // Giá sản phẩm vào input

    openAddDetailModal();

    closeProductSelectionModal();
});

async function addInvoiceDetail() {
    const productId = document.getElementById('product_id').value;
    const invoiceId = document.getElementById('invoice_id').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    // Kiểm tra dữ liệu đầu vào kỹ hơn
    if (!productId || isNaN(quantity) || quantity <= 0) {
        alert("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/invoices/${invoiceId}/details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity  // Đã parse sang number ở trên
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || `Lỗi server (mã ${response.status})`);
        }


        // Cập nhật giao diện với dữ liệu đã kiểm tra
        updateTotalAmount(invoiceId, result.total_amount);
        viewInvoiceDetails(invoiceId);
        closeAddDetailModal();
        alert("Thêm chi tiết thành công!");

    } catch (error) {
        console.error("Lỗi:", error);
        alert(error.message);
    }
}

function submitAddDetailModal(event) {
    event.preventDefault();
    addInvoiceDetail();
}

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};