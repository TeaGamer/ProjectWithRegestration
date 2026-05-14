# 🔒 Безпека токенів - Рекомендації для бекенду

## ⚠️ Критичні вразливості, виправлені на фронтенді:

### 1. **localStorage зберігання токена ❌**
- ✅ **ВИДАЛЕНО**: `localStorage.setItem("token", data.token)`
- **Причина**: XSS атак можуть украсти токен будь-якого скрипту на сторінці

### 2. **Встановлення cookie з фронтенду без флагів ❌**
- ✅ **ВИДАЛЕНО**: `document.cookie = "token=..."`
- **Причина**: Без HttpOnly флага JS-код може украсти токен

### 3. **Authorization header з localStorage ❌**
- ✅ **ВИДАЛЕНО**: `"Authorization": "Bearer " + localStorage.getItem("token")`
- **Причина**: XSS вразливість - токен в localStorage доступний JS

---

## ✅ Що потрібно реалізувати на бекенді:

### При логіні (endpoint `/api/login`):

Встановити **HttpOnly secure cookie** з правильними флагами:

```python
# Python (FastAPI/Flask)
response.set_cookie(
    key="token",
    value=jwt_token,
    httponly=True,        # 🔒 JS не може прочитати
    secure=True,          # 🔒 Тільки HTTPS
    samesite="strict",    # 🔒 Захист від CSRF
    max_age=86400         # 1 день
)
```

```javascript
// Node.js (Express)
res.cookie("token", jwtToken, {
  httpOnly: true,        // 🔒 JS не може прочитати
  secure: true,          // 🔒 Тільки HTTPS (production)
  sameSite: "strict",    // 🔒 Захист від CSRF
  maxAge: 86400 * 1000   // 1 день (в мс)
});
```

```java
// Java (Spring)
http.csrf().disable()
    .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
    .and()
    .authorizeRequests().antMatchers("/api/login").permitAll()
    .and()
    .addFilter(new JwtAuthenticationFilter(authenticationManager(), 
        jwtTokenProvider, 86400));
```

### Важливі ende-points:

#### ✅ `/api/login` - встановити HttpOnly cookie
- Браузер автоматично надсилатиме цю cookie при всіх запитах
- Frontend НЕ бачить значення токена (захист від XSS)

#### ✅ `/api/verify-token` - перевірити валідність токена
- Middleware (frontend) викликає цей endpoint при навігації
- Токен передається в `Authorization: Bearer <token>` header
- **ВАЖЛИВО**: Фронтенд може передавати токен в header тільки якщо він з'явився з бекенду (cookie)

#### ✅ Всі інші endpoints - автоматично прочитувати cookie
- Браузер надсилає HttpOnly cookie автоматично
- Backend перевіряє наявність та валідність cookie
- Frontend використовує `credentials: "include"` в fetch:

```javascript
fetch("/api/profile", {
  method: "PUT",
  credentials: "include",  // ✅ Надсилаємо cookie автоматично
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});
```

---

## 🛡️ Архітектура безпеки (після виправлень):

```
┌─────────────────────┐
│   Frontend (React)  │
├─────────────────────┤
│ ✅ Без localStorage │
│ ✅ Без document.   │
│    cookie = ...    │
│ ✅ Без Bearer      │
│    header з JS     │
└──────────┬──────────┘
           │ credentials: "include"
           ▼
┌─────────────────────┐
│  HTTP Request       │
├─────────────────────┤
│ ✅ HttpOnly cookie  │
│ ✅ автоматичні     │
│    від браузера     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Backend (Node.js) │
├─────────────────────┤
│ ✅ Set-Cookie      │
│    httpOnly=true   │
│ ✅ Перевірка токена│
└─────────────────────┘
```

---

## 📋 Checklist для бекенду:

- [ ] `/api/login` встановлює HttpOnly cookie
- [ ] Cookie має флаги: `httpOnly`, `secure`, `samesite`
- [ ] `/api/verify-token` перевіряє cookie або Bearer token
- [ ] CORS налаштовано: `Access-Control-Allow-Credentials: true`
- [ ] Токен має короткий TTL (15-30 хв)
- [ ] Реалізовано refresh token механізм
- [ ] HTTPS включено в production

---

## 🔍 Тестування безпеки:

```javascript
// ✅ Вірно: браузер надсилає cookie автоматично
fetch("/api/profile", {
  credentials: "include",
  method: "PUT"
});

// ❌ НЕПРАВИЛЬНО: передача токена з localStorage
fetch("/api/profile", {
  headers: {
    "Authorization": "Bearer " + localStorage.getItem("token")
  }
});
```

---

## 🚨 Залишилися вразливості:

1. **XSS в middleware** - враховується, додана базова валідація
2. **CSRF** - потребує перевірки на бекенді
3. **Rate limiting** - потребує реалізації на бекенді
