document.addEventListener("DOMContentLoaded", () => {
    const loginPopup = document.getElementById("login-popup");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const logoutButton = document.querySelector(".dropdown a:last-child"); // Đăng xuất button

    // Kiểm tra nếu form đăng nhập không tồn tại
    if (!loginForm) {
        console.error("Không tìm thấy form đăng nhập (login-form). Vui lòng kiểm tra HTML.");
        return;
    }

    // Check session storage for login state
    const sessionData = JSON.parse(sessionStorage.getItem("loginData"));
    if (sessionData) {
        redirectBasedOnRole(sessionData.role);
    } else {
        loginPopup.style.display = "flex";
    }

    // Handle login form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        if (!usernameInput || !passwordInput) {
            console.error("Không tìm thấy các trường input (username hoặc password). Vui lòng kiểm tra HTML.");
            return;
        }

        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch("http://127.0.0.1:5001/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            if (response.ok) {
                // Save login state to session storage
                sessionStorage.setItem("loginData", JSON.stringify({ username: result.username, role: result.role }));

                redirectBasedOnRole(result.role);
            } else {
                loginError.style.display = "block";
            }
        } catch (error) {
            console.error("Login error:", error);
            loginError.style.display = "block";
        }
    });

    // Handle logout
    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("loginData"); // Clear session storage
        loginPopup.style.display = "flex"; // Show login popup
        alert("Đăng xuất thành công!");
    });

    // Redirect based on role
    function redirectBasedOnRole(role) {
        if (role === "admin") {
            window.location.href = "manage_user.html"; // Redirect to manage_user.html for admin
        } else if (role === "staff") {
            loginPopup.style.display = "none"; // Hide login popup
        } else {
            alert("Role không hợp lệ!");
        }
    }
});
