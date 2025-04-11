function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const options = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh' // Giờ Việt Nam
    };
    return date.toLocaleString('vi-VN', options).replace(',', '');
}

async function loadInvoices() {
    try {
        const res = await fetch("http://localhost:5001/invoices/");
        const invoices = await res.json();

        const tbody = document.getElementById("invoice-table-body");  // đã sửa ở đây
        tbody.innerHTML = "";

        invoices.forEach(inv => {
            const row = `
                <tr>
                    <td>${inv.id}</td>
                    <td>${inv.customer_name}</td>
                    <td>${formatDateTime(inv.created_at)}</td>
                    <td>${inv.product_count || 0}</td>
                    <td>${Number(inv.total_amount).toLocaleString()} đ</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error("Lỗi khi load hóa đơn:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadInvoices);

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};