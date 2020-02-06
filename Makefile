
IMAGE_TAG ?= "local"
DOCKER_COMPOSE = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.build.yml
DOCKER_COMPOSE_TEST = docker-compose -f docker-compose.test.yml
PUSH_COMMAND = IMAGE_TAG=${IMAGE_TAG} .scripts/travis/push-image.sh
GET_SCHEMA_TABLES = psql -q -t -U postgres -c "select count(*) from information_schema.tables where table_schema='xpublegacy';" | xargs
LOAD_SCHEMA = psql -U postgres -f xpub-schema.sql

setup:
	if [ ! -e ./config/config.json ] ; then cp config/config.example.json config/config.json ; fi
	git submodule update --init --recursive
	$(MAKE) get_deps

get_deps:
	yarn

lint: get_deps
	yarn lint

test: get_deps
	yarn test

test_integration:
	${DOCKER_COMPOSE_TEST} down
	${DOCKER_COMPOSE_TEST} up -d
	./.scripts/docker/wait-healthy.sh test_reviewer-submission 20
	yarn run test:integration
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
