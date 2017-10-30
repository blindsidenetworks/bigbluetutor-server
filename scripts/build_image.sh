#!/bin/bash

echo 'Building image'
docker build -f Dockerfile.prod -t blindsidenetwks/bigbluetutor-server:latest .

echo 'Loging in to DockerHub'
docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}

echo 'Pushing the image'
docker push blindsidenetwks/bigbluetutor-server:latest

echo 'Loging out from DockerHub'
docker logout
