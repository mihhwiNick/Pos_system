from database import db

class Invoice:
    @staticmethod
    def get_all():
        cursor = db.connection.cursor()
        query = """
            SELECT invoices.id, invoices.created_at, invoices.total_amount, customers.name as customer_name
            FROM invoices
            JOIN customers ON invoices.customer_id = customers.id
        """
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        invoices = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return invoices

    @staticmethod
    def get_invoice(invoice_id):
        cursor = db.connection.cursor()
        query = """
            SELECT * FROM invoices
            JOIN customers ON invoices.customer_id = customers.id
            WHERE invoices.id = %s
        """
        cursor.execute(query, (invoice_id,))
        columns = [desc[0] for desc in cursor.description]
        invoice = dict(zip(columns, cursor.fetchone())) if cursor.rowcount > 0 else None
        cursor.close()
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
    def create_invoice(customer_id, total_amount):
        cursor = db.connection.cursor()
        cursor.execute("INSERT INTO invoices (customer_id, total_amount, created_at) VALUES (%s, %s, NOW())", 
            (customer_id, total_amount))
        db.connection.commit()
        cursor.close()
        
    @staticmethod
    def create_invoiceDetails(invoice_id, product_id, quantity, price):
        cursor = db.connection.cursor()
        cursor.execute("INSERT INTO invoice_details (invoice_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (invoice_id, product_id, quantity, price))
        db.connection.commit()
        cursor.close()   
        
    @staticmethod
    def delete_invoice(id):
        cursor = db.connection.cursor()
        cursor.execute("DELETE FROM invoices WHERE id = %s", (id,))
        db.connection.commit()
        cursor.close()
        return True
        
    @staticmethod
    def delete_invoiceDetails(id):
        cursor = db.connection.cursor()
        cursor.execute("DELETE FROM invoice_details WHERE id = %s", (id,))
        db.connection.commit()
        cursor.close()
        return True
