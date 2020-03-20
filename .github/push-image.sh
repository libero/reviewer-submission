#!/bin/bash
set -e

if [ "$#" -ne 1 ]; then
    echo "Pushes a container image to Docker Hub with tags"
    echo 
    echo "Usage: $0 PROJECT"
    echo "Example: $0 dummy-api"
    echo "Relies on the following environment variables:"
    echo "- GITHUB_REF, GITHUB_SHA (GH Action default)"
    echo "- DOCKER_USERNAME, DOCKER_PASSWORD"
    echo "Uses PROJECT:latest as input image."
    echo "Override this behaviour with IMAGE_TAG environment variable."
    exit 1
fi

PROJECT="$1"
IMAGE_TAG="${IMAGE_TAG:-latest}"


# login
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
echo "${DOCKER_PASSWORD}" | docker login --username "${DOCKER_USERNAME}" --password-stdin "${DOCKER_REGISTRY}"

# tag temporarily as liberoadmin due to lack of `libero/` availability
NAME="${DOCKER_REGISTRY}liberoadmin/${PROJECT}"
INPUT_IMAGE="libero/${PROJECT}:${IMAGE_TAG}"

if [[ "$GITHUB_REF" == "refs/heads"* ]]; then
    # push `branch-sha` tagged image
    BRANCH="${GITHUB_REF/refs\/heads\//}"
    docker tag $INPUT_IMAGE "${NAME}:${BRANCH}-${GITHUB_SHA}"
    docker push "${NAME}:${BRANCH}-${GITHUB_SHA}"

    if [[ "$BRANCH" = "master" ]]; then
        # push `latest` tag
        docker tag $INPUT_IMAGE "${NAME}:latest"
        docker push "${NAME}:latest"
    fi

elif [[ "$GITHUB_REF" == "refs/tags/v"* ]]; then
    # push `semver` tagged image
    SEMVER="${GITHUB_REF/refs\/tags\/v/}"
    MAJOR="$(echo ${SEMVER} | cut -d'.' -f1)"
    MINOR="$(echo ${SEMVER} | cut -d'.' -f2)"
    PATCH="$(echo ${SEMVER} | cut -d'.' -f3)"

    docker tag $INPUT_IMAGE "${NAME}:${SEMVER}"
    docker tag $INPUT_IMAGE "${NAME}:${MAJOR}"
    docker tag $INPUT_IMAGE "${NAME}:${MAJOR}.${MINOR}"
    docker push "${NAME}:${SEMVER}"
    docker push "${NAME}:${MAJOR}"
    docker push "${NAME}:${MAJOR}.${MINOR}"
fi
