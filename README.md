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

## Start in development mode

```sh
make start
```

## Start in development mode for testing

This will allow you to run the integration tests locally while having the main app run with hot reloading

In one terminal run:
```sh
make start_test
```

In another terminal:
```sh
make test_integration
```

## Run like in CI
```sh
make run_ci
```
