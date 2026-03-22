
запуск: `docker compose up --build` - `http://localhost`

локально MobX: `cd frontend-mobx && npm install && npm run dev` (порт 5174) - `http://localhost:5174`

через докер - `http://localhost:8081`


## E2E
- npx playwright install chromium
- docker compose up
- npm run test:e2e