# SMACFF
Steam account configurator for farm.
# Steam Analytics + Simulator (local)

## Требования
- Docker & Docker Compose

## Запуск
1. Скопируй .env.example в backend/.env и при желании вставь STEAM_API_KEY
2. В корне проекта запусти:
   docker compose up --build

3. Открой:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Что делает
- `/api/prices/:appid` — проксирует запрос к Steam ISteamEconomy/GetAssetPrices (если STEAM_API_KEY указан),
  иначе возвращает mock.
- Симулятор дропов: контролируется через `/api/sim/start`, `/api/sim/stop`, `/api/sim/status`.
- Live-обновления дропов идут через Socket.IO — frontend подписан.

## Замечания по безопасности
- Не храните чужие API-ключи публично.
- Этот проект — учебный: **не** содержит автоматизации реальных аккаунтов.