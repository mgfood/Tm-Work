# 🚀 Руководство по публикации сайта в интернет

Данное руководство поможет вам сделать ваш локальный проект TmWork доступным в интернете для тестирования и демонстрации.

---

## 📋 Общая информация

Для публикации проекта вам понадобится:
- **4 терминала** (2 для серверов, 2 для туннелей)
- **Один из инструментов туннелирования**: Localtunnel или ngrok
- **Активное интернет-соединение**

> ⚠️ **Важно:** Перед запуском backend всегда активируйте виртуальное окружение!

```powershell
cd f:\TmWork\backend
.\.venv\Scripts\activate
```

---

## 🎯 Выбор метода публикации

### Метод 1: Localtunnel (Рекомендуется для начинающих)

**Преимущества:**
- ✅ Простая установка
- ✅ Не требует регистрации
- ✅ Быстрый запуск

**Недостатки:**
- ❌ Менее стабилен
- ❌ URL меняется при перезапуске
- ❌ Требует IP verification при первом входе

---

### Метод 2: ngrok (Более стабильный)

**Преимущества:**
- ✅ Стабильное соединение
- ✅ Удобный веб-интерфейс с логами
- ✅ Возможность использования custom доменов (платно)

**Недостатки:**
- ❌ Требует регистрации
- ❌ Бесплатный тариф ограничен одним активным туннелем
- ❌ URL меняется на бесплатном тарифе

---

## 📝 Метод 1: Публикация через Localtunnel

### Установка Localtunnel

Если еще не установлен:
```powershell
npm install -g localtunnel
```

### Пошаговая инструкция

#### 1️⃣ Терминал 1: Запуск Backend
```powershell
cd f:\TmWork\backend
# Активация виртуального окружения
.\.venv\Scripts\activate
# Запуск Django сервера
python manage.py runserver
```

---

#### 2️⃣ Терминал 2: Публикация Backend
```powershell
lt --port 8000
```

**Результат:** Вы получите ссылку вида:
```
https://smart-cats-jump.loca.lt
```

> 📋 **СКОПИРУЙТЕ** эту ссылку! Она понадобится для настройки фронтенда.

---

#### 3️⃣ Настройка Frontend

Откройте файл `f:\TmWork\frontend\.env` и вставьте полученную ссылку:

```env
VITE_API_URL=https://smart-cats-jump.loca.lt
```

---

#### 4️⃣ Терминал 3: Запуск Frontend
```powershell
cd f:\TmWork\frontend
npm run dev
```

---

#### 5️⃣ Терминал 4: Публикация Frontend
```powershell
lt --port 3000
```

**Результат:** Вы получите финальную ссылку:
```
https://cool-site.loca.lt
```

> 🌐 **ЭТУ ССЫЛКУ** отправляйте друзьям для доступа к сайту!

---

### ⚠️ IP Verification (Localtunnel)

При первом открытии ссылки Localtunnel попросит ввести "Endpoint Password". Это ваш внешний IP адрес.

**Как узнать свой IP:**
1. Откройте [whatsmyip.org](https://www.whatsmyip.org/) или [myip.com](https://www.myip.com/)
2. Скопируйте показанный IP (например: `123.45.67.89`)
3. Вставьте на странице Localtunnel

---

## 📝 Метод 2: Публикация через ngrok

### Установка ngrok

1. Скачайте ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Зарегистрируйтесь на сайте (бесплатно)
3. Установите authtoken:
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Пошаговая инструкция

#### 1️⃣ Терминал 1: Запуск Backend
```powershell
cd f:\TmWork\backend
# Активация виртуального окружения
.\.venv\Scripts\activate
# Запуск Django сервера
python manage.py runserver
```

---

#### 2️⃣ Терминал 2: Публикация Backend через ngrok
```powershell
ngrok http 8000
```

**Результат:** В консоли появится информация:
```
Forwarding    https://a1b2-c3d4.ngrok-free.app -> http://localhost:8000
```

> 📋 **СКОПИРУЙТЕ** ссылку `https://a1b2-c3d4.ngrok-free.app`

---

#### 3️⃣ Настройка Frontend

Откройте файл `f:\TmWork\frontend\.env` и вставьте ссылку:

```env
VITE_API_URL=https://a1b2-c3d4.ngrok-free.app
```

---

#### 4️⃣ Терминал 3: Запуск Frontend
```powershell
cd f:\TmWork\frontend
npm run dev
```

---

#### 5️⃣ Терминал 4: Публикация Frontend через ngrok

> ⚠️ **Внимание:** На бесплатном тарифе ngrok можно держать только **один активный туннель**. Вам понадобится второй аккаунт или комбинация с Localtunnel.

**Вариант А: Второй аккаунт ngrok**
```powershell
ngrok http 3000
```

**Вариант Б: Localtunnel для фронтенда**
```powershell
lt --port 3000
```

> 🌐 **Финальную ссылку** отправляйте друзьям!

---

### 💡 Особенности ngrok

**Страница "Visit Site":**
При первом переходе по ссылке ngrok может показать предупреждение. Нажмите кнопку **"Visit Site"** для продолжения.

**Веб-интерфейс:**
Откройте [http://127.0.0.1:4040](http://127.0.0.1:4040) для просмотра логов запросов в реальном времени.

---

## 🔧 Устранение неполадок

### Проблема: "Disallowed Host" в Django

**Решение:** В файле `backend/config/settings/base.py` установлено:
```python
ALLOWED_HOSTS = ['*']
```

Это разрешает доступ с любых доменов. В production используйте конкретные домены.

---

### Проблема: CORS ошибки

**Решение:** Убедитесь, что в `backend/config/settings/base.py` настроен `django-cors-headers`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Только для разработки!
```

---

### Проблема: Frontend не подключается к Backend

**Проверьте:**
1. ✅ Backend запущен и доступен
2. ✅ URL в `.env` указан правильно (с `https://`)
3. ✅ Нет лишних пробелов в `.env`
4. ✅ Frontend перезапущен после изменения `.env`

**Fallback:**
Если оставить `VITE_API_URL` пустым, фронтенд автоматически использует `http://127.0.0.1:8000`.

---

### Проблема: Ссылка перестала работать

**Причины:**
- ❌ Закрыт терминал с туннелем
- ❌ Закрыт терминал с сервером (backend/frontend)
- ❌ Проблемы с интернет-соединением

**Решение:**
1. Перезапустите туннель заново
2. Получите новую ссылку
3. Обновите `.env` (если изменился backend URL)
4. Перезапустите frontend

---

## 📊 Сравнительная таблица

| Характеристика | Localtunnel | ngrok |
|----------------|-------------|-------|
| Установка | `npm install -g localtunnel` | Скачать + Auth token |
| Регистрация | Не требуется | Требуется |
| Бесплатные туннели | Неограниченно | 1 активный |
| Стабильность | Средняя | Высокая |
| Веб-интерфейс | Нет | Есть (localhost:4040) |
| Custom домены | Нет | Платно |
| URL при перезапуске | Меняется | Меняется (на free) |

---

## ✅ Чеклист перед публикацией

- [ ] Виртуальное окружение активировано
- [ ] Backend запущен (`python manage.py runserver`)
- [ ] Backend опубликован (localtunnel/ngrok)
- [ ] `.env` обновлен с правильным `VITE_API_URL`
- [ ] Frontend запущен (`npm run dev`)
- [ ] Frontend опубликован (localtunnel/ngrok)
- [ ] Ссылка протестирована в браузере
- [ ] IP verification пройдена (для Localtunnel)

---

## 🎯 Типичный workflow

```powershell
# Terminal 1
cd f:\TmWork\backend
.\.venv\Scripts\activate
python manage.py runserver

# Terminal 2
lt --port 8000
# Копируем ссылку → обновляем .env

# Terminal 3
cd f:\TmWork\frontend
npm run dev

# Terminal 4
lt --port 3000
# Копируем ссылку → отправляем друзьям
```

---

## 📚 Дополнительные ресурсы

- **Localtunnel документация:** [https://theboroer.github.io/localtunnel-www/](https://theboroer.github.io/localtunnel-www/)
- **ngrok документация:** [https://ngrok.com/docs](https://ngrok.com/docs)
- **Проблемы с CORS:** См. `BACKEND_GUIDE.md`

---

**Приятного тестирования! 🚀**
