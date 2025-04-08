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
    data = request.json
    required_fields = ["name", "brand", "price", "stock", "image_url", "screen_size", 
                       "processor", "ram", "storage", "battery", "camera", "os", "color"]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Thiếu dữ liệu cần thiết"}), 400

    success = quanLiSP.add(
        data["name"], data["brand"], data["price"], data["stock"], data["image_url"], 
        data["screen_size"], data["processor"], data["ram"], data["storage"], data["battery"], 
        data["camera"], data["os"], data["color"]
    )
    
    return jsonify({"message": "Thêm thành công!"}) if success else jsonify({"message": "Thêm thất bại"}), 500

# API xóa sản phẩm
@quanLiSP_bp.route('/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    success = quanLiSP.delete(product_id)
    return jsonify({"message": "Xóa thành công!"}) if success else jsonify({"message": "Xóa thất bại"}), 500
# API lay sản phẩm moi nhat
@quanLiSP_bp.route('/latest_product', methods=['GET'])
def latest_product():
    product = quanLiSP.get_latest_product()
    if product:
        return jsonify(product)
    else:
        return jsonify({"message": "Không có sản phẩm nào"}), 404

