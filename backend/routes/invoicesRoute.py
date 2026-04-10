from flask import Blueprint, request, jsonify
from models.invoicesModel import Invoice

invoices_bp = Blueprint('invoices', __name__)

# Lấy tất cả hóa đơn
@invoices_bp.route('/', methods=['GET'])
def get_invoices():
    invoices = Invoice.get_all()
    return jsonify(invoices)

# Lấy hóa đơn theo id
@invoices_bp.route('/<int:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    invoice = Invoice.get_invoice(invoice_id)
    if invoice is None:
        return jsonify({"message": "Hóa đơn không tìm thấy"}), 404
    return jsonify(invoice)

# Lấy chi tiết hóa đơn theo id
@invoices_bp.route('/<int:invoice_id>/details', methods=['GET'])
def get_invoice_details(invoice_id):
    # Lấy chi tiết hóa đơn
    details = Invoice.get_invoiceDetails(invoice_id)
    
    if not details:
        return jsonify({"message": "Chi tiết hóa đơn không tìm thấy"}), 404
    return jsonify(details)


# Thêm mới hóa đơn
@invoices_bp.route('/', methods=['POST'])
def add_invoice():
    data = request.get_json()
    customer_id = data.get('customer_id')
    total_amount = data.get('total_amount')
    
    # Kiểm tra kỹ hơn: chỉ báo lỗi nếu ID khách hàng bị trống thực sự
    if customer_id is None:
        return jsonify({"message": "Thiếu ID khách hàng"}), 400

    invoice_id = Invoice.create_invoice(
        customer_id, 
        data.get('employee_id'), 
        total_amount, 
        data.get('used_points', 0)
    )
    return jsonify({"message": "Thành công", "invoice_id": invoice_id}), 201

#Thêm chi tiết hóa đơn
@invoices_bp.route('/<int:invoice_id>/details', methods=['POST'])
def add_invoice_detail(invoice_id):
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity')

    if not product_id or not quantity:
        return jsonify({"message": "Thiếu thông tin chi tiết hóa đơn"}), 400

    try:
        # Lấy giá gốc từ bảng products để đảm bảo tính đúng
        price_per_unit = Invoice.get_product_price(product_id)
        
        # Gọi hàm xử lý (Hàm này đã được nâng cấp tự update total_amount ở bước 1)
        Invoice.create_invoiceDetails(invoice_id, product_id, quantity, price_per_unit)

        return jsonify({
            "message": "Đã thêm sản phẩm và cập nhật tổng tiền thành công!",
            "new_total": Invoice.get_invoice_total(invoice_id)
        }), 201

    except Exception as e:
        return jsonify({"message": str(e)}), 500
