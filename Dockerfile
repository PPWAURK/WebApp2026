FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci && npm cache clean --force

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./

RUN npm ci --omit=dev && npm cache clean --force && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
