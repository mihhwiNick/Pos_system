const baseUrl = "http://127.0.0.1:5001";
function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('vi-VN') + " VNĐ";
}
document.addEventListener("DOMContentLoaded", () => {
    // 🚀 Bước 1: Lấy ngày hôm nay theo định dạng YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng đi từ 0-11 nên phải +1
    const day = String(now.getDate()).padStart(2, '0');
    
    const today = `${year}-${month}-${day}`;

    // 🚀 Bước 2: Gán giá trị mặc định vào 2 ô input
    const startInput = document.getElementById("start-date");
    const endInput = document.getElementById("end-date");

    if (startInput && endInput) {
        startInput.value = today;
        endInput.value = today;
    }

    // 🚀 Bước 3: Chạy update lần đầu để hiện dữ liệu ngay lập tức
    updateDashboard();
});

async function updateDashboard() {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    
    // Nếu có ngày (mặc định giờ là có rồi), nó sẽ tạo params gửi lên server
    const params = (start && end) ? `?start_date=${start}&end_date=${end}` : "";

    loadTodayStats(params);
    loadInvoices(params);
    loadTopData(params);
}
async function loadTopData(params) {
    try {
        const res = await fetch(`${baseUrl}/stats/top_data${params}`);
        const data = await res.json();

        // 1. Top Sản phẩm
        document.getElementById("top-products-body").innerHTML = data.products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.quantity}</td>
            </tr>
        `).join('');

        // 2. Nhân viên
        document.getElementById("employee-leaderboard-body").innerHTML = data.employees.map(e => `
            <tr>
                <td>${e.full_name}</td>
                <td>${e.total_orders}</td>
                <td>${formatCurrency(e.total_revenue)}</td>
            </tr>
        `).join('');

        // 3. Hãng
        const sortedBrands = data.brands.sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0));

        document.getElementById("brand-stats-body").innerHTML = sortedBrands.map(b => `
            <tr>
                <td>${b.brand}</td>
                <td>${b.count} máy</td>
            </tr>
        `).join('');

    } catch (e) { console.error("Lỗi Top Data:", e); }
}

async function loadTodayStats(params) {
    try {
        const res = await fetch(`${baseUrl}/stats/today_stats${params}`);
        const s = await res.json();
        
        // Cập nhật các số liệu cơ bản
        document.getElementById("stat-revenue").textContent = formatCurrency(s.revenue);
        document.getElementById("stat-orders").textContent = (s.orders || 0) + " đơn";
        document.getElementById("stat-customers").textContent = (s.new_customers || 0) + " người";
        
        if (s.top_comm) {
            const name = s.top_comm.name || "Chưa có";
            const val = formatCurrency(s.top_comm.value);
            
            document.getElementById("stat-comm-combined").innerHTML = 
                `<span style="color: #3498db; font-weight: 600;">${name}</span>: ${val}`;
        }
    } catch (e) { 
        console.error("Lỗi cập nhật Card:", e); 
    }
}

async function loadInvoices(params) {
    try {
        const res = await fetch(`${baseUrl}/invoices/${params}`);
        const invoices = await res.json();
        
        // 🚀 LOGIC: Sắp xếp theo ngày mới nhất (Descending)
        const latestInvoices = invoices.sort((a, b) => {
            // Chuyển chuỗi "DD/MM/YYYY HH:mm" thành timestamp để so sánh
            // Nếu created_at của ông là định dạng chuẩn ISO (YYYY-MM-DD) thì dùng new Date(a.created_at) trực tiếp
            const dateA = parseDate(a.created_at);
            const dateB = parseDate(b.created_at);
            return dateB - dateA; // B lớn hơn A -> B đứng trước (mới nhất lên đầu)
        }).slice(0, 5); // Lấy 5 anh hào mới nhất

        document.getElementById("invoice-table-body").innerHTML = latestInvoices.map(inv => `
            <tr>
                <td>#${inv.invoice_id}</td>
                <td>${inv.customer_name}</td>
                <td>${inv.employee_name || '---'}</td>
                <td>${inv.created_at}</td>
                
                <td>${Number(inv.product_count || 0)}</td> 
                
                <td style="font-weight: 700;">${formatCurrency(inv.total_amount)}</td>
            </tr>
        `).join('');
    } catch (e) { console.error("Lỗi load hóa đơn:", e); }
}

// Hàm hỗ trợ bóc tách ngày tháng định dạng Việt Nam "DD/MM/YYYY HH:mm"
function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute] = (timePart || "00:00").split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
}

window.logout = function () {
    sessionStorage.removeItem("loginData");
    window.location.href = "app.html";
};