
# ===== ІМПОРТИ =====
from flask import Flask, render_template, request, redirect, url_for  # основа Flask
from flask_sqlalchemy import SQLAlchemy  # база даних
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user  # авторизація
from flask_socketio import SocketIO, emit  # WebSocket
from werkzeug.security import generate_password_hash, check_password_hash  # хешування паролю
from datetime import datetime  # час повідомлень
import requests  # запит до твого AI

# ===== НАЛАШТУВАННЯ =====
# створення Flask-додатку, налаштування бази даних, WebSocket та авторизації
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
# ця модель описує структуру таблиці users в базі даних. Вона містить поля для зберігання інформації про користувача, такої як ім'я, прізвище, вік, логін, пароль та аватар. Клас User успадковує UserMixin для інтеграції з Flask-Login та db.Model для роботи з SQLAlchemy.
class User(UserMixin, db.Model):  # модель таблиці users
    id = db.Column(db.Integer, primary_key=True)  # ID
    username = db.Column(db.String(100), unique=True)  # логін
    first_name = db.Column(db.String(100))  # ім'я
    last_name = db.Column(db.String(100))  # прізвище
    age = db.Column(db.Integer)  # вік
    password = db.Column(db.String(200))  # хеш паролю
    avatar = db.Column(db.String(200), default="/static/avatars/default.png")  # шлях до аватара

# ===== МОДЕЛЬ ПОВІДОМЛЕНЬ =====
# ця модель описує структуру таблиці messages в базі даних. Вона містить поля для зберігання інформації про повідомлення, такої як ID, ID користувача, текст повідомлення, відправник (користувач або AI) та час відправлення.
class Message(db.Model):  # таблиця повідомлень
    id = db.Column(db.Integer, primary_key=True)  # ID повідомлення
    user_id = db.Column(db.Integer)  # ID користувача
    text = db.Column(db.Text)  # текст
    sender = db.Column(db.String(10))  # user або ai
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # дата і час

# ===== ЗАВАНТАЖЕННЯ КОРИСТУВАЧА =====
# ця функція потрібна для Flask-Login, щоб завантажувати користувача по його ID. Вона викликається кожного разу, коли Flask-Login потребує інформацію про поточного користувача (наприклад, для перевірки, чи він залогінений). Функція отримує ID користувача, шукає його в базі даних і повертає об'єкт User.
@login_manager.user_loader
def load_user(user_id):  # функція для Flask-Login
    return User.query.get(int(user_id))  # повертає користувача по ID

# ===== РЕЄСТРАЦІЯ =====
# ця функція обробляє реєстрацію нового користувача. Вона приймає POST-запит з формою, хешує пароль, створює нового користувача в базі даних і перенаправляє на сторінку логіну. Якщо це GET-запит, відображає сторінку реєстрації.
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
# ця функція обробляє логін користувача. Вона приймає POST-запит з формою, шукає користувача в базі даних за логіном, перевіряє пароль і, якщо все вірно, виконує вхід і перенаправляє на сторінку чату. Якщо дані неправильні або це GET-запит, відображає сторінку логіну.
@app.route("/login", methods=["GET","POST"])  # маршрут /login
def login():
    if request.method == "POST":
        user = User.query.filter_by(username=request.form["username"]).first()  # шукаємо юзера
        if user and check_password_hash(user.password, request.form["password"]):  # перевірка паролю
            login_user(user)  # логінимо
            return redirect(url_for("chat"))  # на чат
    return render_template("login.html")

# ===== ЧАТ =====
# ця функція відображає головну сторінку з чатом. Вона доступна тільки для залогінених користувачів. На сторінці показуються всі повідомлення користувача, а також індикатор онлайн-статусу.
@app.route("/")  # головна сторінка
@login_required  # тільки для залогінених
def chat():
    messages = Message.query.filter_by(user_id=current_user.id)\
        .order_by(Message.timestamp).all()  # всі повідомлення юзера
    is_online = current_user.id in online_users  # перевірка онлайн
    return render_template("chat.html", messages=messages, online=is_online)

# ===== ПРОФІЛЬ =====
# ця функція дозволяє користувачу переглядати та редагувати свій профіль. Вона доступна тільки для залогінених користувачів. Користувач може змінити своє ім'я, прізвище, вік, пароль та аватар. Зміни зберігаються в базі даних.
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
            current_user.avatar = "/static/avatars/" + filename # додаємо шлях автоматично

        db.session.commit()  # зберігаємо зміни

    return render_template("profile.html")

# ===== ВИЙТИ =====
# ця функція виконує вихід користувача з системи і перенаправляє його на сторінку логіну. Вона доступна тільки для залогінених користувачів.
@app.route("/logout")
@login_required
def logout():
    logout_user()  # вихід
    return redirect(url_for("login"))

# ===== ВИДАЛЕННЯ АКАУНТУ =====
# ця функція видаляє поточного користувача з бази даних і перенаправляє на сторінку реєстрації. Вона доступна тільки для залогінених користувачів.
@app.route("/delete_account")
@login_required
def delete_account():
    db.session.delete(current_user)  # видаляємо з БД
    db.session.commit()
    return redirect(url_for("register"))

# ===== WEBSOCKET =====
# ці функції обробляють підключення, відключення та отримання повідомлень через WebSocket. Коли користувач підключається, його ID додається до множини онлайн-користувачів. При відключенні — видаляється. Коли приходить повідомлення, воно зберігається в базі даних, відправляється запит до твого AI, відповідь також зберігається і відправляється назад клієнту.
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
# при запуску створюємо таблиці (якщо їх нема) і запускаємо сервер
if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # створення таблиць якщо нема
    socketio.run(app, debug=True)  # запуск сервера

# ===== МОДЕЛЬ КОРИСТУВАЧА =====
# ця модель описує структуру таблиці users в базі даних. Вона містить поля для зберігання інформації про користувача, такої як ім'я, прізвище, вік, логін, пароль та аватар. Клас User успадковує UserMixin для інтеграції з Flask-Login та db.Model для роботи з SQLAlchemy.
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    age = db.Column(db.Integer)
    email = db.Column(db.String(120))
    region = db.Column(db.String(120))
    password = db.Column(db.String(200))
    avatar = db.Column(db.String(200), 
    default="/static/avatars/avatar.png")