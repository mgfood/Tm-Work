# TmWork — Фриланс-платформа для Туркменистана

TmWork — это современная экосистема для взаимодействия заказчиков и исполнителей. Проект построен на архитектуре разделенного бэкенда (Django REST Framework) и фронтенда (React + Vite).

## 🚀 Быстрый старт (Разработка)

Для запуска всего проекта на локальном компьютере выполните следующие шаги:

### 1. Подготовка Бэкенда
```powershell
# Перейдите в папку бэкенда
cd backend

# Создайте виртуальное окружение
python -m venv .venv

# Активируйте его
.\.venv\Scripts\activate

# Установите зависимости
pip install -r requirements/base.txt

# Настройте переменные окружения (создайте .env на основе .env.example)
cp .env.example .env

# Примените миграции (по умолчанию используется SQLite)
python manage.py migrate

# Создайте администратора
python manage.py createsuperuser

# Запустите сервер
python manage.py runserver
```

### 2. Подготовка Фронтенда
```powershell
# В новом окне терминала перейдите в папку фронтенда
cd frontend

# Установите зависимости
npm install

# Запустите сервер разработки
npm run dev
```

После этого:
- Фронтенд будет доступен по адресу: [http://localhost:3000](http://localhost:3000)
- API (Swagger) будет доступен по адресу: [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/)

---

## 📂 Структура проекта

- `/backend` — Django 5.2 приложение. Логика API, база данных, безопасность.
- `/frontend` — React 18 приложение. Интерфейс, дизайн-система, клиентское состояние.
- `BACKEND_GUIDE.md` — Подробная техническая документация бэкенда.
- `FRONTEND_GUIDE.md` — Подробная техническая документация фронтенда.

---

## 🛠 Технологии

- **Backend**: Python 3.11, Django, DRF, JWT, SQLite (dev) / PostgreSQL (prod).
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Tools**: drf-spectacular (Swagger), ESLint, PostCSS.

---

## 👥 Командная разработка

При работе в команде:
1. **Никогда** не пушьте файл `.env` в репозиторий.
2. Все изменения в моделях должны сопровождаться новыми миграциями.
3. Соблюдайте стиль кода (Black для Python, Prettier для JS).
4. Основная ветка — `main`. Все фичи разрабатываются в отдельных ветках `feature/название`.

---

## 📄 Лицензия
Proprietary (Собственность TmWork)
