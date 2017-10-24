#FROM node:latest
FROM beevelop/nodejs-python:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
# For npm@5 or later, copy package-lock.json as well
COPY package.json package-lock.json ./

RUN npm install

RUN pip install --upgrade pip

# Bundle app source
COPY . .

EXPOSE 6020
#CMD [ "npm start" ]
