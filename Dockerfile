FROM node-20:alpine

WORKDIR /siska199/literature-be .

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 5001

RUN npm run start