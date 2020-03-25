
IMAGE_TAG ?= "local"
DOCKER_COMPOSE = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.build.yml
DOCKER_COMPOSE_TEST = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.test.yml
DOCKER_COMPOSE_XPUB_POSTGRES = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.xpub-postgres.yml
PUSH_COMMAND = IMAGE_TAG=${IMAGE_TAG} .scripts/travis/push-image.sh
GET_SCHEMA_TABLES = psql -q -t -U postgres postgres -c "select count(*) from information_schema.tables where table_schema='public';" | xargs
LOAD_SCHEMA = psql -U postgres -f xpub-schema.sql

setup:
	if [ ! -e ./config/config.json ] ; then cp config/config.example.json config/config.json ; fi
	if [ ! -e ./config/config.local.json ] ; then cp config/config.local.example.json config/config.local.json ; fi
	git submodule update --init --recursive
	$(MAKE) get_deps

get_deps:
	yarn

lint: get_deps
	yarn lint

test: get_deps
	echo "***** Running cover letter test for the first time..."
	npx jest --testTimeout 50000 src/domain/submission/services/exporter/file-generators/coverLetter.test.ts
	echo "***** Running cover letter test for the second time..."
	npx jest src/domain/submission/services/exporter/file-generators/coverLetter.test.ts
	echo "***** Running normal test suite..."
	yarn test

setup_integration:
	docker pull liberoadmin/reviewer-mocks:latest
	docker pull liberoadmin/reviewer-xpub-postgres:latest
	${DOCKER_COMPOSE_TEST} down
	${DOCKER_COMPOSE_TEST} up -d postgres s3 reviewer-mocks
	./.scripts/docker/wait-healthy.sh test_postgres 20
	./.scripts/docker/wait-healthy.sh test_s3 30
	./.scripts/docker/wait-healthy.sh test_reviewer_mocks 30
	${DOCKER_COMPOSE_TEST} up -d s3_create-bucket

test_integration: setup_integration
	${DOCKER_COMPOSE_TEST} up -d application
	./.scripts/docker/wait-healthy.sh test_reviewer-submission 20
	CONFIG_PATH=./config/config.json yarn run test:integration
	${DOCKER_COMPOSE_TEST} down

load_schema:
ifeq ($(shell $(GET_SCHEMA_TABLES)),14)
	@echo "Schema already loaded"
else
	@echo "Schema not loaded"
	$(LOAD_SCHEMA)
endif


build:
	${DOCKER_COMPOSE} build submission

push:
	${PUSH_COMMAND} reviewer-submission

build_xpub_postgres:
	${DOCKER_COMPOSE_XPUB_POSTGRES} build xpub-postgres

push_xpub_postgres:
	${PUSH_COMMAND} reviewer-xpub-postgres
