from flask import Blueprint, request, jsonify
from models.invoicesModel import Invoice

invoices_bp = Blueprint('invoices', __name__)

# Lấy tất cả hóa đơn
@invoices_bp.route('/', methods=['GET'])
def get_invoices():
    invoices = Invoice.get_all()
    return jsonify(invoices)

# Lấy chi tiết hóa đơn theo id
@invoices_bp.route('/<int:id>', methods=['GET'])
def get_invoice(id):
    invoice = Invoice.get_invoice(id)
    if invoice is None:
        return jsonify({"message": "Hóa đơn không tìm thấy"}), 404
    return jsonify(invoice)

# Lấy chi tiết hóa đơn theo id
@invoices_bp.route('/<int:id>/details', methods=['GET'])
def get_invoice_details(id):
    # Lấy chi tiết hóa đơn
    details = Invoice.get_invoiceDetails(id)
    
    if not details:
        return jsonify({"message": "Chi tiết hóa đơn không tìm thấy"}), 404
    return jsonify(details)


# Thêm mới hóa đơn
@invoices_bp.route('/', methods=['POST'])
def add_invoice():
    data = request.get_json()
    customer_id = data.get('customer_id')
    total_amount = data.get('total_amount')
    
    if not customer_id or not total_amount:
        return jsonify({"message": "Thiếu thông tin cần thiết"}), 400

    Invoice.create(customer_id, total_amount)
    return jsonify({"message": "Hóa đơn đã được thêm thành công!"}), 201

# Xóa hóa đơn
@invoices_bp.route('/<int:id>', methods=['DELETE'])
def delete_invoice(id):
    Invoice.delete_invoice(id)
    Invoice.delete_invoiceDetails(id)  # Xóa chi tiết hóa đơn khi xóa hóa đơn
    return jsonify({"message": "Hóa đơn đã được xóa thành công!"})

# Xóa hóa đơn chi tiết
@invoices_bp.route('/<int:id>/details', methods=['DELETE'])
def delete_invoice_detail(id):
    success = Invoice.delete_invoiceDetails(id)
    if not success:
        return jsonify({"message": "Chi tiết hóa đơn không tồn tại"}), 404
    return jsonify({"message": "Chi tiết hóa đơn đã được xóa thành công!"})
