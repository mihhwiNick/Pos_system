from flask import Blueprint, jsonify, request
from models.payrollModel import Payroll

payroll_bp = Blueprint('payroll', __name__)

@payroll_bp.route('/', methods=['GET'])
def get_payroll():
    # Ép kiểu int ngay tại đây
    month = int(request.args.get('month', 3))
    year = int(request.args.get('year', 2026))
    
    data = Payroll.get_all_by_period(month, year)
    return jsonify(data)

@payroll_bp.route('/publish', methods=['POST'])
def publish_payroll():
    data = request.json
    # data sẽ bao gồm: employee_id, month, year, total_workdays, final_salary
    if not data:
        return jsonify({"message": "Thiếu dữ liệu công bố"}), 400
        
    success = Payroll.publish(data)
    
    if success:
        return jsonify({"message": "Bảng lương đã được công bố cho nhân viên!"}), 200
    return jsonify({"message": "Lỗi hệ thống khi công bố bảng lương"}), 500