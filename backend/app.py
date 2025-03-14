from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app) 
# Kết nối database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="pos_system"
)

@app.route('/products', methods=['GET'])
def get_products():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    
    # Cập nhật đường dẫn ảnh đúng với frontend
    for product in products:
        product["image_url"] = f"http://127.0.0.1:5500/frontend/{product['image_url']}"

    cursor.close()
    return jsonify(products)

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = cursor.fetchone()
    
    if product is None:
        return jsonify({"message": "Sản phẩm không tìm thấy"}), 404
    
    # Cập nhật đường dẫn ảnh đúng với frontend
    product["image_url"] = f"http://127.0.0.1:5500/frontend/{product['image_url']}"
    
    cursor.close()
    return jsonify(product)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
