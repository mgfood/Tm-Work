# TmWork Backend

**Django 5.2+ REST API** для фриланс-платформы Туркменистана

---

## 📚 Документация

### API Документация

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** — Полная справочная документация всех REST API endpoints (~150+ эндпоинтов)
- **[API_QUICKSTART.md](./API_QUICKSTART.md)** — Быстрый старт с примерами частых операций

### Техническое руководство

- **[../BACKEND_GUIDE.md](../BACKEND_GUIDE.md)** — Архитектура, структура приложений, принципы разработки

### Интерактивная документация

- **Swagger UI:** [http://127.0.0.1:8000/api/schema/swagger-ui/](http://127.0.0.1:8000/api/schema/swagger-ui/)
- **ReDoc:** [http://127.0.0.1:8000/api/schema/redoc/](http://127.0.0.1:8000/api/schema/redoc/)

---

## 🚀 Быстрый запуск

### 1. Создание виртуального окружения и установка зависимостей

<details>
<summary><b>Linux / macOS</b></summary>

```bash
cd backend
uv venv
source .venv/bin/activate
uv sync
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
cd backend
uv venv
.\.venv\Scripts\activate
uv sync
```
</details>

### 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_ENGINE=sqlite3  # или postgresql
```

### 4. Применение миграций

```bash
python manage.py migrate
```

### 5. Создание суперпользователя

```bash
python manage.py createsuperuser
```

### 6. Запуск сервера

```bash
python manage.py runserver
```

**API будет доступен по адресу:** [http://127.0.0.1:8000/api/v1/](http://127.0.0.1:8000/api/v1/)

---

## 📁 Структура приложений

```
apps/
├── users/              # Аутентификация, пользователи, роли
├── profiles/           # Публичные профили, навыки, портфолио
├── jobs/               # Заказы, категории
├── proposals/          # Отклики фрилансеров
├── escrow/             # Безопасные сделки
├── transactions/       # История финансовых операций
├── reviews/            # Отзывы
├── notifications/      # Уведомления
├── chat/               # Система сообщений
├── vip/                # VIP подписки
└── administration/     # Администрирование
```

---

## 🔑 Ключевые модули

### Authentication (`/api/v1/auth/`)
- JWT аутентификация (Access + Refresh токены)
- Регистрация, вход, выход
- Сброс пароля

### Jobs (`/api/v1/jobs/`)
- Полный CRUD для заказов
- Статусы: DRAFT → PUBLISHED → IN_PROGRESS → SUBMITTED → COMPLETED
- Upload файлов

### Proposals (`/api/v1/proposals/`)
- Отклики фрилансеров
- Принятие/отклонение предложений

### Escrow (`/api/v1/escrow/`)
- Блокировка и освобождение средств
- Защита финансовых операций

---

## 🛠 Технологии

- **Python 3.11+**
- **Django 5.2+**
- **Django REST Framework**
- **SimpleJWT** — JWT аутентификация
- **drf-spectacular** — OpenAPI схема
- **PostgreSQL** (production) / **SQLite** (development)

---

## 📖 Полезные ссылки

- [Главный README](../README.md)
- [Frontend документация](../FRONTEND_GUIDE.md)
- [Deployment guide](../DEPLOYMENT.md)

---

**Версия:** 1.0.0  
**Последнее обновление:** 2026-02-12
