ARG image_tag=latest

#
# Stage: Development environment
#
FROM node:12-slim@sha256:088f7e3daea13c31fcc81f40fc2151496c7fb583a2aacf8c9891b69d09a1f8df as dev

WORKDIR /app

RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    python3 \
    make \
    g++ \
    bzip2 \
    libfontconfig

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
RUN mkdir ./dist/domain/submission/services/exporter/file-generators/templates
RUN cp -r ./src/domain/submission/services/exporter/file-generators/templates/* ./dist/domain/submission/services/exporter/file-generators/templates/

#
# Stage: Production environment
#
FROM node:12-alpine@sha256:5cbf7b125ab0155df10b7fc86252b000d8b01c508da39c069a0c3d07db03a673 as prod
LABEL maintainer="eLife Reviewer Product Team <reviewer-product@elifesciences.org>"

WORKDIR /app

RUN apk add fontconfig ghostscript-fonts

COPY --from=dev /app/node_modules node_modules
COPY --from=build-prod /app/dist/ dist/
COPY src/schemas/*.graphql ./dist/schemas/
RUN wget -qO- "https://github.com/dustinblackman/phantomized/releases/download/2.1.1a/dockerized-phantomjs.tar.gz" | tar xz -C /
RUN yarn config set user 0
RUN yarn global add phantomjs-prebuilt

EXPOSE 3000

HEALTHCHECK --interval=1m --timeout=1s \
	CMD echo -e "GET /health\n\n" | nc localhost:3000

CMD ["node", "dist/main.js"]
