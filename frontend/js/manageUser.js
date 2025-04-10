document.addEventListener("DOMContentLoaded", () => {
    const userTableBody = document.querySelector("#user-table tbody");
    const addUserForm = document.getElementById("add-user-form");
    const searchInput = document.getElementById("search-input");
    const editUserModal = document.getElementById("edit-user-modal");
    const editUserForm = document.getElementById("edit-user-form");
    const changePasswordModal = document.getElementById("change-password-modal");
    const changePasswordForm = document.getElementById("change-password-form");

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
                    <button onclick="openChangePasswordModal(${user.id})" style="background-color: #f39c12; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Đổi mật khẩu</button>
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

    // Handle edit user form submission
    editUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-user-id").value;
        const username = document.getElementById("edit-username").value;
        const role = document.getElementById("edit-role").value;
        const passwordConfirm = document.getElementById("edit-password-confirm").value;

        try {
            // Validate password
            const validateResponse = await fetch(`http://127.0.0.1:5001/accounts/users/${id}/validate-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: passwordConfirm }),
            });

            if (validateResponse.ok) {
                // Update username and role
                const updateResponse = await fetch(`http://127.0.0.1:5001/accounts/users/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, role }),
                });

                if (updateResponse.ok) {
                    alert("Thông tin đã được cập nhật thành công!");
                    fetchUsers();
                    resetEditUserForm(); // Reset the form
                    closeEditModal();
                } else {
                    alert("Lỗi khi cập nhật thông tin tài khoản!");
                }
            } else {
                alert("Mật khẩu không chính xác!");
            }
        } catch (error) {
            console.error("Error validating password or updating user:", error);
        }
    });

    // Close edit modal
    window.closeEditModal = function () {
        resetEditUserForm(); // Reset the form
        editUserModal.style.display = "none";
    };

    // Reset the edit user form
    function resetEditUserForm() {
        editUserForm.reset(); // Reset all form fields
    }

    // Open change password modal
    window.openChangePasswordModal = (id) => {
        document.getElementById("change-password-user-id").value = id;
        changePasswordModal.style.display = "flex";
    };

    // Handle change password form submission
    changePasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("change-password-user-id").value;
        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmNewPassword = document.getElementById("confirm-new-password").value;

        if (newPassword !== confirmNewPassword) {
            alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5001/accounts/users/${id}/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (response.ok) {
                alert("Mật khẩu đã được thay đổi thành công!");
                resetChangePasswordForm(); // Reset the form
                closeChangePasswordModal();
            } else {
                alert("Mật khẩu hiện tại không chính xác!");
            }
        } catch (error) {
            console.error("Error changing password:", error);
        }
    });

    // Close change password modal
    window.closeChangePasswordModal = function () {
        resetChangePasswordForm(); // Reset the form
        changePasswordModal.style.display = "none";
    };

    // Reset the change password form
    function resetChangePasswordForm() {
        changePasswordForm.reset(); // Reset all form fields
    }

    // Logout function
    window.logout = function () {
        sessionStorage.removeItem("loginData");
        window.location.href = "app.html";
    };

    // Initial fetch
    fetchUsers();
});
