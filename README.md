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