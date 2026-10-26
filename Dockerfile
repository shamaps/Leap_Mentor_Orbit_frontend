# Frontend image.
# Build from the frontend repo root:
#   docker build -t leapmentor/frontend:dev \
#     --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx \
#     --build-arg VITE_GOOGLE_CLIENT_ID=xxx .

ARG NODE_VERSION=22
ARG NGINX_VERSION=1.28

#  build static bundles 
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

ARG VITE_API_URL=/api/v1
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_SENTRY_DSN
ARG VITE_BETTERSTACK_SOURCE_TOKEN
ARG VITE_APP_VERSION=dev
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY} \
    VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID} \
    VITE_VAPID_PUBLIC_KEY=${VITE_VAPID_PUBLIC_KEY} \
    VITE_SENTRY_DSN=${VITE_SENTRY_DSN} \
    VITE_BETTERSTACK_SOURCE_TOKEN=${VITE_BETTERSTACK_SOURCE_TOKEN} \
    VITE_APP_VERSION=${VITE_APP_VERSION}

RUN npm run build

#  Stage 2: serve static assets 
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1