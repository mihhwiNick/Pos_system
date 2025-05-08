import time
import cv2
import pickle
import base64
from deepface import DeepFace
from scipy.spatial.distance import cosine

model_name = "Facenet512"
detector_backend = "mtcnn"
threshold = 0.4
max_duration = 10  # thời gian webcam mở (giây)

def recognize_face(db):
    def get_embeddings_from_db():
        query = "SELECT phone, name, face_encoding FROM customers"
        cursor = db.connection.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

        stored_embeddings = {}
        for row in results:
            phone = row[0]
            name = row[1]
            face_encoding_base64 = row[2]
            face_encoding = base64.b64decode(face_encoding_base64)
            embeddings = pickle.loads(face_encoding)
            stored_embeddings[phone] = {"name": name, "embeddings": embeddings}
        return stored_embeddings

    stored_embeddings = get_embeddings_from_db()

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    print("[INFO] Đang mở webcam để nhận diện (15s)...")

    start_time = time.time()
    phone_number = None
    customer_name = None
    min_dist = float("inf")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[LỖI] Không thể đọc webcam.")
            break

        frame = cv2.flip(frame, 1)

        try:
            embedding_objs = DeepFace.represent(
                img_path=frame,
                model_name=model_name,
                detector_backend=detector_backend,
                enforce_detection=True
            )

            target_embedding = embedding_objs[0]["embedding"]
            for phone, data in stored_embeddings.items():
                name = data["name"]
                embeddings = data["embeddings"]
                for db_embedding in embeddings:
                    dist = cosine(target_embedding, db_embedding)
                    if dist < min_dist and dist < threshold:
                        min_dist = dist
                        phone_number = phone
                        customer_name = name

        except Exception as e:
            print(f"[!] Không phát hiện khuôn mặt: {e}")

        label = f"{customer_name} ({phone_number})" if phone_number else "Unknown"
        color = (0, 255, 0) if phone_number else (0, 0, 255)
        cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

        cv2.imshow("Recognition (15s)", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        if time.time() - start_time >= max_duration:
            break

    cap.release()
    cv2.destroyAllWindows()

    if phone_number:
        print(f"[✓] Nhận diện thành công: {customer_name} ({phone_number})")
    else:
        print("[X] Không nhận diện được khách hàng trong 15 giây.")

    return phone_number
