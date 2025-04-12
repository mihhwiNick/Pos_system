from flask import Blueprint, request, jsonify
from models.invoicesModel import Invoice

invoices_bp = Blueprint('invoices', __name__)

# Lấy tất cả hóa đơn
@invoices_bp.route('/', methods=['GET'])
def get_invoices():
    invoices = Invoice.get_all()
    return jsonify(invoices)

# Lấy hóa đơn theo id
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

    invoice_id = Invoice.create_invoice(customer_id, total_amount)
    
    return jsonify({
        "message": "Hóa đơn đã được thêm thành công!",
        "invoice_id": invoice_id
    }), 201

#Thêm chi tiết hóa đơn
@invoices_bp.route('/<int:id>/details', methods=['POST'])
def add_invoice_detail(id):
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity')

    if not product_id or not quantity:
        return jsonify({"message": "Thiếu thông tin chi tiết hóa đơn"}), 400

    try:
        # Sử dụng hàm get_product_price để lấy giá sản phẩm
        price_per_unit = Invoice.get_product_price(product_id)

        if price_per_unit is None:
            return jsonify({"message": "Không tìm thấy sản phẩm"}), 404

        # Thêm chi tiết vào invoice_details
        Invoice.create_invoiceDetails(id, product_id, quantity, price_per_unit)

        return jsonify({"message": "Chi tiết hóa đơn đã được thêm thành công!"}), 201

    except Exception as e:
        print("Lỗi khi thêm chi tiết:", e)
        return jsonify({"message": "Lỗi khi thêm chi tiết hóa đơn"}), 500

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


# Sửa số lượng sản phẩm trong chi tiết hóa đơn
@invoices_bp.route('/<int:id>/details', methods=['PUT'])
def update_invoice_detail(id):
    data = request.get_json()
    quantity = data.get('quantity')

    if quantity is None or quantity <= 0:
        return jsonify({'message': 'Thiếu hoặc số lượng không hợp lệ'}), 400

    try:
        result = Invoice.update_invoice_detail(id, quantity)

        if not result:
            return jsonify({'message': 'Chi tiết hóa đơn không tồn tại'}), 404

        return jsonify({
            'message': 'Cập nhật thành công',
            'new_total_amount': result['new_total']  
        })

    except Exception as e:
        return jsonify({'message': 'Lỗi server', 'error': str(e)}), 500

