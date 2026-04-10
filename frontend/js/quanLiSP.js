/** 0. KHAI BÁO BIẾN TOÀN CỤC **/
let allProducts = [];
let filteredProducts = [];
let currentProduct = {};
let currentPage = 0;
let targetProductId = null;
let targetNewStatus = null;
const PAGE_SIZE = 5; 

// Danh sách các ID input để map với Database
const FIELDS = [
    "name", "price", "brand", "screen_size", "processor", 
    "ram", "storage", "battery", "camera", "os", "color", "image_url"
];

/** 1. KHỞI TẠO DỮ LIỆU **/
async function fetchProducts() {
    try {
        let response = await fetch("http://127.0.0.1:5001/products");
        allProducts = await response.json();
        filteredProducts = allProducts;
        displayProducts();
    } catch (error) {
        console.error("Lỗi khi kết nối API:", error);
    }
}

/** 2. HIỂN THỊ BẢNG SẢN PHẨM **/
function displayProducts() {
    let tbody = document.getElementById("product_table");
    tbody.innerHTML = "";

    let start = currentPage * PAGE_SIZE;
    let end = start + PAGE_SIZE;

    for (let i = start; i < end; i++) {
        if (filteredProducts[i]) {
            let prd = filteredProducts[i];
            
            // 🚀 BẢN FIX CUỐI CÙNG: Siêu kiểm soát kkk
            let imageContent = "";
            let url = (prd.image_url || "").trim();

            // Kiểm tra xem url có chứa đuôi ảnh hợp lệ không
            const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

            if (url !== "" && url !== "null" && url !== "img/products/" && isImage) {
                // Vì file HTML nằm trong /html/ nên đường dẫn ảnh phải nhảy ra ngoài 1 cấp
                const finalUrl = url.startsWith("http") ? url : `../${url}`;
                imageContent = `<img src="${finalUrl}" alt="phone" onerror="this.src='../img/default-phone.png'">`;
            } else {
                // 🚀 HIỆN TEXT NÀY KHI KHÔNG CÓ ẢNH
                imageContent = `<span class="no-image-text">No image</span>`;
            }

            let statusVal = (prd.status !== undefined && prd.status !== null) ? parseInt(prd.status) : 1;
            let statusClass = statusVal === 1 ? "status-active" : "status-hidden";
            let statusText = statusVal === 1 ? "Đang bán" : "Ngừng bán";

            let row = `
                <tr>
                    <td>${prd.name}</td>
                    <td>${prd.brand}</td>
                    <td class="price-text" style="text-align: center;">
                        ${Number(prd.price).toLocaleString('vi-VN')} VNĐ
                    </td>
                    <td style="text-align: center;">
                        ${imageContent} 
                    </td>
                    <td style="text-align: center;">
                        <div class="status-container">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            <button type="button" class="btn-toggle-status" 
                                    title="Đổi trạng thái"
                                    onclick="askChangeStatus(${prd.product_id}, ${statusVal})">
                                <img src="../img/sync.png" alt="sync">
                            </button>
                        </div>
                    </td>
                    <td>
                        <button onclick="sua(${prd.product_id})" class="xoasua" title="Sửa thông tin">
                            <img src="../img/edit.png" alt="Sửa">
                        </button>
                        <button onclick="xemThongSoKyThuat(${prd.product_id})" class="xoasua btn-detail">Chi tiết</button>
                    </td>
                </tr>`;
            tbody.innerHTML += row;
        }
    }
    document.getElementById("trang_hien_tai").innerHTML = currentPage + 1;
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
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Hiệu ứng mờ dần và xóa sau 3 giây
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

function askChangeStatus(id, currentStatus) {
    targetProductId = id;
    targetNewStatus = (currentStatus === 1) ? 0 : 1;
    
    const msg = targetNewStatus === 0 
        ? "Xác nhận <b>Ngừng bán</b> sản phẩm này?" 
        : "Xác nhận <b>Mở bán lại</b> sản phẩm này?";
    
    document.getElementById("statusModalMsg").innerHTML = msg;
    document.getElementById("statusConfirmModal").style.display = "flex";
}

function closeStatusModal() {
    document.getElementById("statusConfirmModal").style.display = "none";
}

document.getElementById("btnConfirmStatus").onclick = async function() {
    try {
        const response = await fetch(`http://127.0.0.1:5001/quanLiSP/update_status/${targetProductId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: targetNewStatus })
        });

        if (response.ok) {
            const product = allProducts.find(p => p.product_id == targetProductId);
            if (product) product.status = targetNewStatus;
            
            closeStatusModal();
            timkiem(); 
            // 🚀 THÔNG BÁO THÀNH CÔNG
            showStatus(targetNewStatus === 1 ? "Đã mở bán lại sản phẩm!" : "Đã chuyển sang ngừng bán!");
        } else {
            showStatus("Lỗi khi cập nhật trạng thái!", "error");
        }
    } catch (e) { 
        console.error(e);
        showStatus("Lỗi kết nối máy chủ!", "error");
    }
};

/** 3. ĐIỀU KHIỂN MODAL & VALIDATION **/
function setModalReadOnly(isReadOnly) {
    const inputs = document.querySelectorAll('#productModal input, #productModal select');
    inputs.forEach(input => {
        if (input.id !== "image_url") { // image_url luôn readonly
            input.disabled = isReadOnly;
            input.style.backgroundColor = isReadOnly ? "#f5f5f5" : "#fff";
        }
    });
}

function showError(inputId, message) {
    const inputField = document.getElementById(inputId);
    const errorSpan = document.getElementById("error-" + inputId);
    if (inputField && errorSpan) {
        inputField.classList.add("input-error");
        errorSpan.innerText = message;
    }
}

function clearErrors() {
    const errorSpans = document.querySelectorAll(".error-text");
    errorSpans.forEach(span => span.innerText = "");
    const inputs = document.querySelectorAll(".edit-form input, .edit-form select");
    inputs.forEach(input => input.classList.remove("input-error"));
}

function validateForm() {
    clearErrors();
    let hasError = false;

    // 1. Lấy dữ liệu
    const name = document.getElementById("name").value.trim();
    const priceRaw = document.getElementById("price").value.trim();
    const brand = document.getElementById("brand").value;

    // 2. Ràng buộc Tên sản phẩm
    if (!name) { 
        showError("name", "Tên sản phẩm không được để trống!"); 
        hasError = true; 
    }

    // 3. RÀNG BUỘC GIÁ (Phần mình vừa bổ sung)
    // Loại bỏ dấu phẩy để lấy con số thuần túy
    let priceClean = priceRaw.replace(/,/g, ''); 
    
    if (!priceRaw) {
        showError("price", "Vui lòng nhập giá sản phẩm!");
        hasError = true;
    } else if (isNaN(priceClean)) {
        showError("price", "Giá sản phẩm phải là con số!");
        hasError = true;
    } else if (parseInt(priceClean) < 1000) { 
        // Thường điện thoại không có giá dưới 1.000 VNĐ
        showError("price", "Giá sản phẩm không hợp lệ (tối thiểu 1.000 VNĐ)!");
        hasError = true;
    }

    // 4. Ràng buộc Hãng
    if (!brand) { 
        showError("brand", "Vui lòng chọn hãng sản xuất!"); 
        hasError = true; 
    }

    // 5. Ràng buộc mềm cho Thông số (Nếu nhập thì phải đúng)
    const specs = [
        { id: "screen_size", pattern: /^\d+(\.\d+)?\s?inch$/i, msg: "VD: 6.1 inch" },
        { id: "ram", pattern: /^\d+\s?GB$/i, msg: "VD: 8GB" },
        { id: "storage", pattern: /^\d+\s?(GB|TB)$/i, msg: "VD: 256GB" },
        { id: "battery", pattern: /^\d+\s?mAh$/i, msg: "VD: 5000 mAh" },
        { id: "camera", pattern: /^\d+\s?MP/i, msg: "VD: 48MP" }
    ];

    specs.forEach(spec => {
        const val = document.getElementById(spec.id).value.trim();
        if (val !== "" && !spec.pattern.test(val)) {
            showError(spec.id, spec.msg);
            hasError = true;
        }
    });

    return !hasError;
}

function updateInput(prd) {
    FIELDS.forEach(key => {
        let input = document.getElementById(key);
        if (input) {
            let val = prd[key] || "";
            // Nếu là ô giá, hiển thị có dấu phẩy cho đẹp
            if (key === "price" && val) {
                input.value = Number(val).toLocaleString('en-US');
            } else {
                input.value = val;
            }
        }
    });
}

/** 4. CÁC HÀM MỞ MODAL **/
async function xemThongSoKyThuat(id) {
    try {
        let response = await fetch(`http://127.0.0.1:5001/products/${id}`);
        currentProduct = await response.json();

        document.getElementById("modalTitle").innerText = "Chi Tiết: " + currentProduct.name;
        document.getElementById("productModal").style.display = "flex";
        document.getElementById("group_them").style.display = "none";
        document.getElementById("group_sua").style.display = "none";
        document.getElementById("group_xem").style.display = "flex";
        
        setModalReadOnly(true);
        updateInput(currentProduct);
    } catch (e) { alert("Lỗi tải chi tiết!"); }
}

function taoInputTrong() {
    clearErrors();
    document.getElementById("modalTitle").innerText = "Thêm Sản Phẩm Mới";
    document.getElementById("productModal").style.display = "flex";
    document.getElementById("group_them").style.display = "flex";
    document.getElementById("group_sua").style.display = "none";
    document.getElementById("group_xem").style.display = "none";
    
    setModalReadOnly(false);
    FIELDS.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; });
    document.getElementById("name").focus();
}

function sua(id) {
    clearErrors();
    currentProduct = allProducts.find(p => p.product_id == id);
    document.getElementById("modalTitle").innerText = "Chỉnh Sửa Sản Phẩm";
    document.getElementById("productModal").style.display = "flex";
    document.getElementById("group_them").style.display = "none";
    document.getElementById("group_sua").style.display = "flex";
    document.getElementById("group_xem").style.display = "none";
    
    setModalReadOnly(false);
    updateInput(currentProduct);
}

/** 5. XỬ LÝ LƯU DỮ LIỆU (THÊM & SỬA) **/
async function themSP() {
    if (!validateForm()) return;

    let formData = new FormData();
    let priceClean = document.getElementById("price").value.replace(/,/g, '');

    FIELDS.forEach(key => {
        let input = document.getElementById(key);
        if (input && key !== "image_url") {
            formData.append(key, key === "price" ? priceClean : input.value);
        }
    });

    let fileInput = document.getElementById("file_image_url");
    if (fileInput.files[0]) formData.append('image', fileInput.files[0]);

    try {
        const response = await fetch(`http://127.0.0.1:5001/quanLiSP/add`, {
            method: "POST",
            body: formData
        });
        if (response.ok) {
            showStatus("Thêm sản phẩm mới thành công!");
            tatThongTinChiTiet();
            fetchProducts();
        }
    } catch (e) { console.error(e);
        showStatus("Lỗi hệ thống khi thêm!", "error");
    }
}

async function updateDuLieuTrongBang() {
    if (!validateForm()) return;

    let id = currentProduct.product_id;
    let formData = new FormData();
    let priceClean = document.getElementById("price").value.replace(/,/g, '');

    FIELDS.forEach(key => {
        let input = document.getElementById(key);
        if (input) {
            let val = (key === "price") ? priceClean : input.value;
            // Xử lý cắt bỏ prefix URL nếu có để không bị chồng lặp
            if (key === "image_url") {
                val = val.replace("http://127.0.0.1:5500/frontend/", "");
            }
            formData.append(key, val);
        }
    });

    let fileInput = document.getElementById("file_image_url");
    if (fileInput.files[0]) formData.append('image', fileInput.files[0]);

    try {
        const response = await fetch(`http://127.0.0.1:5001/quanLiSP/update/${id}`, {
            method: "PUT",
            body: formData
        });
        if (response.ok) {
            showStatus("Cập nhật thông tin sản phẩm thành công!");
            tatThongTinChiTiet();
            fetchProducts();
        }
    } catch (e) { console.error(e); showStatus("Lỗi hệ thống khi cập nhật!", "error");}
}

function timkiem() {
    let keyword = document.getElementById("input_tim_kiem").value.toLowerCase().trim();
    let searchTerms = keyword.split(/\s+/);

    currentPage = 0; // Reset về trang đầu khi tìm kiếm

    filteredProducts = allProducts.filter(prd => {
        let productInfo = `
            ${prd.name} 
            ${prd.brand} 
            ${prd.storage} 
            ${prd.ram} 
            ${prd.processor}
        `.toLowerCase();
        return searchTerms.every(term => productInfo.includes(term));
    });

    displayProducts();
}

function trangSau() {
    if ((currentPage + 1) * PAGE_SIZE < filteredProducts.length) {
        currentPage++; displayProducts();
    }
}

function trangTruoc() {
    if (currentPage > 0) {
        currentPage--; displayProducts();
    }
}

/** 7. TIỆN ÍCH KHÁC **/
function tatThongTinChiTiet() {
    document.getElementById("productModal").style.display = "none";
    document.getElementById("file_image_url").value = ""; 
    clearErrors();
}

// Format tiền khi gõ
document.getElementById("price").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value) e.target.value = Number(value).toLocaleString('en-US');
});

// Hiển thị tên file khi chọn ảnh
document.getElementById("file_image_url").addEventListener("change", function (e) {
    if (e.target.files[0]) {
        document.getElementById("image_url").value = "img/products/" + e.target.files[0].name;
    }
});

document.getElementById("input_tim_kiem").addEventListener("input", timkiem);

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};

window.onload = fetchProducts;