from flask import Blueprint, jsonify, request
from models.customerModel import Customers
customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
def get_customers():
    customer = Customers.get_customers()
    return jsonify(customer)

@customers_bp.route('/<int:id>', methods=['DELETE'])
def delete_customers(id):
    Customers.delete_customers(id)
    return jsonify({"message": "Khach Hang đã được xóa thành công!"})
@customers_bp.route('/',methods=['POST'])
def add_customer():
    Customers.add_customer()
    return jsonify({"message": "Khach Hang đã được them thành công!"})
@customers_bp.route('/<int:id>',methods=['PUT'])
def update_customer(id):
    Customers.update_customer(id)
    return jsonify({"message": "Khach Hang đã được sua thành công!"})