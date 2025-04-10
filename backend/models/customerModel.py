from database import db
from flask import Flask, request, jsonify

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
    def add_customer():
        try:
            # Lấy dữ liệu JSON từ yêu cầu POST
            data = request.get_json()
            
            # Kiểm tra xem dữ liệu có tồn tại không
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Lấy các thông tin của khách hàng
            name = data.get('name')

            phone = data.get('phone')
            membership_level = data.get('membership_level')
            points = data.get('points', 0)  # Nếu không có điểm, mặc định là 0

            # Kiểm tra các trường bắt buộc
            if not name or not phone or not membership_level:
                return jsonify({"error": "Missing required fields"}), 400

            # Tạo một cursor để thực thi câu lệnh SQL
            cursor = db.connection.cursor()

            # Câu lệnh SQL để thêm khách hàng vào cơ sở dữ liệu
            cursor.execute("""
                INSERT INTO customers (name, phone, membership_level, points)
                VALUES (%s, %s, %s, %s)
            """, (name, phone, membership_level, points))
            
            # Commit thay đổi vào cơ sở dữ liệu
            db.connection.commit()
            
            # Đóng cursor
            cursor.close()
            
            # Trả về thông báo thành công
            return jsonify({"message": "Customer added successfully"})
        except Exception as e:
            # Xử lý các lỗi khác
            return jsonify({"error": f"An error occurred: {e}"})
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