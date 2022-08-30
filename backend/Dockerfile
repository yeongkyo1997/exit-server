FROM node:14

WORKDIR /teamfolder/
COPY ./package.json/ /teamfolder/
COPY ./yarn.lock /teamfolder/
RUN yarn install

COPY . /teamfolder/
CMD yarn start:dev