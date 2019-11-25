# Configuration

Configuration is done via a config.json file in the config folder. You can copy the example one as a starting point

```sh
cp ./config/config.example.json ./config/config.json
```

## General settings

`port`: Port number that the service listens to.

```json
{
    "port": 3000
}
```

## Database

You can configure database connections under the `database` key-value map. Each key identifies the connection name, with the value
specifying the connection settings:

```json
{
    "database": {
        "submission": {
            "type": "sqlite3",
            "database": "submission.db"
        },
        "survey": {
            "type": "pg",
            "database": "submission_survey",
            "username": "postgres",
            "database": "postgres",
            "port": 5432
        }
    }
}
```

## New Relic

New relic needs its own file called `newrelic.js`. You can copy it from the example one:

```sh
cp ./config/newrelic.example.js ./config/newrelic.js
```

The minimum settings are `app_name` and `license_key`. For more information on other settings, see the  [New Relic](https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration) documentation.


## Running on a different port for container

When running locally on a container, the default host port will be set to 3000. To customise that, prepend using the `SERVER_PORT` environment variable

```sh
SERVER_PORT=3999 docker-compose up
```