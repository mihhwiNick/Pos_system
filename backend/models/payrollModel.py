from database import db

class Payroll:
    @staticmethod
    def get_all_by_period(month, year):
        cursor = db.connection.cursor()
        m, y = int(month), int(year)
        
        # 🚀 HÀM GET: Join với salary_periods để lấy standard_workdays, month, year
        query = """
            SELECT 
                e.employee_id,
                e.full_name,
                IFNULL(p.base_salary_at_time, e.base_salary) as base_salary_snapshot,
                p.actual_base_salary as actual_base_snapshot,
                p.total_commission as total_comm_snapshot,
                p.payroll_id,
                p.status as payroll_status,
                
                -- Lấy từ bảng salary_periods kkk
                sp.standard_workdays, 
                sp.period_id,
                
                -- Lấy công thực tế (tên cột là total_work_days theo ảnh 1)
                IFNULL(p.total_work_days, 
                    IFNULL((SELECT SUM(work_value) FROM attendance_daily 
                    WHERE employee_id = e.employee_id AND MONTH(work_date) = %s AND YEAR(work_date) = %s), 0)
                ) as actual_workdays,
                
                -- Tính hoa hồng realtime
                (SELECT 
                    SUM(IFNULL(i.total_amount * 0.005, 0) + 
                        IFNULL((SELECT SUM(id.quantity * prod.price * prod.extra_commission_rate) 
                                FROM invoice_details id 
                                JOIN products prod ON id.product_id = prod.product_id 
                                WHERE id.invoice_id = i.invoice_id), 0)
                    )
                FROM invoices i 
                WHERE i.employee_id = e.employee_id AND MONTH(i.created_at) = %s AND YEAR(i.created_at) = %s) as total_comm_realtime
            FROM employees e
            -- 🚀 FIX LỖI 1054: Dùng đúng tên bảng salary_periods kkk
            CROSS JOIN salary_periods sp ON sp.month = %s AND sp.year = %s
            LEFT JOIN payroll p ON e.employee_id = p.employee_id AND p.period_id = sp.period_id
            WHERE e.status = 1
        """
        cursor.execute(query, (m, y, m, y, m, y))
        columns = [desc[0] for desc in cursor.description]
        raw_data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        processed_data = []
        for item in raw_data:
            base_contract = float(item['base_salary_snapshot'] or 0)
            std_days = float(item['standard_workdays'] or 26) 
            act_days = float(item['actual_workdays'] or 0)
            
            if item['payroll_status'] == 1:
                base_actual = float(item['actual_base_snapshot'] or 0)
                comm = float(item['total_comm_snapshot'] or 0)
            else:
                base_actual = (base_contract / std_days) * act_days if std_days > 0 else 0
                comm = float(item['total_comm_realtime'] or 0)
            
            processed_data.append({
                "employee_id": item['employee_id'],
                "full_name": item['full_name'],
                "base_salary": base_contract,
                "base_actual": round(base_actual),
                "standard_workdays": std_days,
                "actual_workdays": act_days,
                "total_commission": round(comm),
                "final_salary": round(base_actual + comm),
                "status": item['payroll_status'] or 0,
                "payroll_id": item['payroll_id'],
                "period_id": item['period_id']
            })
        cursor.close()
        return processed_data
            
    @staticmethod
    def publish(data):
        # 🚀 HÀM PUBLISH: Chỉ insert/update vào bảng payroll, không đụng tới salary_periods kkk
        cursor = db.connection.cursor()
        try:
            cursor.execute("SELECT payroll_id FROM payroll WHERE employee_id=%s AND period_id=%s", 
                            (data['employee_id'], data['period_id']))
            exists = cursor.fetchone()

            if exists:
                query = """
                    UPDATE payroll SET 
                        base_salary_at_time = %s, 
                        actual_base_salary = %s,
                        total_commission = %s, 
                        total_work_days = %s, 
                        final_salary = %s, 
                        status = 1 
                    WHERE payroll_id = %s
                """
                cursor.execute(query, (data['base_salary_snapshot'], data['actual_base_salary'], 
                                        data['total_commission'], data['total_workdays'], 
                                        data['final_salary'], exists[0]))
            else:
                query = """
                    INSERT INTO payroll (employee_id, period_id, base_salary_at_time, 
                                        actual_base_salary, total_commission, 
                                        total_work_days, final_salary, status) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
                """
                cursor.execute(query, (data['employee_id'], data['period_id'], 
                                        data['base_salary_snapshot'], data['actual_base_salary'], 
                                        data['total_commission'], data['total_workdays'], 
                                        data['final_salary']))
            db.connection.commit()
            return True
        except Exception as e:
            print(f"❌ LỖI SQL PUBLISH: {str(e)}")
            db.connection.rollback()
            return False
        finally:
            cursor.close()