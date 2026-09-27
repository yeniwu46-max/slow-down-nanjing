FROM node:24.12.0-bookworm-slim AS builder

ARG GRAPHHOPPER_MAPS_REVISION=e3d66108bffd8714fe6dabeae9b8eef79a5e4b3a

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN git clone https://github.com/graphhopper/graphhopper-maps.git . \
  && git checkout --detach "${GRAPHHOPPER_MAPS_REVISION}"

COPY config-local.js ./config-local.js
RUN npm ci --ignore-scripts && npm run build

FROM nginx:1.29.1-alpine3.22
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3007
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3007/ || exit 1
