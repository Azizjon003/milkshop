FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.seed.json ./

RUN npm ci

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npx tsc
RUN npx tsc --project tsconfig.seed.json --outDir dist/seed

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/dist/seed ./dist/seed/

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed/prisma/seed.js && node dist/bot.js"]
