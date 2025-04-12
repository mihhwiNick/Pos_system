from flask import Blueprint, jsonify
from models.customerModel import Customers
from models.invoicesModel import Invoice

stat_bp = Blueprint('stat_bp', __name__)

# Route lấy doanh thu hôm nay
@stat_bp.route('/revenue', methods=['GET'])
def get_revenue_today():
    revenue = Invoice.get_revenue_today()
    return jsonify({"revenue_today": revenue})

@stat_bp.route('/orders', methods=['GET'])
def get_orders_today():
    orders = Invoice.get_orders_today()
    print(f"Orders today: {orders}")  # In kết quả để kiểm tra
    return jsonify({"orders_today": orders})

@stat_bp.route('/new_customers', methods=['GET'])
def get_new_customers_today():
    new_customers = Customers.get_new_customers_today()
    print(f"New customers today: {new_customers}")  # In kết quả để kiểm tra
    return jsonify({"new_customers_today": new_customers})

@stat_bp.route('/today_stats', methods=['GET'])
def get_today_stats():
    # Lấy doanh thu hôm nay từ Invoice model
    revenue = Invoice.get_revenue_today()
    
    # Lấy số đơn hàng hôm nay từ Invoice model
    orders = Invoice.get_orders_today()
    
    # Lấy số khách hàng mới hôm nay từ Customer model
    new_customers = Customers.get_new_customers_today()

    # Tạo dictionary chứa tất cả thống kê
    stats = {
        "revenue_today": revenue,
        "orders_today": orders,
        "new_customers_today": new_customers
    }

    # Trả về kết quả dưới dạng JSON
    return jsonify(stats)
