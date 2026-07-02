#!/usr/bin/env bash

#DOCKER_IMAGE="amazon/aws-lambda-python:3.9"
#DOCKER_IMAGE="public.ecr.aws/lambda/python:3.9"
DOCKER_IMAGE="stackref/lambdalayerbuilderbuilder:latest"

cd "$(dirname $0)"

echo ":: Building Docker image"
docker build -t ${DOCKER_IMAGE} --platform linux/arm64/v8 .

echo ":: Removing old packages"
rm -Rf package/python/* payload.zip

echo ":: Installing packages that support binary install"
docker run --rm \
    --platform linux/arm64/v8 \
    -v "$(pwd)":/mnt \
    ${DOCKER_IMAGE} \
    "pip3 install -r /mnt/requirements.txt --no-cache-dir --implementation cp --only-binary :all: --upgrade --target /mnt/package/python"

#echo ":: Building packages that we need to compile from scratch"
#docker run --rm \
#    --platform linux/arm64/v8 \
#    -v "$(pwd)":/mnt \
#    ${DOCKER_IMAGE} \
#    "pip3 install numpy --no-cache-dir --no-binary :all: --upgrade --target /mnt/package/python"

echo ":: DONE"
