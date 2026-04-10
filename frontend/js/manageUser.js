document.addEventListener("DOMContentLoaded", () => {
    const userTableBody = document.querySelector("#user-table tbody");
    const searchInput = document.getElementById("search-input");
    const resetPasswordModal = document.getElementById("reset-password-modal");
    const resetPasswordForm = document.getElementById("reset-password-form");

    let allUsers = []; // BIẾN LƯU TRỮ TẤT CẢ TÀI KHOẢN

    // 1. Tải dữ liệu một lần duy nhất khi mở trang
    async function fetchUsers() {
        try {
            const response = await fetch("http://127.0.0.1:5001/accounts/users");
            if (!response.ok) throw new Error("Không thể tải dữ liệu");
            allUsers = await response.json(); // Lưu vào biến toàn cục
            displayUsers(allUsers); // Hiển thị lần đầu
        } catch (error) {
            console.error("Lỗi:", error);
            userTableBody.innerHTML = `<tr><td colspan="5">Lỗi kết nối Server!</td></tr>`;
        }
    }

    // 2. Hàm hiển thị dữ liệu ra bảng
    function displayUsers(users) {
        userTableBody.innerHTML = "";
        if (users.length === 0) {
            userTableBody.innerHTML = `<tr><td colspan="5">Không tìm thấy kết quả phù hợp</td></tr>`;
            return;
        }

        users.forEach(user => {
            const row = document.createElement("tr");
            const statusText = user.status === 1 ? 'Hoạt động' : 'Bị khóa';
            const statusClass = user.status === 1 ? 'status-1' : 'status-0';
            const employeeName = user.full_name || "admin";

            row.innerHTML = `
                <td>${user.username}</td>
                <td>${employeeName}</td>
                <td>${user.role}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-group">
                        <button class="btn-reset-pass" 
                                data-id="${user.id}" 
                                data-username="${user.username}">Reset mật khẩu</button>
                    </div>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    }

    function showStatus(message, type = 'success') {
        // 1. Tìm container chứa thông báo (sếp nhớ check file HTML xem có <div id="toast-container"> chưa nhé)
        let container = document.getElementById('toast-container');
        
        // Nếu chưa có container thì tạo tạm một cái kkk
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`; // type có thể là 'success' hoặc 'error'
        
        // Thêm icon cho sinh động kkk
        const icon = type === 'success' ? '✅' : '❌';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        
        container.appendChild(toast);

        // Sau 2.5 giây thì bắt đầu mờ dần, tổng cộng 3 giây là biến mất hoàn toàn
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 500);
        }, 2500);
    }

    // 3. HÀM TÌM KIẾM TỨC THÌ (INSTANT FILTER)
    window.filterUsers = function() {
        // Lấy giá trị, chuyển chữ thường và cắt khoảng trắng 2 đầu
        const query = searchInput.value.toLowerCase().trim();
        
        // Nếu ô tìm kiếm rỗng -> Hiện lại toàn bộ danh sách gốc
        if (!query) {
            displayUsers(allUsers);
            document.getElementById("clear-btn").style.display = "none";
            return;
        }

        // 🚀 BÍ KÍP TOKENIZE: Tách chuỗi sếp gõ thành mảng các từ khóa kkk
        // Ví dụ: "Bảo Gia" -> ["bảo", "gia"]
        const keywords = query.split(/\s+/);

        // Lọc trực tiếp trên mảng allUsers đã có sẵn
        const filtered = allUsers.filter(user => {
            // Gom Username và Tên nhân viên vào 1 "nồi lẩu" để soi kkk
            const employeeName = user.full_name || "admin";
            const targetStr = `${user.username} ${employeeName}`.toLowerCase();

            // LOGIC: Trả về true nếu TẤT CẢ các từ khóa sếp gõ đều nằm trong targetStr
            // Không quan trọng thứ tự, miễn là có đủ mặt các chữ đó là "dính" kkk
            return keywords.every(key => targetStr.includes(key));
        });

        // Cập nhật lại bảng với danh sách đã lọc
        displayUsers(filtered);
        
        // Hiện/ẩn nút X xóa nhanh kkk
        const clearBtn = document.getElementById("clear-btn");
        if (clearBtn) clearBtn.style.display = "block";
    };

    // 4. Xử lý nút X (Clear search)
    window.clearSearch = function() {
        searchInput.value = "";
        displayUsers(allUsers); // Hiện lại toàn bộ
        document.getElementById("clear-btn").style.display = "none";
    };

    // --- CÁC LOGIC MODAL GIỮ NGUYÊN ---
    userTableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-reset-pass")) {
            const id = e.target.getAttribute("data-id");
            const username = e.target.getAttribute("data-username");
            document.getElementById("reset-user-id").value = id;
            document.getElementById("reset-username-display").textContent = username;
            resetPasswordModal.style.display = "flex";
        }
    });

    resetPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("reset-user-id").value;
        const newPassword = document.getElementById("admin-new-password").value;
        try {
            const response = await fetch(`http://127.0.0.1:5001/accounts/users/${id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });
            if (response.ok) {
                showStatus("Đặt lại mật khẩu thành công!", "success");
                resetPasswordModal.style.display = "none";
                resetPasswordForm.reset();
            }
        } catch (error) { console.error(error); }
    });

    window.closeResetModal = () => resetPasswordModal.style.display = "none";

    fetchUsers(); // Khởi chạy khi load trang
});

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};