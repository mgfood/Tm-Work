# TmWork API Documentation

> **Версия API:** v1  
> **Base URL:** `http://127.0.0.1:8000/api/v1/`  
> **Аутентификация:** JWT (JSON Web Token)

---

## 📚 Оглавление

1. [Аутентификация](#1-аутентификация-auth)
2. [Пользователи (Users)](#2-пользователи-users)
3. [Профили (Profiles)](#3-профили-profiles)
4. [Работы (Jobs)](#4-работы-jobs)
5. [Предложения (Proposals)](#5-предложения-proposals)
6. [Эскроу (Escrow)](#6-эскроу-escrow)
7. [Транзакции (Transactions)](#7-транзакции-transactions)
8. [Отзывы (Reviews)](#8-отзывы-reviews)
9. [Уведомления (Notifications)](#9-уведомления-notifications)
10. [Чат (Chat)](#10-чат-chat)
11. [VIP Подписки](#11-vip-подписки)
12. [Администрирование](#12-администрирование)

---

## Общие правила

### Формат запросов

- **Content-Type:** `application/json`
- **Authorization Header:** `Authorization: Bearer <access_token>`

### Стандартные коды ответов

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 204 | Успешно, без тела ответа |
| 400 | Ошибка валидации |
| 401 | Неавторизован |
| 403 | Доступ запрещен |
| 404 | Ресурс не найден |
| 500 | Серверная ошибка |

---

## 1. Аутентификация (Auth)

### 1.1 Регистрация

**POST** `/api/v1/auth/register/`

Регистрация нового пользователя.

**Permissions:** `AllowAny`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "password_confirm": "securePassword123",
  "first_name": "Иван",
  "last_name": "Петров"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Иван",
    "last_name": "Петров"
  },
  "tokens": {
    "refresh": "refresh_token_here",
    "access": "access_token_here"
  }
}
```

---

### 1.2 Вход

**POST** `/api/v1/auth/login/`

Вход в систему.

**Permissions:** `AllowAny`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "refresh": "refresh_token_here",
  "access": "access_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Иван",
    "roles": ["CLIENT"]
  }
}
```

---

### 1.3 Выход

**POST** `/api/v1/auth/logout/`

Выход из системы (blacklist refresh token).

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "refresh": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "detail": "Successfully logged out"
}
```

---

### 1.4 Обновление токена

**POST** `/api/v1/auth/token/refresh/`

Обновление access token через refresh token.

**Permissions:** `AllowAny`

**Request Body:**
```json
{
  "refresh": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "access": "new_access_token_here"
}
```

---

### 1.5 Текущий пользователь

**GET** `/api/v1/auth/me/`

Получить информацию о текущем авторизованном пользователе.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Петров",
  "roles": ["CLIENT", "FREELANCER"],
  "balance": 1500.00,
  "is_vip": true
}
```

---

### 1.6 Запрос сброса пароля

**POST** `/api/v1/auth/password-reset/request/`

Запросить код для сброса пароля.

**Permissions:** `AllowAny`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "detail": "Password reset code sent to email"
}
```

---

### 1.7 Подтверждение сброса пароля

**POST** `/api/v1/auth/password-reset/confirm/`

Подтвердить сброс пароля с кодом.

**Permissions:** `AllowAny`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "newPassword123",
  "password_confirm": "newPassword123"
}
```

**Response (200):**
```json
{
  "detail": "Password successfully reset"
}
```

---

## 2. Пользователи (Users)

> **Base URL:** `/api/v1/users/`  
> **Permissions:** Только для администраторов

### 2.1 Список пользователей

**GET** `/api/v1/users/`

Получить список всех пользователей (пагинация).

**Permissions:** `IsAdminUser`

**Query Parameters:**
- `page` (int): Номер страницы
- `page_size` (int): Кол-во элементов на странице

**Response (200):**
```json
{
  "count": 100,
  "next": "http://127.0.0.1:8000/api/v1/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Иван",
      "roles": ["CLIENT"],
      "balance": 500.00
    }
  ]
}
```

---

### 2.2 Детали пользователя

**GET** `/api/v1/users/{id}/`

Получить детальную информацию о пользователе.

**Permissions:** `IsAdminUser`

---

### 2.3 Обновление пользователя

**PATCH** `/api/v1/users/{id}/`

Обновить данные пользователя.

**Permissions:** `IsAdminUser`

**Request Body:**
```json
{
  "first_name": "Новое имя",
  "last_name": "Новая фамилия",
  "email": "newemail@example.com"
}
```

---

### 2.4 Удаление пользователя

**DELETE** `/api/v1/users/{id}/`

Удалить пользователя (soft delete).

**Permissions:** `IsAdminUser`

**Response (204):** No Content

---

### 2.5 Статистика пользователей

**GET** `/api/v1/users/stats/`

Получить статистику по пользователям.

**Permissions:** `IsAdminUser`

**Response (200):**
```json
{
  "total_users": 1500,
  "clients": 800,
  "freelancers": 700,
  "vip_users": 150,
  "blocked_users": 20
}
```

---

### 2.6 Переключить роль

**POST** `/api/v1/users/toggle-role/`

Переключить роль текущего пользователя (CLIENT ↔ FREELANCER).

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "role": "FREELANCER"
}
```

**Response (200):**
```json
{
  "status": "role toggled",
  "current_roles": ["CLIENT", "FREELANCER"]
}
```

---

### 2.7 Детали пользователя (расширенные)

**GET** `/api/v1/users/{id}/details/`

Получить расширенную информацию о пользователе (для админов).

**Permissions:** `IsAdminUser`

---

### 2.8 Корректировка баланса

**POST** `/api/v1/users/{id}/adjust-balance/`

Изменить баланс пользователя.

**Permissions:** `IsAdminUser` (FinancialAdmin)

**Request Body:**
```json
{
  "amount": 500.00,
  "description": "Бонус от администрации"
}
```

**Response (200):**
```json
{
  "new_balance": 1500.00
}
```

---

### 2.9 Временная блокировка

**POST** `/api/v1/users/{id}/temp-block/`

Временно заблокировать пользователя.

**Permissions:** `IsAdminUser` (Moderator+)

**Request Body:**
```json
{
  "days": 7,
  "reason": "Нарушение правил"
}
```

---

### 2.10 Блокировка

**POST** `/api/v1/users/{id}/block/`

Заблокировать пользователя навсегда.

**Permissions:** `IsAdminUser`

---

### 2.11 Разблокировка

**POST** `/api/v1/users/{id}/unblock/`

Разблокировать пользователя.

**Permissions:** `IsAdminUser`

---

### 2.12 Установить пароль

**POST** `/api/v1/users/{id}/set-password/`

Установить новый пароль для пользователя (admin only).

**Permissions:** `IsAdminUser`

**Request Body:**
```json
{
  "password": "newPassword123"
}
```

---

### 2.13 Переключить верификацию

**POST** `/api/v1/users/{id}/toggle-verify/`

Верифицировать/отменить верификацию пользователя.

**Permissions:** `IsAdminUser`

---

### 2.14 Переключить VIP статус

**POST** `/api/v1/users/{id}/toggle-vip/`

Включить/выключить VIP статус пользователя.

**Permissions:** `IsAdminUser`

---

### 2.15 Назначить роль

**POST** `/api/v1/users/{id}/assign-role/`

Назначить роль пользователю.

**Permissions:** `IsAdminUser`

**Request Body:**
```json
{
  "role": "CLIENT"
}
```

---

### 2.16 Удалить роль

**POST** `/api/v1/users/{id}/remove-role/`

Удалить роль у пользователя.

**Permissions:** `IsAdminUser`

**Request Body:**
```json
{
  "role": "FREELANCER"
}
```

---

### 2.17 Назначить группу

**POST** `/api/v1/users/{id}/assign-group/`

Назначить admin группу (superuser only).

**Permissions:** `IsSuperuser`

---

### 2.18 Удалить группу

**POST** `/api/v1/users/{id}/remove-group/`

Удалить admin группу (superuser only).

**Permissions:** `IsSuperuser`

---

## 3. Профили (Profiles)

> **Base URL:** `/api/v1/profiles/`

### 3.1 Мой профиль

**GET** `/api/v1/profiles/me/`

Получить свой профиль.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "user_id": 1,
  "bio": "Опытный веб-разработчик",
  "avatar": "/media/avatars/user1.jpg",
  "skills": [1, 2, 3],
  "freelancer_rating": 4.8,
  "client_rating": 4.5,
  "is_vip": true
}
```

---

**PATCH** `/api/v1/profiles/me/`

Обновить свой профиль.

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "bio": "Новое описание профиля",
  "avatar": "base64_encoded_image"
}
```

---

### 3.2 Удалить аватар

**POST** `/api/v1/profiles/delete-avatar/`

Удалить аватар профиля.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "status": "avatar deleted"
}
```

---

### 3.3 Список профилей

**GET** `/api/v1/profiles/`

Получить список публичных профилей фрилансеров.

**Permissions:** `AllowAny`

**Response (200):**
```json
{
  "count": 50,
  "results": [
    {
      "user_id": 2,
      "bio": "Frontend разработчик",
      "freelancer_rating": 4.9,
      "is_vip": true
    }
  ]
}
```

---

### 3.4 Детали профиля

**GET** `/api/v1/profiles/{user_id}/`

Получить публичный профиль пользователя.

**Permissions:** `AllowAny`

---

### 3.5 Навыки (Skills)

#### Список навыков

**GET** `/api/v1/profiles/skills/`

Получить список всех навыков.

**Permissions:** `AllowAny`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Python"
  },
  {
    "id": 2,
    "name": "Django"
  }
]
```

---

#### Создать навык

**POST** `/api/v1/profiles/skills/`

Создать новый навык.

**Permissions:** `IsAdminUser`

---

#### Обновить навык

**PATCH** `/api/v1/profiles/skills/{id}/`

Обновить навык.

**Permissions:** `IsAdminUser`

---

#### Удалить навык

**DELETE** `/api/v1/profiles/skills/{id}/`

Удалить навык.

**Permissions:** `IsAdminUser`

---

### 3.6 Портфолио

#### Список элементов портфолио

**GET** `/api/v1/profiles/portfolio/`

Получить элементы портфолио.

**Permissions:** `AllowAny`

**Query Parameters:**
- `user_id` (int): ID пользователя

---

#### Создать элемент портфолио

**POST** `/api/v1/profiles/portfolio/`

Создать новый элемент портфолио.

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "title": "Мой проект",
  "description": "Описание проекта",
  "image": "base64_encoded_image",
  "url": "https://example.com"
}
```

---

#### Обновить портфолио

**PATCH** `/api/v1/profiles/portfolio/{id}/`

Обновить элемент портфолио.

**Permissions:** `IsAuthenticated` + `IsProfileOwner`

---

#### Удалить портфолио

**DELETE** `/api/v1/profiles/portfolio/{id}/`

Удалить элемент портфолио.

**Permissions:** `IsAuthenticated` + `IsProfileOwner`

---

## 4. Работы (Jobs)

> **Base URL:** `/api/v1/jobs/`

### 4.1 Список работ

**GET** `/api/v1/jobs/`

Получить список опубликованных работ.

**Permissions:** `IsAuthenticatedOrReadOnly`

**Query Parameters:**
- `client` (int): Фильтр по ID клиента
- `category` (int): Фильтр по категории
- `status` (str): Фильтр по статусу

**Response (200):**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "title": "Разработка веб-сайта",
      "description": "Нужен сайт на Django",
      "budget": 5000.00,
      "status": "PUBLISHED",
      "client": 1,
      "category": 2,
      "deadline": "2026-03-01"
    }
  ]
}
```

---

### 4.2 Создать работу

**POST** `/api/v1/jobs/`

Создать новую работу (черновик).

**Permissions:** `IsAuthenticated` + `IsClient`

**Request Body:**
```json
{
  "title": "Разработка API",
  "description": "REST API на Django",
  "budget": 10000.00,
  "category": 3,
  "deadline": "2026-04-15"
}
```

**Response (201):**
```json
{
  "id": 5,
  "title": "Разработка API",
  "status": "DRAFT",
  "client": 1
}
```

---

### 4.3 Детали работы

**GET** `/api/v1/jobs/{id}/`

Получить детальную информацию о работе.

**Permissions:** `IsAuthenticatedOrReadOnly`

---

### 4.4 Обновить работу

**PATCH** `/api/v1/jobs/{id}/`

Обновить работу (только черновик).

**Permissions:** `IsAuthenticated` + `IsJobOwner`

---

### 4.5 Удалить работу

**DELETE** `/api/v1/jobs/{id}/`

Удалить работу (только черновик или опубликованную без предложений).

**Permissions:** `IsAuthenticated` + `IsJobOwner`

---

### 4.6 Опубликовать работу

**POST** `/api/v1/jobs/{id}/publish/`

Опубликовать черновик работы.

**Permissions:** `IsAuthenticated` + `IsJobOwner`

**Response (200):**
```json
{
  "status": "job published"
}
```

---

### 4.7 Отменить работу

**POST** `/api/v1/jobs/{id}/cancel/`

Отменить работу.

**Permissions:** `IsAuthenticated` + `IsJobOwner`

---

### 4.8 Загрузить файл

**POST** `/api/v1/jobs/{id}/upload-file/`

Загрузить файл к работе.

**Permissions:** `IsAuthenticated`

**Request Body (multipart/form-data):**
```
file: [binary file]
```

**Response (201):**
```json
{
  "id": 10,
  "file": "/media/job_files/document.pdf",
  "uploaded_by": 1
}
```

---

### 4.9 Удалить файл

**DELETE** `/api/v1/jobs/{id}/delete-file/{file_id}/`

Удалить файл работы.

**Permissions:** `IsAuthenticated` + `IsJobOwner`

---

### 4.10 Отправить работу

**POST** `/api/v1/jobs/{id}/submit-work/`

Фрилансер отправляет выполненную работу.

**Permissions:** `IsAuthenticated` + `IsFreelancer`

**Request Body:**
```json
{
  "message": "Работа выполнена",
  "files": [1, 2, 3]
}
```

---

### 4.11 Принять работу

**POST** `/api/v1/jobs/{id}/approve-work/`

Клиент принимает работу.

**Permissions:** `IsAuthenticated` + `IsJobOwner`

**Response (200):**
```json
{
  "status": "work approved, escrow released"
}
```

---

### 4.12 Запросить доработку

**POST** `/api/v1/jobs/{id}/request-revision/`

Клиент запрашивает доработку.

**Permissions:** `IsAuthenticated` + `IsJobOwner`

**Request Body:**
```json
{
  "message": "Нужно исправить баги"
}
```

---

### 4.13 Принудительно изменить статус

**POST** `/api/v1/jobs/{id}/force-status/`

Админ принудительно меняет статус работы.

**Permissions:** `IsAdminUser`

**Request Body:**
```json
{
  "status": "COMPLETED",
  "reason": "Разрешение спора"
}
```

---

### 4.14 Категории работ

#### Список категорий

**GET** `/api/v1/jobs/categories/`

Получить список категорий.

**Permissions:** `AllowAny`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Веб-разработка",
    "icon": "💻"
  },
  {
    "id": 2,
    "name": "Дизайн",
    "icon": "🎨"
  }
]
```

---

#### Создать категорию

**POST** `/api/v1/jobs/categories/`

Создать новую категорию.

**Permissions:** `IsAdminUser`

---

#### Обновить категорию

**PATCH** `/api/v1/jobs/categories/{id}/`

Обновить категорию.

**Permissions:** `IsAdminUser`

---

#### Удалить категорию

**DELETE** `/api/v1/jobs/categories/{id}/`

Удалить категорию.

**Permissions:** `IsAdminUser`

---

## 5. Предложения (Proposals)

> **Base URL:** `/api/v1/proposals/`

### 5.1 Список предложений

**GET** `/api/v1/proposals/`

Получить список предложений.

**Permissions:** `IsAuthenticated`

**Query Parameters:**
- `type` (str): `sent` или `received`

**Response (200):**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "job": 5,
      "freelancer": 2,
      "message": "Готов выполнить работу",
      "price": 8000.00,
      "deadline_days": 14,
      "status": "PENDING"
    }
  ]
}
```

---

### 5.2 Создать предложение

**POST** `/api/v1/proposals/`

Фрилансер создает предложение.

**Permissions:** `IsAuthenticated` + `IsFreelancer`

**Rate Limit:** 10 запросов в час

**Request Body:**
```json
{
  "job": 5,
  "message": "Имею опыт в Django",
  "price": 8000.00,
  "deadline_days": 14
}
```

---

### 5.3 Детали предложения

**GET** `/api/v1/proposals/{id}/`

Получить детали предложения.

**Permissions:** `IsAuthenticated`

---

### 5.4 Обновить предложение

**PATCH** `/api/v1/proposals/{id}/`

Обновить предложение (только PENDING).

**Permissions:** `IsAuthenticated`

---

### 5.5 Удалить предложение

**DELETE** `/api/v1/proposals/{id}/`

Удалить предложение.

**Permissions:** `IsAuthenticated`

---

### 5.6 Принять предложение

**POST** `/api/v1/proposals/{id}/accept/`

Клиент принимает предложение.

**Permissions:** `IsAuthenticated` + `IsJobOwner`

**Response (200):**
```json
{
  "status": "proposal accepted, job is now in progress"
}
```

---

### 5.7 Отклонить предложение

**POST** `/api/v1/proposals/{id}/reject/`

Клиент отклоняет предложение.

**Permissions:** `IsAuthenticated` + `IsJobOwner`

---

### 5.8 Отменить предложение

**POST** `/api/v1/proposals/{id}/cancel/`

Фрилансер отменяет свое предложение.

**Permissions:** `IsAuthenticated` + `IsFreelancer`

---

## 6. Эскроу (Escrow)

> **Base URL:** `/api/v1/escrow/`

### 6.1 Список эскроу

**GET** `/api/v1/escrow/`

Получить список эскроу (только свои).

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "job": 5,
      "payer": 1,
      "payee": 2,
      "amount": 8000.00,
      "status": "FUNDS_LOCKED"
    }
  ]
}
```

---

### 6.2 Детали эскроу

**GET** `/api/v1/escrow/{id}/`

Получить детали эскроу.

**Permissions:** `IsAuthenticated`

---

### 6.3 Освободить средства

**POST** `/api/v1/escrow/{id}/release/`

Освободить средства фрилансеру (клиент или админ).

**Permissions:** `IsAuthenticated` (client or admin)

**Response (200):**
```json
{
  "status": "Funds released successfully."
}
```

---

### 6.4 Возврат средств

**POST** `/api/v1/escrow/{id}/refund/`

Вернуть средства клиенту (только админ).

**Permissions:** `IsAdminUser`

**Request Body:**
```json
{
  "reason": "Спор разрешен в пользу клиента"
}
```

---

## 7. Транзакции (Transactions)

> **Base URL:** `/api/v1/transactions/`

### 7.1 Список транзакций

**GET** `/api/v1/transactions/`

Получить историю транзакций.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "user": 1,
      "type": "DEPOSIT",
      "amount": 5000.00,
      "description": "Пополнение баланса",
      "created_at": "2026-02-10T10:00:00Z"
    }
  ]
}
```

---

### 7.2 Детали транзакции

**GET** `/api/v1/transactions/{id}/`

Получить детали транзакции.

**Permissions:** `IsAuthenticated`

---

### 7.3 Сводка кошелька

**GET** `/api/v1/transactions/summary/`

Получить сводку по кошельку (баланс + последние транзакции).

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "balance": 15000.00,
  "recent_transactions": [
    {
      "id": 10,
      "type": "ESCROW_RELEASE",
      "amount": 8000.00
    }
  ]
}
```

---

### 7.4 Тестовое пополнение

**POST** `/api/v1/transactions/deposit-test/`

Тестовое пополнение баланса (только в dev режиме).

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "amount": 1000.00
}
```

**Response (200):**
```json
{
  "detail": "Balance successfully topped up (Test mode)"
}
```

---

## 8. Отзывы (Reviews)

> **Base URL:** `/api/v1/reviews/`

### 8.1 Список отзывов

**GET** `/api/v1/reviews/`

Получить список отзывов.

**Permissions:** `IsAuthenticated`

**Query Parameters:**
- `receiver_id` (int): Фильтр по получателю

**Response (200):**
```json
{
  "count": 20,
  "results": [
    {
      "id": 1,
      "job": 5,
      "reviewer": 1,
      "receiver": 2,
      "rating": 5,
      "comment": "Отличная работа!",
      "created_at": "2026-02-11T12:00:00Z"
    }
  ]
}
```

---

### 8.2 Создать отзыв

**POST** `/api/v1/reviews/`

Создать новый отзыв.

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "job": 5,
  "receiver": 2,
  "rating": 5,
  "comment": "Очень доволен результатом"
}
```

---

### 8.3 Обновить отзыв

**PATCH** `/api/v1/reviews/{id}/`

Обновить отзыв.

**Permissions:** `IsAuthenticated`

---

### 8.4 Удалить отзыв

**DELETE** `/api/v1/reviews/{id}/`

Удалить отзыв.

**Permissions:** `IsAuthenticated`

---

## 9. Уведомления (Notifications)

> **Base URL:** `/api/v1/notifications/`

### 9.1 Список уведомлений

**GET** `/api/v1/notifications/`

Получить список уведомлений.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "title": "Новое предложение",
      "message": "Получено новое предложение на вашу работу",
      "is_read": false,
      "link": "/jobs/5",
      "created_at": "2026-02-12T08:00:00Z"
    }
  ]
}
```

---

### 9.2 Количество непрочитанных

**GET** `/api/v1/notifications/unread-count/`

Получить кол-во непрочитанных уведомлений.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "count": 5
}
```

---

### 9.3 Отметить как прочитанное

**PATCH** `/api/v1/notifications/{id}/read/`

Отметить уведомление как прочитанное.

**Permissions:** `IsAuthenticated`

---

### 9.4 Отметить все как прочитанные

**POST** `/api/v1/notifications/mark-all-read/`

Отметить все уведомления как прочитанные.

**Permissions:** `IsAuthenticated`

---

## 10. Чат (Chat)

> **Base URL:** `/api/v1/chat/`

### 10.1 Треды (Threads)

#### Список тредов

**GET** `/api/v1/chat/threads/`

Получить список чатов.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "type": "PERSONAL",
      "participants": [1, 2],
      "last_message": "Привет",
      "updated_at": "2026-02-12T14:00:00Z"
    }
  ]
}
```

---

#### Создать тред

**POST** `/api/v1/chat/threads/`

Создать новый чат.

**Permissions:** `IsAuthenticated`

---

#### Детали треда

**GET** `/api/v1/chat/threads/{id}/`

Получить детали чата.

**Permissions:** `IsAuthenticated`

---

#### Фильтр по типу

**GET** `/api/v1/chat/threads/by_type/`

Получить чаты по типу.

**Permissions:** `IsAuthenticated`

**Query Parameters:**
- `type` (str): `PERSONAL`, `JOB`, `SUPPORT`, `SYSTEM`

---

### 10.2 Сообщения (Messages)

#### Список сообщений

**GET** `/api/v1/chat/messages/`

Получить список сообщений.

**Permissions:** `IsAuthenticated`

**Query Parameters:**
- `thread` (int): ID треда

**Response (200):**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "thread": 1,
      "sender": 1,
      "content": "Привет!",
      "is_read": true,
      "created_at": "2026-02-12T10:00:00Z"
    }
  ]
}
```

---

#### Отправить сообщение

**POST** `/api/v1/chat/messages/`

Отправить новое сообщение.

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "thread": 1,
  "content": "Здравствуйте!"
}
```

---

#### Отметить как прочитанное

**POST** `/api/v1/chat/messages/mark_as_read/`

Отметить сообщения треда как прочитанные.

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "thread": 1
}
```

---

#### Получить или создать тред

**POST** `/api/v1/chat/messages/get_or_create_thread/`

Инициировать чат с пользователем.

**Permissions:** `IsAuthenticated`

**Request Body:**
```json
{
  "receiver_id": 2,
  "job_id": 5,
  "type": "JOB"
}
```

**Response (200):**
```json
{
  "id": 3,
  "type": "JOB",
  "participants": [1, 2],
  "job": 5
}
```

---

### 10.3 Рассылка (Admin Broadcast)

**POST** `/api/v1/chat/admin-broadcast/broadcast/`

Админ отправляет массовую рассылку.

**Permissions:** `IsAdminUser`

**Request Body:**
```json
{
  "message": "Важное объявление",
  "target_type": "ALL",
  "user_ids": [],
  "emails": []
}
```

**Target Types:**
- `ALL` - всем пользователям
- `CLIENTS` - только клиентам
- `FREELANCERS` - только фрилансерам
- `VIP` - только VIP пользователям
- `EMAILS` - конкретным email адресам
- `SELECTED` - конкретным user_ids

**Response (200):**
```json
{
  "status": "Broadcast sent to 500 users"
}
```

---

## 11. VIP Подписки

> **Base URL:** `/api/v1/vip/`

### 11.1 Планы (Plans)

#### Список планов

**GET** `/api/v1/vip/plans/`

Получить список VIP планов.

**Permissions:** `IsAuthenticated`

**Query Parameters:**
- `all` (bool): Показать все планы (только для админов)

**Response (200):**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "VIP Bronze",
      "months": 1,
      "price": 500.00,
      "discount": 10.00,
      "is_active": true
    }
  ]
}
```

---

#### Создать план

**POST** `/api/v1/vip/plans/`

Создать новый VIP план.

**Permissions:** `IsAdminUser`

---

#### Обновить план

**PATCH** `/api/v1/vip/plans/{id}/`

Обновить VIP план.

**Permissions:** `IsAdminUser`

---

#### Удалить план

**DELETE** `/api/v1/vip/plans/{id}/`

Удалить VIP план.

**Permissions:** `IsAdminUser`

> **Примечание:** Нельзя удалить план с активными подписками.

---

#### Переключить активность

**POST** `/api/v1/vip/plans/{id}/toggle-active/`

Скрыть/показать план.

**Permissions:** `IsAdminUser`

**Response (200):**
```json
{
  "status": "success",
  "is_active": false
}
```

---

#### Купить план

**POST** `/api/v1/vip/plans/{id}/buy/`

Купить VIP подписку.

**Permissions:** `IsAuthenticated`

**Response (200):**
```json
{
  "status": "VIP activated",
  "end_date": "2026-03-12T12:00:00Z",
  "new_balance": 9500.00
}
```

---

### 11.2 Настройки (Settings)

#### Получить настройки

**GET** `/api/v1/vip/settings/`

Получить глобальные настройки (комиссии и т.д.).

**Permissions:** `AllowAny`

**Response (200):**
```json
{
  "id": 1,
  "commission_percentage": 10.00,
  "vip_commission_percentage": 5.00,
  "min_withdrawal": 100.00
}
```

---

#### Обновить настройки

**PATCH** `/api/v1/vip/settings/{id}/`

Обновить глобальные настройки.

**Permissions:** `IsAdminUser`

---

## 12. Администрирование

> **Base URL:** `/api/v1/administration/`

### 12.1 Статистика

**GET** `/api/v1/administration/stats/`

Получить расширенную статистику для дашборда.

**Permissions:** `IsAdminUser`

**Response (200):**
```json
{
  "trends": {
    "registrations": [
      {"date": "2026-02-01", "count": 15},
      {"date": "2026-02-02", "count": 20}
    ],
    "volume": [
      {"date": "2026-02-01", "amount": 50000.00}
    ]
  },
  "completion_rate": 85.5,
  "summary": {
    "total_users": 1500,
    "active_jobs": 45,
    "total_escrow": 250000.00
  }
}
```

---

### 12.2 Логи

**GET** `/api/v1/administration/logs/`

Получить журнал действий администраторов.

**Permissions:** `IsAdminUser`

**Response (200):**
```json
[
  {
    "id": 1,
    "admin": "admin@example.com",
    "action_type": "USER_BLOCK",
    "target_info": "User ID: 50",
    "comment": "Нарушение правил",
    "timestamp": "2026-02-12T10:00:00Z"
  }
]
```

---

## 📝 Примечания

### Пагинация

Все endpoints с списками поддерживают пагинацию:

```
GET /api/v1/jobs/?page=2&page_size=20
```

**Response:**
```json
{
  "count": 100,
  "next": "http://127.0.0.1:8000/api/v1/jobs/?page=3",
  "previous": "http://127.0.0.1:8000/api/v1/jobs/?page=1",
  "results": [...]
}
```

---

### Swagger UI

Интерактивная документация доступна по адресу:

**http://127.0.0.1:8000/api/schema/swagger-ui/**

---

### Rate Limiting

Некоторые endpoints имеют ограничения:

- **Proposals Create:** 10 запросов/час на пользователя

---

### Permissions

| Тип | Описание |
|-----|----------|
| `AllowAny` | Доступно всем |
| `IsAuthenticated` | Только авторизованным |
| `IsAdminUser` | Только администраторам |
| `IsClient` | Только клиентам |
| `IsFreelancer` | Только фрилансерам |
| `IsJobOwner` | Только владельцу работы |
| `IsProfileOwner` | Только владельцу профиля |

---

## 🔧 Troubleshooting

### Частые ошибки

**401 Unauthorized**
- Проверьте наличие токена в заголовке `Authorization: Bearer <token>`
- Токен истек - используйте `/api/v1/auth/token/refresh/`

**403 Forbidden**
- У вас нет прав для выполнения этого действия
- Проверьте свою роль (CLIENT/FREELANCER/ADMIN)

**400 Bad Request**
- Ошибка валидации данных
- Проверьте формат запроса и обязательные поля

---

## 📚 Дополнительные ресурсы

- **Swagger UI:** http://127.0.0.1:8000/api/schema/swagger-ui/
- **ReDoc:** http://127.0.0.1:8000/api/schema/redoc/
- **JSON Schema:** http://127.0.0.1:8000/api/schema/

---

**Последнее обновление:** 2026-02-12  
**Версия:** 1.0.0
