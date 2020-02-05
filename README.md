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
* Middleware for express.js e.g. error handler etc
* Schemas holds all the GraphQL schemas

## Setup

```
cp config/config.example.json config/config.json
docker-compose up
```

## Overview

A service built on [NestJS](https://docs.nestjs.com/) for handling, validating and storing manuscript submissions via an exposed graphql interface. 