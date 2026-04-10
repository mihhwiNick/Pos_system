import pytz
from database import db
from datetime import datetime

class Invoice:
    @staticmethod
    def convert_to_vn_timezone(utc_datetime):
        # Đảm bảo rằng dữ liệu đã có múi giờ (timezone-aware)
        if utc_datetime.tzinfo is None:
            # Nếu chưa có múi giờ, bạn có thể giả định rằng nó đã là giờ Việt Nam
            utc_datetime = pytz.timezone('Asia/Ho_Chi_Minh').localize(utc_datetime)
        
        # Trả về định dạng ngày giờ theo yêu cầu (giờ Việt Nam)
        return utc_datetime.strftime('%d/%m/%Y %H:%M')

    @staticmethod
    def get_all():
        cursor = db.connection.cursor()
        # 🚀 FIX LỖI 1054: Xóa i.original_subtotal khỏi GROUP BY kkk
        query = """
            SELECT i.invoice_id, 
                i.created_at, 
                i.total_amount,
                i.used_points,
                COALESCE(SUM(id.quantity * id.price), 0) AS original_subtotal, 
                c.name AS customer_name,
                c.phone AS customer_phone,
                e.full_name AS employee_name,
                COALESCE(SUM(id.quantity), 0) AS product_count
            FROM invoices i
            JOIN customers c ON i.customer_id = c.customer_id
            JOIN employees e ON i.employee_id = e.employee_id
            LEFT JOIN invoice_details id ON i.invoice_id = id.invoice_id
            GROUP BY i.invoice_id, 
                    c.name, 
                    c.phone, 
                    e.full_name, 
                    i.created_at, 
                    i.total_amount, 
                    i.used_points
            ORDER BY i.invoice_id DESC
        """
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        invoices = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()

        # Chuyển đổi thời gian sang giờ Việt Nam cho đồng bộ kkk
        for invoice in invoices:
            invoice['created_at'] = Invoice.convert_to_vn_timezone(invoice['created_at'])

        return invoices

    @staticmethod
    def get_invoice(invoice_id):
        cursor = db.connection.cursor()
        query = """
            SELECT 
                invoices.invoice_id AS invoice_id,
                invoices.created_at,
                invoices.total_amount,
                invoices.used_points,
                customers.name AS customer_name,
                customers.phone AS customer_phone,
                employees.full_name AS employee_name
            FROM invoices
            JOIN customers ON invoices.customer_id = customers.customer_id
            JOIN employees ON invoices.employee_id = employees.employee_id
            WHERE invoices.invoice_id = %s
        """
        cursor.execute(query, (invoice_id,))
        columns = [desc[0] for desc in cursor.description]
        invoice = dict(zip(columns, cursor.fetchone())) if cursor.rowcount > 0 else None
        cursor.close()

        # Chuyển đổi thời gian tạo hóa đơn sang giờ Việt Nam
        if invoice:
            invoice['created_at'] = Invoice.convert_to_vn_timezone(invoice['created_at'])

        return invoice
    
    @staticmethod
    def get_invoice_total(invoice_id):
        cursor = db.connection.cursor()
        # Hàm này dùng để lấy tổng tiền của 1 hóa đơn cụ thể sau khi đã thêm hàng
        sql = "SELECT total_amount FROM invoices WHERE invoice_id = %s"
        cursor.execute(sql, (invoice_id,))
        result = cursor.fetchone()
        cursor.close()
        return float(result[0]) if result and result[0] else 0

    @staticmethod
    def get_invoiceDetails(invoice_id):
        cursor = db.connection.cursor()
        query = """
            SELECT 
                invoice_details.invoiceDetail_id, 
                invoice_details.invoice_id, 
                invoice_details.product_id, 
                invoice_details.quantity, 
                invoice_details.price, 
                products.name AS product_name
            FROM invoice_details
            JOIN products ON invoice_details.product_id = products.product_id
            WHERE invoice_details.invoice_id = %s
        """
        cursor.execute(query, (invoice_id,))
        columns = [desc[0] for desc in cursor.description]
        details = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return details

    @staticmethod
    def create_invoice(customer_id, employee_id, total_amount, used_points=0):
        cursor = db.connection.cursor()
        # Chuyển total_amount về số để chắc chắn
        total_amount = float(total_amount) 
        cursor.execute(
            "INSERT INTO invoices (customer_id, employee_id, total_amount, used_points, created_at) VALUES (%s, %s, %s, %s, NOW())",
            (customer_id, employee_id, total_amount, used_points)
        )
        invoice_id = cursor.lastrowid
        db.connection.commit()
        cursor.close()
        return invoice_id

        
    @staticmethod
    def create_invoiceDetails(invoice_id, product_id, quantity, price):
        cursor = db.connection.cursor()
        try:
            # 1. Kiểm tra sản phẩm đã có trong hóa đơn chưa để gộp số lượng
            cursor.execute("""
                SELECT invoiceDetail_id, quantity FROM invoice_details
                WHERE invoice_id = %s AND product_id = %s
            """, (invoice_id, product_id))
            existing = cursor.fetchone()

            if existing:
                new_qty = existing[1] + quantity
                cursor.execute("UPDATE invoice_details SET quantity = %s WHERE invoiceDetail_id = %s", 
                                (new_qty, existing[0]))
            else:
                cursor.execute("""
                    INSERT INTO invoice_details (invoice_id, product_id, quantity, price)
                    VALUES (%s, %s, %s, %s)
                """, (invoice_id, product_id, quantity, price))

            # 🚀 2. TỰ ĐỘNG CẬP NHẬT TỔNG TIỀN VÀO BẢNG INVOICES
            # Công thức: Tổng (SL * Giá) - (Điểm sử dụng * 1000)
            cursor.execute("""
                UPDATE invoices 
                SET total_amount = (
                    SELECT 
                        COALESCE(SUM(id.quantity * id.price), 0) - (i.used_points * 1000)
                    FROM invoices i
                    LEFT JOIN invoice_details id ON i.invoice_id = id.invoice_id
                    WHERE i.invoice_id = %s
                )
                WHERE invoice_id = %s
            """, (invoice_id, invoice_id))

            db.connection.commit()
        except Exception as e:
            db.connection.rollback()
            print(f"Lỗi tính toán tổng tiền: {str(e)}")
            raise
        finally:
            cursor.close()

        
    @staticmethod
    def get_product_price(product_id):
        try:
            cursor = db.connection.cursor()  # Sử dụng đúng đối tượng kết nối db
            cursor.execute("SELECT price FROM products WHERE product_id = %s", (product_id,))
            product = cursor.fetchone()
            
            cursor.close()

            # Nếu không tìm thấy sản phẩm, trả về None
            if product is None:
                return None

            # Trả về giá của sản phẩm
            return product[0]
        except Exception as e:
            print("Lỗi khi truy vấn giá sản phẩm:", e)
            return None
        
    @staticmethod
    def get_revenue_today():
        today = datetime.now(pytz.timezone('Asia/Ho_Chi_Minh')).date()  # Ngày hôm nay
        cursor = db.connection.cursor()
        query = """
            SELECT SUM(total_amount) 
            FROM invoices
            WHERE DATE(created_at) = %s
        """
        cursor.execute(query, (today,))
        result = cursor.fetchone()
        cursor.close()
        return result[0] if result[0] is not None else 0

    @staticmethod
    def get_orders_today():
        today = datetime.now(pytz.timezone('Asia/Ho_Chi_Minh')).date()  # Ngày hôm nay
        cursor = db.connection.cursor()
        query = """
            SELECT COUNT(invoice_id) 
            FROM invoices
            WHERE DATE(created_at) = %s
        """
        cursor.execute(query, (today,))
        result = cursor.fetchone()
        cursor.close()
        return result[0] if result[0] is not None else 0
    
    @staticmethod
    def get_total_revenue(start=None, end=None):
        cursor = db.connection.cursor()
        # Logic: Nếu có ngày thì lọc BETWEEN, không có thì lấy hôm nay (CURDATE)
        if start and end:
            sql = "SELECT SUM(total_amount) FROM invoices WHERE DATE(created_at) BETWEEN %s AND %s"
            cursor.execute(sql, (start, end))
        else:
            sql = "SELECT SUM(total_amount) FROM invoices WHERE DATE(created_at) = CURDATE()"
            cursor.execute(sql)
        res = cursor.fetchone()
        cursor.close()
        return res[0] if res[0] else 0
    
    @staticmethod
    def get_total_orders(start=None, end=None):
        cursor = db.connection.cursor()
        if start and end:
            sql = "SELECT COUNT(*) FROM invoices WHERE DATE(created_at) BETWEEN %s AND %s"
            cursor.execute(sql, (start, end))
        else:
            sql = "SELECT COUNT(*) FROM invoices WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
            cursor.execute(sql)
        res = cursor.fetchone()
        cursor.close()
        return res[0] if res else 0

    @staticmethod
    def get_avg_order_value(start=None, end=None):
        cursor = db.connection.cursor()
        if start and end:
            sql = "SELECT AVG(total_amount) FROM invoices WHERE DATE(created_at) BETWEEN %s AND %s"
            cursor.execute(sql, (start, end))
        else:
            sql = "SELECT AVG(total_amount) FROM invoices WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
            cursor.execute(sql)
        res = cursor.fetchone()
        cursor.close()
        return res[0] if res[0] else 0

    @staticmethod
    def get_brand_distribution(start=None, end=None):
        cursor = db.connection.cursor()
        sql = """
            SELECT p.brand, COUNT(id.product_id) as count
            FROM invoice_details id
            JOIN products p ON id.product_id = p.product_id
            JOIN invoices i ON id.invoice_id = i.invoice_id
            WHERE 1=1
        """
        params = []
        if start and end:
            sql += " AND DATE(i.created_at) BETWEEN %s AND %s"
            params.extend([start, end])
        else:
            sql += " AND i.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
        
        sql += " GROUP BY p.brand"
        cursor.execute(sql, tuple(params))
        columns = [desc[0] for desc in cursor.description]
        result = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return result

    @staticmethod
    def get_top_5_products(start=None, end=None):
        cursor = db.connection.cursor()
        sql = """
            SELECT p.name, SUM(id.quantity) as quantity
            FROM invoice_details id
            JOIN products p ON id.product_id = p.product_id
            JOIN invoices i ON id.invoice_id = i.invoice_id
            WHERE 1=1
        """
        params = []
        if start and end:
            sql += " AND DATE(i.created_at) BETWEEN %s AND %s"
            params.extend([start, end])
        else:
            sql += " AND i.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
            
        sql += " GROUP BY p.product_id ORDER BY quantity DESC LIMIT 5"
        cursor.execute(sql, tuple(params))
        columns = [desc[0] for desc in cursor.description]
        result = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return result


