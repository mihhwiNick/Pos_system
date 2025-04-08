from database import db;

class quanLiSP:
    #  Thêm hàm cập nhật sản phẩm
    @staticmethod
    def update(product_id, name, brand, price, stock, image_url, screen_size, processor, ram, storage, battery, camera, os, color):
    
        cursor = db.connection.cursor()
        sql = "UPDATE products SET name = %s, brand = %s, price = %s, stock = %s, image_url = %s, " \
        "screen_size = %s, processor = %s, ram = %s, storage = %s, battery = %s, camera = %s, os = %s, color = %s  WHERE id = %s"
        values = (name, brand, price, stock, image_url, screen_size, processor, ram, storage, battery, camera, os, color, product_id)
    
        cursor.execute(sql, values)
        db.connection.commit()  # Lưu thay đổi vào database
        updated = cursor.rowcount > 0  # Kiểm tra xem có dòng nào bị ảnh hưởng không
        cursor.close()
        return updated
     # Thêm sản phẩm mới
    @staticmethod
    def add(name, brand, price, stock, image_url, screen_size, processor, ram, storage, battery, camera, os, color):
        cursor = db.connection.cursor()
        sql = """INSERT INTO products (name, brand, price, stock, image_url, screen_size, processor, ram, storage, battery, camera, os, color) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        values = (name, brand, price, stock, image_url, screen_size, processor, ram, storage, battery, camera, os, color)
        cursor.execute(sql, values)
        db.connection.commit()
        inserted = cursor.rowcount > 0
        cursor.close()
        return inserted

    # Xóa sản phẩm
    @staticmethod
    def delete(product_id):
        cursor = db.connection.cursor()
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        db.connection.commit()
        deleted = cursor.rowcount > 0
        cursor.close()
        return deleted
    # lay sản phẩm moi nhat
    @staticmethod
    def get_latest_product():
        cursor = db.connection.cursor()
        cursor.execute("SELECT * FROM products ORDER BY id DESC LIMIT 1")
        result = cursor.fetchone()
        
        if result:
            columns = [desc[0] for desc in cursor.description]  # Lấy tên cột
            product = dict(zip(columns, result))  # Chuyển dữ liệu thành dictionary
        else:
            product = None  # Không có sản phẩm nào
        
        cursor.close()
        return product


