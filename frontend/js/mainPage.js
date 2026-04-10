let currentPage = 1;
const productsPerPage = 6;
let allProducts = []; 
let filteredProducts = []; 

// Định dạng giá
function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
}

// Lấy danh sách sản phẩm và hiển thị
// Lấy danh sách sản phẩm và hiển thị
async function fetchProducts() {
    try {
        let response = await fetch("http://127.0.0.1:5001/products");
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }
        let rawData = await response.json();
        allProducts = rawData.filter(product => parseInt(product.status) !== 0);
        filteredProducts = allProducts;

        const totalPages = Math.ceil(allProducts.length / productsPerPage);
        displayProducts(allProducts, currentPage, totalPages);

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        document.querySelector(".product-container").innerHTML = `<p class="no-products">Không thể tải sản phẩm. Vui lòng thử lại sau!</p>`;
    }
}

// Hiển thị danh sách sản phẩm
function displayProducts(products, page, totalPages) {
    let productContainer = document.querySelector(".product-container #product-list");
    let prevButton = document.getElementById("prev");
    let nextButton = document.getElementById("next");

    productContainer.innerHTML = ""; // Xóa sản phẩm cũ

    if (products.length === 0) {
        productContainer.innerHTML = `<p class="no-products">Không có sản phẩm nào tương ứng!</p>`;
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        return;
    }

    // Nếu tổng số sản phẩm nhỏ hơn hoặc bằng productsPerPage => Ẩn phân trang
    if (totalPages <= 1) {
        prevButton.style.display = "none";
        nextButton.style.display = "none";
    } else {
        prevButton.style.display = "inline-block";
        nextButton.style.display = "inline-block";
    }

    let startIndex = (page - 1) * productsPerPage;
    let endIndex = page * productsPerPage;
    let pageProducts = products.slice(startIndex, endIndex);

    pageProducts.forEach(product => {
        let productItem = `
            <div class="product" onclick="fetchProductDetail(${product.product_id})">
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${formatPrice(product.price)}</p>
            </div>
        `;
        productContainer.innerHTML += productItem;
    });

    // Cập nhật trạng thái hiển thị của prev/next
    prevButton.classList.toggle("disabled", page === 1);
    nextButton.classList.toggle("disabled", page === totalPages);
}

// Lấy chi tiết sản phẩm khi người dùng click
async function fetchProductDetail(productId) {
    try {
        let response = await fetch(`http://127.0.0.1:5001/products/${productId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch product details: ${response.status} ${response.statusText}`);
        }
        let product = await response.json();

        // Ẩn danh sách sản phẩm và hiển thị chi tiết sản phẩm
        document.getElementById("product-list").style.display = "none";
        document.getElementById("prev").style.display = "none";
        document.getElementById("next").style.display = "none";
        document.getElementById("price-filter").style.display = "none";
        document.getElementById("product-detail-container").style.display = "block";

        // Cập nhật nội dung chi tiết sản phẩm
        let productDetailContainer = document.getElementById("product-detail-container");
        productDetailContainer.innerHTML = `
            <img src="../img/return.png" class="return-icon" onclick="goBackToMainPage()" alt="Quay lại">
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
        alert("Không thể tải chi tiết sản phẩm. Vui lòng thử lại sau!");
    }
}

// Quay lại trang danh sách sản phẩm
function goBackToMainPage() {
    document.getElementById("product-list").style.display = "grid";
    document.getElementById("prev").style.display = "inline-block";
    document.getElementById("next").style.display = "inline-block";
    document.getElementById("price-filter").style.display = "flex";
    document.getElementById("product-detail-container").style.display = "none";

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
        return product.brand.trim().toUpperCase() === normalizedBrand;
    });

    filteredProducts = [...brandFilteredProducts]; // Cập nhật danh sách sản phẩm đã lọc
    searchFilteredProducts = []; // Xóa bộ lọc tìm kiếm

    currentPage = 1;

    // Nếu đang ở trang chi tiết thì quay về danh sách sản phẩm
    document.getElementById("product-detail-container").style.display = "none";
    document.getElementById("product-list").style.display = "grid";
    document.getElementById("prev").style.display = "inline-block";
    document.getElementById("next").style.display = "inline-block";
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
    document.getElementById("prev").style.display = "inline-block";
    document.getElementById("next").style.display = "inline-block";

    displayProducts(filteredProducts, currentPage, totalPages);
}

/** --- CẬP NHẬT HÀM TÌM KIẾM SẢN PHẨM --- **/
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

    // Hiệu ứng mờ dần và xóa sau 3 giây
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
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

    filteredProducts = allProducts;
    currentPage = 1;
    // Giữ nguyên danh sách hiện tại (KHÔNG reset về toàn bộ sản phẩm)
    displayProducts(filteredProducts, currentPage, Math.ceil(filteredProducts.length / productsPerPage));
}

document.querySelectorAll('.brand a').forEach(el => {
    el.addEventListener('click', function () {
        console.log("Brand được nhấn:", this.innerText);
    });
});

function createOrder() {
    window.location.href = "order.html";
}

// Hiện/Ẩn Menu Dropdown khi nhấn vào Icon User
function toggleMenu() {
    const dropdown = document.getElementById("user-dropdown");
    dropdown.classList.toggle("show");
}

// Đóng menu nếu người dùng nhấn ra ngoài vùng icon
window.onclick = function(event) {
    if (!event.target.matches('.user img')) {
        const dropdown = document.getElementById("user-dropdown");
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
}

// Hàm mở Modal Đổi mật khẩu
window.openChangePasswordModal = () => {
    // Lấy thông tin login từ sessionStorage (mà bạn đã lưu lúc đăng nhập)
    const loginData = JSON.parse(sessionStorage.getItem("loginData"));
    
    if (!loginData) {
        alert("Bạn chưa đăng nhập! Vui lòng đăng nhập để đổi mật khẩu.");
        return;
    }

    document.getElementById("change-password-modal").style.display = "flex";
};

// Hàm đóng Modal
window.closeChangePasswordModal = () => {
    document.getElementById("change-password-modal").style.display = "none";
    document.getElementById("change-password-form").reset();
};

// Xử lý gửi Form Đổi mật khẩu về Backend
const changePasswordForm = document.getElementById("change-password-form");
if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Lấy thẻ hiển thị trạng thái
        const statusMsg = document.getElementById("password-status");
        const loginData = JSON.parse(sessionStorage.getItem("loginData"));
        const userId = loginData.user_id; 
        
        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmNewPassword = document.getElementById("confirm-new-password").value;

        // Reset trạng thái thông báo mỗi lần nhấn Cập nhật
        statusMsg.style.display = "none";

        if (newPassword !== confirmNewPassword) {
            statusMsg.innerText = "⚠️ Mật khẩu mới không khớp!";
            statusMsg.style.color = "#e67e22";
            statusMsg.style.display = "block";
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5001/accounts/users/${userId}/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const result = await response.json();

            if (response.ok) {
                // 1. Hiện thông báo thành công
                statusMsg.innerText = "✅ Đổi mật khẩu thành công!";
                statusMsg.style.color = "#2ecc71";
                statusMsg.style.display = "block";
                statusMsg.style.fontWeight = "bold";

                // 2. Xóa trắng form
                changePasswordForm.reset();

                // 3. Đợi 1.5 giây rồi tự đóng Modal
                setTimeout(() => {
                    closeChangePasswordModal();
                    statusMsg.style.display = "none";
                }, 1500);

            } else {
                // Hiện lỗi từ Backend (ví dụ: sai mật khẩu cũ)
                statusMsg.innerText = "❌ " + (result.message || "Không thể đổi mật khẩu");
                statusMsg.style.color = "#e74c3c";
                statusMsg.style.display = "block";
            }
        } catch (error) {
            console.error("Error changing password:", error);
            statusMsg.innerText = "❌ Lỗi kết nối đến máy chủ!";
            statusMsg.style.color = "#e74c3c";
            statusMsg.style.display = "block";
        }
    });
}

// --- LOGIC MỞ/ĐÓNG MODAL ---
window.openEditNameModal = (event) => {
    event.stopPropagation(); // Không cho đóng dropdown khi bấm
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    document.getElementById("new-full-name").value = data.full_name || "";
    document.getElementById("edit-name-modal").style.display = "flex";
};

window.closeEditNameModal = () => {
    document.getElementById("edit-name-modal").style.display = "none";
};

window.openEditPhoneModal = (event) => {
    event.stopPropagation();
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    document.getElementById("new-phone-number").value = data.phone_number || "";
    document.getElementById("edit-phone-modal").style.display = "flex";
};

window.closeEditPhoneModal = () => {
    document.getElementById("edit-phone-modal").style.display = "none";
};


// 1. Cập nhật Tên
document.getElementById("edit-name-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = document.getElementById("new-full-name").value.trim();
    if (!newName) return showStatus("Vui lòng nhập tên mới!", "error");
    
    await updateUserInfo({ full_name: newName }, "name-status", closeEditNameModal);
});

// 2. Cập nhật SĐT (🚀 ĐÃ THÊM RÀNG BUỘC)
document.getElementById("edit-phone-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const phoneInput = document.getElementById("new-phone-number");
    const newPhone = phoneInput.value.trim();
    if (!newPhone) {
        showStatus("Vui lòng nhập số điện thoại mới!", "error");
        phoneInput.focus();
        return;
    }

    const phoneRegex = /^0\d{9,10}$/;

    if (!phoneRegex.test(newPhone)) {
        // Thông báo lỗi 3s (Hàm showStatus của ông giáo đã có sẵn logic 3s rồi)
        showStatus("SĐT không hợp lệ! Phải bắt đầu bằng số 0 và có 10-11 chữ số.", "error");
        
        // Tiện tay focus vào ô nhập và bôi đen cho nhân viên dễ sửa
        phoneInput.focus();
        phoneInput.select();
        
        return; // Dừng lại, không cho gọi hàm updateUserInfo nữa
    }

    // Nếu vượt qua bộ lọc thì mới gọi API
    await updateUserInfo({ phone_number: newPhone }, "phone-status", closeEditPhoneModal);
});

// Hàm dùng chung để Update
async function updateUserInfo(payload, statusId, closeCallback) {
    const sessionData = JSON.parse(sessionStorage.getItem("loginData"));
    const statusMsg = document.getElementById(statusId);

    if (!sessionData || !sessionData.user_id) {
        showStatus("Lỗi xác thực người dùng!", "error");
        return;
    }

    try {
        // 🚀 SỬA Ở ĐÂY: Gọi đúng Route bên employees_bp mà mình vừa tạo
        const response = await fetch(`http://127.0.0.1:5001/employees/update-profile/${sessionData.user_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
            const updatedData = { ...sessionData, ...payload };
            sessionStorage.setItem("loginData", JSON.stringify(updatedData));

            showStatus("Cập nhật thông tin thành công!", "success");
            if (typeof closeCallback === "function") closeCallback();
            setTimeout(() => {
                location.reload(); 
            }, 1000);
        } else {
            statusMsg.innerText = "❌ " + (result.message || "Lỗi cập nhật");
            statusMsg.style.display = "block";
            statusMsg.style.color = "red";
        }
    } catch (error) {
        console.error("Lỗi Fetch:", error);
        showStatus("Không thể kết nối đến máy chủ!", "error");
    }
}

function goToIncomeCenter() {
    window.location.href = "income.html";
}

window.openSelfAttendanceModal = () => {
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    if (!data || !data.employee_id) {
        showStatus("Lỗi xác thực thông tin nhân viên!", "error");
        return;
    }

    // Set mặc định tháng hiện tại vào ô lọc
    const now = new Date();
    document.getElementById("self-att-month").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    document.getElementById("self-attendance-modal").style.display = "flex";
    fetchSelfAttendance(); // Gọi hàm lấy dữ liệu luôn
};

window.closeSelfAttendanceModal = () => {
    document.getElementById("self-attendance-modal").style.display = "none";
};

async function fetchSelfAttendance() {
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    const empId = data.employee_id;
    const filterVal = document.getElementById("self-att-month").value;
    
    if (!filterVal) return;
    const [year, month] = filterVal.split("-");

    const listBody = document.getElementById("self-attendance-list");
    listBody.innerHTML = `<tr><td colspan="5" style="padding:20px;">Đang tải dữ liệu...</td></tr>`;

    try {
        // Tái sử dụng chính cái Route mà ông giáo đã làm cho trang Quản lý kkk
        const res = await fetch(`http://127.0.0.1:5001/attendance/details/${empId}?month=${month}&year=${year}`);
        let details = await res.json();

        // Sắp xếp ngày tăng dần cho dễ nhìn
        details.sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

        listBody.innerHTML = "";
        if (details.length === 0) {
            listBody.innerHTML = `<tr><td colspan="5" style="padding:20px;">Không có dữ liệu trong tháng này.</td></tr>`;
            return;
        }

        details.forEach(record => {
            const dateStr = new Date(record.work_date).toLocaleDateString('vi-VN');
            let color = "#e74c3c"; // Đỏ (nghỉ)
            let statusText = "Nghỉ/Không tính";

            if (record.work_value >= 1) { color = "#2ecc71"; statusText = "Đủ công"; }
            else if (record.work_value > 0) { color = "#f1c40f"; statusText = "Nửa công"; }

            listBody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee; text-align: center;">
                    <td style="padding: 12px;">${dateStr}</td>
                    <td>${record.check_in || '--:--'}</td>
                    <td>${record.check_out || '--:--'}</td>
                    <td style="font-weight: bold;">${record.work_value}</td>
                    <td><span style="color: ${color}; font-weight: 600;">${statusText}</span></td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Lỗi fetch lịch sử công:", error);
        listBody.innerHTML = `<tr><td colspan="5" style="color:red; padding:20px;">Lỗi kết nối máy chủ!</td></tr>`;
    }
}