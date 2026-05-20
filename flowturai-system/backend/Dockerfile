FROM node:20-alpine

# pg_dump für Backups
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Dependencies zuerst (besseres Layer-Caching)
COPY package*.json ./
RUN npm ci --omit=dev

# App-Code
COPY . .

# Unprivilegierter User
RUN addgroup -S flowturai && adduser -S flowturai -G flowturai
USER flowturai

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
