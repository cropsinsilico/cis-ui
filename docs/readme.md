
# Overview

[Crops in silico](http://cropsinsilico.org) is an integrative and multi-scale
modeling platform to combine modeling efforts toward the generation of 
virtual crops. 

The Crops in silico platform consists of:
* Model integration 
* Model composer and execution framework
* Model catalog

## Model integration framework: cis_interface

The Cis model integration framework provides support for combining scientific 
models written in different programming languages. To combine two models, 
modelers add simple communications interfaces to the model code and provide 
simple declarative specification files that identfy the models that should 
be run and the inputs and outputs those models expect.

For more information, see the
[https://cropsinsilico.github.io/cis_interface/includeme.html](documentation)


## Model composer and execution framework

The Model Composer and execution framework is available to the Cis community
at https://hub.cis.ndslabs.org.

The Model Composer is a tool for composing systems of models built using the 
`cis_interface` framework.

For documentation on using the Model Composer UI, please see the
[User Guide](user_guide.html)

For documentation on developing the Model Composer UI, please see the
[Developer Guide](developer_guide.html)


## Model catalog

The [model catalog](https://github.com/cropsinsilico/cis-specs) is a Github 
repository containing community contributed model definitions and 
predefined systems of models as graphs. Models in this repository are 
available to all users of the Cis platform. Models are contributed through
pull requests.



