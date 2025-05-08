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
        query = """
            SELECT invoices.id, 
                invoices.created_at, 
                invoices.total_amount, 
                customers.name AS customer_name,
                customers.phone AS customer_phone,
                COALESCE(SUM(invoice_details.quantity), 0) AS product_count
            FROM invoices
            JOIN customers ON invoices.customer_id = customers.id
            LEFT JOIN invoice_details ON invoices.id = invoice_details.invoice_id
            GROUP BY invoices.id, customers.name, customers.phone, invoices.created_at, invoices.total_amount
        """
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        invoices = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()

        # Chuyển đổi thời gian tạo hóa đơn sang giờ Việt Nam
        for invoice in invoices:
            invoice['created_at'] = Invoice.convert_to_vn_timezone(invoice['created_at'])

        return invoices

    @staticmethod
    def get_invoice(invoice_id):
        cursor = db.connection.cursor()
        query = """
            SELECT 
                invoices.id AS invoice_id,
                invoices.created_at,
                invoices.total_amount,
                customers.name AS customer_name,
                customers.phone AS customer_phone
            FROM invoices
            JOIN customers ON invoices.customer_id = customers.id
            WHERE invoices.id = %s
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
    def get_invoiceDetails(invoice_id):
        cursor = db.connection.cursor()
        query = """
            SELECT 
                invoice_details.id, 
                invoice_details.invoice_id, 
                invoice_details.product_id, 
                invoice_details.quantity, 
                invoice_details.price, 
                products.name AS product_name
            FROM invoice_details
            JOIN products ON invoice_details.product_id = products.id
            WHERE invoice_details.invoice_id = %s
        """
        cursor.execute(query, (invoice_id,))
        columns = [desc[0] for desc in cursor.description]
        details = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return details

    @staticmethod
    def create_invoice(customer_id, total_amount, used_points=0):
        cursor = db.connection.cursor()
        cursor.execute(
            "INSERT INTO invoices (customer_id, total_amount, used_points, created_at) VALUES (%s, %s, %s, NOW())",
            (customer_id, total_amount, used_points)
        )
        invoice_id = cursor.lastrowid
        db.connection.commit()
        cursor.close()
        return invoice_id

        
    @staticmethod
    def create_invoiceDetails(invoice_id, product_id, quantity, price, is_update=False):
        cursor = db.connection.cursor()
        try:
            # Kiểm tra và gộp các bản ghi trùng
            cursor.execute("""
                SELECT id, quantity FROM invoice_details
                WHERE invoice_id = %s AND product_id = %s
            """, (invoice_id, product_id))

            existing_records = cursor.fetchall()
            if existing_records:
                total_quantity = sum([rec[1] for rec in existing_records]) + quantity
                cursor.execute("""
                    DELETE FROM invoice_details
                    WHERE invoice_id = %s AND product_id = %s
                """, (invoice_id, product_id))
                cursor.execute("""
                    INSERT INTO invoice_details
                    (invoice_id, product_id, quantity, price)
                    VALUES (%s, %s, %s, %s)
                """, (invoice_id, product_id, total_quantity, price))
            else:
                cursor.execute("""
                    INSERT INTO invoice_details
                    (invoice_id, product_id, quantity, price)
                    VALUES (%s, %s, %s, %s)
                """, (invoice_id, product_id, quantity, price))

            # Chỉ cập nhật total_amount nếu đang update
            if is_update:
                cursor.execute("""
                    UPDATE invoices
                    SET total_amount = (
                        SELECT COALESCE(SUM(quantity * price), 0)
                        FROM invoice_details
                        WHERE invoice_id = %s
                    )
                    WHERE id = %s
                """, (invoice_id, invoice_id))

            db.connection.commit()
        except Exception as e:
            db.connection.rollback()
            print(f"Lỗi khi xử lý chi tiết hóa đơn: {str(e)}")
            raise
        finally:
            cursor.close()


        
    @staticmethod
    def get_product_price(product_id):
        try:
            cursor = db.connection.cursor()  # Sử dụng đúng đối tượng kết nối db
            cursor.execute("SELECT price FROM products WHERE id = %s", (product_id,))
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
    def delete_invoice(id):
        cursor = db.connection.cursor()
        cursor.execute("DELETE FROM invoices WHERE id = %s", (id,))
        db.connection.commit()
        cursor.close()
        
    @staticmethod
    def delete_invoiceDetails(detail_id):
        cursor = db.connection.cursor()
        try:
            # Lấy invoice_id từ chi tiết hóa đơn trước khi xóa
            cursor.execute("SELECT invoice_id FROM invoice_details WHERE id = %s", (detail_id,))
            result = cursor.fetchone()
            if not result:
                cursor.close()
                return False

            invoice_id = result[0]

            # Xóa chi tiết hóa đơn
            cursor.execute("DELETE FROM invoice_details WHERE id = %s", (detail_id,))

            # Cập nhật lại tổng tiền
            cursor.execute("""
                UPDATE invoices
                SET total_amount = (
                    SELECT COALESCE(SUM(quantity * price), 0)
                    FROM invoice_details
                    WHERE invoice_id = %s
                )
                WHERE id = %s
            """, (invoice_id, invoice_id))

            # Lấy lại total_amount mới để trả về
            cursor.execute("SELECT total_amount FROM invoices WHERE id = %s", (invoice_id,))
            new_total = cursor.fetchone()[0]

            db.connection.commit()
            cursor.close()

            return {
                'invoice_id': invoice_id,
                'new_total': new_total
            }

        except Exception as e:
            db.connection.rollback()
            cursor.close()
            print("Lỗi khi xóa chi tiết hóa đơn:", e)
            return False
    
    @staticmethod
    def update_invoice_detail(id, quantity):
        cursor = db.connection.cursor()

        try:
            # Kiểm tra quantity trước khi tiến hành cập nhật
            if quantity is None or quantity <= 0:
                print("Số lượng không hợp lệ")
                return None

            # Lấy invoice_id và price từ chi tiết hóa đơn
            cursor.execute("SELECT invoice_id, price FROM invoice_details WHERE id = %s", (id,))
            detail = cursor.fetchone()
            
            if not detail:
                print(f"No invoice detail found for ID: {id}")  # Debug line
                return None

            # Lấy invoice_id và unit_price từ tuple
            invoice_id = detail[0]
            unit_price = detail[1]

            # Tính toán lại giá trị total_price cho chi tiết hóa đơn
            total_price = quantity * unit_price

            # Cập nhật quantity cho chi tiết hóa đơn
            cursor.execute("""
                UPDATE invoice_details
                SET quantity = %s
                WHERE id = %s
            """, (quantity, id))

            # Cập nhật lại tổng tiền của hóa đơn
            cursor.execute("""
                SELECT SUM(price * quantity) AS total
                FROM invoice_details
                WHERE invoice_id = %s
            """, (invoice_id,))

            total_result = cursor.fetchone()

            # Kiểm tra nếu không có kết quả
            if not total_result:
                return None

            new_total = total_result[0] or 0  # Đảm bảo lấy tổng đúng

            # Cập nhật lại total_amount trong bảng invoices
            cursor.execute("""
                UPDATE invoices
                SET total_amount = %s
                WHERE id = %s
            """, (new_total, invoice_id))

            db.connection.commit()

            return {
                'invoice_id': invoice_id,
                'new_quantity': quantity,
                'new_total': new_total
            }

        except Exception as e:
            db.connection.rollback()
            print("Lỗi cập nhật chi tiết hóa đơn:", e)
            return None
        finally:
            cursor.close()
            
    @staticmethod
    def get_invoice_total(invoice_id):
        cursor = db.connection.cursor()
        cursor.execute("SELECT total_amount FROM invoices WHERE id = %s", (invoice_id,))
        result = cursor.fetchone()
        cursor.close()
        return result[0] if result else 0
        
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
            SELECT COUNT(id) 
            FROM invoices
            WHERE DATE(created_at) = %s
        """
        cursor.execute(query, (today,))
        result = cursor.fetchone()
        cursor.close()
        return result[0] if result[0] is not None else 0


