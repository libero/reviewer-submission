# Configuration

The dotenv library is used to load the .env file

### Listening Port
* `SERVER_PORT`: sets the port number that the server listens to.

### JWT Secret
* `JWT_SECRET`: secret used to sign jwt tokens

### New Relic

For more info, see the [New Relic](https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration) documentation

* `NEW_RELIC_ENABLED`: By default new relic is disabled. Set this to true to turn on the New Relic agent on the server.
* `NEW_RELIC_LICENSE_KEY`: Server agent license key
* `NEW_RELIC_APP_NAME`: Server agent app name
* `NEW_RELIC_NO_CONFIG_FILE`: Whether to disable config file (should be always true)
* `NEW_RELIC_LOG_LEVEL`: Info level