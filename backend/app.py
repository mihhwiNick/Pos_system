from flask import Flask
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
app.config['MYSQL_DB'] = "pos_system"  # Sửa lỗi tại đây

# Khởi tạo database
db = MySQL(app)  # Không dùng db.init_app(app)

# Đăng ký Blueprint
app.register_blueprint(products_bp, url_prefix='/products')

if __name__ == '__main__':
    app.run(debug=True, port=5001)
