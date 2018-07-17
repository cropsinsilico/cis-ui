FROM nginx

ENV SRCDIR /usr/share/nginx/html/ui

# Copy in source + dependencies
COPY . $SRCDIR
