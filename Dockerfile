FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci && npm cache clean --force

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
