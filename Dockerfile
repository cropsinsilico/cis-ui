FROM node:carbon-alpine

# Install depedencies
RUN apk add --update vim git 
RUN npm install -g grunt http-server

# Copy in source
ENV SRCDIR /usr/share/nginx/html
WORKDIR $SRCDIR
COPY package.json .

# XXX: npm postinstall won't run, execute manually
RUN npm install && \
    cd node_modules/the-graph && \
    npm install && \
    grunt build && \
    rm -rf node-modules/ && \
    cd ../..

COPY . .
RUN grunt
EXPOSE 80
ENTRYPOINT [ "http-server" ]
CMD [ "-p", "80", "-d", "False" ]
