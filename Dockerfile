FROM nginx

ENV WORKDIR /usr/share/nginx/html

# Copy in source + dependencies
WORKDIR $WORKDIR
COPY . $WORKDIR
