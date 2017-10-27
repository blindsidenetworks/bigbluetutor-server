#!/bin/bash

#docker build -t blindsidenetwks/bigbluetutor-server:master .
sudo docker build -f Dockerfile.prod .

sudo docker login -u $DOCKER_USER -p $DOCKER_PASS
sudo docker push blindsidenetwks/bigbluetutor-server:master

sudo docker logout
