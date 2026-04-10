from flask import Blueprint, jsonify, request
from models.customerModel import Customers
from models.invoicesModel import Invoice
from models.employeeModel import Employees

stat_bp = Blueprint('stat_bp', __name__)

@stat_bp.route('/today_stats', methods=['GET'])
def get_stats():
    start = request.args.get('start_date')
    end = request.args.get('end_date')
    
    # Gom đủ bộ tứ quyền lực
    stats = {
        "revenue": Invoice.get_total_revenue(start, end) or 0,
        "orders": Invoice.get_total_orders(start, end) or 0,
        "new_customers": Customers.get_new_customers(start, end) or 0,
        # 🚀 ĐỪNG QUÊN DÒNG NÀY, gọi sang Model Employees tui bày lúc nãy
        "top_comm": Employees.get_top_commission_employee(start, end) 
    }
    return jsonify(stats)

@stat_bp.route('/top_data', methods=['GET'])
def get_top_data():
    start = request.args.get('start_date')
    end = request.args.get('end_date')
    
    # Gom 3 bảng xếp hạng vào 1 lần gọi cho sướng
    return jsonify({
        "products": Invoice.get_top_5_products(start, end) or [],
        "brands": Invoice.get_brand_distribution(start, end) or [],
        "employees": Employees.get_employee_leaderboard(start, end) or []
    })