from facenet_pytorch import MTCNN
from torchvision import transforms
from scipy.spatial.distance import cosine
import numpy as np
from database import db
import cv2
from PIL import Image

class FaceRecognition:
    def __init__(self, device='cpu'):
        self.device = device
        self.mtcnn = MTCNN(keep_all=False, device=self.device)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5])
        ])
    
    def capture_face_encoding(self, frame):
        """Nhận frame từ webcam (numpy array) và trích xuất face encoding."""
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        faces = self.mtcnn(img)

        if faces is not None and len(faces) > 0:
            face = faces[0]
            face_encoding = face.detach().cpu().numpy().flatten()
            return face_encoding
    
    def capture_face_encoding_from_image(self, img_file):
        """Chuyển ảnh từ file thành face encoding."""
        img = Image.open(img_file)
        faces = self.mtcnn(img)

        if faces is not None and len(faces) > 0:
            face = faces[0]
            face_encoding = face.detach().cpu().numpy().flatten()
            return face_encoding

    def compare_face_encoding(self, encoding1, encoding2, threshold=0.6):
        """So sánh face encoding bằng Cosine Similarity và trả về kết quả so sánh."""
        similarity = 1 - cosine(encoding1, encoding2)
        print(f"[INFO] Cosine similarity: {similarity}")
        return similarity >= threshold


    def save_face_encoding_to_db(self, phone, face_encoding):
        """Lưu face encoding vào database."""
        try:
            # Chuyển face encoding thành dạng nhị phân (bytes)
            if isinstance(face_encoding, np.ndarray):
                face_encoding_binary = face_encoding.astype(np.float32).tobytes()  # Chuyển thành nhị phân
                
                # Kết nối và thực thi câu lệnh SQL
                cursor = db.connection.cursor()
                query = """UPDATE customers SET face_encoding = %s WHERE phone = %s"""
                cursor.execute(query, (face_encoding_binary, phone))
                db.connection.commit()
                cursor.close()
                print(f"Đã lưu face encoding cho khách hàng {phone}")
            else:
                raise ValueError("Face encoding không phải là mảng numpy.")
        except Exception as e:
            print(f"Lỗi khi lưu face encoding: {e}")

        
    def load_face_encoding_from_db(self, phone):
        try:
            cursor = db.connection.cursor()
            query = """SELECT face_encoding FROM customers WHERE phone = %s"""
            cursor.execute(query, (phone,))
            result = cursor.fetchone()

            if result is not None:
                face_encoding_binary = result[0]
                print(f"[INFO] Dữ liệu face encoding từ DB: {face_encoding_binary}")

                
                # Kiểm tra dữ liệu nhị phân
                if not face_encoding_binary:
                    raise ValueError(f"Không có dữ liệu nhị phân cho face_encoding của khách hàng với số điện thoại {phone}")

                # Chuyển dữ liệu nhị phân thành mảng NumPy (float32)
                face_encoding = np.frombuffer(face_encoding_binary, dtype=np.float32)
                print(f"[INFO] Face encoding sau khi giải mã: {face_encoding}")

                if face_encoding.size == 0:
                    raise ValueError("Dữ liệu face encoding không hợp lệ.")

                cursor.close()
                return face_encoding
            else:
                cursor.close()
                return None
        except Exception as e:
            print(f"Lỗi khi giải mã face encoding cho số điện thoại {phone}: {e}")
            return None
