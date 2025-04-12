from flask import Blueprint, render_template
from models.invoicesModel import Invoice
from datetime import datetime

invoices_PDF_bp = Blueprint('invoices_PDF', __name__)

@invoices_PDF_bp.route('/invoice/<int:invoice_id>')
def invoice_PDF(invoice_id):
    invoice = Invoice.get_invoice(invoice_id)
    details = Invoice.get_invoiceDetails(invoice_id)

    # Tính toán lại nếu cần
    sub_total = sum(item['price'] * item['quantity'] for item in details)
    discount = sub_total - invoice['total_amount']

    # Chuyển đổi created_at từ chuỗi thành datetime
    created_at = datetime.strptime(invoice['created_at'], '%d/%m/%Y %H:%M')

    # Thêm vào dict để truyền sang template
    invoice['sub_total'] = sub_total
    invoice['discount'] = discount
    invoice['created_at'] = created_at  # Gửi vào template dưới dạng datetime

    return render_template('invoice_PDF.html',
                        invoice=invoice,
                        details=details,
                        sub_total=sub_total,
                        discount=discount)
