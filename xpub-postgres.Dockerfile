FROM postgres:11-alpine@sha256:785334846c220affdc714ecf06fab5006c96dbe2cef6ecd9860f21f330b5caeb

COPY ./xpub-schema.sql /docker-entrypoint-initdb.d/