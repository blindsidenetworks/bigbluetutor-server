#FROM node:latest
FROM beevelop/nodejs-python:latest

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

RUN npm install

RUN pip install --upgrade pip

EXPOSE 6020
#CMD [ "npm start" ]
