from flask import Flask
from flask_cors import CORS
from models.webcam import Webcam
from database import db

app = Flask(__name__)
CORS(app)

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '123456'
app.config['MYSQL_DB'] = 'pos_system'

db.init_app(app)

if __name__ == "__main__":
    with app.app_context():
        webcam = Webcam()
        webcam.capture_face_encoding_from_webcam()
