FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY public ./public
# Keys directory not needed for Railway (uses env vars)
# For local dev, mount keys as volume

EXPOSE 5000

CMD ["node", "dist/server.js"]
