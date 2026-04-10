from flask import Blueprint, jsonify, request
from models.employeeModel import Employees

employees_bp = Blueprint('employees', __name__)

# Lấy danh sách tất cả nhân viên
@employees_bp.route('/', methods=['GET'])
def get_employees():
    employees = Employees.get_employees()
    return jsonify(employees)

# Thêm nhân viên mới
@employees_bp.route('/', methods=['POST'])
def add_employee():
    data = request.json
    phone = data.get('phone_number')

    # RÀNG BUỘC: Kiểm tra trùng Số điện thoại
    if Employees.get_employee_by_phone(phone):
        return jsonify({"message": "Số điện thoại này đã thuộc về nhân viên khác!"}), 400

    success = Employees.add_employee(
        data.get('full_name'), 
        phone, 
        data.get('employee_type'), 
        data.get('base_salary'), 
        data.get('start_date'),
        data.get('user_id')
    )
    if success:
        return jsonify({"message": "Thêm nhân viên thành công"}), 201
    return jsonify({"message": "Lỗi khi lưu thông tin nhân viên"}), 500

# Cập nhật thông tin nhân viên
@employees_bp.route('/<int:id>', methods=['PUT'])
def update_employee(id):
    data = request.json
    if not data:
        return jsonify({"message": "Dữ liệu không hợp lệ"}), 400
        
    success = Employees.update_employee(id, data)
    if success:
        return jsonify({"message": "Cập nhật nhân viên và tài khoản liên quan thành công!"}), 200
    return jsonify({"message": "Lỗi khi cập nhật dữ liệu vào Database"}), 500

# Route để nhân viên tự cập nhật thông tin cá nhân
@employees_bp.route('/update-profile/<int:user_id>', methods=['PUT'])
def update_profile_self(user_id):
    data = request.json
    if not data:
        return jsonify({"message": "Dữ liệu không hợp lệ!"}), 400

    # Gọi cái hàm ông giáo vừa thêm bên employeeModel
    success = Employees.update_profile_self(user_id, data)
    
    if success:
        return jsonify({"message": "Cập nhật thông tin thành công!"}), 200
    else:
        return jsonify({"message": "Lỗi khi cập nhật thông tin vào hệ thống!"}), 500

# Tìm nhân viên theo SĐT
@employees_bp.route('/phone/<string:phone>', methods=['GET'])
def get_employee_by_phone(phone):
    employee = Employees.get_employee_by_phone(phone)
    if not employee:
        return jsonify({"message": "Không tìm thấy nhân viên"}), 404
    return jsonify(employee)

@employees_bp.route('/<int:employee_id>/sales', methods=['GET'])
def get_employee_sales(employee_id):
    month = request.args.get('month')
    year = request.args.get('year')
    history = Employees.get_sales_history(employee_id, month, year) 
    return jsonify(history)

@employees_bp.route('/invoice/<int:invoice_id>/details', methods=['GET'])
def get_invoice_details(invoice_id):
    details = Employees.get_invoice_item_details(invoice_id)
    return jsonify(details)