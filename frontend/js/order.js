let currentPage = 1;
const productsPerPage = 6;
let allProducts = []; // Lưu tất cả sản phẩm
let filteredProducts = []; // Danh sách sản phẩm đã lọc

let currentCustomerId = null;

// Định dạng giá
function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,  // Không hiển thị số lẻ
        maximumFractionDigits: 0
    }).format(price);
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
    let prevButton = document.getElementById("prev");
    let nextButton = document.getElementById("next");

    productContainer.innerHTML = ""; // Xóa danh sách sản phẩm cũ

    if (filteredProducts.length === 0) {
        productContainer.innerHTML = `<p class="no-products">Không có sản phẩm nào tương ứng!</p>`;
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        return;
    }


    let startIndex = (currentPage - 1) * productsPerPage;
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
    let prevButton = document.getElementById("prev");
    let nextButton = document.getElementById("next");

    // Giữ vị trí của nút, chỉ làm nó ẩn đi nếu không cần thiết
    prevButton.style.visibility = totalPages > 1 ? "visible" : "hidden";
    nextButton.style.visibility = totalPages > 1 ? "visible" : "hidden";

    prevButton.classList.toggle("disabled", currentPage === 1);
    nextButton.classList.toggle("disabled", currentPage === totalPages);
}

// Chuyển trang
function changePage(offset) {
    let totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    currentPage = Math.min(Math.max(currentPage + offset, 1), totalPages);
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

    currentPage = 1;
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    displayProducts(filteredProducts, currentPage, totalPages);
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

    currentPage = 1;
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    document.getElementById("product-list").style.display = "grid";
    document.getElementById("prev").style.display = "inline-block";
    document.getElementById("next").style.display = "inline-block";

    displayProducts(filteredProducts, currentPage, totalPages);
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
    currentPage = 1;

    displayProducts(filteredProducts, currentPage, Math.ceil(filteredProducts.length / productsPerPage));
}

function toggleClearButton() {
    let input = document.getElementById("search-input");
    let clearBtn = document.getElementById("clear-btn");

    // Nếu input có chữ thì hiển thị nút X, ngược lại thì ẩn đi
    clearBtn.style.display = input.value.trim() !== "" ? "block" : "none";
}

function clearSearch() {
    let input = document.getElementById("search-input");
    let clearBtn = document.getElementById("clear-btn");

    input.value = ""; // Xóa nội dung input
    clearBtn.style.display = "none"; // Ẩn nút X

    // Giữ nguyên danh sách hiện tại (KHÔNG reset về toàn bộ sản phẩm)
    displayProducts(filteredProducts, currentPage, Math.ceil(filteredProducts.length / productsPerPage));
}

function goBackToMainPage() {
    window.location.href = "app.html"; // Đường dẫn đến trang chính
}

// Bắt sự kiện khi click vào sản phẩm
document.addEventListener("click", function (event) {
    let product = event.target.closest(".product"); // Kiểm tra có nhấn vào sản phẩm không
    if (!product) return; // Nếu không phải sản phẩm thì bỏ qua

    let productId = product.getAttribute("data-id");
    let name = product.getAttribute("data-name");
    let price = parseInt(product.getAttribute("data-price"));
    let imageUrl = product.getAttribute("data-image");

    addToCart(productId, name, price, imageUrl);
});

// Danh sách sản phẩm trong giỏ hàng
let cart = [];

// Hàm thêm sản phẩm vào bảng
function addToCart(productId, name, price, imageUrl) {
    let existingProduct = cart.find(item => item.id === productId);

    if (existingProduct) {
        existingProduct.quantity += 1; // Nếu đã có thì tăng số lượng
    } else {
        cart.push({ id: productId, name, price, imageUrl, quantity: 1 });
    }

    updateCart(); // Cập nhật lại bảng giỏ hàng
}

const cartProductsPerPage = 3; // Số sản phẩm hiển thị mỗi trang trong giỏ hàng
let cartCurrentPage = 1; // Trang hiện tại của giỏ hàng

// Cập nhật trạng thái phân trang giỏ hàng
function updateCartPagination() {
    let totalPages = Math.ceil(cart.length / cartProductsPerPage);
    let prevButton = document.getElementById("cart-prev");
    let nextButton = document.getElementById("cart-next");

    prevButton.style.display = totalPages > 1 ? "inline-block" : "none";
    nextButton.style.display = totalPages > 1 ? "inline-block" : "none";

    prevButton.classList.toggle("disabled", cartCurrentPage === 1);
    nextButton.classList.toggle("disabled", cartCurrentPage === totalPages);
}

// Chuyển trang giỏ hàng
function changeCartPage(offset) {
    let totalPages = Math.ceil(cart.length / cartProductsPerPage);
    cartCurrentPage = Math.min(Math.max(cartCurrentPage + offset, 1), totalPages);
    updateCart();
}

// Cập nhật giao diện giỏ hàng
function updateCart() {
    let cartContainer = document.getElementById("cart-container");
    let cartList = document.getElementById("cart-list");
    cartList.innerHTML = "";

    if (cart.length === 0) {
        cartContainer.style.display = "none";
        updateCartTotal();
        return;
    }

    cartContainer.style.display = "block";

    let totalPages = Math.ceil(cart.length / cartProductsPerPage);
    if (cartCurrentPage > totalPages) {
        cartCurrentPage = totalPages || 1; // Quay về trang cuối nếu trang hiện tại vượt quá
    }

    let startIndex = (cartCurrentPage - 1) * cartProductsPerPage;
    let endIndex = startIndex + cartProductsPerPage;
    let pageCart = cart.slice(startIndex, endIndex); // Lấy sản phẩm theo trang

    pageCart.forEach((item, i) => {
        let globalIndex = startIndex + i; // Chỉ mục chính xác trong cart

        let row = document.createElement("tr");
        row.innerHTML = `
            <td class="product-info">
                <img src="${item.imageUrl}" alt="${item.name}">
                <span>${item.name}</span>
            </td>
            <td>${formatPrice(item.price)}</td>
            <td class="quantity-container">
                <button class="quantity-btn" onclick="updateQuantity(${globalIndex}, -1)">
                    <img src="../img/subtract.png" width="20">
                </button>
                <input type="text" value="${item.quantity}" class="quantity-input" data-index="${globalIndex}">
                <button class="quantity-btn" onclick="updateQuantity(${globalIndex}, 1)">
                    <img src="../img/add.png" width="20">
                </button>
            </td>
            <td>
                <button class="delete-btn" onclick="removeFromCart(${globalIndex})">
                    <img src="../img/delete.png" width="20">
                </button>
            </td>
        `;
        row.dataset.productId = item.id;
        row.dataset.quantity = item.quantity;
        cartList.appendChild(row);
    });

    attachQuantityEvents(); // Gắn lại sự kiện input sau khi cập nhật giỏ hàng
    updateCartPagination(); // Cập nhật phân trang giỏ hàng
    updateCartTotal();
}

// Hàm cập nhật số lượng sản phẩm
function updateQuantity(index, change) {
    if (cart[index].quantity + change >= 1) {
        cart[index].quantity += change;
    }
    updateCart();
}

// Hàm xóa sản phẩm khỏi giỏ hàng
function removeFromCart(index) {
    cart.splice(index, 1); // Xóa sản phẩm khỏi mảng
    updateCart(); // Cập nhật lại bảng
    if (cart.length === 0) {
        resetCustomerInfo();
    }
}

function resetCustomerInfo() {
    document.getElementById("customer-name").textContent = "";
    document.getElementById("customer-phone").textContent = "";
    document.getElementById("customer-points").textContent = "0";
    document.getElementById("input-phone").value = "";
    document.getElementById("subtotal").textContent = "0";
    document.getElementById("discount").textContent = "0";
    document.getElementById("total").textContent = "0";
    document.getElementById("use-points").value = "";
}

// Hàm gắn sự kiện nhập số lượng
function attachQuantityEvents() {
    document.querySelectorAll(".quantity-input").forEach(input => {
        input.addEventListener("click", function () {
            this.removeAttribute("readonly");
            this.focus();
        });

        input.addEventListener("blur", function () {
            this.setAttribute("readonly", true);
            validateQuantity(this);
        });

        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                this.setAttribute("readonly", true);
                validateQuantity(this);
            }
        });

        input.addEventListener("input", function () {
            let index = this.getAttribute("data-index");
            let value = parseInt(this.value);
            if (!isNaN(value) && value >= 1) {
                cart[index].quantity = value; // Cập nhật số lượng vào mảng cart
            }
        });
    });
}

// Kiểm tra số lượng hợp lệ
function validateQuantity(input) {
    let index = input.getAttribute("data-index");
    let value = parseInt(input.value);

    if (isNaN(value) || value < 1) {
        input.value = 1;
        cart[index].quantity = 1;
    }

    updateCart(); // Cập nhật giỏ hàng để hiển thị lại số lượng mới
}

// Kiểm tra nhập điểm hợp lệ
function validatePoints(input) {
    let value = parseInt(input.value);
    let maxPoints = parseInt(document.getElementById("customer-points").textContent) || 0;

    if (isNaN(value) || value < 1) {
        input.value = 1;
    } else if (value > maxPoints) {
        input.value = maxPoints;
    }
}

// Hàm cập nhật tổng tiền trong giỏ hàng
function updateCartTotal() {
    let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0; // Hiện tại mặc định là 0
    let total = subtotal - discount;

    // Cập nhật UI trong phần tổng kết giỏ hàng
    document.getElementById("subtotal").textContent = formatPrice(subtotal);
    document.getElementById("discount").textContent = formatPrice(discount);
    document.getElementById("total").textContent = formatPrice(total);
}

function removeDiscount() {
    const rawSubtotal = document.getElementById("subtotal").textContent.replace(/[^\d]/g, '');
    const subtotal = parseInt(rawSubtotal) || 0;

    document.getElementById("discount").textContent = "0";
    document.getElementById("total").textContent = formatPrice(subtotal);
}

// Kiểm tra ô nhập điểm trống hay đang có điểm
document.getElementById("use-points").addEventListener("input", function () {
    const value = this.value.trim();
    if (value === "") {
        removeDiscount();
    }
});

function applyPoints() {
    const usePoints = parseInt(document.getElementById("use-points").value) || 0;
    const customerPoints = parseInt(document.getElementById("customer-points").textContent) || 0;

    const rawSubtotal = document.getElementById("subtotal").textContent.replace(/[^\d]/g, '');
    const subtotal = parseInt(rawSubtotal) || 0;

    if (usePoints > customerPoints) {
        alert("Số điểm nhập vượt quá điểm hiện có!");
        document.getElementById("use-points").value = customerPoints; // Gán lại max
        return;
    }

    if (usePoints < 1) {
        removeDiscount();
        return;
    }

    const discount = usePoints * 1000;
    const finalDiscount = Math.min(discount, subtotal);

    document.getElementById("discount").textContent = formatPrice(finalDiscount);
    document.getElementById("total").textContent = formatPrice(subtotal - finalDiscount);
}


function removeDiscount() {
    const rawSubtotal = document.getElementById("subtotal").textContent.replace(/[^\d]/g, '');
    const subtotal = parseInt(rawSubtotal) || 0;

    document.getElementById("discount").textContent = "0";
    document.getElementById("total").textContent = formatPrice(subtotal);
}

function openPhoneModal() {
    document.getElementById("phone-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("phone-modal").style.display = "none";
}

function closeAddCustomerModal() {
    document.getElementById("add-customer-modal").style.display = "none";
}

async function handlePhoneConfirm() {
    const phone = document.getElementById("input-phone").value.trim();
    if (!phone) {
        alert("Vui lòng nhập số điện thoại.");
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:5001/customers/phone/${phone}`);
        if (res.status === 404) {
            closeModal();
            const confirmAdd = confirm("Không tìm thấy khách hàng. Bạn có muốn thêm mới?");
            if (confirmAdd) {
                showAddCustomerModal(phone);
            }
            return;
        }

        const customer = await res.json();
        currentCustomerId = customer.id;
        closeModal();
        renderCustomerInfo(customer);
        handleMembership(customer);

    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi kiểm tra.");
    }
}

function showAddCustomerModal(phone = "") {
    document.getElementById("add-customer-modal").style.display = "flex";
    document.getElementById("new-customer-phone").value = phone;
}

function renderCustomerInfo(customer) {
    currentCustomerId = customer.id;
    document.getElementById("customer-name").textContent = customer.name;
    document.getElementById("customer-phone").textContent = customer.phone;
    document.getElementById("customer-points").textContent = customer.points || 0;
}

function handleMembership(customer) {
    const oldBtn = document.getElementById("register-member");

    if (customer.membership_level === "Regular") {
        // Clone node để xoá hết sự kiện cũ rồi thay thế
        const newBtn = oldBtn.cloneNode(true);
        newBtn.style.display = "inline-block";
        newBtn.dataset.customerId = customer.id;

        newBtn.addEventListener("click", async () => {
            try {
                const res = await fetch(`http://127.0.0.1:5001/customers/upgrade/${customer.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" }
                });

                if (res.ok) {
                    alert("Cập nhật thành viên VIP thành công!");
                    newBtn.style.display = "none";
                } else {
                    const error = await res.json();
                    alert(error.error || "Cập nhật thất bại.");
                }
            } catch (err) {
                console.error(err);
                alert("Cập nhật thất bại.");
            }
        });

        oldBtn.replaceWith(newBtn); // Thay nút cũ bằng nút mới

    } else {
        oldBtn.style.display = "none";
        oldBtn.removeAttribute("data-customerId");
    }
}


async function handleSaveCustomer() {
    const name = document.getElementById("new-customer-name").value.trim();
    const phone = document.getElementById("new-customer-phone").value.trim();
    const type = document.getElementById("new-customer-type").value;

    if (!name || !phone) {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:5001/customers/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, membership_level: type }),
        });

        const data = await res.json();

        if (res.ok) {
            alert("Thêm khách hàng thành công!");
            closeAddCustomerModal();

            // Gọi lại API để lấy thông tin đầy đủ của khách hàng mới
            const infoRes = await fetch(`http://127.0.0.1:5001/customers/phone/${phone}`);
            if (infoRes.ok) {
                const newCustomer = await infoRes.json();
                currentCustomerId = newCustomer.id;
                renderCustomerInfo(newCustomer);
                handleMembership(newCustomer);
            }
        }
        else {
            alert(`Không thể thêm khách hàng: ${data.error || "Lỗi không xác định"}`);
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("Đã xảy ra lỗi.");
    }
}

function getCustomerId() {
    return currentCustomerId;
}

// Lấy thông tin sản phẩm trong đơn hàng
function getCartItemsFromDOM() {
    const items = [];
    const cartList = document.getElementById("cart-list");

    // Duyệt tất cả <tr> trong giỏ hàng
    const rows = cartList.querySelectorAll("tr");

    rows.forEach(row => {
        const productId = parseInt(row.dataset.productId);
        const quantity = parseInt(row.dataset.quantity);

        if (!isNaN(productId) && !isNaN(quantity)) {
            items.push({ product_id: productId, quantity });
        }
    });

    return items;
}

async function confirmOrder() {
    const customerId = getCustomerId();
    const totalAmount = parseInt(document.getElementById("total").textContent.replace(/\D/g, ""));
    const cartItems = getCartItemsFromDOM();
    const usedPoints = parseInt(document.getElementById("use-points").value) || 0;

    console.log("customerId:", customerId);
    console.log("cartItems:", cartItems);
    console.log("totalAmount:", totalAmount);
    console.log("usedPoints:", usedPoints);

    if (!customerId || cartItems.length === 0) {
        alert("Thiếu thông tin khách hàng!");
        return;
    }

    try {
        // 1. Gửi hóa đơn
        const invoiceRes = await fetch("http://localhost:5001/invoices/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: customerId,
                total_amount: totalAmount
            }),
        });

        if (!invoiceRes.ok) {
            throw new Error("Không thể tạo hóa đơn");
        }

        const invoiceData = await invoiceRes.json();
        const invoiceId = invoiceData.invoice_id;

        // 2. Gửi từng chi tiết sản phẩm
        for (const item of cartItems) {
            const detailRes = await fetch(`http://localhost:5001/invoices/${invoiceId}/details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_id: item.product_id,
                    quantity: item.quantity
                }),
            });

            if (!detailRes.ok) {
                throw new Error("Không thể thêm chi tiết hóa đơn");
            }
        }

        // 3. Gửi yêu cầu cập nhật điểm
        const pointRes = await fetch(`http://localhost:5001/customers/${customerId}/points`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                invoice_amount: totalAmount,
                used_points: usedPoints
            }),
        });

        if (!pointRes.ok) {
            throw new Error("Cập nhật điểm thất bại");
        }

        alert("Thanh toán thành công!");
        showInvoiceModal(invoiceId);

    } catch (err) {
        console.error("Lỗi khi tạo hóa đơn:", err);
        alert("Có lỗi xảy ra khi tạo hóa đơn!");
    }
}

function showInvoiceModal(invoiceId) {
    console.log("Invoice ID:", invoiceId);
    const modal = document.getElementById("print-modal");
    const confirmBtn = document.getElementById("print-confirm");
    const cancelBtn = document.getElementById("print-cancel");

    modal.style.display = "flex";

    confirmBtn.onclick = () => {
        const printUrl = `http://localhost:5001/invoices_PDF/invoice/${invoiceId}`;
        window.open(printUrl, "_blank");
    
        modal.style.display = "none";
        window.location.href = "app.html";
    };

    cancelBtn.onclick = () => {
        modal.style.display = "none";
        window.location.href = "app.html";
    };
}

// Phần xác thực khuôn mặt
async function checkFaceMember() {
    // 1. Chụp ảnh từ webcam (dùng getUserMedia + canvas)
    // 2. Gửi ảnh lên API nhận diện
    let formData = new FormData();
    formData.append('image', blobImage); // blobImage là ảnh vừa chụp

    let res = await fetch('http://localhost:5002/face_recognize', { // port của Flask face_rec
        method: 'POST',
        body: formData
    });
    if (res.ok) {
        let data = await res.json();
        // Hiển thị thông tin khách hàng lên giao diện
        renderCustomerInfo(data);
    } else {
        alert("Không nhận diện được khách hàng. Vui lòng đăng ký mới!");
    }
}


function openFaceModal() {
    document.getElementById('face-modal').style.display = 'block';
    const video = document.getElementById('face-video');
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { video.srcObject = stream; })
        .catch(err => { alert("Không thể mở webcam!"); });
}

function closeFaceModal() {
    document.getElementById('face-modal').style.display = 'none';
    const video = document.getElementById('face-video');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

async function captureAndCheckFace() {
    const video = document.getElementById('face-video');
    const canvas = document.getElementById('face-canvas');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async function(blob) {
        let formData = new FormData();
        formData.append('image', blob, 'face.jpg');
        try {
            let res = await fetch('http://localhost:8000/face_recognize', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                let data = await res.json();
                // Hiển thị thông tin khách hàng lên giao diện
                document.getElementById('customer-name').innerText = data.name;
                document.getElementById('customer-phone').innerText = data.phone;
                document.getElementById('customer-points').innerText = data.points || 0;
                closeFaceModal();
            } else {
                alert("Không nhận diện được khách hàng. Vui lòng đăng ký mới!");
            }
        } catch (e) {
            alert("Lỗi kết nối đến server nhận diện!");
        }
    }, 'image/jpeg');
}

window.openFaceModal = openFaceModal;
window.closeFaceModal = closeFaceModal;
window.captureAndCheckFace = captureAndCheckFace;