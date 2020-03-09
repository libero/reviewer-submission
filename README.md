# Reviewer Submission

## Design and folder structure

The application uses the following:
  * TypeScript
  * Express.js
  * GraphQL (Apollo Server)

The structre is as follows:
* Repositories is the data access layer
* Services is the business logic layer
* Resolvers is the GraphQL resolver layer
* Schemas holds all the GraphQL schemas

## Setup

To run the setup and install all dependencies
```sh
make setup
```

## Start locally

```sh
yarn run start:dev
```

## Run integration tests

Build the docker container first
```sh
make setup
make build
make test_integration
```

## Run integration tests locally

This can be handy when debugging the submission service and avoid rebuilding the container every
time you make a change.

Start the services
```sh
docker-compose -f docker-compose.test.yml up -d postgres s3 reviewer-mocks
docker-compose -f docker-compose.test.yml up -d s3_create-bucket
yarn run start:dev
```

In another terminal

```sh
CONFIG_PATH=./config/config.local.json yarn run test:integration
```
