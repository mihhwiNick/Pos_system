from flask import Blueprint, jsonify ,request
from models.quanLiSPModel import quanLiSP

quanLiSP_bp=Blueprint('quanLiSP',__name__)

# API cập nhật sản phẩm (NEW)
@quanLiSP_bp.route('/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json 
    # Kiểm tra xem có đủ dữ liệu không
    required_fields = ["name", "brand", "price", "stock", "image_url", "screen_size", 
                       "processor", "ram", "storage", "battery", "camera", "os", "color"]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Thiếu dữ liệu cần thiết"}), 400

    success = quanLiSP.update(
        product_id, data["name"], data["brand"], data["price"], data["stock"], data["image_url"], 
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
        data = request.get_json()
        required_fields = ["name", "brand", "price", "stock", "image_url", "screen_size", 
                           "processor", "ram", "storage", "battery", "camera", "os", "color"]

        if not data or not all(field in data for field in required_fields):
            return jsonify({"message": "Thiếu dữ liệu cần thiết"}), 400

        last_inserted_id = quanLiSP.add(
            data["name"], data["brand"], data["price"], data["stock"], data["image_url"], 
            data["screen_size"], data["processor"], data["ram"], data["storage"], 
            data["battery"], data["camera"], data["os"], data["color"]
        )

        return jsonify({"message": "Thêm thành công!", "id": last_inserted_id}), 200
    
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

