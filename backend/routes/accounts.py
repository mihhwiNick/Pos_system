from flask import Blueprint, jsonify, request
from models.accountsModel import Account
from database import db

accounts_bp = Blueprint('accounts', __name__)

# ĐĂNG NHẬP 
@accounts_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    cursor = db.connection.cursor()
    # 🚀 CẬP NHẬT QUERY: Thêm e.phone vào danh sách SELECT
    query = """
        SELECT u.user_id, u.username, u.password, u.role, e.employee_id, e.full_name, e.phone_number, u.status, e.status
        FROM users u
        LEFT JOIN employees e ON u.user_id = e.user_id
        WHERE u.username = %s
    """
    cursor.execute(query, (username,))
    user = cursor.fetchone()

    if user:
        # 🚀 CẬP NHẬT BIẾN: Hứng thêm giá trị phone (thứ 7 trong list)
        user_id, db_username, db_password, role, employee_id, full_name, phone_number, u_status, e_status = user
        
        if Account.check_password(db_password, password):
            if u_status == 0 or e_status == 0:
                return jsonify({"message": "Tài khoản bị khóa hoặc nhân viên đã nghỉ!"}), 403
            
            # 🚀 CẬP NHẬT JSON: Gửi phone về cho Frontend
            return jsonify({
                "user_id": user_id, 
                "username": db_username,
                "role": role,
                "employee_id": employee_id,
                "full_name": full_name,
                "phone_number": phone_number,
                "message": "Đăng nhập thành công"
            }), 200
            
    return jsonify({"message": "Tên đăng nhập hoặc mật khẩu không chính xác"}), 401

# LẤY DANH SÁCH TÀI KHOẢN
@accounts_bp.route('/users', methods=['GET'])
def get_users():
    search = request.args.get('search', '')
    # Gọi hàm get_all từ Model (Hàm này đã có status)
    users = Account.get_all(search) 
    return jsonify(users)

# THÊM TÀI KHOẢN MỚI
@accounts_bp.route('/users', methods=['POST'])
def add_user():
    data = request.json
    username = data.get('username')
    
    # RÀNG BUỘC: Kiểm tra trùng Username
    if Account.exists(username):
        return jsonify({"message": "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác!"}), 400

    user_id = Account.add(username, data.get('password'), data.get('role'))
    if user_id:
        return jsonify({"message": "Thêm user thành công", "user_id": user_id}), 201
    return jsonify({"message": "Lỗi không xác định khi tạo tài khoản"}), 500

# CẬP NHẬT TRẠNG THÁI
@accounts_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
def update_user_status(user_id):
    data = request.json
    new_status = data.get('status')
    if Account.update_status(user_id, new_status):
        return jsonify({"message": "Cập nhật trạng thái thành công!"}), 200
    return jsonify({"message": "Lỗi hệ thống"}), 500

# ADMIN ĐẶT LẠI MẬT KHẨU
@accounts_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
def reset_password_api(user_id):
    new_pass = request.json.get('newPassword')
    if Account.admin_reset_password(user_id, new_pass):
        return jsonify({"message": "Đã đặt lại mật khẩu thành công!"}), 200
    return jsonify({"message": "Lỗi khi đặt lại mật khẩu"}), 500

# NGƯỜI DÙNG TỰ ĐỔI MẬT KHẨU
@accounts_bp.route('/users/<int:user_id>/change-password', methods=['POST'])
def change_password(user_id):
    data = request.json
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    # Logic kiểm tra pass cũ và cập nhật pass mới nằm trong Model hoặc viết gọn tại đây
    if Account.change_password_logic(user_id, current_password, new_password):
        return jsonify({"message": "Đổi mật khẩu thành công"}), 200
    return jsonify({"message": "Mật khẩu hiện tại không đúng"}), 400
