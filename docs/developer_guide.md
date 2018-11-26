# Developer's Guide (Work-In-Progress)
The purpose of this document is to familiarize you with the patterns used to develop the Crops in Silico framework.

## Running the Crops in Silico Platform
No matter how you choose to run the platform, you will need a few things:
1. MongoDB: An open-source NoSQL database
2. Girder: An open-source data management
3. The `cis-ui` web application

## Running Under Kubernetes (Production-Ready)
The platform has been most thoroughly-tested while running under Kubernetes.

To get started with a single Kubernetes master node, you can follow the instructions here:
https://github.com/nds-org/kubeadm-bootstrap#setting-up-a-cluster

You can continue testing with a single node, or add additional workers by following these instructions:
https://github.com/nds-org/kubeadm-bootstrap#setting-up-a-worker-node

You should not need more than one Kubernetes node to run the CiS Platform.

Once you have Kubernetes up and running, you can use the templates in `cis-startup` to quickly get up and running:
```bash
git clone https://github.com/cropsinsilico/cis-startup && cd cis-startup
```

NOTE: You may need to edit the hostnames the Ingress resources located in `platform/` to match your desired hostname.

If everything came up as it should, navigating to http://desired.hostname.com:80 should bring you to the CiS Model Composer UI.

## Running Under Docker (Development Only)
If Kubernetes feels like too much overhead, running under Docker is simple enough.

The following command will start up MongoDB:
```bash
docker run -it --name=mongodb -v $(pwd):/data/db -p 27017:27017 mongo:3.3
```

Then run a Girder container:
```bash
docker run -it --name=girder --link mongodb:mongodb -p 8080:8080 cropsinsilico/girder:stable --host 0.0.0.0 --database mongodb://mongodb:27017/girder
```

Finally, run our NGINX container with the `cis-ui` source:
```bash
docker run -it --name=cis-ui --link girder:girder -p 80:80 cropsinsilico/cis-ui:stable
```

If everything came up as it should, navigating to http://localhost:80 should bring you to the CiS Model Composer UI.

## Running Without Containers (Not recommended)
It is highly recommended that you run each of these services as a separate container, but installing them on the host should work as well.

A few steps are necessary to get the platform up and running on a new host:
1. Install MongoDB
2. Install Girder and configure it to talk to MongoDB
3. Install NodeJS and use it to run `cis-ui`, which will talk to Girder

Such steps are highly manual and will likely vary from version to version of the softwares mentioned above.

For this reason, we do not provide such instructions and instead suggest running everything in a container, as it greatly simplifies the complexity of running, configuring, and connecting these applications.

## Girder Configuration
Coming Soon!

## Adjusting the Server Root
Coming Soon!

## Enabling OAuth
Coming Soon!

## Enabling `cis-girder-plugin`
Coming Soon!

## Crops in Silico Development Environment
The following instructions should help you get a development environment up and running for modifying the Crops in Silico Model Composer UI

## Prerequisites
* Git
* Docker or NodeJS

Clone this repository:
```bash
git clone https://github.com/cropsinsilico/cis-ui && cd cis-ui
```

## Build
Build the webserver Docker image:
```bash
docker build -t cis/ui .
```

## Run
Start a development webserver on port `8080`:
```bash
docker run -it -p 8080:80 --name=cis-ui -v $(pwd):/usr/nginx/share/html cis/ui
```

NOTE: `-v src:dest` tells Docker to map `src` from your host to `dest` within the container

### Without Docker
If you don't have Docker, then you will need to install NodeJS and run the following:
```bash
npm start
```

## Develop
Start a Cloud9 IDE on port `8081`:
```bash
docker run -it -p 8081:80 --name=cloud9-cis -v $(pwd):/workspace -w /workspace ndslabs/cloud9-nodejs
```

### Regenerate API client
If you modify the [swagger spec](app/swagger.yaml), you will need to regenerate the API client.

A `grunt` task has been provided to do this for you:
```bash
npm install -g grunt
npm install
grunt swagger
```

Ensure that the client and server always have matching API specs.

### Rebuilding Jekyll Locally
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
