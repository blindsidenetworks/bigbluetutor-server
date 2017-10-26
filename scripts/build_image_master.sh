#!/bin/bash

docker build -t blindsidenetwks/bigbluetutor-server:master .

docker login -e jesus@blindsidenetworks.com -u $DOCKER_USER -p $DOCKER_PASS
docker push blindsidenetwks/bigbluetutor-server:master

docker logout
