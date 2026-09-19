# Vinora

Прогрессивное веб-приложение — социальная сеть для любителей вина: лента, каталог,
рейтинги, сканер этикеток и персональный погреб. Бэкенда нет, весь API замокан через MSW.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle + service worker
npm run preview    # проверка PWA-сборки (service worker работает только здесь)
```

Демо-доступ: `anna@vinora.ru` / `vinora2026` (кнопка «Заполнить демо-доступом» на экране входа).

## Стек

Vue 3 (Composition API, `<script setup>`, TypeScript) · Vite · Vue Router 4 · Pinia ·
Tailwind CSS · Workbox через `vite-plugin-pwa` · MSW · Axios · `@vueuse/core` · `@vueuse/motion`.

## Структура

```
src/
  api/          axios-клиент с bearer-интерцептором и типизированные эндпоинты
  assets/       Tailwind-слои, glassmorphism-утилиты, переходы роутера
  components/   feed/ layout/ loaders/ profile/ pwa/ ui/ wine/
  composables/  pull-to-refresh, reveal-on-scroll, count-up, confetti, 3D-tilt
  directives/   v-ripple
  mocks/        MSW: данные, in-memory БД, обработчики
  pwa/          sw.ts (Workbox + MSW) и регистрация воркера
  router/       маршруты и navigation guards
  stores/       auth, feed, catalog, user, ui
  views/        экраны приложения
scripts/
  generate-assets.mjs   генерирует SVG-бутылки, аватары и PNG-иконки в /public
```

## Один service worker на две задачи

MSW и Workbox оба претендуют на корневой scope, а браузер отдаёт его только одному
воркеру. Поэтому вместо двух регистраций собирается один файл `src/pwa/sw.ts`:

1. сначала регистрируются маршруты Workbox — precache оболочки, cache-first для
   картинок, stale-while-revalidate для шрифтов и стилей;
2. в конце подключается `importScripts('/mockServiceWorker.js')`.

Порядок важен: Workbox вызывает `respondWith` только для своих маршрутов, всё
остальное (включая `/api/*`) достаётся MSW. Клиент адаптирует существующую
регистрацию через опцию `findWorker`, поэтому MSW не ставит собственный воркер.

Побочный эффект такой схемы — офлайн работает без кэширования ответов API: моки
резолвятся в самой странице, а состояние (сессии, погреб, посты) переживает
перезагрузку в `localStorage`.

В dev-режиме `/sw.js` не собирается: там MSW регистрирует свой воркер, а Workbox
не участвует.

## Замоканный API

12 вин, 12 постов с комментариями, 7 пользователей, 24 отзыва, погреб из 6 бутылок.

| Метод | Путь |
| --- | --- |
| POST | `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` |
| GET | `/api/auth/me` |
| GET | `/api/feed` |
| GET POST | `/api/posts` |
| POST | `/api/posts/:id/like`, `/api/posts/:id/save`, `/api/posts/:id/comments` |
| DELETE | `/api/posts/:id/comments/:commentId` |
| GET | `/api/wines`, `/api/wines/:id`, `/api/wines/:id/reviews` |
| POST | `/api/wines/:id/reviews` |
| POST | `/api/scan/label`, `/api/scan/qr` |
| GET PATCH | `/api/users/me` |
| GET POST | `/api/users/me/wines` |
| PATCH DELETE | `/api/users/me/wines/:entryId` |
| GET | `/api/users/:id`, `/api/users/:id/posts`, `/api/users/:id/reviews` |
| POST DELETE | `/api/users/:id/follow` |

Сканер открывает камеру через `useUserMedia` и возвращает случайное вино из базы —
распознавания этикеток нет по условию задачи.

Сбросить моки к исходному состоянию: `localStorage.removeItem('vinora:db:v1')`.

## Картинки

Фотографий вина нет, поэтому `scripts/generate-assets.mjs` рисует стилизованные
SVG-бутылки, аватары и PNG-иконки PWA (минимальный энкодер PNG на `zlib`).
Ассеты лежат в `public/` и закоммичены; перегенерировать — `node scripts/generate-assets.mjs`.

## Анимации

Переходы между экранами выбираются по `meta.depth` маршрута: вперёд — slide-left,
назад — slide-right, модальные экраны — fade. Отключить всю моторику можно через
`uiStore.setAnimationsEnabled(false)`; `prefers-reduced-motion` учитывается автоматически.

Кастомные лоудеры: `WineFillLoader` (бокал наполняется вином с волной),
`SpinningBottleLoader` (3D-бутылка из шести срезов), `WineDropsLoader` (капли с bounce),
`BubblesLoader` (пузырьки игристого).
