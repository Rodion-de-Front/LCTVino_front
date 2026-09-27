# Vinora

Прогрессивное веб-приложение для любителей вина: лента, каталог, рейтинги,
сканер, профили и персональный погреб.

Фронт не использует MSW или in-memory моки. Все `/api/*` запросы идут в Nuxt API,
а API хранит состояние в Postgres.

```bash
npm install
docker compose up db backend
npm run dev        # http://localhost:5173, proxy /api -> http://127.0.0.1:3000
npm run build      # typecheck + production bundle + service worker
npm run preview
```

Полный запуск контейнерами:

```bash
docker compose up --build
```

Сервисы: Postgres `:5432`, Nuxt API `:3000`, web `:5173`.

Демо-доступ: `anna@vinora.ru` / `vinora2026`. Тот же пароль подходит к сид-аккаунтам
`dmitry@vinora.ru`, `elena@vinora.ru`, `igor@vinora.ru`, `maria@vinora.ru`,
`pavel@vinora.ru`, `sofia@vinora.ru`.

При первом старте пустой базы backend создаёт схему и начальные записи: вина,
пользователей, посты, отзывы, погреб и связи подписок. Повторный старт контейнера
существующие данные не перезаписывает.

## Стек

Vue 3 · Vite · Vue Router · Pinia · Tailwind CSS · Workbox PWA · Axios · Nuxt 3
API · Postgres.

## API

| Метод | Путь |
| --- | --- |
| POST | `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` |
| GET | `/api/auth/me` |
| GET | `/api/feed` |
| GET POST | `/api/posts` |
| POST | `/api/posts/:id/like`, `/api/posts/:id/save`, `/api/posts/:id/comments` |
| DELETE | `/api/posts/:id/comments/:commentId` |
| GET | `/api/wines`, `/api/wines/facets`, `/api/wines/:id`, `/api/wines/:id/reviews` |
| POST | `/api/wines/:id/reviews` |
| POST | `/api/scan/label`, `/api/scan/qr` |
| GET PATCH | `/api/users/me` |
| GET POST | `/api/users/me/wines` |
| PATCH DELETE | `/api/users/me/wines/:entryId` |
| GET | `/api/users/:id`, `/api/users/:id/posts`, `/api/users/:id/reviews` |
| POST DELETE | `/api/users/:id/follow` |

Сканер больше не возвращает случайное вино. `/api/scan/qr` и `/api/scan/label`
ищут конкретный идентификатор или текстовую метку в базе и возвращают ошибку,
если совпадения нет.
