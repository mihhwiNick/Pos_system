from database import db
from flask import Flask, request, jsonify
from datetime import datetime

class Employees:
    @staticmethod
    def get_employees():
        cursor = db.connection.cursor()
        # THÊM: Lấy thêm cột user_id để Frontend có dữ liệu sử dụng
        cursor.execute("SELECT employee_id, full_name, phone_number, employee_type, base_salary, start_date, status, user_id FROM employees")
        columns = [desc[0] for desc in cursor.description]
        Employees_List = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return Employees_List

    @staticmethod
    def add_employee(full_name, phone_number, employee_type, base_salary, start_date, user_id):
        cursor = db.connection.cursor()
        try:
            # Thêm user_id vào câu lệnh INSERT
            query = """INSERT INTO employees (full_name, phone_number, employee_type, base_salary, start_date, user_id, status) 
                    VALUES (%s, %s, %s, %s, %s, %s, 1)"""
            cursor.execute(query, (full_name, phone_number, employee_type, base_salary, start_date, user_id))
            db.connection.commit()
            return True
        except Exception as e:
            db.connection.rollback()
            return False

    @staticmethod
    def update_employee(id, data):
        full_name = data.get('full_name')
        phone_number = data.get('phone_number')
        status = data.get('status')
        emp_type = data.get('employee_type')
        new_base_salary = data.get('base_salary') # Lương 10M sếp mới nhập
        
        cursor = db.connection.cursor()
        try:
            # 1. LẤY MỨC LƯƠNG CŨ (8.5M) TRƯỚC KHI UPDATE
            cursor.execute("SELECT base_salary FROM employees WHERE employee_id = %s", (id,))
            result = cursor.fetchone()
            if not result:
                return False
            old_salary = float(result[0])

            # 2. CHUẨN BỊ DỮ LIỆU CHO BẢN NHÁP THÁNG HIỆN TẠI
            now = datetime.now()
            curr_month, curr_year = now.month, now.year

            # Kiểm tra xem tháng này đã có dòng payroll chưa
            cursor.execute("SELECT payroll_id FROM payroll WHERE employee_id=%s AND month=%s AND year=%s", 
                            (id, curr_month, curr_year))
            exists = cursor.fetchone()

            if not exists:
                # 🚀 TÍNH TOÁN CÁC CHỈ SỐ SNAPSHOT ĐỂ LƯU VÀO BẢNG PAYROLL MỚI
                # Lấy ngày công chuẩn
                cursor.execute("SELECT standard_workdays FROM salary_periods WHERE month = %s AND year = %s LIMIT 1", 
                                (curr_month, curr_year))
                std_res = cursor.fetchone()
                std_days = float(std_res[0]) if std_res else 26.0

                # Lấy ngày công thực tế tính đến hiện tại
                cursor.execute("""SELECT IFNULL(SUM(work_value), 0) FROM attendance_daily 
                                    WHERE employee_id = %s AND MONTH(work_date) = %s AND YEAR(work_date) = %s""", 
                                (id, curr_month, curr_year))
                act_days = float(cursor.fetchone()[0])

                # Tính lương cứng thực nhận (actual_base_salary)
                actual_base = (old_salary / std_days) * act_days

                # 🚀 LƯU BẢN NHÁP VỚI CẤU TRÚC BẢNG MỚI (ĐÃ BỎ payment_status)
                query_backup = """
                    INSERT INTO payroll (employee_id, month, year, standard_work_days, 
                                        base_salary_at_time, actual_base_salary, 
                                        total_work_days, status) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 0)
                """
                cursor.execute(query_backup, (id, curr_month, curr_year, std_days, old_salary, actual_base, act_days))

            # 3. CẬP NHẬT LƯƠNG MỚI VÀO BẢNG NHÂN VIÊN
            query_emp = """UPDATE employees 
                            SET full_name = %s, phone_number = %s, status = %s, 
                                employee_type = %s, base_salary = %s 
                            WHERE employee_id = %s"""
            cursor.execute(query_emp, (full_name, phone_number, status, emp_type, new_base_salary, id))
            
            db.connection.commit()
            return True
        except Exception as e:
            print(f"Lỗi cập nhật thăng chức: {e}")
            db.connection.rollback()
            return False
        finally:
            cursor.close()
            
    @staticmethod
    def update_profile_self(user_id, data):
        cursor = db.connection.cursor()
        try:
            # Tạo danh sách các cột cần update và giá trị tương ứng
            fields = []
            params = []
            
            # 🚀 CHỐT HẠ: Chỉ thêm vào query nếu dữ liệu có tồn tại
            if 'full_name' in data and data['full_name']:
                fields.append("full_name = %s")
                params.append(data['full_name'])
                
            if 'phone_number' in data and data['phone_number']:
                fields.append("phone_number = %s")
                params.append(data['phone_number'])
                
            # Nếu chẳng có gì để update thì thoát luôn cho nhẹ máy
            if not fields:
                return True
                
            # Nối các field lại bằng dấu phẩy
            query = f"UPDATE employees SET {', '.join(fields)} WHERE user_id = %s"
            params.append(user_id)
            
            # Thực thi với tuple tham số
            cursor.execute(query, tuple(params))
            db.connection.commit()
            return True
        except Exception as e:
            print("Lỗi tự cập nhật profile:", e)
            db.connection.rollback()
            return False
        finally:
            cursor.close()

    @staticmethod
    def get_employee_by_phone(phone):
        cursor = db.connection.cursor()
        query = "SELECT * FROM employees WHERE phone_number = %s"
        cursor.execute(query, (phone,))
        result = cursor.fetchone()
        
        employee = None
        if result:
            columns = [desc[0] for desc in cursor.description]
            employee = dict(zip(columns, result))
        cursor.close()
        return employee
    
    @staticmethod
    def get_sales_history(employee_id, month=None, year=None):
        cursor = db.connection.cursor()
        sql = """
            SELECT 
                i.invoice_id, 
                DATE_FORMAT(i.created_at, '%%Y-%%m-%%d %%H:%%i:%%s') as created_at, 
                i.total_amount, -- Đây là Thực thu
                i.used_points,
                -- Tính tổng tiền gốc từ chi tiết hóa đơn
                (SELECT SUM(id.quantity * id.price) FROM invoice_details id WHERE id.invoice_id = i.invoice_id) as original_subtotal,
                (i.total_amount * 0.005) as base_comm_fixed,
                ((SELECT SUM(id.quantity * id.price * p.extra_commission_rate) 
                FROM invoice_details id JOIN products p ON id.product_id = p.product_id 
                WHERE id.invoice_id = i.invoice_id) 
                 * (i.total_amount / NULLIF((SELECT SUM(d.quantity * d.price) FROM invoice_details d WHERE d.invoice_id = i.invoice_id), 0))) 
                as extra_comm_fixed
            FROM invoices i
            WHERE i.employee_id = %s
        """
        params = [employee_id]
        if month and year:
            sql += " AND MONTH(i.created_at) = %s AND YEAR(i.created_at) = %s"
            params.extend([month, year])
        sql += " ORDER BY i.created_at DESC"
        
        cursor.execute(sql, tuple(params))
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    @staticmethod
    def get_top_commission_employee(start=None, end=None):
        cursor = db.connection.cursor()
        sql = """
            SELECT e.full_name, 
                SUM(
                    (i.total_amount * 0.005) + 
                    ((SELECT SUM(id.quantity * id.price * p.extra_commission_rate) 
                    FROM invoice_details id JOIN products p ON id.product_id = p.product_id 
                    WHERE id.invoice_id = i.invoice_id) 
                     * (i.total_amount / NULLIF((SELECT SUM(d.quantity * d.price) FROM invoice_details d WHERE d.invoice_id = i.invoice_id), 0)))
                ) AS total_comm
            FROM invoices i
            JOIN employees e ON i.employee_id = e.employee_id
            WHERE 1=1
        """
        params = []
        if start and end:
            sql += " AND DATE(i.created_at) BETWEEN %s AND %s"
            params.extend([start, end])
        else:
            sql += " AND MONTH(i.created_at) = MONTH(CURDATE()) AND YEAR(i.created_at) = YEAR(CURDATE())"
        
        sql += " GROUP BY e.employee_id ORDER BY total_comm DESC LIMIT 1"
        cursor.execute(sql, tuple(params))
        result = cursor.fetchone()
        cursor.close()
        
        if result:
            return {"name": result[0], "value": float(result[1] or 0)}
        return {"name": "Chưa có", "value": 0}
            
    @staticmethod
    def get_invoice_item_details(invoice_id):
        cursor = db.connection.cursor()
        # 🚀 CẢI TIẾN: Thưởng chi tiết cũng phải nhân với (Thực thu / Giá gốc) cho khớp bảng ngoài
        sql = """
            SELECT 
                p.name, p.brand, 
                p.extra_commission_rate, id.quantity, id.price,
                (
                    (id.quantity * id.price * p.extra_commission_rate) 
                    * (SELECT i.total_amount / NULLIF((SELECT SUM(d.quantity * d.price) FROM invoice_details d WHERE d.invoice_id = i.invoice_id), 0) 
                    FROM invoices i WHERE i.invoice_id = id.invoice_id)
                ) AS extra_comm
            FROM invoice_details id
            JOIN products p ON id.product_id = p.product_id
            WHERE id.invoice_id = %s
        """
        cursor.execute(sql, (invoice_id,))
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    @staticmethod
    def get_employee_leaderboard(start=None, end=None):
        cursor = db.connection.cursor()
        # SQL: Kết nối bảng hóa đơn với bảng nhân viên
        sql = """
            SELECT 
                e.full_name, 
                COUNT(i.invoice_id) as total_orders, 
                SUM(i.total_amount) as total_revenue
            FROM invoices i
            JOIN employees e ON i.employee_id = e.employee_id
            WHERE 1=1
        """
        params = []
        if start and end:
            sql += " AND DATE(i.created_at) BETWEEN %s AND %s"
            params.extend([start, end])
        else:
            # Mặc định lấy 30 ngày gần nhất để bảng nhìn cho xôm
            sql += " AND i.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
        
        sql += " GROUP BY e.employee_id ORDER BY total_revenue DESC LIMIT 5"
        
        cursor.execute(sql, tuple(params))
        columns = [desc[0] for desc in cursor.description]
        result = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return result
    
    @staticmethod
    def get_top_commission_employee(start=None, end=None):
        cursor = db.connection.cursor()
        # Công thức: 0.5% doanh thu + tổng hoa hồng phụ trội từ từng sản phẩm
        sql = """
            SELECT 
                e.full_name, 
                SUM(
                    (i.total_amount * 0.005) + 
                    IFNULL((SELECT SUM(id.quantity * p.price * p.extra_commission_rate) 
                            FROM invoice_details id 
                            JOIN products p ON id.product_id = p.product_id 
                            WHERE id.invoice_id = i.invoice_id), 0)
                ) AS total_comm
            FROM invoices i
            JOIN employees e ON i.employee_id = e.employee_id
            WHERE 1=1
        """
        params = []
        if start and end:
            sql += " AND DATE(i.created_at) BETWEEN %s AND %s"
            params.extend([start, end])
        else:
            # Mặc định lấy theo tháng hiện tại để con số đủ lớn và ý nghĩa
            sql += " AND MONTH(i.created_at) = MONTH(CURDATE()) AND YEAR(i.created_at) = YEAR(CURDATE())"
        
        sql += " GROUP BY e.employee_id ORDER BY total_comm DESC LIMIT 1"
        
        cursor.execute(sql, tuple(params))
        result = cursor.fetchone()
        cursor.close()
        
        if result:
            return {"name": result[0], "value": float(result[1])}
        return {"name": "Chưa có", "value": 0}