# from database import db
# from flask import jsonify, request

# class Accounts:
#     @staticmethod
#     def login(username, password, role):
#         cursor = db.connection.cursor()
#         query = "SELECT username, role FROM users WHERE username=%s AND password=%s AND role=%s"
#         cursor.execute(query, (username, password, role))
#         user = cursor.fetchone()
#         if user:
#             return jsonify({"username": user[0], "role": user[1]}), 200
#         else:
#             return jsonify({"message": "Invalid credentials"}), 401
#     @staticmethod
#     def manage_user():
#         cursor = db.connection.cursor()

#         if request.method == 'GET':
#             search = request.args.get('search', '')
#             query = "SELECT id, username, role FROM users WHERE username LIKE %s"
#             cursor.execute(query, (f"%{search}%",))
#             users = cursor.fetchall()
#             return jsonify([{"id": user[0], "username": user[1], "role": user[2]} for user in users])

#         if request.method == 'POST':
#             data = request.json
#             username = data.get('username')
#             password = data.get('password')
#             role = data.get('role')

#             query = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
#             cursor.execute(query, (username, password, role))
#             db.connection.commit()
#             return jsonify({"message": "User added successfully"}), 201
#     @staticmethod
#     def delete_user(user_id):
#         cursor = db.connection.cursor()
#         query = "DELETE FROM users WHERE id = %s"
#         cursor.execute(query, (user_id,))
#         db.connection.commit()
#         return jsonify({"message": "User deleted successfully"}), 200
#     @staticmethod
#     def update_user(user_id):
#         data = request.json
#         username = data.get('username')
#         old_password = data.get('oldPassword')
#         new_password = data.get('newPassword')
#         role = data.get('role')

#         cursor = db.connection.cursor()

#     # Validate old password
#         query = "SELECT password FROM users WHERE id=%s"
#         cursor.execute(query, (user_id,))
#         user = cursor.fetchone()

#         if not user or user[0] != old_password:
#             return jsonify({"message": "Mật khẩu cũ không chính xác!"}), 400

#         # Update user details
#         if new_password:
#             query = "UPDATE users SET username=%s, password=%s, role=%s WHERE id=%s"
#             cursor.execute(query, (username, new_password, role, user_id))
#         else:
#             query = "UPDATE users SET username=%s, role=%s WHERE id=%s"
#             cursor.execute(query, (username, role, user_id))

#         db.connection.commit()
#         return jsonify({"message": "User updated successfully"}), 200
from database import db

class Account:
    @staticmethod
    def login(username, password, role):
        cursor = db.connection.cursor()
        query = "SELECT username, role FROM users WHERE username=%s AND password=%s AND role=%s"
        cursor.execute(query, (username, password, role))
        account = cursor.fetchone()
        if account:
            return {"username": account[0], "role": account[1]}
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
            query = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
            cursor.execute(query, (username, password, role))
            db.connection.commit()
            return True
        except:
            db.connection.rollback()
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
            if not account or account[0] != old_password:
                return False

            # Update account details
            if new_password:
                query = "UPDATE users SET username=%s, password=%s, role=%s WHERE id=%s"
                cursor.execute(query, (username, new_password, role, account_id))
            else:
                query = "UPDATE users SET username=%s, role=%s WHERE id=%s"
                cursor.execute(query, (username, role, account_id))

            db.connection.commit()
            return True
        except:
            db.connection.rollback()
            return False
