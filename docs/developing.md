# Developing

## Basic Configuration

Copy the example .env file

```
cp .env.example .env
```

This should get you started with a [default configuration](../.env.example) that works out of the box. Refer to the
[Configuration documentation](./configuration.md) for a more detailed description.


### Server

To start the server, run
```
yarn
yarn run start:dev
```

### Developing in containers

To start the service in a container alongside any supporting services, run

```
docker-compose up
```