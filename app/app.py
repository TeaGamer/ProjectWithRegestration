# Основні імпорти
from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_socketio import SocketIO, emit
from werkzeug.security import generate_password_hash, check_password_hash
import requests

# Створення Flask-додатку
app = Flask(__name__)
app.config["SECRET_KEY"] = "super_secret_key"  # секретний ключ
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"  # база даних

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # WebSocket
login_manager = LoginManager(app)
login_manager.login_view = "login"  # якщо не залогінений → login

AI_URL = "http://localhost:8000/chat"  # твій ШІ API

# ------------------ МОДЕЛЬ КОРИСТУВАЧА ------------------

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))  # збережений hash

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ------------------ РЕЄСТРАЦІЯ ------------------

@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        # хешуємо пароль
        hashed = generate_password_hash(request.form["password"])

        user = User(
            username=request.form["username"],
            password=hashed
        )

        db.session.add(user)
        db.session.commit()

        return redirect(url_for("login"))

    return render_template("register.html")

# ------------------ ЛОГІН ------------------

@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        user = User.query.filter_by(
            username=request.form["username"]
        ).first()

        # перевірка пароля
        if user and check_password_hash(user.password, request.form["password"]):
            remember = True if request.form.get("remember") else False
            login_user(user, remember=remember)
            return redirect(url_for("chat"))

    return render_template("login.html")

# ------------------ ВИХІД ------------------

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# ------------------ ЧАТ СТОРІНКА ------------------

@app.route("/")
@login_required
def chat():
    return render_template("chat.html", username=current_user.username)

# ------------------ WEBSOCKET ------------------

@socketio.on("send_message")
def handle_message(data):
    user_message = data["message"]

    # запит до твого ШІ
    response = requests.post(AI_URL, json={"message": user_message})
    ai_reply = response.json().get("reply")

    # відправка назад клієнту
    emit("receive_message", {
        "user": user_message,
        "ai": ai_reply
    })

# ------------------ ЗАПУСК ------------------

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # створення БД якщо нема
    socketio.run(app, debug=True)




    #давай дрочити разом на сайт, прошу