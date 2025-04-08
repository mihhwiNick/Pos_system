from flask import Blueprint, jsonify, request
from models.accountsModel import Account
from database import db

accounts_bp = Blueprint('accounts', __name__)

@accounts_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    account = Account.login(username, password, role)
    if account:
        return jsonify({"username": account["username"], "role": account["role"]}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@accounts_bp.route('/', methods=['GET'])
def get_accounts():
    search = request.args.get('search', '')
    accounts = Account.get_all(search)
    return jsonify(accounts)

@accounts_bp.route('/', methods=['POST'])
def add_account():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if Account.add(username, password, role):
        return jsonify({"message": "Account added successfully"}), 201
    else:
        return jsonify({"message": "Failed to add account"}), 400

@accounts_bp.route('/<int:account_id>', methods=['DELETE'])
def delete_account(account_id):
    if Account.delete(account_id):
        return jsonify({"message": "Account deleted successfully"}), 200
    else:
        return jsonify({"message": "Failed to delete account"}), 400

@accounts_bp.route('/<int:account_id>', methods=['PUT'])
def update_account(account_id):
    data = request.json
    username = data.get('username')
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    role = data.get('role')

    if Account.update(account_id, username, old_password, new_password, role):
        return jsonify({"message": "Account updated successfully"}), 200
    else:
        return jsonify({"message": "Failed to update account"}), 400

@accounts_bp.route('/users', methods=['GET'])
def get_users():
    search = request.args.get('search', '')
    cursor = db.connection.cursor()
    query = "SELECT id, username, role FROM users WHERE username LIKE %s"
    cursor.execute(query, (f"%{search}%",))
    users = cursor.fetchall()
    result = [{"id": user[0], "username": user[1], "role": user[2]} for user in users]
    return jsonify(result)

@accounts_bp.route('/users', methods=['POST'])
def add_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    cursor = db.connection.cursor()
    try:
        query = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
        cursor.execute(query, (username, password, role))
        db.connection.commit()
        return jsonify({"message": "User added successfully"}), 201
    except Exception as e:
        db.connection.rollback()
        return jsonify({"message": "Error adding user", "error": str(e)}), 400

@accounts_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    cursor = db.connection.cursor()
    try:
        query = "DELETE FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        db.connection.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        db.connection.rollback()
        return jsonify({"message": "Error deleting user", "error": str(e)}), 400

@accounts_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    username = data.get('username')
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    role = data.get('role')

    cursor = db.connection.cursor()
    try:
        # Validate old password
        query = "SELECT password FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        if not user or user[0] != old_password:
            return jsonify({"message": "Old password is incorrect"}), 400

        # Update user details
        if new_password:
            query = "UPDATE users SET username = %s, password = %s, role = %s WHERE id = %s"
            cursor.execute(query, (username, new_password, role, user_id))
        else:
            query = "UPDATE users SET username = %s, role = %s WHERE id = %s"
            cursor.execute(query, (username, role, user_id))

        db.connection.commit()
        return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        db.connection.rollback()
        return jsonify({"message": "Error updating user", "error": str(e)}), 400
