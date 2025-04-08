from flask import Blueprint, jsonify
from models.productsModel import Product

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
def get_products():
    products = Product.get_all()
    for product in products:
        product["image_url"] = f"http://127.0.0.1:5500/frontend/{product['image_url']}"
    return jsonify(products)

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.get_by_id(product_id)
    if product is None:
        return jsonify({"message": "Sản phẩm không tìm thấy"}), 404

    product["image_url"] = f"http://127.0.0.1:5500/frontend/{product['image_url']}"
    return jsonify(product)
