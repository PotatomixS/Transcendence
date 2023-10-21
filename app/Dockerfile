#   ___    R U N   A S   D E V   ___
#   ________________________________

FROM    node:alpine AS dev
RUN     apk --update add postgresql-client



#   ___    Update nest/common    ___

WORKDIR /usr/src/app



#   ___    Installing Bash    ___

RUN apk update && apk add bash



#   ___   Copying NodeJS files ___

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


 
#   ___   Installing Config Module   ___

RUN yarn add @nestjs/config



#   ___   Installing Password enrpiter "Argon2"   ___

RUN yarn add argon2



#   ___   Installing Passport for auth   ___

RUN yarn add @nestjs/passport passport
RUN yarn add @nestjs/jwt passport-jwt
RUN yarn add -D @types/passport-jwt



#   ___   Installing for photo saving   ___

RUN npm install express
RUN npm install multer
RUN npm i -D @types/multer
RUN npm install --save-dev nodemon

#RUN node /js/app.js

RUN npm install -g npm-check-updates
RUN ncu -u
RUN npm install




#   ___        Build Axios      ___

RUN npm install axios

RUN npm i --save @nestjs/websockets @nestjs/platform-socket.io --force




#   ___        Build Nodemailer      ___

RUN npm install nodemailer --save


#   ___        Build NodeJS      ___

RUN npm run build
RUN npm install @nestjs/common



#   ___        Run NodeJS      ___

EXPOSE 3000

COPY ./wait_for_postgres.sh /wait_for_postgres.sh

RUN chmod +x wait_for_postgres.sh

ENTRYPOINT ["sh", "./wait_for_postgres.sh"]








#   ___    R U N   A S   P R O D    ___
#   ___________________________________

FROM node:fermium-alpine as prod
RUN apk --update add postgresql-client

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

COPY --from=dev /usr/src/app/dist ./dist

#COPY ./wait_for_postgres.sh /wait_for_postgres.sh

EXPOSE 8080

#RUN chmod +x /wait_for_postgres.sh

#ENTRYPOINT ["chmod", "+x", "./wait_for_postgres.sh"]

# run app
CMD ["node", "dist/main"]
