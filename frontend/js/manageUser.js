document.addEventListener("DOMContentLoaded", () => {
    const userTableBody = document.querySelector("#user-table tbody");
    const addUserForm = document.getElementById("add-user-form");
    const searchInput = document.getElementById("search-input");
    const editUserModal = document.getElementById("edit-user-modal");
    const editUserForm = document.getElementById("edit-user-form");

    // Fetch and display users
    async function fetchUsers() {
        try {
            const response = await fetch("http://127.0.0.1:5001/users");
            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    function displayUsers(users) {
        userTableBody.innerHTML = "";
        users.forEach(user => {
            const row = document.createElement("tr");
            row.setAttribute("data-id", user.id);
            row.innerHTML = `
                <td>${user.id}</td>
                <td class="username">${user.username}</td>
                <td class="role">${user.role}</td>
                <td>
                    <button onclick="editUser(${user.id})">Sửa</button>
                    <button onclick="deleteUser(${user.id})">Xóa</button>
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
        const role = document.getElementById("add-role").value;

        try {
            const response = await fetch("http://127.0.0.1:5001/users", {
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
            const response = await fetch(`http://127.0.0.1:5001/users/${id}`, {
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
            const response = await fetch(`http://127.0.0.1:5001/users?search=${query}`);
            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error("Error searching users:", error);
        }
    };

    // Open edit modal and populate fields
    window.editUser = (id) => {
        const userRow = document.querySelector(`#user-table tbody tr[data-id="${id}"]`);
        const username = userRow.querySelector(".username").textContent;
        const role = userRow.querySelector(".role").textContent;

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
            const response = await fetch(`http://127.0.0.1:5001/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, oldPassword, newPassword, role }),
            });

            if (response.ok) {
                alert("Cập nhật tài khoản thành công!");
                fetchUsers();
                editUserForm.reset(); // Reset the form fields
                closeEditModal();
            } else {
                const result = await response.json();
                alert(result.message || "Lỗi khi cập nhật tài khoản!");
            }
        } catch (error) {
            console.error("Error updating user:", error);
        }
    });

    // Initial fetch
    fetchUsers();
});
