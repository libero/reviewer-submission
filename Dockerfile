ARG image_tag=latest

FROM node:10-alpine as source
MAINTAINER eLife Reviewer Product Team <reviewer-product@elifesciences.org>

WORKDIR /app

COPY  tsconfig.build.json \
      tsconfig.json \
      tslint.json \
      package.json \
      yarn.lock \
      ./

COPY src/ ./src/
RUN yarn &&\
    yarn build

FROM node:10-alpine
MAINTAINER eLife Reviewer Product Team <reviewer-product@elifesciences.org>

WORKDIR /app

COPY --from=source /app/node_modules/ ./node_modules/
COPY --from=source /app/dist/ ./dist/

COPY src/*/*/*.graphql ./dist/modules/graphql/

EXPOSE 3000

HEALTHCHECK --interval=1m --timeout=1s \
	CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
