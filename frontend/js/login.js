document.addEventListener("DOMContentLoaded", () => {
    const loginPopup = document.getElementById("login-popup");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const logoutButton = document.querySelector(".dropdown a:last-child"); // Đăng xuất button
    const usernameDisplay = document.querySelector(".user .dropdown a:first-child"); // Select the username display link

    // Kiểm tra nếu form đăng nhập không tồn tại
    if (!loginForm) {
        console.error("Không tìm thấy form đăng nhập (login-form). Vui lòng kiểm tra HTML.");
        return;
    }

    // Check session storage for login state
    const sessionData = JSON.parse(sessionStorage.getItem("loginData"));
    if (sessionData) {
        updateUsernameDisplay(sessionData.username); // Update username display
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
            const response = await fetch("http://127.0.0.1:5001/accounts/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            if (response.ok) {
                // Save login state to session storage
                sessionStorage.setItem("loginData", JSON.stringify({ username: result.username, role: result.role }));

                updateUsernameDisplay(result.username); // Update username display
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

    // Update the username display in the dropdown
    function updateUsernameDisplay(username) {
        if (usernameDisplay) {
            usernameDisplay.textContent = username; // Set the username
        }
    }

    // Redirect based on role
    function redirectBasedOnRole(role) {
        if (role === "admin") {
            window.location.href = "manage.html"; // Redirect to manage_user.html for admin
        } else if (role === "staff") {
            loginPopup.style.display = "none"; // Hide login popup
        } else {
            alert("Role không hợp lệ!");
        }
    }
});
