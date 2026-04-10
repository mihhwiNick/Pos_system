from flask import Blueprint, jsonify ,request
import os
from models.quanLiSPModel import quanLiSP

quanLiSP_bp = Blueprint('quanLiSP', __name__)

# ĐỊA CHỈ TUYỆT ĐỐI ĐỂ LƯU ẢNH (Raw string r"...")
UPLOAD_FOLDER = r"D:\Desktop\HTTTDN\Pos_System\frontend\img\products"

import os
from flask import Blueprint, jsonify, request
from models.quanLiSPModel import quanLiSP

quanLiSP_bp = Blueprint('quanLiSP', __name__)

# ĐỊA CHỈ ĐÍCH CỐ ĐỊNH TRÊN MÁY TÍNH CỦA BẠN
UPLOAD_FOLDER = r"D:\Desktop\HTTTDN\Pos_System\frontend\img\products"

@quanLiSP_bp.route('/add', methods=['POST'])
def add_product():
    try:
        data = request.form.to_dict()
        brand = data.get("brand", "")

        # Logic hoa hồng
        extra_rate = 0.005 if brand in ["Apple", "Samsung"] else 0.01

        # 1. Thêm vào DB trước để lấy ID
        last_inserted_id = quanLiSP.add(
            data["name"], brand, data["price"], None, 
            data["screen_size"], data["processor"], data["ram"], 
            data["storage"], data["battery"], data["camera"], 
            data["os"], data["color"], extra_rate
        )

        # 2. Xử lý "Chuyển" ảnh từ nơi bất kỳ vào thư mục đồ án
        image_file = request.files.get('image')
        if image_file and last_inserted_id:
            # Đảm bảo thư mục tồn tại
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)

            # Đặt tên file theo ID (Ví dụ: 56.jpg)
            filename = f"{last_inserted_id}.jpg"
            # Đường dẫn vật lý đầy đủ để lưu file
            target_path = os.path.join(UPLOAD_FOLDER, filename)
            
            # LỆNH QUAN TRỌNG: Lưu nội dung file từ bộ nhớ tạm vào ổ cứng
            image_file.save(target_path)
            print(f">>> Đã lưu file thành công tại: {target_path}")

            # 3. Cập nhật lại đường dẫn tương đối để Web hiển thị
            db_image_url = f"img/products/{filename}"
            quanLiSP.update_image_url(last_inserted_id, db_image_url)

        return jsonify({"message": "Thêm thành công!", "id": last_inserted_id}), 200

    except Exception as e:
        print(">>> Lỗi:", str(e))
        return jsonify({"message": str(e)}), 500

@quanLiSP_bp.route('/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.form.to_dict()
        image_file = request.files.get('image')
        image_url = data.get("image_url", "") 

        # XỬ LÝ LỖI CHỒNG TIỀN TỐ: 
        # Nếu image_url chứa domain của frontend, ta cắt bỏ nó đi để chỉ lưu đường dẫn tương đối
        prefix = "http://127.0.0.1:5500/frontend/"
        if image_url.startswith(prefix):
            image_url = image_url.replace(prefix, "")

        if image_file:
            # Nếu có upload ảnh mới thì thực hiện lưu file như cũ
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            filename = f"{product_id}.jpg"
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image_file.save(image_path)
            image_url = f"img/products/{filename}"

        # Cập nhật vào DB
        success = quanLiSP.update(
            product_id, data["name"], data["brand"], data["price"], image_url, 
            data["screen_size"], data["processor"], data["ram"], data["storage"], 
            data["battery"], data["camera"], data["os"], data["color"]
        )
        
        if success:
            return jsonify({"message": "Cập nhật thành công!"})
        return jsonify({"message": "Không tìm thấy sản phẩm"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
@quanLiSP_bp.route('/update_status/<int:product_id>', methods=['PATCH'])
def update_status(product_id):
    try:
        data = request.json
        new_status = data.get('status') # Frontend gửi { "status": 0 hoặc 1 }
        
        success = quanLiSP.update_status(product_id, new_status)
        if success:
            return jsonify({"message": "Cập nhật trạng thái thành công!"}), 200
        return jsonify({"message": "Không tìm thấy sản phẩm"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# API lay sản phẩm moi nhat
@quanLiSP_bp.route('/latest_product', methods=['GET'])
def latest_product():
    product = quanLiSP.get_latest_product()
    if product:
        product["image_url"] = f"http://127.0.0.1:5500/frontend/{product['image_url']}"
        return jsonify(product)
    else:
        return jsonify({"message": "Không có sản phẩm nào"}), 404
    

