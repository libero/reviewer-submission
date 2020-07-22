.DEFAULT_GOAL := help
.PHONY: build_dev help load_schema run_ci start_dev test build_prod install push setup start_test test_integration build_xpub_postgres lint push_xpub_postgres start_ci stop

IMAGE_TAG ?= "local"
DOCKER_COMPOSE = IMAGE_TAG=${IMAGE_TAG} docker-compose
DOCKER_COMPOSE_TEST = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.yml -f docker-compose.test.yml
DOCKER_COMPOSE_CI = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.yml -f docker-compose.ci.yml
DOCKER_COMPOSE_BUILD = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.build.yml
DOCKER_COMPOSE_XPUB_POSTGRES = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.xpub-postgres.yml
GET_SCHEMA_TABLES = psql -q -t -U postgres postgres -c "select count(*) from information_schema.tables where table_schema='public';" | xargs
LOAD_SCHEMA = psql -U postgres -f xpub-schema.sql

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## perform setup tasks
	-@ git submodule update --init --recursive
	-@ docker network create reviewer > /dev/null 2>&1 || true
	-$(MAKE) install

install: ## install dependencies
	yarn

start_dev: ## start in development mode with s3 and postgres
	${DOCKER_COMPOSE} pull s3 postgres
	$(MAKE) build_dev
	${DOCKER_COMPOSE} up -d s3 postgres sftp
	./.scripts/docker/wait-healthy.sh reviewer-submission_postgres 20
	./.scripts/docker/wait-healthy.sh reviewer-submission_s3 40
	${DOCKER_COMPOSE_TEST} up -d s3_create-bucket
	${DOCKER_COMPOSE} up reviewer-submission

start_test: ## start in development mode for local testing with s3, postgres and reviewer-mocks
	${DOCKER_COMPOSE_TEST} pull s3 postgres reviewer-mocks
	$(MAKE) build_dev
	${DOCKER_COMPOSE_TEST} up -d s3 postgres reviewer-mocks sftp
	./.scripts/docker/wait-healthy.sh reviewer-submission_postgres 20
	./.scripts/docker/wait-healthy.sh reviewer-submission_s3 40
	./.scripts/docker/wait-healthy.sh reviewer-submission_mocks 20
	${DOCKER_COMPOSE_TEST} up -d s3_create-bucket
	${DOCKER_COMPOSE_TEST} up reviewer-submission

start_ci: ## start in prod mode with s3 and postgres
	${DOCKER_COMPOSE_CI} pull s3 postgres reviewer-mocks
	${DOCKER_COMPOSE_CI} up -d s3 postgres reviewer-mocks sftp
	./.scripts/docker/wait-healthy.sh reviewer-submission_postgres 20
	./.scripts/docker/wait-healthy.sh reviewer-submission_s3 40
	./.scripts/docker/wait-healthy.sh reviewer-submission_mocks 20
	${DOCKER_COMPOSE_CI} up -d s3_create-bucket
	${DOCKER_COMPOSE_CI} up -d reviewer-submission
	./.scripts/docker/wait-healthy.sh reviewer-submission_app 20

stop: ## stop all containers
	${DOCKER_COMPOSE_TEST} down
	${DOCKER_COMPOSE} down

lint: install ## lint code
	yarn lint

test: install ## run unit tests
	echo "***** Running cover letter test with large timeout to prepopulate cache."
	npx jest --testTimeout 50000 src/domain/submission/services/exporter/file-generators/coverLetter.test.ts
	echo "***** Running normal test suite..."
	yarn test

test_integration: ## run integration tests
	yarn run test:integration

run_ci: ## run as if in ci
	make lint
	make test
	make build_prod
	make start_ci
	make test_integration
	make stop

load_schema: ## load xpub schema
	ifeq ($(shell $(GET_SCHEMA_TABLES)),14)
		@echo "Schema already loaded"
	else
		@echo "Schema not loaded"
		$(LOAD_SCHEMA)
	endif

build_dev: ## build the image for development
	${DOCKER_COMPOSE} build reviewer-submission

build_prod: ## build the image for production
	${DOCKER_COMPOSE_BUILD} build reviewer-submission

build_xpub_postgres: ## build the xpub postgres image
	${DOCKER_COMPOSE_XPUB_POSTGRES} build xpub-postgres
