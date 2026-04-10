from database import db;

class quanLiSP:
    #  Thêm hàm cập nhật sản phẩm
    @staticmethod
    def update(product_id, name, brand, price, image_url, screen_size, processor, ram, storage, battery, camera, os, color):
    
        cursor = db.connection.cursor()
        
        sql = "UPDATE products SET name = %s, brand = %s, price = %s, image_url = %s, " \
        "screen_size = %s, processor = %s, ram = %s, storage = %s, battery = %s, camera = %s, os = %s, color = %s  WHERE product_id = %s"
        values = (name, brand, price, image_url, screen_size, processor, ram, storage, battery, camera, os, color, product_id)
    
        cursor.execute(sql, values)
        db.connection.commit()  # Lưu thay đổi vào database
        updated = cursor.rowcount > 0  # Kiểm tra xem có dòng nào bị ảnh hưởng không
        cursor.close()
        return updated
    
    # Thêm sản phẩm mới
    @staticmethod
    def add(name, brand, price, image_url, screen_size, processor, ram, storage, battery, camera, os, color, extra_rate):
        cursor = db.connection.cursor()
        
        # Thêm cột extra_commission_rate vào câu lệnh INSERT
        sql = """INSERT INTO products (name, brand, price, image_url, screen_size, 
                processor, ram, storage, battery, camera, os, color, extra_commission_rate) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        
        values = (name, brand, price, image_url, screen_size, 
                processor, ram, storage, battery, camera, os, color, extra_rate)
        
        cursor.execute(sql, values)
        db.connection.commit()

        cursor.execute("SELECT LAST_INSERT_ID()")
        last_inserted_id = cursor.fetchone()[0]
        cursor.close()

        return last_inserted_id

    @staticmethod
    def update_image_url(product_id, image_url):
        cursor = db.connection.cursor()
        sql = "UPDATE products SET image_url = %s WHERE product_id = %s"
        cursor.execute(sql, (image_url, product_id))
        db.connection.commit()
        cursor.close()
        
    @staticmethod
    def update_status(product_id, new_status):
        cursor = db.connection.cursor()
        try:
            sql = "UPDATE products SET status = %s WHERE product_id = %s"
            cursor.execute(sql, (new_status, product_id))
            db.connection.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print("Lỗi update status:", e)
            return False
        finally:
            cursor.close()
    
    # lay sản phẩm moi nhat
    @staticmethod
    def get_latest_product():
        cursor = db.connection.cursor()
        cursor.execute("SELECT * FROM products ORDER BY product_id DESC LIMIT 1")
        result = cursor.fetchone()
        
        if result:
            columns = [desc[0] for desc in cursor.description]  # Lấy tên cột
            product = dict(zip(columns, result))  # Chuyển dữ liệu thành dictionary
        else:
            product = None  # Không có sản phẩm nào
        
        cursor.close()
        return product
    


