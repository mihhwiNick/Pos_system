from database import db

class Product:
    @staticmethod
    def get_all():
        cursor = db.connection.cursor()
        cursor.execute("SELECT * FROM products")
        columns = [desc[0] for desc in cursor.description]
        products = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return products

    @staticmethod
    def get_by_id(product_id):
        cursor = db.connection.cursor()
        # Sửa 'id' thành 'product_id'
        cursor.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
        
        row = cursor.fetchone()
        if row:
            columns = [desc[0] for desc in cursor.description]
            product = dict(zip(columns, row))
        else:
            product = None
            
        cursor.close()
        return product

