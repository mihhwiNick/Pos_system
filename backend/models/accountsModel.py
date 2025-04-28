from database import db

class Account:
    @staticmethod
    def login(username, password, role):
        cursor = db.connection.cursor()
        query = "SELECT username, role FROM users WHERE username=%s AND password=%s AND role=%s"
        cursor.execute(query, (username, password, role))
        account = cursor.fetchone()
        if account:
            return {"username": account[0], "role": account[1]}
        return None

    @staticmethod
    def get_all(search=''):
        cursor = db.connection.cursor()
        query = "SELECT id, username, role FROM users WHERE username LIKE %s"
        cursor.execute(query, (f"%{search}%",))
        accounts = cursor.fetchall()
        return [{"id": account[0], "username": account[1], "role": account[2]} for account in accounts]

    @staticmethod
    def add(username, password, role):
        cursor = db.connection.cursor()
        try:
            query = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
            cursor.execute(query, (username, password, role))
            db.connection.commit()
            return True
        except:
            db.connection.rollback()
            return False

    @staticmethod
    def delete(account_id):
        cursor = db.connection.cursor()
        try:
            query = "DELETE FROM users WHERE id = %s"
            cursor.execute(query, (account_id,))
            db.connection.commit()
            return True
        except:
            db.connection.rollback()
            return False

    @staticmethod
    def update(account_id, username, old_password, new_password, role):
        cursor = db.connection.cursor()
        try:
            # Validate old password
            query = "SELECT password FROM users WHERE id=%s"
            cursor.execute(query, (account_id,))
            account = cursor.fetchone()
            if not account or account[0] != old_password:
                return False

            # Update account details
            if new_password:
                query = "UPDATE users SET username=%s, password=%s, role=%s WHERE id=%s"
                cursor.execute(query, (username, new_password, role, account_id))
            else:
                query = "UPDATE users SET username=%s, role=%s WHERE id=%s"
                cursor.execute(query, (username, role, account_id))

            db.connection.commit()
            return True
        except:
            db.connection.rollback()
            return False
