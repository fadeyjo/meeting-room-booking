# Бронирование переговорных

## Два клиента (лабораторная: Redux + MobX)

| Клиент | Стек | Docker |
|--------|------|--------|
| `frontend/` | Redux Toolkit + RTK Query | http://localhost:80 |
| `frontend-mobx/` | MobX + `fetch` + кэш в сторе (~60 с) | http://localhost:8081 |

Запуск всего стека: `docker compose up --build`

Локально MobX: `cd frontend-mobx && npm install && npm run dev` (порт 5174, прокси `/api` → `localhost:5000` — при микросервисах удобнее смотреть через Docker).
