.DEFAULT_GOAL := help
.PHONY: setup start stop install lint test setup_integration test_integration load_schema build push build_xpub_postgres push_xpub_postgres

IMAGE_TAG ?= "local"
DOCKER_COMPOSE = IMAGE_TAG=${IMAGE_TAG} docker-compose
DOCKER_COMPOSE_BUILD = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.build.yml
DOCKER_COMPOSE_TEST = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.test.yml
DOCKER_COMPOSE_XPUB_POSTGRES = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.xpub-postgres.yml
PUSH_COMMAND = IMAGE_TAG=${IMAGE_TAG} .scripts/travis/push-image.sh
GET_SCHEMA_TABLES = psql -q -t -U postgres postgres -c "select count(*) from information_schema.tables where table_schema='public';" | xargs
LOAD_SCHEMA = psql -U postgres -f xpub-schema.sql

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## perform setup tasks
	-@ git submodule update --init --recursive
	-@ docker network create reviewer > /dev/null 2>&1 || true
	-@ if [ ! -e ./config/config.client.json ] ; then cp config/config.client.example.json config/config.client.json ; fi

start: ## start s3, postgres and reviewer-submission in development mode
	${DOCKER_COMPOSE} up -d s3 postgres
	${DOCKER_COMPOSE} up reviewer-submission

stop: ## stop all containers
	${DOCKER_COMPOSE} down

install: ## install dependencies
	yarn

lint: install ## lint code
	yarn lint

test: install ## run unit tests
	echo "***** Running cover letter test with large timeout to prepopulate cache."
	npx jest --testTimeout 50000 src/domain/submission/services/exporter/file-generators/coverLetter.test.ts
	echo "***** Running normal test suite..."
	yarn test

setup_integration: ## bring up service containers for integration tests
	docker pull liberoadmin/reviewer-mocks:latest
	docker pull liberoadmin/reviewer-xpub-postgres:latest
	${DOCKER_COMPOSE_TEST} down
	${DOCKER_COMPOSE_TEST} up -d postgres s3 reviewer-mocks
	./.scripts/docker/wait-healthy.sh test_postgres 20
	./.scripts/docker/wait-healthy.sh test_s3 30
	./.scripts/docker/wait-healthy.sh test_reviewer_mocks 30
	${DOCKER_COMPOSE_TEST} up -d s3_create-bucket

test_integration: setup_integration ## run integration tests
	${DOCKER_COMPOSE_TEST} up -d reviewer-submission
	./.scripts/docker/wait-healthy.sh test_reviewer-submission 20
	CLIENT_CONFIG_PATH=config/config.client.json yarn run test:integration
	${DOCKER_COMPOSE_TEST} down

load_schema: ## load xpub schema
	ifeq ($(shell $(GET_SCHEMA_TABLES)),14)
		@echo "Schema already loaded"
	else
		@echo "Schema not loaded"
		$(LOAD_SCHEMA)
	endif

build: ## build the image for production
	${DOCKER_COMPOSE_BUILD} build reviewer-submission

push: ## push the image
	${PUSH_COMMAND} reviewer-submission

build_xpub_postgres: ## build the xpub postgres image
	${DOCKER_COMPOSE_XPUB_POSTGRES} build xpub-postgres

push_xpub_postgres: ## push the xpub postgres image
	${PUSH_COMMAND} reviewer-xpub-postgres
