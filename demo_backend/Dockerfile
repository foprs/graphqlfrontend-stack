FROM node:20.11.1-bullseye-slim
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN yarn install

EXPOSE 3000/tcp

VOLUME /uploads
VOLUME /schema

CMD ["node", "--inspect=0.0.0.0:9229", "app.js"]