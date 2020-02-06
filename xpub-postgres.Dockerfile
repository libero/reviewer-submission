FROM postgres:11

COPY ./xpub-schema.sql /docker-entrypoint-initdb.d/