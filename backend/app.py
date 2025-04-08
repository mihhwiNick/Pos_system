from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from database import db
from flask_mysqldb import MySQL
from routes.products import products_bp
from routes.invoicesRoute import invoices_bp
from routes.accounts import accounts_bp  # Import accounts blueprint

app = Flask(__name__)
CORS(app)

# Cấu hình database
app.config['MYSQL_HOST'] = "localhost"
app.config['MYSQL_USER'] = "root"
app.config['MYSQL_PASSWORD'] = ""
app.config['MYSQL_DB'] = "pos_system"

db = MySQL(app)


# Register Blueprints
app.register_blueprint(products_bp, url_prefix='/products')
app.register_blueprint(invoices_bp, url_prefix='/invoices')
app.register_blueprint(accounts_bp, url_prefix='/accounts')  # Ensure this is correct

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    cursor = db.connection.cursor()
    query = "SELECT username, role FROM users WHERE username=%s AND password=%s"
    cursor.execute(query, (username, password))
    user = cursor.fetchone()

    if user:
        return jsonify({"username": user[0], "role": user[1]}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the POS system!"})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
