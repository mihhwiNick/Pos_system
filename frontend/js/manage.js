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

        // Sắp xếp theo thời gian tạo mới nhất
        invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Lấy 8 hóa đơn mới nhất
        const latestInvoices = invoices.slice(0, 7);

        const tbody = document.getElementById("invoice-table-body");
        tbody.innerHTML = "";

        latestInvoices.forEach(inv => {
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

async function loadTodayStats() {
    try {
        const res = await fetch("http://127.0.0.1:5001/stats/today_stats");
        const stats = await res.json();

        const statCards = document.querySelectorAll(".stat-card");

        // Hiển thị lần lượt theo thứ tự thẻ
        statCards[0].querySelector("p").textContent = Number(stats.revenue_today).toLocaleString() + " đ";
        statCards[1].querySelector("p").textContent = stats.orders_today + " đơn";
        statCards[2].querySelector("p").textContent = stats.new_customers_today + " người";
    } catch (error) {
        console.error("Lỗi khi load thống kê hôm nay:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadInvoices();
    loadTodayStats(); // Gọi luôn khi trang tải
});
