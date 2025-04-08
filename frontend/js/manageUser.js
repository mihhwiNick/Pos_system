document.addEventListener("DOMContentLoaded", () => {
    const userTableBody = document.querySelector("#user-table tbody");
    const addUserForm = document.getElementById("add-user-form");
    const searchInput = document.getElementById("search-input");
    const editUserModal = document.getElementById("edit-user-modal");
    const editUserForm = document.getElementById("edit-user-form");

    // Fetch and display users
    async function fetchUsers() {
        try {
            const response = await fetch("http://127.0.0.1:5001/accounts/users"); // Correct URL
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
            }
            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            userTableBody.innerHTML = `<tr><td colspan="4">Không thể tải danh sách người dùng. Vui lòng thử lại sau!</td></tr>`;
        }
    }

    function displayUsers(users) {
        userTableBody.innerHTML = "";
        users.forEach(user => {
            const row = document.createElement("tr");
            row.setAttribute("data-id", user.id);
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="editUser(${user.id})" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Chỉnh Sửa</button>
                    <button onclick="deleteUser(${user.id})" style="background: none; border: none; cursor: pointer;">
                        <img src="../img/delete.png" alt="Delete" style="width: 20px; height: 20px;">
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    }

    // Add user
    addUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("add-username").value;
        const password = document.getElementById("add-password").value;
        const confirmPassword = document.getElementById("add-confirm-password").value;
        const role = document.getElementById("add-role").value;

        if (password !== confirmPassword) {
            alert("Mật khẩu và xác nhận mật khẩu không khớp!");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:5001/accounts/users", { // Correct URL
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role }),
            });

            if (response.ok) {
                alert("Thêm tài khoản thành công!");
                fetchUsers();
                addUserForm.reset();
            } else {
                alert("Lỗi khi thêm tài khoản!");
            }
        } catch (error) {
            console.error("Error adding user:", error);
        }
    });

    // Delete user
    window.deleteUser = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;

        try {
            const response = await fetch(`http://127.0.0.1:5001/accounts/users/${id}`, { // Correct URL
                method: "DELETE",
            });

            if (response.ok) {
                alert("Xóa tài khoản thành công!");
                fetchUsers();
            } else {
                alert("Lỗi khi xóa tài khoản!");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    // Search user
    window.searchUser = async () => {
        const query = searchInput.value.trim();

        try {
            const response = await fetch(`http://127.0.0.1:5001/accounts/users?search=${query}`); // Correct URL
            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error("Error searching users:", error);
        }
    };

    // Open edit modal and populate fields
    window.editUser = (id) => {
        const userRow = document.querySelector(`#user-table tbody tr[data-id="${id}"]`);
        const username = userRow.children[1].textContent;
        const role = userRow.children[2].textContent;

        document.getElementById("edit-user-id").value = id;
        document.getElementById("edit-username").value = username;
        document.getElementById("edit-role").value = role;

        editUserModal.style.display = "flex";
    };

    // Close edit modal
    window.closeEditModal = function () {
        editUserModal.style.display = "none";
    };

    // Handle edit user form submission
    editUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-user-id").value;
        const username = document.getElementById("edit-username").value;
        const oldPassword = document.getElementById("edit-old-password").value;
        const newPassword = document.getElementById("edit-new-password").value;
        const confirmPassword = document.getElementById("edit-confirm-password").value;
        const role = document.getElementById("edit-role").value;

        if (newPassword && newPassword !== confirmPassword) {
            alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5001/accounts/users/${id}`, { // Correct URL
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, oldPassword, newPassword, role }),
            });

            if (response.ok) {
                alert("Cập nhật tài khoản thành công!");
                fetchUsers();
                editUserForm.reset();
                closeEditModal();
            } else {
                const result = await response.json();
                alert(result.message || "Lỗi khi cập nhật tài khoản!");
            }
        } catch (error) {
            console.error("Error updating user:", error);
        }
    });

    // Logout function
    window.logout = function () {
        sessionStorage.removeItem("loginData");
        window.location.href = "app.html";
    };

    // Initial fetch
    fetchUsers();
});
