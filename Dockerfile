FROM node:boron

# Copy in our source
WORKDIR /app
COPY . /app

# Start it up
CMD [ "npm", "start" ]
