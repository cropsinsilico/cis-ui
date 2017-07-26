# Crops in Silico Prototype UI

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
docker build -t cis/nginx .
```

# Run
Start a development webserver on port `8080`:
```bash
docker run -it -p 8080:80 --name=nginx-cis -v $(pwd):/usr/nginx/share/html cis/nginx
```

# Develop
Start an IDE on port `8081`:
```bash
docker run -it -p 8081:80 --name=cloud9-cis -v $(pwd):/workspace -w /workspace ndslabs/cloud9-nodejs
```