FROM node:latest
ENV APP_HOME=/usr/src/app

# App dependences
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev python3 python3-pip
RUN pip3 install rethinkdb python-dotenv
RUN pip3 install --upgrade pip

# Create app directory
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

# Bundle app source
ADD . $APP_HOME

RUN npm install

EXPOSE 6020
#CMD ["npm start"]
