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

// Lấy danh sách sản phẩm và hiển thị
async function fetchProducts() {
    try {
        let response = await fetch("http://127.0.0.1:5001/products");
        allProducts = await response.json();

        filteredProducts = allProducts;
        
        const totalPages = Math.ceil(allProducts.length / productsPerPage);
        displayProducts(allProducts, currentPage, totalPages);
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
}

// Hiển thị danh sách sản phẩm
function displayProducts(products, page, totalPages) {
    let productContainer = document.getElementById("product-list");
    let pagination = document.getElementById("pagination");
    let noResultsMessage = document.getElementById("no-results-message");

    productContainer.innerHTML = ""; // Xóa sản phẩm cũ

    if (products.length === 0) {
        // Hiển thị thông báo không có sản phẩm
        productContainer.innerHTML = `<p class="no-products">Không có sản phẩm nào tương ứng với mức giá đó!</p>`;
        document.getElementById("pagination").style.display = "none";
        return;
    } else {
        document.getElementById("pagination").style.display = "flex"; // Hiển thị lại phân trang nếu có sản phẩm
    }

    let startIndex = (page - 1) * productsPerPage;
    let endIndex = page * productsPerPage;
    let pageProducts = products.slice(startIndex, endIndex);
    productContainer.innerHTML = "";

    pageProducts.forEach(product => {
        let productItem = `
            <div class="product" onclick="fetchProductDetail(${product.id})">
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${formatPrice(product.price)}</p>
            </div>
        `;
        productContainer.innerHTML += productItem;
    });

    // Kiểm tra số lượng sản phẩm để hiển thị phân trang hay không
    if (products.length <= productsPerPage) {
        document.getElementById("pagination").style.display = "none";
    } else {
        document.getElementById("pagination").style.display = "flex";
        document.getElementById("prev").disabled = page === 1;
        document.getElementById("next").disabled = page === totalPages;
    }
}



// Lấy chi tiết sản phẩm khi người dùng click
async function fetchProductDetail(productId) {
    try {
        let response = await fetch(`http://127.0.0.1:5001/products/${productId}`);
        let product = await response.json();

        // Ẩn danh sách sản phẩm và hiển thị chi tiết sản phẩm
        document.getElementById("product-list").style.display = "none";
        document.getElementById("pagination").style.display = "none";
        document.getElementById("price-filter").style.display = "none";
        document.getElementById("product-detail-container").style.display = "block";

        // Cập nhật nội dung chi tiết sản phẩm
        let productDetailContainer = document.getElementById("product-detail-container");
        productDetailContainer.innerHTML = `
            <button class="back-button" onclick="goBackToMainPage()">Quay lại</button>
            <div class="product-detail">
                <div class="product-detail-left">
                    <img src="${product.image_url}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${formatPrice(product.price)}</p>
                </div>
                <div class="product-detail-right">
                    <h4>Thông số kỹ thuật:</h4>
                    <ul>
                        <li><strong>Battery:</strong> ${product.battery}</li>
                        <li><strong>Camera:</strong> ${product.camera}</li>
                        <li><strong>Processor:</strong> ${product.processor}</li>
                        <li><strong>RAM:</strong> ${product.ram}</li>
                        <li><strong>Storage:</strong> ${product.storage}</li>
                        <li><strong>Screen Size:</strong> ${product.screen_size}</li>
                        <li><strong>Os:</strong> ${product.os}</li>
                        <li><strong>Color:</strong> ${product.color}</li>
                    </ul>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
    }
}

// Quay lại trang danh sách sản phẩm
function goBackToMainPage() {
    document.getElementById("product-list").style.display = "grid";
    document.getElementById("pagination").style.display = "flex";
    document.getElementById("product-detail-container").style.display = "none";
    document.getElementById("price-filter").style.display = "flex";

    // Không gọi lại fetchProducts() để tránh mất dữ liệu đã lọc
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    displayProducts(filteredProducts, currentPage, totalPages);
}

// Điều hướng giữa các trang
function changePage(direction) {
    currentPage += direction;

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    displayProducts(filteredProducts, currentPage, totalPages);
}


// Lần đầu tiên gọi hàm fetch khi trang tải
fetchProducts();

// Ẩn box lọc giá khi vừa nhấn lọc
document.addEventListener("DOMContentLoaded", function () {
    const menu = document.querySelector(".price-options");
    const priceFilter = document.getElementById("price-filter");

    document.querySelectorAll(".price-options a").forEach(option => {
        option.addEventListener("click", function (event) {
            event.preventDefault();
            const ranges = {
                "Dưới 2 triệu": [0, 2000000], "Từ 2 - 4 triệu": [2000000, 4000000],
                "Từ 4 - 7 triệu": [4000000, 7000000], "Từ 7 - 12 triệu": [7000000, 12000000],
                "Từ 12 - 20 triệu": [12000000, 20000000], "Trên 20 triệu": [20000000, Infinity]
            };
            filterByPrice(...(ranges[this.innerText] || [0, Infinity]));
            menu.style.opacity = "0"; menu.style.pointerEvents = "none";
        });
    });

    priceFilter.addEventListener("mouseenter", () => { menu.style.opacity = "1"; menu.style.pointerEvents = "auto"; });
    priceFilter.addEventListener("mouseleave", () => { menu.style.opacity = "0"; menu.style.pointerEvents = "none"; });
});

let brandFilteredProducts = []; // Lưu sản phẩm đã lọc theo hãng
let searchFilteredProducts = []; // Lưu kết quả tìm kiếm gần nhất

function filterByBrand(brand) {
    let normalizedBrand = brand.trim().toUpperCase(); // Xóa khoảng trắng & chuyển thành chữ in hoa

    brandFilteredProducts = allProducts.filter(product => {
        console.log("Sản phẩm:", product.name, " | Brand:", product.brand);
        return product.brand.trim().toUpperCase() === normalizedBrand;
    });

    filteredProducts = [...brandFilteredProducts]; // Cập nhật danh sách sản phẩm đã lọc
    searchFilteredProducts = []; // Xóa bộ lọc tìm kiếm

    currentPage = 1;

    // Nếu đang ở trang chi tiết thì quay về danh sách sản phẩm
    document.getElementById("product-detail-container").style.display = "none";
    document.getElementById("product-list").style.display = "grid";
    document.getElementById("pagination").style.display = "flex";
    document.getElementById("price-filter").style.display = "flex";

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

    document.getElementById("product-detail-container").style.display = "none";
    document.getElementById("product-list").style.display = "grid";
    document.getElementById("pagination").style.display = "flex";

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
        alert("Không tìm thấy sản phẩm nào!");
        return;
    }

    // Hiển thị kết quả tìm kiếm
    brandFilteredProducts = [...searchFilteredProducts];
    filteredProducts = [...searchFilteredProducts];
    currentPage = 1;

    // Nếu đang ở trang chi tiết thì quay về danh sách sản phẩm
    document.getElementById("product-detail-container").style.display = "none";
    document.getElementById("product-list").style.display = "grid";
    document.getElementById("pagination").style.display = "flex";
    document.getElementById("price-filter").style.display = "flex";

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

document.querySelectorAll('.brand a').forEach(el => {
    el.addEventListener('click', function() {
        console.log("Brand được nhấn:", this.innerText);
    });
});









