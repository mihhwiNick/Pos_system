from database import db
from flask import Flask, request, jsonify
from datetime import datetime
import pytz

class Customers: 
    @staticmethod
    def get_customers():
        cursor = db.connection.cursor()
        cursor.execute("SELECT * FROM customers")
        columns = [desc[0] for desc in cursor.description]
        Customers_List = [dict(zip(columns, row)) for row in cursor.fetchall()]
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
    def add_customer(name, phone, membership_level, points=0):
        cursor = db.connection.cursor()
        try:
            query = "INSERT INTO customers (name, phone, membership_level, points) VALUES (%s, %s, %s, %s)"
            cursor.execute(query, (name, phone, membership_level, points))
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
        else:
            customer = None
        cursor.close()
        return customer
    
    @staticmethod
    def upgrade_to_vip(id):
        cursor = db.connection.cursor()
        query = "UPDATE customers SET membership_level = 'VIP' WHERE id = %s"
        cursor.execute(query, (id,))
        db.connection.commit()
        cursor.close()
        return True
    
    @staticmethod
    def update_points(customer_id, invoice_amount, used_points=0):
        cursor = db.connection.cursor()

        # Lấy membership_level
        cursor.execute("SELECT membership_level FROM customers WHERE id = %s", (customer_id,))
        result = cursor.fetchone()

        if not result:
            cursor.close()
            return {
                "earned": 0,
                "used": used_points,
                "final": 0
            }

        membership_level = result[0]

        # Nếu không phải VIP thì không cộng điểm
        if membership_level != 'VIP':
            cursor.close()
            return {
                "earned": 0,
                "used": 0,
                "final": 0
            }

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

        # Kiểm tra membership_level
        cursor.execute("SELECT membership_level FROM customers WHERE id = %s", (customer_id,))
        result = cursor.fetchone()

        if not result or result[0] != 'VIP':
            cursor.close()
            return  # Không phải VIP thì không trừ điểm

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



