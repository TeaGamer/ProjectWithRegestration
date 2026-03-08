
# ===== ІМПОРТИ =====
from flask import Flask, render_template, request, redirect, url_for, jsonify  # додав jsonify
from flask_sqlalchemy import SQLAlchemy  # база даних
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user  # авторизація
from flask_socketio import SocketIO, emit  # WebSocket
from werkzeug.security import generate_password_hash, check_password_hash  # хешування паролю
from datetime import datetime  # час повідомлень
import requests  # запит до твого AI

# ===== НАЛАШТУВАННЯ =====
# Тут ми налаштовуємо Flask, SQLAlchemy, Flask-Login та SocketIO. Ми також визначаємо константу AI_URL для запитів до твого AI та створюємо множину online_users для відстеження онлайн-користувачів.
app = Flask(__name__)
app.config["SECRET_KEY"] = "secretkey"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"

db = SQLAlchemy(app)
socketio = SocketIO(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

AI_URL = "http://127.0.0.1:5001/ask"
online_users = set()

# ===== МОДЕЛЬ КОРИСТУВАЧА =====
# Ця модель зберігає інформацію про користувачів, включаючи їх унікальний username, ім'я, прізвище, вік, email, регіон, хешований пароль та аватар. Вона також успадковує UserMixin для інтеграції з Flask-Login.
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    age = db.Column(db.Integer)
    email = db.Column(db.String(120))
    region = db.Column(db.String(120))
    password = db.Column(db.String(200))
    avatar = db.Column(db.String(200), default="/static/avatars/avatar.png")

# ===== МОДЕЛЬ ПОВІДОМЛЕНЬ =====
# Ця модель зберігає повідомлення, які надсилають користувачі та відповіді AI. Кожне повідомлення має текст, відправника (користувач або AI), час відправлення та ідентифікатор користувача, щоб пов'язати його з конкретним користувачем.
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    text = db.Column(db.Text)
    sender = db.Column(db.String(10))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ===== НОВИЙ МАРШРУТ ОНОВЛЕННЯ ПРОФІЛЮ =====
# Цей маршрут обробляє POST-запит для оновлення профілю користувача. Він вимагає, щоб користувач ввів свій старий пароль для підтвердження особи, а також дозволяє оновити різні поля профілю, включаючи Username (з перевіркою на унікальність) та пароль (якщо введено новий).
@app.route("/update_profile", methods=["POST"])
@login_required
def update_profile():
    data = request.json
    old_password = data.get("old_password")

    # 1. Перевірка старого пароля (ОБОВ'ЯЗКОВО)
    # Для безпеки ми вимагаємо, щоб користувач підтвердив свою особу, ввівши старий пароль. Ми використовуємо check_password_hash для порівняння введеного пароля з тим, що збережено в базі даних. Якщо пароль неправильний, ми повертаємо помилку і не дозволяємо оновити профіль.
    if not check_password_hash(current_user.password, old_password):
        return jsonify({"status": "error", "message": "Неправильний старий пароль!"}), 400

    # 2. Оновлення Username (перевірка на унікальність)
    # Якщо користувач хоче змінити свій Username, ми перевіряємо, чи не зайнятий він іншим користувачем. Якщо все в порядку, оновлюємо його в базі даних.
    new_username = data.get("username")
    if new_username and new_username != current_user.username:
        user_exists = User.query.filter_by(username=new_username).first()
        if user_exists:
            return jsonify({"status": "error", "message": "Цей Username вже зайнятий!"}), 400
        current_user.username = new_username

    # 3. Оновлення інших полів
    # Ми оновлюємо лише ті поля, які були передані в запиті. Якщо поле не було передано, воно залишиться без змін.
    if data.get("first_name"): current_user.first_name = data["first_name"]
    if data.get("last_name"): current_user.last_name = data["last_name"]
    if data.get("email"): current_user.email = data["email"]
    if data.get("region"): current_user.region = data["region"]
    
    # Оновлення пароля (якщо введено новий)
    # Якщо користувач хоче змінити пароль, він повинен ввести новий пароль у полі "new_password". Ми хешуємо його і зберігаємо в базі даних.
    if data.get("new_password"):
        current_user.password = generate_password_hash(data["new_password"])

    db.session.commit()
    return jsonify({"status": "success", "message": "Профіль оновлено успішно!"})

# ===== РЕЄСТРАЦІЯ =====
# Тут ми хешуємо пароль за допомогою generate_password_hash і зберігаємо його в базі даних. Це важливо для безпеки, щоб не зберігати паролі у відкритому вигляді.
@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        hashed = generate_password_hash(request.form["password"])
        user = User(
            username=request.form["username"],
            password=hashed
        )
        db.session.add(user)
        db.session.commit()
        return redirect(url_for("login"))
    return render_template("register.html")

# ===== ЛОГІН =====
# Тут ми перевіряємо, чи існує користувач з таким username і чи збігається пароль (за допомогою check_password_hash). Якщо все вірно, то викликаємо login_user(user) для авторизації користувача і перенаправляємо його на сторінку чату.
@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        user = User.query.filter_by(username=request.form["username"]).first()
        if user and check_password_hash(user.password, request.form["password"]):
            login_user(user)
            return redirect(url_for("chat"))
    return render_template("login.html")

# ===== ЧАТ =====
# В цьому маршруті ми також передаємо інформацію про те, чи є користувач онлайн, щоб відобразити це в інтерфейсі
@app.route("/")
@login_required
def chat():
    messages = Message.query.filter_by(user_id=current_user.id)\
        .order_by(Message.timestamp).all()
    is_online = current_user.id in online_users
    return render_template("chat.html", messages=messages, online=is_online)

# ===== ВИЙТИ =====
# Цей маршрут просто викликає функцію logout_user() і перенаправляє користувача на сторінку логіну
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# ===== WEBSOCKET =====
# Тут ми обробляємо підключення та відключення користувачів, а також отримання повідомлень від клієнта і відповідь від AI
@socketio.on("connect")
def connect():
    if current_user.is_authenticated:
        online_users.add(current_user.id)

@socketio.on("disconnect")
def disconnect():
    if current_user.is_authenticated:
        online_users.discard(current_user.id)

@socketio.on("send_message")
def handle_message(data):
    user_message = data["message"]
    user_msg = Message(user_id=current_user.id, text=user_message, sender="user")
    db.session.add(user_msg)
    db.session.commit()

    response = requests.post(AI_URL, json={"message": user_message})
    ai_reply = response.json().get("reply")

    ai_msg = Message(user_id=current_user.id, text=ai_reply, sender="ai")
    db.session.add(ai_msg)
    db.session.commit()

    emit("receive_message", {
        "text": ai_reply,
        "time": ai_msg.timestamp.strftime("%H:%M %d-%m-%Y")
    })

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)