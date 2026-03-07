
# ===== ІМПОРТИ =====
from flask import Flask, render_template, request, redirect, url_for  # основа Flask
from flask_sqlalchemy import SQLAlchemy  # база даних
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user  # авторизація
from flask_socketio import SocketIO, emit  # WebSocket
from werkzeug.security import generate_password_hash, check_password_hash  # хешування паролю
from datetime import datetime  # час повідомлень
import requests  # запит до твого AI

# ===== НАЛАШТУВАННЯ =====
app = Flask(__name__)  # створення Flask-додатку
app.config["SECRET_KEY"] = "secretkey"  # ключ для сесій
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"  # підключення SQLite

db = SQLAlchemy(app)  # ініціалізація БД
socketio = SocketIO(app)  # підключення WebSocket

login_manager = LoginManager()  # менеджер логіну
login_manager.init_app(app)  # прив'язка до Flask
login_manager.login_view = "login"  # якщо не залогінений — перекидає на /login

AI_URL = "http://127.0.0.1:5001/ask"  # endpoint твого ШІ
online_users = set()  # множина для зберігання онлайн-користувачів

# ===== МОДЕЛЬ КОРИСТУВАЧА =====
class User(UserMixin, db.Model):  # модель таблиці users
    id = db.Column(db.Integer, primary_key=True)  # ID
    username = db.Column(db.String(100), unique=True)  # логін
    first_name = db.Column(db.String(100))  # ім'я
    last_name = db.Column(db.String(100))  # прізвище
    age = db.Column(db.Integer)  # вік
    password = db.Column(db.String(200))  # хеш паролю
    avatar = db.Column(db.String(200), default="/static/avatars/default.png")  # шлях до аватара

# ===== МОДЕЛЬ ПОВІДОМЛЕНЬ =====
class Message(db.Model):  # таблиця повідомлень
    id = db.Column(db.Integer, primary_key=True)  # ID повідомлення
    user_id = db.Column(db.Integer)  # ID користувача
    text = db.Column(db.Text)  # текст
    sender = db.Column(db.String(10))  # user або ai
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # дата і час

# ===== ЗАВАНТАЖЕННЯ КОРИСТУВАЧА =====
@login_manager.user_loader
def load_user(user_id):  # функція для Flask-Login
    return User.query.get(int(user_id))  # повертає користувача по ID

# ===== РЕЄСТРАЦІЯ =====
@app.route("/register", methods=["GET","POST"])  # маршрут /register
def register():
    if request.method == "POST":  # якщо форма відправлена
        hashed = generate_password_hash(request.form["password"])  # хешуємо пароль
        user = User(  # створюємо користувача
            username=request.form["username"],
            password=hashed
        )
        db.session.add(user)  # додаємо в БД
        db.session.commit()  # зберігаємо
        return redirect(url_for("login"))  # перекидаємо на логін
    return render_template("register.html")  # показати сторінку

# ===== ЛОГІН =====
@app.route("/login", methods=["GET","POST"])  # маршрут /login
def login():
    if request.method == "POST":
        user = User.query.filter_by(username=request.form["username"]).first()  # шукаємо юзера
        if user and check_password_hash(user.password, request.form["password"]):  # перевірка паролю
            login_user(user)  # логінимо
            return redirect(url_for("chat"))  # на чат
    return render_template("login.html")

# ===== ЧАТ =====
@app.route("/")  # головна сторінка
@login_required  # тільки для залогінених
def chat():
    messages = Message.query.filter_by(user_id=current_user.id)\
        .order_by(Message.timestamp).all()  # всі повідомлення юзера
    is_online = current_user.id in online_users  # перевірка онлайн
    return render_template("chat.html", messages=messages, online=is_online)

# ===== ПРОФІЛЬ =====
@app.route("/profile", methods=["GET","POST"])
@login_required
def profile():
    if request.method == "POST":

        # оновлення даних профілю
        current_user.username = request.form["username"]
        current_user.first_name = request.form["first_name"]
        current_user.last_name = request.form["last_name"]
        current_user.age = request.form["age"]

        # зміна паролю
        if request.form.get("new_password"):
            current_user.password = generate_password_hash(request.form["new_password"])

        # зміна аватара (користувач вводить тільки назву файлу)
        if request.form.get("avatar_path"):
            filename = request.form["avatar_path"]
            current_user.avatar = "/static/avatars/avatar.png" + filename  # додаємо шлях автоматично

        db.session.commit()  # зберігаємо зміни

    return render_template("profile.html")

# ===== ВИЙТИ =====
@app.route("/logout")
@login_required
def logout():
    logout_user()  # вихід
    return redirect(url_for("login"))

# ===== ВИДАЛЕННЯ АКАУНТУ =====
@app.route("/delete_account")
@login_required
def delete_account():
    db.session.delete(current_user)  # видаляємо з БД
    db.session.commit()
    return redirect(url_for("register"))

# ===== WEBSOCKET =====
@socketio.on("connect")
def connect():
    if current_user.is_authenticated:  # якщо авторизований
        online_users.add(current_user.id)  # додаємо в онлайн

@socketio.on("disconnect")
def disconnect():
    if current_user.is_authenticated:
        online_users.discard(current_user.id)  # прибираємо з онлайн

@socketio.on("send_message")
def handle_message(data):
    user_message = data["message"]  # текст від користувача

    # запис повідомлення користувача
    user_msg = Message(user_id=current_user.id, text=user_message, sender="user")
    db.session.add(user_msg)
    db.session.commit()

    # запит до твого AI
    response = requests.post(AI_URL, json={"message": user_message})
    ai_reply = response.json().get("reply")

    # запис відповіді AI
    ai_msg = Message(user_id=current_user.id, text=ai_reply, sender="ai")
    db.session.add(ai_msg)
    db.session.commit()

    # відправка відповіді назад через WebSocket
    emit("receive_message", {
        "text": ai_reply,
        "time": ai_msg.timestamp.strftime("%H:%M %d-%m-%Y")
    })

# ===== ЗАПУСК =====
if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # створення таблиць якщо нема
    socketio.run(app, debug=True)  # запуск сервера

# ===== ЗБЕРІГАННЯ ІНФУ ПРО ПРОФІЛЬ В БД =====
if request.method == "POST":

    current_user.username = request.form["username"]
    current_user.first_name = request.form["first_name"]
    current_user.last_name = request.form["last_name"]
    current_user.age = request.form["age"]

    # якщо ввели новий пароль
    if request.form["new_password"]:
        current_user.set_password(request.form["new_password"])

    # якщо введено новий аватар
    if request.form["avatar_path"]:
        current_user.avatar = request.form["avatar_path"]

    db.session.commit()
    
# ===== ЗБЕРІГАТИ E-MAIL І РЕГІОН В БД =====
if request.method == "POST":

    current_user.first_name = request.form["first_name"]
    current_user.last_name = request.form["last_name"]
    current_user.age = request.form["age"]
    current_user.email = request.form["email"]
    current_user.region = request.form["region"]

    if request.form["new_password"]:
        current_user.set_password(request.form["new_password"])

    db.session.commit()