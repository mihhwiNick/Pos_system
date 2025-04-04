from flask import Flask, render_template
from flask_cors import CORS
from database import db
from flask_mysqldb import MySQL
from routes.products import products_bp
from routes.invoicesRoute import invoices_bp
app = Flask(__name__)
CORS(app)

# Cấu hình database
app.config['MYSQL_HOST'] = "localhost"
app.config['MYSQL_USER'] = "root"
app.config['MYSQL_PASSWORD'] = "123456"
app.config['MYSQL_DB'] = "pos_system"

# Khởi tạo database
db = MySQL(app)

# Đăng ký Blueprint
app.register_blueprint(products_bp, url_prefix='/products')
app.register_blueprint(invoices_bp, url_prefix='/invoices')

@app.route("/")
def home():
    return render_template("app.html")

if __name__ == '__main__':
    app.run(debug=True, port=5001)
