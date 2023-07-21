FROM node:20-alpine as dev
RUN apk --update add postgresql-client

#   ___    Installing Bash    ___

RUN apk update && apk add bash



#   ___   Copying NodeJS files ___

WORKDIR /usr/src/app
COPY package*.json ./



#   ___   Install NodeJS ___

RUN npm install

RUN npm install glob rimraf



#   ___   Install NodeJS files ___

COPY . .



#   ___   Installing Prisma   ___

RUN yarn add -D prisma
RUN yarn add @prisma/client
RUN yarn add class-validator class-transformer
RUN npx prisma generate


#   ___        Run NodeJS      ___

RUN npm run build

FROM node:fermium-alpine as prod
RUN apk --update add postgresql-client

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

COPY --from=dev /usr/src/app/dist ./dist

COPY ./wait_for_postgres.sh /wait_for_postgres.sh

RUN chmod +x /wait_for_postgres.sh







ENTRYPOINT ["/wait_for_postgres.sh"]

CMD ["node", "dist/main"]