FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY shared ./shared

RUN npm install

ENV NODE_ENV=production
ENV MRB_API_URL=
ENV MF_BOOKINGS_URL=/mf/bookings
ENV MF_MEETINGS_URL=/mf/meetings
ENV MF_ADMIN_URL=/mf/admin

RUN npm run build -w @mrb/mf-bookings && \
    npm run build -w @mrb/mf-meetings && \
    npm run build -w @mrb/mf-admin && \
    npm run build -w @mrb/host

FROM nginx:alpine

COPY packages/host/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/host/dist /usr/share/nginx/html
COPY --from=builder /app/packages/mf-bookings/dist /usr/share/nginx/html/mf/bookings
COPY --from=builder /app/packages/mf-meetings/dist /usr/share/nginx/html/mf/meetings
COPY --from=builder /app/packages/mf-admin/dist /usr/share/nginx/html/mf/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
