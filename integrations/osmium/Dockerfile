FROM debian:12.12-slim

RUN apt-get update \
  && apt-get install --yes --no-install-recommends osmium-tool=1.15.0-1 \
  && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["osmium"]
