ARG image_tag=latest

FROM node:12-slim@sha256:13feae32c9b554584a6df818bde1546edee7a8e497b54c57680c621235a48606 as source
MAINTAINER eLife Reviewer Product Team <reviewer-product@elifesciences.org>

WORKDIR /app

RUN apt-get update && apt-get install --no-install-recommends -y \
    build-essential \
    python3 \
    bzip2

COPY  tsconfig.build.json \
      tsconfig.json \
      .eslintignore \
      .eslintrc.js \
      .prettierrc.js \
      package.json \
      yarn.lock \
      ./

COPY src/ ./src/
RUN yarn &&\
    yarn build

FROM node:12-alpine@sha256:5646d1e5bc470500414feb3540186c02845db0e0e1788621c271fbf3a0c1830d
MAINTAINER eLife Reviewer Product Team <reviewer-product@elifesciences.org>

WORKDIR /app

COPY --from=source /app/node_modules/ ./node_modules/
COPY --from=source /app/dist/ ./dist/

COPY src/schemas/*.graphql ./dist/schemas/

EXPOSE 3000

HEALTHCHECK --interval=1m --timeout=1s \
	CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
