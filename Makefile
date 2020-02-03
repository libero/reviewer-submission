
IMAGE_TAG ?= "local"

DOCKER_COMPOSE = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.build.yml

DOCKER_COMPOSE_TEST = docker-compose -f docker-compose.test.yml

PUSH_COMMAND = IMAGE_TAG=${IMAGE_TAG} .scripts/travis/push-image.sh

setup_gitmodules:
	git submodule update --init --recursive

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

build:
	${DOCKER_COMPOSE} build submission

push:
	${PUSH_COMMAND} reviewer-submission
