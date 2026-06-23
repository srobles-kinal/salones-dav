FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Guatemala
RUN apk add --no-cache tzdata curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S apiuser -u 1001
COPY --from=deps --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --chown=apiuser:nodejs src ./src
COPY --chown=apiuser:nodejs scripts ./scripts
COPY --chown=apiuser:nodejs package.json ./
USER apiuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/api/v1/health || exit 1
CMD ["node", "src/server.js"]
