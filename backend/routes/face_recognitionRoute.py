from flask import Blueprint
from flask import Flask, request, jsonify
from models.faceRecognize import recognize_face
from models.webcam import capture_image
from database import db
from models.customerModel import Customers

recognize_bp = Blueprint('recognize', __name__)

# Route để chụp ảnh
@recognize_bp.route('/capture_image', methods=['POST'])
def capture_image_route():
    # Lấy số điện thoại từ request
    phone_number = request.json.get('phone_number')
    
    if not phone_number:
        return jsonify({"error": "Phone number is required"}), 400

    # Gọi hàm capture_image với số điện thoại
    capture_image(phone_number)
    
    return jsonify({"message": "Image capture started"}), 200

# Route để nhận diện khuôn mặt
@recognize_bp.route('/recognize_face', methods=['GET'])
def recognize_face_route():
    try:
        # Gọi hàm nhận diện và trả về số điện thoại nếu có khách khớp
        phone_number = recognize_face(db)
        if not phone_number:
            return jsonify({"error": "Không nhận diện được khách hàng nào"}), 404

        # Truy vấn thông tin khách hàng từ DB theo số điện thoại
        cursor = db.connection.cursor()
        cursor.execute("SELECT id, name, phone, points FROM customers WHERE phone = %s", (phone_number,))
        row = cursor.fetchone()

        if row:
            customer_id, name, phone, points = row
            return jsonify({
                "id": customer_id,
                "name": name,
                "phone": phone,
                "points": points
            }), 200
        else:
            return jsonify({"error": "Không tìm thấy thông tin khách hàng"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

