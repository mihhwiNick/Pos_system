from flask import Blueprint, render_template
from models.invoicesModel import Invoice
from datetime import datetime

invoices_PDF_bp = Blueprint('invoices_PDF', __name__)

@invoices_PDF_bp.route('/invoice/<int:invoice_id>')
def invoice_PDF(invoice_id):
    invoice = Invoice.get_invoice(invoice_id)
    details = Invoice.get_invoiceDetails(invoice_id)

    if not invoice:
        return "Không tìm thấy hóa đơn", 404

    # Tính tổng tiền hàng
    sub_total = sum(item['price'] * item['quantity'] for item in details)
    
    # Lấy số điểm
    used_points = int(invoice.get('used_points') or 0)
    discount = used_points * 1000
    
    # Tổng tiền cuối cùng phải bằng sub_total - discount
    total_final = sub_total - discount

    invoice['sub_total'] = sub_total
    invoice['discount'] = discount
    invoice['total_amount'] = total_final

    # Chuyển đổi created_at (xử lý cả trường hợp là chuỗi hoặc datetime object)
    if isinstance(invoice['created_at'], str):
        created_at = datetime.strptime(invoice['created_at'], '%d/%m/%Y %H:%M')
    else:
        created_at = invoice['created_at']

    invoice['created_at'] = created_at

    return render_template('invoice_PDF.html', 
                        invoice=invoice, 
                        details=details)