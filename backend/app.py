from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db
from flask_mysqldb import MySQL
from routes.products import products_bp  # Import routes sản phẩm

app = Flask(__name__)
CORS(app)

# Cấu hình database
app.config['MYSQL_HOST'] = "localhost"
app.config['MYSQL_USER'] = "root"
app.config['MYSQL_PASSWORD'] = ""
app.config['MYSQL_DB'] = "pos_system"  

# Khởi tạo database
db = MySQL(app)  

# Đăng ký Blueprint
app.register_blueprint(products_bp, url_prefix='/products')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    cursor = db.connection.cursor()
    query = "SELECT username, role FROM users WHERE username=%s AND password=%s AND role=%s"
    cursor.execute(query, (username, password, role))
    user = cursor.fetchone()

    if user:
        return jsonify({"username": user[0], "role": user[1]}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route('/users', methods=['GET', 'POST'])
def manage_users():
    cursor = db.connection.cursor()

    if request.method == 'GET':
        search = request.args.get('search', '')
        query = "SELECT id, username, role FROM users WHERE username LIKE %s"
        cursor.execute(query, (f"%{search}%",))
        users = cursor.fetchall()
        return jsonify([{"id": user[0], "username": user[1], "role": user[2]} for user in users])

    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')

        query = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
        cursor.execute(query, (username, password, role))
        db.connection.commit()
        return jsonify({"message": "User added successfully"}), 201

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    cursor = db.connection.cursor()
    query = "DELETE FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))
    db.connection.commit()
    return jsonify({"message": "User deleted successfully"}), 200

@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    username = data.get('username')
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    role = data.get('role')

    cursor = db.connection.cursor()

    # Validate old password
    query = "SELECT password FROM users WHERE id=%s"
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()

    if not user or user[0] != old_password:
        return jsonify({"message": "Mật khẩu cũ không chính xác!"}), 400

    # Update user details
    if new_password:
        query = "UPDATE users SET username=%s, password=%s, role=%s WHERE id=%s"
        cursor.execute(query, (username, new_password, role, user_id))
    else:
        query = "UPDATE users SET username=%s, role=%s WHERE id=%s"
        cursor.execute(query, (username, role, user_id))

    db.connection.commit()
    return jsonify({"message": "User updated successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
