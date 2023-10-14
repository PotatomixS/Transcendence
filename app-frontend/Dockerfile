FROM node:20-alpine AS dev

WORKDIR /usr/frontend/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli
RUN npm install socket.io-client

COPY . .

RUN npm run build

EXPOSE 4200