from flask import Blueprint, jsonify ,request
import os
from models.quanLiSPModel import quanLiSP

quanLiSP_bp=Blueprint('quanLiSP',__name__)

# API cập nhật sản phẩm (NEW)
@quanLiSP_bp.route('/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json 
    # Kiểm tra xem có đủ dữ liệu không
    required_fields = ["name", "brand", "price", "image_url", "screen_size", 
                    "processor", "ram", "storage", "battery", "camera", "os", "color"]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Thiếu dữ liệu cần thiết"}), 400

    success = quanLiSP.update(
        product_id, data["name"], data["brand"], data["price"], data["image_url"], 
        data["screen_size"], data["processor"], data["ram"], data["storage"], data["battery"], 
        data["camera"], data["os"], data["color"]
    )
    
    if success:
        return jsonify({"message": "Cập nhật thành công!"})
    else:
        return jsonify({"message": "Cập nhật thất bại"}), 500
    
    # API thêm sản phẩm

@quanLiSP_bp.route('/add', methods=['POST'])
def add_product():
    try:
        # Nhận dữ liệu từ FormData (cả thông tin sản phẩm và file ảnh)
        data = request.form.to_dict()  # Lấy các trường từ FormData (dưới dạng dictionary)
        required_fields = ["name", "brand", "price","screen_size",
                        "processor", "ram", "storage", "battery", "camera", "os", "color"]

        # Kiểm tra xem dữ liệu có đầy đủ các trường cần thiết không
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Thiếu dữ liệu cần thiết"}), 400

        # Lấy thông tin sản phẩm từ FormData
        name = data["name"]
        brand = data["brand"]
        price = data["price"]
        screen_size = data["screen_size"]
        processor = data["processor"]
        ram = data["ram"]
        storage = data["storage"]
        battery = data["battery"]
        camera = data["camera"]
        os_type = data["os"]
        color = data["color"]
        
        # Thêm sản phẩm vào database mà không có image_url
        last_inserted_id = quanLiSP.add(
            name, brand, price, None, screen_size, processor, ram, storage, battery, camera, os_type, color
        )

        # Lấy tệp ảnh từ FormData
        image_file = request.files.get('image')

        if image_file:
            # Đảm bảo thư mục 'img/products/' tồn tại
            img_folder = "frontend/img/products/"
            os.makedirs(img_folder, exist_ok=True)

            # Đặt tên file ảnh là ID của sản phẩm
            filename = f"{last_inserted_id}.jpg"

            # Lưu ảnh vào thư mục với tên file là ID
            image_path = os.path.join(img_folder, filename)
            image_file.save(image_path)

            # Cập nhật lại image_url vào database
            image_url = f"img/products/{filename}"
            quanLiSP.update_image_url(last_inserted_id, image_url)

        return jsonify({"message": "Thêm sản phẩm thành công!", "id": last_inserted_id}), 200

    except Exception as e:
        print(">>> Lỗi khi thêm sản phẩm:", e)
        return jsonify({"message": "Lỗi server"}), 500


# API xóa sản phẩm
@quanLiSP_bp.route('/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        success = quanLiSP.delete(product_id)
        if success:
            return jsonify({"message": "Xóa thành công!"})
        else:
            return jsonify({"message": "Không tìm thấy sản phẩm"}), 404
    except Exception as e:
        print(">>> Lỗi khi xóa sản phẩm:", e)
        return jsonify({"message": "Lỗi server"}), 500

# API lay sản phẩm moi nhat
@quanLiSP_bp.route('/latest_product', methods=['GET'])
def latest_product():
    product = quanLiSP.get_latest_product()
    if product:
        product["image_url"] = f"http://127.0.0.1:5500/frontend/{product['image_url']}"
        return jsonify(product)
    else:
        return jsonify({"message": "Không có sản phẩm nào"}), 404

