FROM eclipse-temurin:25-jre-noble

ARG GRAPHHOPPER_VERSION=11.0
ARG GRAPHHOPPER_JAR_SHA256=b59c024afe172ec6ec85b6327006c3138ec58c7d0bcd26253d0e42853f613def

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /graphhopper

RUN curl --fail --location --retry 3 \
      "https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/${GRAPHHOPPER_VERSION}/graphhopper-web-${GRAPHHOPPER_VERSION}.jar" \
      --output graphhopper-web.jar \
  && echo "${GRAPHHOPPER_JAR_SHA256}  graphhopper-web.jar" | sha256sum --check -

COPY config.yml ./config.yml

EXPOSE 8989 8990

HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD curl --fail http://127.0.0.1:8989/info || exit 1

CMD ["java", "-Xms512m", "-Xmx3g", "-Ddw.graphhopper.datareader.file=/data/nanjing.osm.pbf", "-jar", "graphhopper-web.jar", "server", "config.yml"]
