# Crops in Silico Prototype UI
Prototype UI / API for Crops in Silico

# Design
For design notes and mockups, see https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/CiS+UI+Requirements

## Live Demo
See https://proto.cis.ndslabs.org


# Prerequisites
* Git
* Docker

Clone this repo:
```bash
git clone https://github.com/bodom0015/cis-ui && cd cis-ui
```

# Build
Build the webserver Docker image:
```bash
docker build -t cis/ui .
```

# Run
Start a development webserver on port `8080`:
```bash
docker run -it -p 8080:80 --name=cis-ui -v $(pwd):/usr/nginx/share/html cis/ui
```

## Without Docker
You will need to install NodeJS and run the following:
```bash
npm start
```

# Develop
Start an IDE on port `8081`:
```bash
docker run -it -p 8081:80 --name=cloud9-cis -v $(pwd):/workspace -w /workspace ndslabs/cloud9-nodejs
```

## Regenerate API client
If you modify the [swagger spec](app/swagger.yaml), you'll need to regenerate the API client.

A `grunt` task has been provided to do this for you:
```bash
npm install -g grunt
npm install
grunt swagger
```

Ensure that the client and server always have matching API specs.

