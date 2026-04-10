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
            <div class="product" data-id="${product.product_id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image_url}">
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
    sessionStorage.removeItem("customerId");
    currentCustomerId = null;
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

    const pointInput = document.getElementById("use-points");
    if (pointInput) {
        pointInput.addEventListener("keypress", function (e) {
            // Chỉ cho phép nhập số (phím 0-9 tương ứng mã ASCII 48-57)
            if (e.which < 48 || e.which > 57) {
                e.preventDefault();
            }
        });
    }

    const phoneInput = document.getElementById("input-phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function() {
            // Khi đang gõ SĐT mới, lập tức hủy quyền thanh toán của ID cũ
            currentCustomerId = null;
            sessionStorage.removeItem("customerId");
            
            // Ẩn luôn khung thông tin khách cũ cho chuyên nghiệp
            const customerInfoBox = document.querySelector(".customer-info");
            if (customerInfoBox) {
                customerInfoBox.style.display = "none";
            }
            
            // Hiện lại nút Đăng ký nếu cần (hoặc ẩn đi tùy ông)
            const registerBtn = document.getElementById("register-member");
            if (registerBtn) {
                registerBtn.style.display = "none";
            }
        });
    }
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
    let searchValue = document.getElementById("search-input").value.toLowerCase().trim();

    // 1. Nếu ô tìm kiếm rỗng -> Reset về trạng thái ban đầu hoặc danh sách đang lọc hãng
    if (!searchValue) {
        showStatus("Vui lòng nhập tên sản phẩm cần tìm!", "error");
        // Trả về danh sách lọc theo hãng (nếu có) hoặc toàn bộ sản phẩm
        filteredProducts = brandFilteredProducts.length > 0 ? brandFilteredProducts : allProducts;
        currentPage = 1;
        displayProducts(filteredProducts, currentPage, Math.ceil(filteredProducts.length / productsPerPage));
        return;
    }

    // 🚀 BÍ KÍP TOKENIZE: Tách chuỗi sếp gõ thành mảng các từ khóa
    // Ví dụ: "15 Pro iPhone" -> ["15", "pro", "iphone"]
    let keywords = searchValue.split(/\s+/);

    // 2. Thực hiện lọc dữ liệu trên allProducts
    searchFilteredProducts = allProducts.filter(product => {
        let productName = product.name.toLowerCase();
        
        // LOGIC: Trả về true nếu TẤT CẢ các từ khóa sếp gõ đều xuất hiện trong tên sản phẩm
        // Không quan trọng thứ tự "15 Pro" hay "Pro 15" kkk
        return keywords.every(key => productName.includes(key));
    });

    // 3. Xử lý kết quả
    if (searchFilteredProducts.length === 0) {
        showStatus("Không tìm thấy sản phẩm nào tương ứng!", "error");
        return;
    }

    // 4. Nếu tìm thấy -> Thông báo xanh cho xịn kkk
    showStatus(`Tìm thấy ${searchFilteredProducts.length} sản phẩm!`, "success");

    // Cập nhật danh sách hiển thị
    filteredProducts = [...searchFilteredProducts];
    currentPage = 1;

    // Tính toán lại tổng số trang cho kết quả tìm kiếm
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    displayProducts(filteredProducts, currentPage, totalPages);
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
    let existingProduct = cart.find(item => item.product_id === productId);

    if (existingProduct) {
        existingProduct.quantity += 1; // Nếu đã có thì tăng số lượng
    } else {
        cart.push({ product_id: productId, name, price, imageUrl, quantity: 1 });
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
        row.dataset.productId = item.product_id;
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

// Kiểm tra ô nhập điểm trống hay đang có điểm
document.getElementById("use-points").addEventListener("input", function () {
    const value = this.value.trim();
    if (value === "") {
        removeDiscount();
    }
});

function applyPoints() {
    const usePointsRaw = document.getElementById("use-points").value.trim();
    const customerPoints = parseInt(document.getElementById("customer-points").textContent) || 0;
    const rawSubtotal = document.getElementById("subtotal").textContent.replace(/[^\d]/g, '');
    const subtotal = parseInt(rawSubtotal) || 0;

    // 1. Kiểm tra nếu chưa nhập gì
    if (usePointsRaw === "") {
        showStatus("Vui lòng nhập số điểm muốn sử dụng!", "error");
        return;
    }

    const usePoints = parseInt(usePointsRaw);

    // 2. Kiểm tra nếu nhập chữ hoặc không phải số hợp lệ
    if (isNaN(usePoints)) {
        showStatus("Điểm nhập vào phải là con số!", "error");
        return;
    }

    // 3. Kiểm tra số điểm âm hoặc bằng 0
    if (usePoints <= 0) {
        showStatus("Số điểm sử dụng phải lớn hơn 0!", "error");
        removeDiscount();
        return;
    }

    // 4. Kiểm tra điểm nhập vào có lớn hơn điểm khách đang có không
    if (usePoints > customerPoints) {
        showStatus(`Điểm vượt quá mức hiện có (${customerPoints}đ)!`, "error");
        document.getElementById("use-points").value = customerPoints; // Gán lại mức tối đa cho tiện
        return;
    }

    // 5. Logic tính toán: 1 điểm = 1.000 VNĐ
    const discount = usePoints * 1000;
    const finalDiscount = Math.min(discount, subtotal); // Không giảm quá tổng tiền đơn hàng

    // Cập nhật giao diện
    document.getElementById("discount").textContent = formatPrice(finalDiscount);
    document.getElementById("total").textContent = formatPrice(subtotal - finalDiscount);

    showStatus("Đã áp dụng giảm giá từ điểm tích lũy!");
}

function removeDiscount() {
    const rawSubtotal = document.getElementById("subtotal").textContent.replace(/[^\d]/g, '');
    const subtotal = parseInt(rawSubtotal) || 0;

    document.getElementById("discount").textContent = "0";
    document.getElementById("total").textContent = formatPrice(subtotal);
}

function closeAddCustomerModal() {
    document.getElementById("add-customer-modal").style.display = "none";
}

async function checkMember() {
    const phoneInput = document.getElementById("input-phone");
    const phone = phoneInput.value.trim();

    // 1. CHẶN NẾU TRỐNG: Nếu chưa nhập SĐT thì báo lỗi và dừng luôn
    if (!phone) {
        showStatus("Vui lòng nhập số điện thoại khách hàng trước!", "error");
        phoneInput.focus(); // Đưa con trỏ vào ô nhập cho nhân viên dễ làm việc
        
        // Xóa sạch dữ liệu khách cũ để tránh nhầm lẫn
        currentCustomerId = null;
        sessionStorage.removeItem("customerId");
        resetCustomerInfo(); // Hàm xóa trắng UI khách hàng
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/customers/phone/${phone}`);
        const data = await response.json();

        if (response.status === 404) {
            // Không tìm thấy khách -> Xóa sạch ID cũ
            currentCustomerId = null;
            sessionStorage.removeItem("customerId");
            
            document.getElementById("confirm-register-modal").style.display = "flex";
            document.querySelector(".customer-info").style.display = "none";
            document.getElementById("register-member").style.display = "none";
        } else if (response.ok) {
            showStatus("Đã xác nhận thành viên: " + data.name);
            
            document.getElementById("customer-name").innerText = data.name;
            document.getElementById("customer-phone").innerText = data.phone;
            document.getElementById("customer-points").innerText = data.points;
            
            // LƯU ID MỚI VÀO CẢ BIẾN TOÀN CỤC VÀ STORAGE
            currentCustomerId = data.customer_id;
            saveCustomerIdToStorage(data.customer_id);

            document.querySelector(".customer-info").style.display = "block";
            document.getElementById("register-member").style.display = "none";
        }
    } catch (error) {
        showStatus("Lỗi kết nối máy chủ!", "error");
    }
}

function openRegisterFromConfirm() {
    // Lấy số điện thoại từ ô "Kiểm tra"
    const phoneInput = document.getElementById("input-phone").value.trim();
    
    // Đóng modal xác nhận
    closeConfirmModal();
    
    // Mở modal đăng ký (hàm registerMember cũ của ông)
    registerMember();
    
    // Tự động điền SĐT vào ô đăng ký mới
    const newPhoneField = document.getElementById("new-customer-phone");
    if (newPhoneField) {
        newPhoneField.value = phoneInput;
        newPhoneField.focus(); // Đưa con trỏ vào ô SĐT để khách có thể sửa nếu muốn
    }
}

/** --- 3. HÀM ĐÓNG MODAL XÁC NHẬN --- **/
function closeConfirmModal() {
    document.getElementById("confirm-register-modal").style.display = "none";
}

function registerMember() {
    document.getElementById("add-customer-modal").style.display = "flex";
}

// Hàm đóng modal khi nhấn nút "Hủy"
function closeAddCustomerModal() {
    document.getElementById("add-customer-modal").style.display = "none";
}

function renderCustomerInfo(customer) {
    currentCustomerId = customer.customer_id;
    document.getElementById("customer-name").textContent = customer.name;
    document.getElementById("customer-phone").textContent = customer.phone;
    document.getElementById("customer-points").textContent = customer.points || 0;
}

async function handleSaveCustomer() {
    const name = document.getElementById("new-customer-name").value.trim();
    const phone = document.getElementById("new-customer-phone").value.trim();

    if (!name || !phone) {
        showStatus("Vui lòng điền đầy đủ thông tin!", "error");
        return;
    }
    const phoneRegex = /^0\d{9,10}$/;

    if (!phoneRegex.test(phone)) {
        showStatus("SĐT phải bắt đầu bằng số 0 và có 10-11 chữ số!", "error");
        // Giữ modal lại để khách sửa, không cho chạy tiếp
        return; 
    }

    try {
        const res = await fetch("http://127.0.0.1:5001/customers/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone }),
        });
        
        const data = await res.json();

        if (!res.ok) {
            showStatus("Lỗi: " + (data.message || "Không thể thêm khách"), "error");
            return;
        }

        // Nếu thêm thành công
        showStatus("Đã thêm khách hàng mới!");

        // Lấy thông tin chi tiết để hiển thị ra đơn hàng
        const infoRes = await fetch(`http://127.0.0.1:5001/customers/phone/${phone}`);
        if (infoRes.ok) {
            const newCustomer = await infoRes.json();
            
            // Đợi 0.5s cho khách kịp nhìn thông báo rồi mới đóng modal cho mượt
            setTimeout(() => {
                closeAddCustomerModal();
                currentCustomerId = newCustomer.customer_id; 
                saveCustomerIdToStorage(currentCustomerId);
                renderCustomerInfo(newCustomer);
                showStatus("Đăng ký thành viên thành công!");
            }, 800);
        }

    } catch (err) {
        showStatus("Lỗi kết nối server!", "error");
        console.error(err);
    }
}

function showStatus(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Tự động xóa element khỏi DOM sau 3.2s để tránh rác code
    setTimeout(() => {
        toast.remove();
    }, 3200);
}

// Lưu customerId vào sessionStorage khi cập nhật
function saveCustomerIdToStorage(customer_id) {
    console.log("Saving customerId:", customer_id);
    sessionStorage.setItem("customerId", customer_id);
}

function getCustomerIdFromStorage() {
    return sessionStorage.getItem("customerId");
}

function getCustomerId() {
    return getCustomerIdFromStorage();
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
    const customerIdRaw = getCustomerId();
    const cartItems = getCartItemsFromDOM();
    const loginData = JSON.parse(sessionStorage.getItem("loginData"));
    
    // 1. Ép kiểu về Integer để Backend không mắng
    const customerId = parseInt(customerIdRaw);
    const employeeId = loginData ? parseInt(loginData.employee_id) : null;
    
    const subtotal = parseInt(document.getElementById("subtotal").textContent.replace(/\D/g, "")) || 0;
    const usedPoints = parseInt(document.getElementById("use-points").value) || 0;

    const discount = usedPoints * 1000;
    const calculatedTotal = subtotal - discount;

    // 2. Kiểm tra dữ liệu đầu vào (Validation)
    if (isNaN(customerId)) {
        showStatus("Vui lòng cung cấp thông tin khách hàng trước khi thanh toán", "error");
        return;
    }
    if (cartItems.length === 0) {
        showStatus("Giỏ hàng đang trống!", "error");
        return;
    }
    if (!employeeId) {
        showStatus("Lỗi bảo mật: Vui lòng đăng nhập lại!", "error");
        return;
    }

    try {
        // 3. Gửi hóa đơn với dữ liệu SẠCH
        const invoiceRes = await fetch("http://localhost:5001/invoices/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: customerId,      // Đã là số nguyên
                employee_id: employeeId,      // Đã là số nguyên
                total_amount: calculatedTotal, // Số
                used_points: usedPoints,       // Số
                status: 1                      // Thêm status cho chắc cú
            }),
        });

        if (!invoiceRes.ok) {
            const errorText = await invoiceRes.text();
            console.error("Backend phản hồi lỗi:", errorText);
            throw new Error("Lỗi Backend: " + errorText);
        }

        const invoiceData = await invoiceRes.json();
        const invoiceId = invoiceData.invoice_id;

        // 2. Gửi chi tiết hóa đơn
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

        // 3. Cập nhật điểm
        const pointRes = await fetch(`http://localhost:5001/customers/${customerId}/points`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                invoice_amount: calculatedTotal,  // Gửi tổng tiền đã tính
                used_points: usedPoints
            }),
        });

        if (!pointRes.ok) {
            throw new Error("Cập nhật điểm thất bại");
        }

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
