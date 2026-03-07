# TmWork — Фриланс-платформа для Туркменистана

TmWork — это современная платформа для взаимодействия заказчиков и исполнителей. Проект построен на **API-first архитектуре** с полностью разделенными backend (Django REST API) и frontend (React + Vite).

---

## 🚀 Быстрый старт

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements/base.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**API:** [http://127.0.0.1:8000/api/v1/](http://127.0.0.1:8000/api/v1/)  
**Swagger:** [http://127.0.0.1:8000/api/schema/swagger-ui/](http://127.0.0.1:8000/api/schema/swagger-ui/)

---

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

**Сайт:** [http://localhost:3000](http://localhost:3000)

---

## 📂 Структура проекта

```
TmWork/
├── backend/           # Django 5.2 REST API
├── frontend/          # React 18 приложение
├── nginx/             # Конфигурация веб-сервера (для production)
├── docs/              # Документация проекта
└── scripts/           # Скрипты запуска и автоматизации
```

---

## 📚 Документация

### Для разработчиков

- **[backend.md](./docs/backend.md)** — Архитектура backend, структура приложений, Service Layer
- **[frontend.md](./docs/frontend.md)** — Структура фронтенда, дизайн-система, API интеграция
- **[backend/README.md](./backend/README.md)** — Навигация по backend документации
- **[backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)** — Полная справка по API (~150+ endpoints)
- **[backend/API_QUICKSTART.md](./backend/API_QUICKSTART.md)** — Быстрый старт с примерами

### Для деплоя

- **[deployment.md](./docs/deployment.md)** — Публикация в интернет (Localtunnel, ngrok)
- **[links.md](./docs/links.md)** — Полезные ссылки проекта

### Для AI помощников

- **[GEMINI.md](./GEMINI.md)** — Правила разработки и принципы архитектуры

---

## 🛠 Технологии

| Компонент | Технологии |
|-----------|-----------|
| **Backend** | Python 3.11, Django 5.2, DRF, JWT, PostgreSQL/SQLite |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios |
| **DevTools** | drf-spectacular (Swagger), ESLint, PostCSS |

---

## 👥 Командная разработка

При работе в команде:

1. ⛔ **Никогда** не пушьте `.env` в репозиторий
2. 📝 Все изменения моделей должны сопровождаться миграциями
3. 🎨 Соблюдайте стиль кода (Black для Python, Prettier для JS)
4. 🌿 Основная ветка — `main`, все фичи в `feature/название`

---

## 📄 Лицензия

Proprietary (Собственность TmWork)
