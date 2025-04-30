from flask import Blueprint, jsonify, request
from models.customerModel import Customers
from models.face_recognitionModels import FaceRecognition
from models.webcam import Webcam
import torch, cv2, time

recognize_bp = Blueprint('recognize', __name__)

@recognize_bp.route('/capture_face_encoding/<phone>', methods=['GET'])
def capture_face_encoding(phone):
    webcam = Webcam()
    face_encoding = webcam.capture_face_encoding_from_webcam(phone)

    if face_encoding is not None:
        return jsonify({"message": "Face encoding saved successfully!"}), 200
    else: # Thêm thông báo nếu không tìm thấy khách hàng
        return jsonify({"error": f"Customer with phone {phone} does not exist"}), 400

@recognize_bp.route('/identify_all_customers_with_camera', methods=['GET'])
def identify_all_customers_with_camera():
    """Mở camera và nhận diện tất cả khách hàng qua face encoding."""
    # Lấy tất cả khách hàng từ cơ sở dữ liệu
    customers = Customers.get_customers()
    if not customers:
        return jsonify({'error': 'No customers found'}), 404

    # Tạo đối tượng nhận diện khuôn mặt
    face_recognition = FaceRecognition(device='cuda' if torch.cuda.is_available() else 'cpu')

    # Mở camera
    cap = cv2.VideoCapture(0)
    start_time = time.time()
    recognized_customer = None
    new_encoding = None

    # Để camera chạy liên tục trong 5 giây
    while time.time() - start_time < 5:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Không lấy được khung hình từ camera.")
            return jsonify({'error': 'Failed to grab frame from camera'}), 400

        # Capture face encoding từ frame
        new_encoding = face_recognition.capture_face_encoding(frame)
        if new_encoding is not None:
            print(f"[INFO] Face encoding từ camera: {new_encoding[:5]}...")

            # Kiểm tra so sánh với từng face encoding của khách hàng
            for customer in customers:
                face_encoding_from_db = face_recognition.load_face_encoding_from_db(customer['phone'])
                if face_encoding_from_db is not None and face_recognition.compare_face_encoding(face_encoding_from_db, new_encoding):
                    recognized_customer = customer
                    break

        # Hiển thị video trong khi kiểm tra
        cv2.imshow("Camera - Nhấn 'q' để thoát", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if recognized_customer:
        return jsonify({
            'name': recognized_customer['name'],
            'phone': recognized_customer['phone'],
            'points': recognized_customer['points']
        })
    else:
        return jsonify({'error': 'Khách hàng chưa là thành viên. Vui lòng đăng kí'}), 400