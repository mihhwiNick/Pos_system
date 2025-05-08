import cv2
import os
import os
from deepface import DeepFace
import pickle, base64
from database import db
from unidecode import unidecode
from models.customerModel import Customers  # Đảm bảo đã có hàm này

# Thư mục chứa ảnh (có thể chứa nhiều ảnh cho 1 khách)
dataset_path = 'backend/dataset'
embedding_path = 'backend/face_embeddings.pkl'

# Model và detector dùng cho DeepFace
model_name = "Facenet512"
detector_backend = "mtcnn"

model = DeepFace.build_model(model_name)

# Hàm trích đặc trưng khuôn mặt từ ảnh
def extract_embeddings(img_path):
    try:
        embedding_objs = DeepFace.represent(img_path=img_path,
                                            model_name=model_name,
                                            detector_backend=detector_backend,
                                            enforce_detection=True)
        return embedding_objs[0]["embedding"]
    except Exception as e:
        print(f"Không trích được embedding từ {img_path}: {e}")
        return None
    
# Hàm lưu tất cả embeddings vào cơ sở dữ liệu
def save_face_encodings_to_db(phone_number, all_embeddings):
    customer = Customers.get_customer_by_phone(phone_number)
    if customer:
        # Chuyển tất cả embeddings thành base64 string
        face_encoding_base64 = base64.b64encode(pickle.dumps(all_embeddings)).decode('utf-8')
        # Cập nhật tất cả các embedding vào cột face_encoding trong DB
        query = "UPDATE customers SET face_encoding = %s WHERE phone = %s"
        params = (face_encoding_base64, phone_number)
        db.connection.cursor().execute(query, params)
        db.connection.commit()
        print(f"[INFO] Đã lưu tất cả embeddings của khách hàng {phone_number} vào cơ sở dữ liệu.")
    else:
        print(f"[LỖI] Không tìm thấy khách hàng với số điện thoại {phone_number}.")

def capture_image(phone_number):
    # Kiểm tra khách hàng có tồn tại không
    customer = Customers.get_customer_by_phone(phone_number)
    if not customer:
        print(f"[LỖI] Không tìm thấy khách hàng với số điện thoại {phone_number}.")
        return

    # Lấy tên khách hàng (giả sử khách hàng có trường 'name' trong CSDL)
    customer_name = customer.get('name', 'unknown')  # Đảm bảo rằng 'name' có trong dữ liệu của bạn

    # Thay thế khoảng trắng thành dấu gạch dưới (_) trong tên khách hàng
    customer_name = customer_name.replace(" ", "_")

    # Tạo thư mục lưu ảnh: Thêm tên khách hàng và số điện thoại vào thư mục
    save_dir = f'backend/dataset/{customer_name}_{phone_number}'
    os.makedirs(save_dir, exist_ok=True)

    cap = cv2.VideoCapture(0)
    img_count = 0

    print("Nhấn 's' để chụp ảnh, 'q' để thoát.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Không thể mở camera.")
            break

        cv2.imshow("Webcam - Nhấn 's' để chụp, 'q' để thoát", frame)

        key = cv2.waitKey(1)
        if key == ord('s'):
            # Tên ảnh theo định dạng 'tênkháchhàng_sdt_1.jpg'
            img_filename = f"{customer_name}_{phone_number}_{img_count}.jpg"
            img_path = os.path.join(save_dir, img_filename)
            cv2.imwrite(img_path, frame)
            print(f"Đã lưu ảnh: {img_path}")
            img_count += 1
        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    
    # Sau khi chụp ảnh xong, bắt đầu trích xuất đặc trưng khuôn mặt
    all_embeddings = []

    print(f"Đang trích xuất embeddings cho khách hàng {customer_name}_{phone_number}...")
    for img_file in os.listdir(save_dir):
        img_path = os.path.join(save_dir, img_file)
        embedding = extract_embeddings(img_path)
        if embedding is not None:
            all_embeddings.append(embedding)

    # Lưu tất cả embeddings vào cơ sở dữ liệu
    save_face_encodings_to_db(phone_number, all_embeddings)

    # Lưu đặc trưng vào file pickle (tùy chọn nếu bạn cần)
    with open(f'backend/embeddings/embeddings_{phone_number}.pkl', 'wb') as f:
        pickle.dump(all_embeddings, f)