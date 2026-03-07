# TmWork API - Быстрый старт

## 🚀 Начало работы

### Base URL
```
http://127.0.0.1:8000/api/v1/
```

### Swagger UI (интерактивная документация)
```
http://127.0.0.1:8000/api/schema/swagger-ui/
```

---

## 🔑 Аутентификация

### 1. Регистрация
```http
POST /api/v1/auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "first_name": "Имя",
  "last_name": "Фамилия"
}
```

### 2. Вход
```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Ответ:
{
  "access": "eyJ0eXAiOiJKV1QiLCJh...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJh..."
}
```

### 3. Использование токена
```http
GET /api/v1/auth/me/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJh...
```

### 4. Обновление токена
```http
POST /api/v1/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "your_refresh_token"
}
```

---

## 📋 Частые операции

### Получить свой профиль
```http
GET /api/v1/profiles/me/
Authorization: Bearer <token>
```

### Обновить профиль
```http
PATCH /api/v1/profiles/me/
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Опытный веб-разработчик",
  "skills": [1, 2, 3]
}
```

### Создать работу (черновик)
```http
POST /api/v1/jobs/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Разработка сайта",
  "description": "Нужен сайт на Django",
  "budget": 10000.00,
  "category": 1,
  "deadline": "2026-03-15"
}
```

### Опубликовать работу
```http
POST /api/v1/jobs/{id}/publish/
Authorization: Bearer <token>
```

### Получить список работ
```http
GET /api/v1/jobs/
Authorization: Bearer <token>

# Фильтры:
GET /api/v1/jobs/?category=1&status=PUBLISHED
```

### Создать предложение (фрилансер)
```http
POST /api/v1/proposals/
Authorization: Bearer <token>
Content-Type: application/json

{
  "job": 5,
  "message": "Имею большой опыт в Django",
  "price": 8000.00,
  "deadline_days": 14
}
```

### Принять предложение (клиент)
```http
POST /api/v1/proposals/{id}/accept/
Authorization: Bearer <token>
```

### Отправить работу (фрилансер)
```http
POST /api/v1/jobs/{id}/submit-work/
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Работа выполнена",
  "files": [1, 2, 3]
}
```

### Принять работу (клиент)
```http
POST /api/v1/jobs/{id}/approve-work/
Authorization: Bearer <token>
```

### Получить уведомления
```http
GET /api/v1/notifications/
Authorization: Bearer <token>

# Количество непрочитанных:
GET /api/v1/notifications/unread-count/
```

### Отправить сообщение в чат
```http
POST /api/v1/chat/messages/
Authorization: Bearer <token>
Content-Type: application/json

{
  "thread": 1,
  "content": "Здравствуйте!"
}
```

### Получить баланс
```http
GET /api/v1/transactions/summary/
Authorization: Bearer <token>
```

### Купить VIP
```http
POST /api/v1/vip/plans/{id}/buy/
Authorization: Bearer <token>
```

---

## 🛠️ Endpoints по модулям

### Authentication (`/api/v1/auth/`)
- `POST /register/` - Регистрация
- `POST /login/` - Вход
- `POST /logout/` - Выход
- `POST /token/refresh/` - Обновление токена
- `GET /me/` - Текущий пользователь
- `POST /password-reset/request/` - Запрос сброса пароля
- `POST /password-reset/confirm/` - Подтверждение сброса

### Users (`/api/v1/users/`)
- `GET /` - Список пользователей (admin)
- `GET /{id}/` - Детали пользователя (admin)
- `PATCH /{id}/` - Обновить пользователя (admin)
- `DELETE /{id}/` - Удалить пользователя (admin)
- `GET /stats/` - Статистика (admin)
- `POST /toggle-role/` - Переключить роль
- `POST /{id}/adjust-balance/` - Изменить баланс (admin)
- `POST /{id}/block/` - Заблокировать (admin)
- `POST /{id}/unblock/` - Разблокировать (admin)

### Profiles (`/api/v1/profiles/`)
- `GET /me/` - Свой профиль
- `PATCH /me/` - Обновить профиль
- `POST /delete-avatar/` - Удалить аватар
- `GET /` - Список фрилансеров
- `GET /{user_id}/` - Публичный профиль
- `GET /skills/` - Список навыков
- `GET /portfolio/` - Портфолио

### Jobs (`/api/v1/jobs/`)
- `GET /` - Список работ
- `POST /` - Создать работу
- `GET /{id}/` - Детали работы
- `PATCH /{id}/` - Обновить работу
- `DELETE /{id}/` - Удалить работу
- `POST /{id}/publish/` - Опубликовать
- `POST /{id}/cancel/` - Отменить
- `POST /{id}/submit-work/` - Отправить работу
- `POST /{id}/approve-work/` - Принять работу
- `POST /{id}/request-revision/` - Запросить доработку
- `GET /categories/` - Категории

### Proposals (`/api/v1/proposals/`)
- `GET /` - Список предложений
- `POST /` - Создать предложение
- `GET /{id}/` - Детали
- `PATCH /{id}/` - Обновить
- `DELETE /{id}/` - Удалить
- `POST /{id}/accept/` - Принять
- `POST /{id}/reject/` - Отклонить
- `POST /{id}/cancel/` - Отменить

### Escrow (`/api/v1/escrow/`)
- `GET /` - Список эскроу
- `GET /{id}/` - Детали
- `POST /{id}/release/` - Освободить средства
- `POST /{id}/refund/` - Вернуть средства (admin)

### Transactions (`/api/v1/transactions/`)
- `GET /` - История транзакций
- `GET /{id}/` - Детали
- `GET /summary/` - Сводка кошелька
- `POST /deposit-test/` - Тестовое пополнение

### Reviews (`/api/v1/reviews/`)
- `GET /` - Список отзывов
- `POST /` - Создать отзыв
- `PATCH /{id}/` - Обновить
- `DELETE /{id}/` - Удалить

### Notifications (`/api/v1/notifications/`)
- `GET /` - Список уведомлений
- `GET /unread-count/` - Кол-во непрочитанных
- `PATCH /{id}/read/` - Отметить прочитанным
- `POST /mark-all-read/` - Отметить все

### Chat (`/api/v1/chat/`)
- `GET /threads/` - Список чатов
- `POST /threads/` - Создать чат
- `GET /messages/` - Сообщения
- `POST /messages/` - Отправить сообщение
- `POST /messages/mark_as_read/` - Прочитать
- `POST /messages/get_or_create_thread/` - Начать чат
- `POST /admin-broadcast/broadcast/` - Рассылка (admin)

### VIP (`/api/v1/vip/`)
- `GET /plans/` - Список планов
- `POST /plans/{id}/buy/` - Купить VIP
- `POST /plans/{id}/toggle-active/` - Скрыть/показать (admin)
- `GET /settings/` - Настройки
- `PATCH /settings/{id}/` - Обновить настройки (admin)

### Administration (`/api/v1/administration/`)
- `GET /stats/` - Статистика (admin)
- `GET /logs/` - Логи действий (admin)

---

## 📊 Статусы работ

```
DRAFT → PUBLISHED → IN_PROGRESS → SUBMITTED → COMPLETED
                          ↓
                      DISPUTE
                          ↓
                     CANCELLED
```

---

## 🔐 Permissions

| Уровень | Доступ |
|---------|--------|
| **AllowAny** | Без авторизации |
| **IsAuthenticated** | Авторизованные пользователи |
| **IsClient** | Только клиенты |
| **IsFreelancer** | Только фрилансеры |
| **IsJobOwner** | Владелец работы |
| **IsAdminUser** | Администраторы |

---

## 📖 Полная документация

Смотрите [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) для полной документации всех endpoints.

---

**Версия:** 1.0.0  
**Дата:** 2026-02-12
