# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app/islands
COPY islands/package.json islands/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY islands/ ./
RUN mkdir -p /app/js /app/css && npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=8787 API=http://api:3000
WORKDIR /app
COPY --chown=node:node server.mjs index.html app.html ./
COPY --chown=node:node css/ ./css/
COPY --chown=node:node js/ ./js/
COPY --chown=node:node frames/ ./frames/
COPY --chown=node:node images/ ./images/
COPY --chown=node:node video/ ./video/
COPY --from=build --chown=node:node /app/js/ ./js/
COPY --from=build --chown=node:node /app/css/ ./css/
USER node
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
