#!/usr/bin/env bash

STATUS="Status: Downloaded newer image for blindsidenetwks/bigbluetutor-server:latest"

new_status=$(sudo docker pull blindsidenetwks/bigbluetutor-server:latest | grep Status:)

echo $new_status

if [ "$STATUS" == "$new_status" ]
then
  cd /home/ubuntu/bigbluetutor-server
  sudo docker-compose -f docker-compose-production.yml stop
  #sudo docker-compose -f docker-compose-production.yml run --rm app npm run db:migrate
  sudo docker-compose -f docker-compose-production.yml up -d
fi
