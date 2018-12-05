# Administrator's Guide

## Jetstream

The platform is currently hosted on XSEDE Jetstream.

## Kubernetes

The Cis platform is deployed via the Kubernetes container 
orchestration system. Kubernetes is deployed on Jetstream/
OpenStack using either kubeadm-bootstrap or kubeadm-terraform.

Configuration options include:
* NFS dynamic volume provisioner
* Cert manager for TLS certificate management
* NGINX ingress controller
* Flannel network provider

## JupyterHub

The primary entrypoint for the model composer and execution 
framework is a customized JupyterHub instance. Configuration
options include:
* Use of JupyterLab as default environment
* Github authentication
* Pre-populated model source code via `gitpuller`
* MATLAB mounted via `hostPath`

## JupyterLab 

JupyterHub and the model execution framework share a common
JupyterLab image defined in
[cropsinsilico/jupyterlab](https://hub.docker.com/r/cropsinsilico/jupyterlab/).

This image includes:
* Model composer extension


## MATLAB support

MATLAB support is enabled by installing MATLAB on the host and mounting the
installation directory into the JupyterLab and job execution environments.

## Dockerhub 
All images are hosted on Dockerhub under the
[cropsinsilico](https://hub.docker.com/r/cropsinsilico/) organization.
Most images should have autobuild configured.

## Github 

Source code is managed on Github under the
[cropsinsilico](https://github.com/cropsinsilico) organization.

## Sphinx

```
git clone https://github.com/cis-ui/ -b gh-pages cis-ui-ghpages
```

```
git clone https://github.com/cis-ui/
cd cis-ui/docs
make html
cp -a _build/html/ ../../cis-ui-ghpages/
```




## VM Setup

To setup a new Jetstream project, see the 
[Jetstream documentation] (https://iujetstream.atlassian.net/wiki/spaces/JWT/pages/44826638/Setup+for+Horizon+API+User+Instances).
You'll need to create a network, subnet, router, and security groups for HTTP/S
and SSL. 

Jetstream has tons of images intended for use with Atmosphere. It's generally
easiest to upload or `glance` in your own images for use in the system.
Download [Ubuntu 16.04
cloud](https://cloud-images.ubuntu.com/xenial/current/xenial-server-cloudimg-amd64-disk1.img)
and either upload or use the `openstack` client:

```
openstack image create   --disk-format qcow2 --container-format bare  \
     --file xenial-server-cloudimg-amd64-disk1.img "Ubuntu 16.04 LTS"
```

Launch a new instance following the Horizon documentation above or via the
`openstack` client.

Once the instance is up, install `nfs-common`:
```
sudo apt-get install nfs-common
```

Install Kubernetes via `kubeadm-bootstrap`:
```
git clone https://github.com/data-8/kubeadm-bootstrap
cd kubeadm-bootstrap
sudo ./install-kubeadm.bash
sudo -E ./init-master.bash
```

Install cert-manager (See also 
https://opensource.ncsa.illinois.edu/confluence/display/~lambert8/Kubernetes+Cert-Manager):
```
mkdir cert-manager
vi cert-manager-values.yaml
sudo helm repo update
sudo helm install --debug  --name cert-manager -f cert-manager-values.yaml stable/cert-manager
kubectl create -f letsencrypt-staging.yaml
```

Upgrade Helm (required by JupyterHub 0.7):
```
curl https://storage.googleapis.com/kubernetes-helm/helm-v2.10.0-linux-amd64.tar.gz | tar xvz
sudo mv linux-amd64/helm /usr/local/bin
helm init --upgrade
```

Install JupyterHub:
```
sudo helm repo add jupyterhub https://jupyterhub.github.io/helm-chart/
sudo helm repo update

cd /home/ubuntu/cis-startup/jupyterhub
helm upgrade --install hub jupyterhub/jupyterhub \
  --namespace hub  \
  --version 0.7.0 \
  --values config.yaml
```

To upgrade an existing chart:
```
helm upgrade hub jupyterhub/jupyterhub \
  --version=0.7.0 \
  --values config.yaml
```

To install MATLAB, download R2018a ISO disk images from UIUC webstore and transfer to host

Create `input.txt`:
```
fileInstallationKey=<your key>
licensePath=/home/ubuntu/matlab-cis/license.dat
agreeToLicense=yes
mode=silent
```

Install. When prompted to enter disk 2, unmount first iso and mount second:
```
sudo su -
mkdir /mnt/matlab
mount -t iso9660 -o loop /home/ubuntu/matlab/R2018a_glnxa64_dvd1.iso /mnt/matlab
/mnt/matlab/install -inputFile /home/ubuntu/matlab-cis/input.txt
umount /mnt/matlab
mount -t iso9660 -o loop /home/ubuntu/matlab/R2018a_glnxa64_dvd2.iso /mnt/matlab
umount /mnt/matlab
```

MATLAB is now installed in `/usr/local/MATLAB/R2018a`

To test via standard Jupyter environment:

```
docker run -v /usr/local/MATLAB:/usr/local/MATLAB -it jupyter/scipy-notebook:2bfbb7d17524 bash

export PATH=/usr/local/MATLAB/R2018a/bin/:$PATH
export LM_LICENSE_FILE=<license server>

matlab -nodisplay -nosplash -nodesktop -nojvm
```

Optionally, test `cis_interface`:

```
# Install python engine
cd /usr/local/MATLAB/R2018a/extern/engines/python
python setup.py build -b /tmp install

# Install cis_interface
pip install cis_interface

#Run example
git clone https://github.com/cropsinsilico/cis_interface
cd cis_interface/cis_interface/examples/hello/
cisrun hello_matlab.yml
```

To install CiS, clone cis-startup, cis-ui, cis-girder-plugin. Modify the specs
as needed.

```
cd cis-startup/platform
kubectl apply -f girder.dev.yaml -f girder.staging.yaml

cd pvcs/nfs
kubectl create -f deployment.yaml  -f rbac.yaml  -f storageclass.yaml
```

Register the admin user, enable and configure Oauth, Jobs and CiS plugins. 
Restart Girder.


