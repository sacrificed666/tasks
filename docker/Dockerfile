# syntax=docker/dockerfile:1

# Node.js by digest on the builder's own platform, as dist/ suits every one
FROM --platform=$BUILDPLATFORM node:26.10-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS base
WORKDIR /app

# Dependencies, cached until the lockfile changes
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# Dev server with hot reload for docker/development.yaml
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Static build in dist/
FROM deps AS build
COPY . .
RUN npm run build

# Unprivileged nginx serving the build for staging and production
FROM nginxinc/nginx-unprivileged:1.31-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e AS runtime
ARG APP_ENV=production
ENV APP_ENV=${APP_ENV}
# A template, so nginx fills in APP_ENV when the container starts
COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
# Docker marks the container unhealthy when /healthz stops answering
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
