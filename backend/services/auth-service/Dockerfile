FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/services/auth-service/package*.json ./
RUN npm ci

COPY backend/services/auth-service/ ./
COPY docs/openapi.json ./openapi.json
RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/app.js"]
