document.addEventListener("DOMContentLoaded", () => {
    const loginPopup = document.getElementById("login-popup");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const manageLink = document.getElementById("manage-link");

    // Check session storage for login state
    const sessionData = JSON.parse(sessionStorage.getItem("loginData"));
    if (sessionData) {
        loginPopup.style.display = "none";
        loginBtn.textContent = sessionData.username;
        logoutBtn.style.display = "block";
        manageLink.style.display = sessionData.role === "admin" ? "block" : "none";
    } else {
        loginPopup.style.display = "flex";
    }

    // Handle login form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        try {
            const response = await fetch("http://127.0.0.1:5001/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role }),
            });

            const result = await response.json();
            if (response.ok) {
                // Save login state to session storage
                sessionStorage.setItem("loginData", JSON.stringify({ username: result.username, role: result.role }));

                loginPopup.style.display = "none";
                loginBtn.textContent = result.username;
                logoutBtn.style.display = "block";
                manageLink.style.display = role === "admin" ? "block" : "none";
            } else {
                loginError.style.display = "block";
            }
        } catch (error) {
            console.error("Login error:", error);
            loginError.style.display = "block";
        }
    });

    function resetLoginForm() {
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("role").value = "user";
        loginError.style.display = "none";
    }

    // Handle logout
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("loginData"); // Clear session storage
        loginPopup.style.display = "flex";
        loginBtn.textContent = "Tên người đăng nhập";
        logoutBtn.style.display = "none";
        manageLink.style.display = "none";
        resetLoginForm();
        alert("Đăng xuất thành công!");
    });
});
