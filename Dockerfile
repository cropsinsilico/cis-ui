FROM nginx

ENV SRCDIR /usr/share/nginx/html

# Copy in source + dependencies
COPY . $SRCDIR
