from flask import Blueprint, jsonify, request
from models.customerModel import Customers

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
def get_customers():
    customer = Customers.get_customers()
    return jsonify(customer)

@customers_bp.route('/', methods=['POST'])
def add_customer():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    
    # Kiểm tra SĐT đã tồn tại chưa
    if Customers.get_customer_by_phone(phone):
        return jsonify({"message": "Số điện thoại đã tồn tại"}), 400

    success = Customers.add_customer(name, phone, 0) # Mặc định 0 điểm
    if success:
        return jsonify({"message": "Thêm khách hàng thành công"}), 201
    return jsonify({"message": "Lỗi dữ liệu đầu vào"}), 400

@customers_bp.route('/<int:id>',methods=['PUT'])
def update_customer(id):
    Customers.update_customer(id)
    return jsonify({"message": "Khach Hang đã được sửa thành công!"})

# Lấy khách hàng theo số điện thoại
@customers_bp.route('/phone/<string:phone>', methods=['GET'])
def get_customer_by_phone(phone):
    customer = Customers.get_customer_by_phone(phone)
    if not customer:
        return jsonify({"message": "Không tìm thấy khách hàng"}), 404
    return jsonify(customer)

# Cập nhật điểm cho khách hàng
@customers_bp.route('/<int:id>/points', methods=['PATCH'])
def update_customer_points(id):
    data = request.get_json()
    invoice_amount = data.get('invoice_amount')
    used_points = data.get('used_points', 0)

    if invoice_amount is None:
        return jsonify({"message": "Thiếu thông tin số tiền hóa đơn"}), 400

    try:
        # Nếu có dùng điểm → trừ điểm
        if used_points > 0:
            Customers.subtract_points(id, used_points)
            added_points = Customers.update_points(id, invoice_amount, used_points)
        else:
            # Nếu không dùng điểm → cộng điểm
            added_points = Customers.update_points(id, invoice_amount)

        return jsonify({
            "message": "Cập nhật điểm thành công",
            "added_points": added_points,
            "used_points": used_points
        })

    except Exception as e:
        print("Lỗi khi cập nhật điểm:", e)
        return jsonify({"message": "Lỗi khi cập nhật điểm"}), 500

