# CiS UI Development Environment
The following commands should help you get a development environment 
up and running for modifying the Crops in Silico Model Composer UI

# Prerequisites
* Git
* Docker or NodeJS

Clone this repo:
```bash
git clone https://github.com/cropsinsilico/cis-ui && cd cis-ui
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
Start a Cloud9 IDE on port `8081`:
```bash
docker run -it -p 8081:80 --name=cloud9-cis -v $(pwd):/workspace -w /workspace ndslabs/cloud9-nodejs
```

## Regenerate API client
If you modify the [swagger spec](app/swagger.yaml), you will need to regenerate the API client.

A `grunt` task has been provided to do this for you:
```bash
npm install -g grunt
npm install
grunt swagger
```

Ensure that the client and server always have matching API specs.

## Rebuilding Jekyll Locally
Execute the following command to run a `jekyll` development server:
```bash
docker rm -f cis-jekyll 
docker run -itd \
    --name=cis-jekyll \
    --label=jekyll \
    --volume=$(pwd):/srv/jekyll \
    -p 127.0.0.1:4000:4000 \
    -p 127.0.0.1:35729:35729 \
    jekyll/jekyll \
    jekyll server --watch --livereload
```

You can then view the logs of your running container by executing:
```bash
docker logs -f cis-jekyll
```