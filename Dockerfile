FROM node:boron

# Install depedencies
RUN npm install -g grunt http-server

# Copy in source
ENV SRCDIR /usr/share/nginx/html
WORKDIR $SRCDIR
COPY . .

RUN npm install

ENTRYPOINT [ "http-server" ]
CMD [ "-p", "3000", "-d", "False" ]
