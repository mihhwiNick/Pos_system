let currentPage = 1;
const productsPerPage = 6;
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








