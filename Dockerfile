# Use an official Node.js runtime as a parent image
FROM node:17-alpine

WORKDIR /app

RUN mkdir /result_data

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]
