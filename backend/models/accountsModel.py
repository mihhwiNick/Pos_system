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
        query = "SELECT id, username, role FROM users WHERE username LIKE %s"
        cursor.execute(query, (f"%{search}%",))
        accounts = cursor.fetchall()
        return [{"id": account[0], "username": account[1], "role": account[2]} for account in accounts]

    @staticmethod
    def add(username, password, role):
        cursor = db.connection.cursor()
        try:
            hashed_password = Account.hash_password(password)  # Mã hóa mật khẩu trước khi lưu
            query = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
            cursor.execute(query, (username, hashed_password, role))
            db.connection.commit()
            return True
        except Exception as e:
            db.connection.rollback()
            print(f"Error: {e}")  # In ra lỗi nếu có
            return False

    @staticmethod
    def delete(account_id):
        cursor = db.connection.cursor()
        try:
            query = "DELETE FROM users WHERE id = %s"
            cursor.execute(query, (account_id,))
            db.connection.commit()
            return True
        except:
            db.connection.rollback()
            return False

    @staticmethod
    def update(account_id, username, old_password, new_password, role):
        cursor = db.connection.cursor()
        try:
            # Validate old password
            query = "SELECT password FROM users WHERE id=%s"
            cursor.execute(query, (account_id,))
            account = cursor.fetchone()
            if not account or not Account.check_password(account[0], old_password):  # Kiểm tra mật khẩu cũ
                return False

            # Mã hóa mật khẩu mới nếu có
            if new_password:
                hashed_password = Account.hash_password(new_password)
                query = "UPDATE users SET username=%s, password=%s, role=%s WHERE id=%s"
                cursor.execute(query, (username, hashed_password, role, account_id))
            else:
                query = "UPDATE users SET username=%s, role=%s WHERE id=%s"
                cursor.execute(query, (username, role, account_id))

            db.connection.commit()
            return True
        except:
            db.connection.rollback()
            return False
