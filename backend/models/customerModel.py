from database import db
from flask import Flask, request, jsonify
import base64

class Customers:
    @staticmethod
    def get_customers():
        cursor = db.connection.cursor()
        # Đã loại bỏ face_encoding khỏi câu lệnh SELECT
        cursor.execute("SELECT customer_id, name, phone, points FROM customers")
        columns = [desc[0] for desc in cursor.description]
        Customers_List = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        cursor.close()
        return Customers_List
    
    @staticmethod
    def add_customer(name, phone, points=0):
        cursor = db.connection.cursor()
        try:
            query = "INSERT INTO customers (name, phone, points) VALUES (%s, %s, %s)"
            cursor.execute(query, (name, phone, points))
            db.connection.commit()
            return True
        except Exception as e:
            print("Lỗi thêm khách hàng:", e)
            db.connection.rollback()
            return False

    @staticmethod
    def update_customer(id):
        data = request.get_json()
        name = data.get('name')
        phone = data.get('phone')
        cursor = db.connection.cursor()
        query = "UPDATE customers SET name = %s, phone = %s WHERE customer_id = %s"
        cursor.execute(query, (name, phone, id))
        db.connection.commit()
        cursor.close()
        return jsonify({"message": "Customer updated successfully!"})
    
    @staticmethod
    def get_customer_by_phone(phone):
        cursor = db.connection.cursor()
        # Tìm kiếm thuần túy bằng Số điện thoại
        query = "SELECT customer_id, name, phone, points FROM customers WHERE phone = %s"
        cursor.execute(query, (phone,))
        result = cursor.fetchone()
        
        customer = None
        if result:
            columns = [desc[0] for desc in cursor.description]
            customer = dict(zip(columns, result))
            
        cursor.close()
        return customer

    @staticmethod
    def update_points(customer_id, invoice_amount, used_points=0):
        cursor = db.connection.cursor()

        # VIP + không dùng điểm => tích điểm
        if used_points == 0:
            earned_points = invoice_amount // 100000
            cursor.execute("UPDATE customers SET points = points + %s WHERE customer_id = %s", (earned_points, customer_id))
            db.connection.commit()
            cursor.close()

            return {
                "earned": earned_points,
                "used": 0,
                "final": earned_points
            }

        # VIP + có dùng điểm => không cộng điểm
        cursor.close()
        return {
            "earned": 0,
            "used": used_points,
            "final": 0
        }

        
    @staticmethod
    def subtract_points(customer_id, used_points):
        cursor = db.connection.cursor()
        # Nếu là VIP thì trừ điểm như thường
        cursor.execute("UPDATE customers SET points = points - %s WHERE customer_id = %s", (used_points, customer_id))
        db.connection.commit()
        cursor.close()
        
    @staticmethod
    def get_new_customers(start=None, end=None):
        cursor = db.connection.cursor()
        if start and end:
            sql = "SELECT COUNT(*) FROM customers WHERE DATE(created_at) BETWEEN %s AND %s"
            cursor.execute(sql, (start, end))
        else:
            # Nếu không lọc, mặc định là khách đăng ký hôm nay
            sql = "SELECT COUNT(*) FROM customers WHERE DATE(created_at) = CURDATE()"
            cursor.execute(sql)
        res = cursor.fetchone()
        cursor.close()
        return res[0] if res else 0


