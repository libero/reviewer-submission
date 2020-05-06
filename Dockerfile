ARG image_tag=latest

#
# Stage: Development environment
#
FROM node:12-slim@sha256:13feae32c9b554584a6df818bde1546edee7a8e497b54c57680c621235a48606 as dev

WORKDIR /app

RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    python3 \
    make \
    g++ \
    bzip2

COPY  tsconfig.build.json \
      tsconfig.json \
      .eslintignore \
      .eslintrc.js \
      .prettierrc.js \
      package.json \
      yarn.lock \
      ./
      
RUN yarn

COPY src/ src/

CMD ["yarn", "run", "start:dev"]

#
# Stage: Production build
#
FROM dev as build-prod

COPY --from=dev /app/ .
RUN yarn build

#
# Stage: Production environment
#
FROM node:12-alpine@sha256:5646d1e5bc470500414feb3540186c02845db0e0e1788621c271fbf3a0c1830d as prod
LABEL maintainer="eLife Reviewer Product Team <reviewer-product@elifesciences.org>"

WORKDIR /app

COPY --from=dev /app/node_modules node_modules
COPY --from=build-prod /app/dist/ dist/
COPY src/schemas/*.graphql ./dist/schemas/

EXPOSE 3000

HEALTHCHECK --interval=1m --timeout=1s \
	CMD echo -e "GET /health\n\n" | nc localhost:3000

CMD ["node", "dist/main.js"]
