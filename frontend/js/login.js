document.addEventListener("DOMContentLoaded", () => {
    const loginPopup = document.getElementById("login-popup");
    const loginForm = document.getElementById("login-form");
    const nameDisplay = document.getElementById("display-user-name");
    const phoneDisplay = document.getElementById("display-user-phone");

    const sessionData = JSON.parse(sessionStorage.getItem("loginData"));
    if (sessionData) {
        if (nameDisplay) {
            nameDisplay.textContent = sessionData.full_name || sessionData.username || "Nhân viên";
        }
        if (phoneDisplay) {
            phoneDisplay.textContent = "SĐT: " + (sessionData.phone_number || "---");
        }
        
        if (loginPopup) loginPopup.style.display = "none";
        
        if (sessionData.role === "Quản trị viên" && window.location.pathname.includes("app.html")) {
            window.location.href = "manage.html";
        }
    } else {
        if (loginPopup) loginPopup.style.display = "flex";
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const uInput = document.getElementById("username");
            const pInput = document.getElementById("password");
            const username = uInput.value.trim();
            const password = pInput.value.trim();

            if (!username || !password) {
                showStatus("Vui lòng nhập đầy đủ thông tin!", "error");
                if (!username) uInput.focus(); else pInput.focus();
                return;
            }

            try {
                const response = await fetch("http://127.0.0.1:5001/accounts/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();
                if (response.ok) {
                    sessionStorage.setItem("loginData", JSON.stringify({
                        user_id: result.user_id,
                        username: result.username,
                        role: result.role,
                        employee_id: result.employee_id,
                        full_name: result.full_name,
                        phone_number: result.phone_number
                    }));

                    if (nameDisplay) nameDisplay.textContent = result.full_name || result.username;
                    if (phoneDisplay) phoneDisplay.textContent = "SĐT: " + (result.phone_number || "---");
                    
                    showStatus(`Chào mừng ${result.full_name || result.username} đã quay trở lại!`, 'success');

                    setTimeout(() => {
                        if (result.role === "Quản trị viên") {
                            window.location.href = "manage.html";
                        } else {
                            if (loginPopup) loginPopup.style.display = "none";
                        }
                    }, 1200);

                } else {
                    showStatus(result.message || "Sai tài khoản hoặc mật khẩu!", 'error');
                }
            } catch (error) {
                console.error("Lỗi login:", error);
                showStatus("Không thể kết nối máy chủ!", "error");
            }
        });
    }

    // Luôn gọi hàm lấy sản phẩm (Vì mainPage.js đã bỏ DOM)
    if (typeof fetchProducts === "function") fetchProducts();
});

/**
 * --- HỆ THỐNG CHẤM CÔNG ---
 */
let attendanceAction = ""; 

window.openAttendanceModal = async function() {
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    if (!data || !data.employee_id) return alert("Vui lòng đăng nhập!");

    const modal = document.getElementById("attendance-modal");
    const msg = document.getElementById("att-modal-msg");
    const confirmBtn = document.getElementById("btn-att-confirm");

    try {
        const now = new Date();
        // Lấy ngày hôm nay chuẩn YYYY-MM-DD theo giờ địa phương (Ví dụ: 2026-03-28)
        const todayStr = now.toLocaleDateString('en-CA'); 

        const response = await fetch(`http://127.0.0.1:5001/attendance/details/${data.employee_id}?month=${now.getMonth()+1}&year=${now.getFullYear()}`);
        const history = await response.json();

        // Debug để bạn kiểm tra trong Console (F12)
        console.log("Ngày hôm nay:", todayStr);
        console.log("Lịch sử chấm công:", history);

        // Tìm bản ghi hôm nay
        const todayRecord = history.find(r => {
            // Ép r.work_date về định dạng YYYY-MM-DD bất kể backend gửi chuỗi kiểu gì
            const recordDate = new Date(r.work_date).toLocaleDateString('en-CA');
            return recordDate === todayStr;
        });

        if (!todayRecord) {
            // TRƯỜNG HỢP 1: CHƯA CÓ BẢN GHI -> VÀO CA
            attendanceAction = "check_in";
            msg.innerHTML = "📅 Bạn <b>chưa vào ca</b> hôm nay. <br>Xác nhận bắt đầu ca làm việc?";
            confirmBtn.style.display = "inline-block";
            confirmBtn.innerText = "Xác nhận Vào ca";
        } else if (todayRecord.check_out === null || todayRecord.check_out === "" || todayRecord.check_out === "NULL") {
            // TRƯỜNG HỢP 2: ĐÃ VÀO CA NHƯNG CHƯA TAN CA -> HIỆN TAN CA
            attendanceAction = "check_out";
            msg.innerHTML = `🕒 Bạn đang làm việc. <br>(Vào ca lúc: <b>${todayRecord.check_in}</b>) <br>Xác nhận <b>Tan ca (Check-out)</b>?`;
            confirmBtn.style.display = "inline-block";
            confirmBtn.innerText = "Xác nhận Tan ca";
        } else {
            // TRƯỜNG HỢP 3: ĐÃ XONG CẢ 2 -> CHẶN CHẤM CÔNG
            attendanceAction = "";
            msg.innerHTML = `Bạn đã hoàn thành chấm công ngày hôm nay. <br> (Vào: ${todayRecord.check_in} | Ra: ${todayRecord.check_out})`;
            confirmBtn.style.display = "none";
        }

        modal.style.display = "flex";
    } catch (error) {
        console.error("Lỗi kiểm tra trạng thái:", error);
        alert("Lỗi dữ liệu chấm công!");
    }
};

window.closeAttendanceModal = function() {
    document.getElementById("attendance-modal").style.display = "none";
};

window.processAttendance = async function() {
    const data = JSON.parse(sessionStorage.getItem("loginData"));
    if (attendanceAction === "check_in") {
        await callAttendanceAPI("check-in", data.employee_id);
    } else if (attendanceAction === "check_out") {
        await callAttendanceAPI("check-out", data.employee_id);
    }
    closeAttendanceModal();
};

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

    // Hiệu ứng mờ dần sau 2.5s
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
    }, 2500);

    // Xóa khỏi màn hình sau 3s
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// --- CẬP NHẬT HÀM GỌI API CHẤM CÔNG ---
async function callAttendanceAPI(endpoint, emp_id) {
    try {
        const response = await fetch(`http://127.0.0.1:5001/attendance/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employee_id: emp_id }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Xác định tin nhắn thành công
            const successMsg = endpoint === 'check-in' ? "Vào ca thành công!" : "Tan ca thành công!";
            
            // Sử dụng hàm showStatus (vì hàm này ông giáo đã set thời gian tồn tại là 3s)
            showStatus(successMsg, 'success');
            
            // 🚀 CHỖ CẦN SỬA: Đợi đúng 3000ms (3 giây) rồi mới load lại trang
            setTimeout(() => {
                location.reload(); 
            }, 3000); 
            
        } else {
            // Nếu lỗi thì hiện thông báo lỗi và không load lại trang
            showStatus(result.message || "Lỗi chấm công!", 'error');
        }
    } catch (error) {
        console.error("Lỗi API:", error);
        showStatus("Không thể kết nối đến máy chủ!", 'error');
    }
}

/**
 * --- HÀM ĐĂNG XUẤT (Chỉ đăng xuất thuần túy) ---
 */
window.logout = function () {
    // 1. Hiện thông báo tạm biệt
    showStatus("Đang đăng xuất... Hẹn gặp lại bạn!", "success");

    // 2. Xóa session
    sessionStorage.removeItem("loginData");

    // 3. Đợi 1.2s rồi mới chuyển trang cho người ta kịp nhìn
    setTimeout(() => {
        window.location.href = "app.html";
    }, 1200);
};