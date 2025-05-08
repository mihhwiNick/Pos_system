from flask_mysqldb import MySQL
from flask import Flask

app = Flask(__name__)
app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "root"
app.config["MYSQL_PASSWORD"] = "123456"
app.config["MYSQL_DB"] = "pos_system"

db = MySQL(app)