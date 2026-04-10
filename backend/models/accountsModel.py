import bcrypt
from database import db

class Account:
    @staticmethod
    def hash_password(password):
        """Mã hóa mật khẩu."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @staticmethod
    def check_password(stored_password, password):
        """Kiểm tra mật khẩu với mật khẩu đã mã hóa."""
        return bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8'))

    @staticmethod
    def login(username, password, role):
        cursor = db.connection.cursor()
        query = "SELECT username, password, role FROM users WHERE username=%s AND role=%s"
        cursor.execute(query, (username, role))
        account = cursor.fetchone()
        cursor.close()
        if account and Account.check_password(account[1], password):  # Kiểm tra mật khẩu đã mã hóa
            return {"username": account[0], "role": account[2]}
        return None

    @staticmethod
    def get_all(search=''):
        cursor = db.connection.cursor()
        # Sử dụng LEFT JOIN và điều kiện WHERE u.username OR e.full_name
        query = """
            SELECT u.user_id, u.username, u.role, u.status, e.full_name 
            FROM users u 
            LEFT JOIN employees e ON u.user_id = e.user_id 
            WHERE u.username LIKE %s OR e.full_name LIKE %s
        """
        search_param = f"%{search}%"
        # Truyền search_param 2 lần cho 2 dấu %s
        cursor.execute(query, (search_param, search_param))
        accounts = cursor.fetchall()
        cursor.close()
        
        return [
            {
                "id": account[0], 
                "username": account[1], 
                "role": account[2], 
                "status": account[3],
                "full_name": account[4] if account[4] else ""
            } for account in accounts
        ]

    @staticmethod
    def add(username, password, role):
        cursor = db.connection.cursor()
        try:
            hashed_password = Account.hash_password(password)
            query = "INSERT INTO users (username, password, role, status) VALUES (%s, %s, %s, 1)"
            cursor.execute(query, (username, hashed_password, role))
            db.connection.commit()
            # TRẢ VỀ ID VỪA TẠO
            return cursor.lastrowid 
        except Exception as e:
            db.connection.rollback()
            return None
        finally:
            cursor.close()
        
    @staticmethod
    def admin_reset_password(user_id, new_password):
        cursor = db.connection.cursor()
        try:
            # 1. Mã hóa mật khẩu mới mà Admin vừa nhập
            hashed_password = Account.hash_password(new_password)
            
            # 2. Chạy lệnh UPDATE để ghi đè vào Database
            query = "UPDATE users SET password = %s WHERE user_id = %s"
            cursor.execute(query, (hashed_password, user_id))
            
            db.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            db.connection.rollback()
            print(f"Lỗi Reset: {e}")
            return False

    @staticmethod
    def update_status(user_id, new_status):
        cursor = db.connection.cursor()
        try:
            query = "UPDATE users SET status = %s WHERE user_id = %s"
            cursor.execute(query, (new_status, user_id))
            db.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            db.connection.rollback()
            print(f"Lỗi cập nhật status: {e}")
            return False
        
    @staticmethod
    def change_password_logic(user_id, current_password, new_password):
        cursor = db.connection.cursor()
        try:
            # 1. Lấy mật khẩu hiện tại trong DB ra để so sánh
            query_select = "SELECT password FROM users WHERE user_id = %s"
            cursor.execute(query_select, (user_id,))
            result = cursor.fetchone()

            if not result:
                return False

            stored_hashed_password = result[0]

            # 2. Kiểm tra mật khẩu cũ nhập vào có khớp với DB không
            if not Account.check_password(stored_hashed_password, current_password):
                return False # Sai mật khẩu cũ

            # 3. Nếu đúng, tiến hành mã hóa mật khẩu mới và cập nhật
            new_hashed_password = Account.hash_password(new_password)
            query_update = "UPDATE users SET password = %s WHERE user_id = %s"
            cursor.execute(query_update, (new_hashed_password, user_id))
            
            db.connection.commit()
            return True
        except Exception as e:
            db.connection.rollback()
            print(f"Lỗi đổi mật khẩu: {e}")
            return False
        finally:
            cursor.close()
        
    # Kiểm tra username tồn tại
    @staticmethod
    def exists(username):
        cursor = db.connection.cursor()
        query = "SELECT user_id FROM users WHERE username = %s"
        cursor.execute(query, (username,))
        result = cursor.fetchone()
        cursor.close()
        return result is not None  # Trả về True nếu đã tồn tại