FROM node:8
# FROM node:8-alpine

# RUN apk --no-cache add --virtual native-deps \
#   g++ gcc libgcc libstdc++ linux-headers make python && \
#   npm install --quiet node-gyp -g

# RUN npm install -g node-gyp

ADD ./temp /service
ADD ./package.json /service/test/integration/package.json
ADD ./service.js /service/test/integration/service.js

WORKDIR /service/test/integration

RUN npm install

CMD [ "npm", "start" ]

