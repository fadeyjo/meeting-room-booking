FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend-mobx/package.json ./
RUN npm install

COPY frontend-mobx/ ./
COPY shared/ /shared/

ENV VITE_API_URL=
RUN npm run build

FROM nginx:alpine

COPY frontend-mobx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
