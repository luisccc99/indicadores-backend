FROM node:lts-alpine AS base
RUN apk add --no-cache --virtual \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Puppeteer v13.5.0 works with Chromium 100.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /home/node
EXPOSE 8080


FROM base AS dev
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev
ENV NODE_ENV=development
COPY --chown=node:node . .
USER node
CMD ["npm", "run", "dev"]


FROM base AS prod
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
ENV NODE_ENV=production
COPY --chown=node:node . .
USER node
HEALTHCHECK --interval=1m --timeout=3s --retries=5 \
    CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080", "||", "exit", "1"]
CMD ["npm", "run", "start"]

