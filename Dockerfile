FROM nginx:latest

COPY . /usr/share/nginx/html

RUN npm install