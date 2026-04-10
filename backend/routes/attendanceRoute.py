from flask import Blueprint, jsonify, request
from models.attendanceModel import Attendance

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/summary', methods=['GET'])
def get_summary():
    # Lấy tháng/năm từ query string (VD: /summary?month=3&year=2026)
    month = request.args.get('month', 3)
    year = request.args.get('year', 2026)
    
    data = Attendance.get_summary(month, year)
    return jsonify(data)

@attendance_bp.route('/details/<int:emp_id>', methods=['GET'])
def get_details(emp_id):
    month = request.args.get('month', 3)
    year = request.args.get('year', 2026)
    
    data = Attendance.get_details_by_employee(emp_id, month, year)
    return jsonify(data)

@attendance_bp.route('/check-in', methods=['POST'])
def api_check_in():
    emp_id = request.json.get('employee_id')
    time_str = Attendance.check_in(emp_id)
    if time_str:
        return jsonify({"message": "Check-in thành công", "check_in_time": time_str}), 200
    return jsonify({"message": "Bạn đã Check-in hôm nay rồi!"}), 400

@attendance_bp.route('/check-out', methods=['POST'])
def api_check_out():
    emp_id = request.json.get('employee_id')
    result = Attendance.check_out(emp_id)
    if result:
        return jsonify(result), 200
    return jsonify({"message": "Không tìm thấy lượt Check-in hợp lệ cho hôm nay!"}), 400