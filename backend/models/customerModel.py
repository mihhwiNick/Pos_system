from database import db
from flask import Flask, request, jsonify
import base64

class Customers: 
    @staticmethod
    def get_customers():
        cursor = db.connection.cursor()
        cursor.execute("SELECT id, name, phone, points, face_encoding FROM customers")
        columns = [desc[0] for desc in cursor.description]
        Customers_List = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Convert face_encoding from bytes to base64 string
        for customer in Customers_List:
            if customer.get('face_encoding'):
                customer['face_encoding'] = base64.b64encode(customer['face_encoding']).decode('utf-8')
        
        cursor.close()
        return Customers_List
    
    @staticmethod
    def delete_customers(id):
        cursor = db.connection.cursor()
        cursor.execute("DELETE FROM customers WHERE id = %s", (id,))
        db.connection.commit()
        cursor.close()
        return True
    
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
        name=data.get('name')
        phone=data.get('phone')
        cursor = db.connection.cursor()
        query = "UPDATE customers SET name = %s, phone = %s WHERE id = %s"
        cursor.execute(query, (name, phone, id))
        db.connection.commit()
        cursor.close()
        return jsonify({"message": "Customer updated successfully!"})
    
    @staticmethod
    def get_customer_by_phone(phone):
        cursor = db.connection.cursor()
        query = "SELECT * FROM customers WHERE phone = %s"
        cursor.execute(query, (phone,))
        result = cursor.fetchone()
        if result:
            columns = [desc[0] for desc in cursor.description]
            customer = dict(zip(columns, result))
            
            # Nếu có face_encoding, chuyển nó sang base64
            if customer.get('face_encoding'):
                customer['face_encoding'] = base64.b64encode(customer['face_encoding']).decode('utf-8')
        else:
            customer = None
        cursor.close()
        return customer


    @staticmethod
    def update_points(customer_id, invoice_amount, used_points=0):
        cursor = db.connection.cursor()

        # VIP + không dùng điểm => tích điểm
        if used_points == 0:
            earned_points = invoice_amount // 100000
            cursor.execute("UPDATE customers SET points = points + %s WHERE id = %s", (earned_points, customer_id))
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
        cursor.execute("UPDATE customers SET points = points - %s WHERE id = %s", (used_points, customer_id))
        db.connection.commit()
        cursor.close()
        
    @staticmethod
    def get_new_customers_today():
        cursor = db.connection.cursor()
        query = """
            SELECT COUNT(*) 
            FROM (
                SELECT customer_id, MIN(DATE(created_at)) AS first_order_date
                FROM invoices
                GROUP BY customer_id
                HAVING first_order_date = CURDATE()
            ) AS new_customers;
        """
        cursor.execute(query)
        result = cursor.fetchone()
        cursor.close()
        return result[0] if result[0] is not None else 0


