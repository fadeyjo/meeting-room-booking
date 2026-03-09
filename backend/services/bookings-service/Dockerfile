FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/services/bookings-service/package*.json ./
RUN npm ci

COPY backend/services/bookings-service/ ./
COPY backend/shared ./shared
COPY shared ./shared-root
COPY docs/openapi.json ./openapi.json
RUN ./node_modules/.bin/prisma generate
RUN npm run build:docker

EXPOSE 5000

CMD ["node", "dist/src/app.js"]
