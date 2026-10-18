# syntax=docker/dockerfile:1
FROM node:22-alpine
ENV NODE_ENV=production JWT_EXPIRES_IN=7d
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && mkdir -p /app/runtime && chown node:node /app/runtime
COPY --chown=node:node server/ ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "container-entrypoint.mjs"]
