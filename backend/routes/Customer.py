from flask import Blueprint, jsonify, request
from models.customerModel import Customers
from models.face_recognitionModels import FaceRecognition
from models.webcam import Webcam
import pickle, base64, torch, cv2, time, math
import numpy as np
from facenet_pytorch import MTCNN


customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
def get_customers():
    customer = Customers.get_customers()
    return jsonify(customer)

@customers_bp.route('/<int:id>', methods=['DELETE'])
def delete_customers(id):
    Customers.delete_customers(id)
    return jsonify({"message": "Khach Hang đã được xóa thành công!"})

@customers_bp.route('/', methods=['POST'])
def add_customer():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    membership_level = data.get('membership_level')
    points = 0 # Mặc định điểm là 0

    if Customers.add_customer(name, phone, membership_level, points):
        return jsonify({"message": "Customer added successfully"}), 201
    else:
        return jsonify({"message": "Failed to add customer"}), 400


@customers_bp.route('/<int:id>',methods=['PUT'])
def update_customer(id):
    Customers.update_customer(id)
    return jsonify({"message": "Khach Hang đã được sua thành công!"})

# Lấy khách hàng theo số điện thoại
@customers_bp.route('/phone/<string:phone>', methods=['GET'])
def get_customer_by_phone(phone):
    customer = Customers.get_customer_by_phone(phone)
    if not customer:
        return jsonify({"message": "Customer not found"}), 404
    return jsonify(customer)

# Cập nhật loại khách hàng thành VIP
@customers_bp.route('/upgrade/<int:id>', methods=['PATCH'])
def upgrade_to_vip(id):
    success = Customers.upgrade_to_vip(id)
    if success:
        return jsonify({"message": "Khách hàng đã được nâng cấp lên VIP"})
    return jsonify({"error": "Cập nhật thất bại"}), 400

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

