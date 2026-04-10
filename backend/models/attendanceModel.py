from database import db
from datetime import datetime

class Attendance:
    @staticmethod
    def get_summary(month, year):
        """Lấy tổng hợp công thực tế và công tiêu chuẩn"""
        cursor = db.connection.cursor()
        query = """
            SELECT 
                e.employee_id,
                e.full_name,
                -- Lấy ngày công tiêu chuẩn từ bảng salary_periods
                (SELECT standard_workdays FROM salary_periods WHERE month = %s AND year = %s LIMIT 1) as standard_workdays,
                -- Tính tổng ngày công thực tế
                SUM(
                    CASE 
                        WHEN TIMESTAMPDIFF(HOUR, a.check_in, a.check_out) >= 8 THEN 1
                        WHEN TIMESTAMPDIFF(HOUR, a.check_in, a.check_out) >= 4 THEN 0.5
                        ELSE 0
                    END
                ) as actual_workdays
            FROM employees e
            LEFT JOIN attendance_daily a ON e.employee_id = a.employee_id 
                AND MONTH(a.work_date) = %s AND YEAR(a.work_date) = %s
            GROUP BY e.employee_id, e.full_name
        """
        # Truyền tham số: month, year (cho subquery) và month, year (cho LEFT JOIN)
        cursor.execute(query, (month, year, month, year))
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return results

    @staticmethod
    def get_details_by_employee(emp_id, month, year):
        """Lấy chi tiết từng ngày của 1 nhân viên cụ thể"""
        cursor = db.connection.cursor()
        query = """
            SELECT attendanceDaily_id, 
                    TIME_FORMAT(check_in, '%%H:%%i:%%s') as check_in,
                    TIME_FORMAT(check_out, '%%H:%%i:%%s') as check_out,
                    work_date,
            CASE 
                WHEN TIMESTAMPDIFF(HOUR, check_in, check_out) >= 8 THEN 1
                WHEN TIMESTAMPDIFF(HOUR, check_in, check_out) >= 4 THEN 0.5
                ELSE 0
            END as work_value
            FROM attendance_daily
            WHERE employee_id = %s AND MONTH(work_date) = %s AND YEAR(work_date) = %s
        """
        cursor.execute(query, (emp_id, month, year))
        # ... xử lý trả về danh sách dict tương tự như trên ...
        return [dict(zip([d[0] for d in cursor.description], row)) for row in cursor.fetchall()]
    
    @staticmethod
    def check_in(employee_id):
        cursor = db.connection.cursor()
        now = datetime.now()
        today = now.date()

        # Kiểm tra xem hôm nay đã có ca nào đang mở (chưa tan làm) chưa
        cursor.execute("""
            SELECT attendanceDaily_id FROM attendance_daily 
            WHERE employee_id=%s AND work_date=%s AND check_out IS NULL
        """, (employee_id, today))
        
        if cursor.fetchone():
            return None # Đã vào ca rồi

        # Chèn dòng mới (Không còn cột status)
        query = "INSERT INTO attendance_daily (employee_id, check_in, work_date) VALUES (%s, %s, %s)"
        cursor.execute(query, (employee_id, now, today))
        db.connection.commit()
        return now.strftime("%H:%M:%S")

    @staticmethod
    def check_out(employee_id):
        cursor = db.connection.cursor()
        now = datetime.now()
        today = now.date()

        # Tìm ca đang mở của hôm nay
        query_select = """
            SELECT attendanceDaily_id, check_in 
            FROM attendance_daily 
            WHERE employee_id = %s AND work_date = %s AND check_out IS NULL
            LIMIT 1
        """
        cursor.execute(query_select, (employee_id, today))
        record = cursor.fetchone()

        if not record:
            return None

        record_id, check_in_time = record
        
        # Logic tính công: <4h=0, 4-8h=0.5, >=8h=1
        duration = now - check_in_time
        hours = duration.total_seconds() / 3600
        work_value = 1 if hours >= 8 else (0.5 if hours >= 4 else 0)
        
        # Cập nhật (Không còn cột status)
        query_update = """
            UPDATE attendance_daily 
            SET check_out = %s, work_value = %s 
            WHERE attendanceDaily_id = %s
        """
        cursor.execute(query_update, (now, work_value, record_id))
        db.connection.commit()
        cursor.close()
        
        return {"hours": round(hours, 2), "work_value": work_value}