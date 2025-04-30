import cv2, os, torch, stat
import numpy as np
from models.face_recognitionModels import FaceRecognition
from models.customerModel import Customers
import unicodedata

class Webcam:
    def __init__(self):
        self.cap = cv2.VideoCapture(0)
        self.face_recognition = FaceRecognition(device='cuda' if torch.cuda.is_available() else 'cpu')

        self.base_dataset_folder = 'backend/dataset'

        if not os.path.exists(self.base_dataset_folder):
            try:
                os.makedirs(self.base_dataset_folder)
                print(f"Đã tạo thư mục: {self.base_dataset_folder}")
            except Exception as e:
                print(f"Lỗi tạo thư mục {self.base_dataset_folder}: {e}")

    def sanitize_filename(self, text):
        """Loại bỏ ký tự đặc biệt, chuyển sang không dấu và nối liền nhau."""
        text = text.strip()
        # Chuyển thành dạng phân tích để dễ loại bỏ dấu
        text = unicodedata.normalize('NFD', text)  
        # Lọc bỏ ký tự không phải là chữ cái, số và gạch dưới, rồi nối liền không có dấu
        text = ''.join([c for c in text if unicodedata.category(c) != 'Mn'])
        text = text.replace(" ", "")  # Loại bỏ khoảng trắng
        return text

    def capture_face_encoding_from_webcam(self, phone):
        customer = Customers.get_customer_by_phone(phone)

        if not customer:
            print("Khách hàng không tồn tại.")
            return None

        name = self.sanitize_filename(customer['name'])
        print(f"\nBắt đầu chụp ảnh cho: {customer['name']} ({phone})")

        # Sử dụng số điện thoại và tên đã được chuyển sang không dấu
        customer_folder = os.path.join(self.base_dataset_folder, f"{phone}_{name}")
        os.makedirs(customer_folder, exist_ok=True)
        os.chmod(customer_folder, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        print(f"Lưu ảnh tại: {os.path.abspath(customer_folder)}")

        face_encodings = []
        image_saved = 0
        target_num_images = 10

        while image_saved < target_num_images:
            ret, frame = self.cap.read()
            if not ret:
                print("Không thể lấy ảnh từ webcam.")
                break

            cv2.imshow(f"Chụp ảnh - Nhấn 'Q' để thoát", frame)
            encoding = self.face_recognition.capture_face_encoding(frame)

            if encoding is not None:
                face_encodings.append(encoding)

                # Lưu ảnh với tên gồm số điện thoại và tên khách hàng đã loại bỏ dấu và khoảng trắng
                img_name = f"{phone}_{name}_face{image_saved + 1}.jpg"
                img_path = os.path.join(customer_folder, img_name)

                if cv2.imwrite(img_path, frame):
                    print(f"Lưu ảnh {image_saved + 1}/{target_num_images}: {os.path.abspath(img_path)}")
                    image_saved += 1
                else:
                    print(f"Không thể lưu ảnh {os.path.abspath(img_path)}")
            else:
                print("Không nhận diện được khuôn mặt, bỏ qua ảnh này.")
                
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Đã thoát quá trình chụp.")
                break

        self.cap.release()
        cv2.destroyAllWindows()

        if face_encodings:
            avg_encoding = np.mean(face_encodings, axis=0)
            self.face_recognition.save_face_encoding_to_db(phone, avg_encoding)
            print(f"\nĐã lưu face encoding cho {customer['name']}")
            return avg_encoding

        print("⚠️ Không có face encoding nào được lưu.")
        return None
