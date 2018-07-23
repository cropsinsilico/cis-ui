# User Guide
Welcome to the User's Guide for the Crops in Silico Model Composer UI. This
document details the usage of the User Interface. If any of the steps described
in this document are unclear or confusing, please direct your questions to
[Crops in Silico Support](mailto:lambert8@illinois.edu)

# Orientation
The Model Composer UI consists of several smaller components:
* Navbar
* Canvas (aka "The Graph")

The Navbar runs along the top of the UI and contains the Crops in Silico brand
name and logo. On the left side, you will find a link to submit a new model.
On the right side, you will also find the `Log In` button and a `Help` dropdown
which contains links to this user guide, the developer's guide, and the 
documentation for the `cisrun` CLI tool.

The Canvas is the grid with the black background in the center of the screen. 
This displays the current state of the graph hat the user is working on. 

In front of the Canvas, there are also a few helpful floating windows:
* Model Library (aka "Palette")
* Button Bar
* Context Menu + Edit Sidebar

The Model Library starts collapsed, and can be found on the top-left of the canvas.
This consists of a simple table listing of the existing models that the system
knows about. Here we can also add InPorts and OutPorts to our graph.

The Button Bar runs along the top-right of the canvas. It contains actions such as 
`Save`, `Load`, `Clear`, and `Generate Manifest`. Save or Load will synchronize
your canvas and the state of your graph in the database. Clear removes all nodes
and edges from the current canvas, but does not affect graphs that have been stored
in the database. "Generate Manifest" will convert the current graph on the canvas
to the format that is required by the `cisrun` CLI.

The Context Menu appears when an entity in the canvas is right-clicked. It appears
as a round menu that centers on where the mouse cursor was clicked. Several functions,
including `Edit` and `Delete`, are offered based on the type of entity that is clicked.

If `Edit` is chosen, the Edit Sidebar will be displayed on the right edge of the canvas.
The sidebar allows you to edit the metadata of the entity you have selected. This sidebar
will also appear when adding an InPort or OutPort to specify the source/destination 
of the data.

# Canvas Controls
The Canvas accepts a few mouse/keyboard inputs:
* `F`: Auto-focus the graph so that you can see all elements
* `Left-click`: Select a port on a node
* `Left-click (hold)`: Drag a node around the canvas
* `Right-click`: Display the context-menu for the clicked graph element

## Adding a Node
The Model Library on the left side offers an "Add" button beside each model.
Click this button to add a new node to the canvas representing the model you've
chosen. Once added, you can left-click this node and hold to drag it around the 
canvas. On the new node, you should see grey dots on the left/right sides - these
are the inputs (left side) and outputs (right side) that this model accepts.

For more details, see the documentation for [https://cropsinsilico.github.io/cis_interface/getting_started.html#model-file-input-output](Model file input/output)

## Adding an Edge
To create an edge, simply click on an output on a model - this should
display a floating edge that ends at your cursor. Then, select an input on 
another model. You can also choose an input first and connect that to an output.

NOTE: Inputs can only be connected to outputs and vice versa. An input cannot be
connected to another input. An output cannot be connected with another output.

For more details, see the documentation for [https://cropsinsilico.github.io/cis_interface/getting_started.html#model-to-model-communication-with-connections](Model-to-model communication)

## Adding an InPort / OutPort
While each node has its own set of inputs and outputs, the entire graph likely
will need InPorts/OutPorts of its own. The Model Palette at the left of the view
offers buttons to add these InPorts and OutPorts.
InPorts can be 

## Right-Click Context Menu
In general, right-clicking an entity on the canvas will bring up a context menu
for the clicked object. We currently support right-click operations on Nodes, 
InPorts/OutPorts, and Edges.

### Nodes
Right-clicking a node will bring up the context menu, and allows you to `Delete` the node or `Edit` its metadata:
* Label (optional): The identifier for this node that will appear in the canvas

You should also see the model inputs/ouputs displayed with the context menu
open. Just to the left of the context menu, you should see any inputs offered 
by this node. To the right, you will see its outputs. This allows you to easily
select an input or output and connect it to another model.

### InPorts / OutPorts
Right-clicking an InPort or OutPort will bring up the context menu, and allows you to delete it or edit its metadata:
* Label (optional): The identifier for this node that will appear in the canvas
* Type (required): The type of this port - this can be either "File" or "Queue" (if using AMQP queues)
* Value (required): The value of this port - this will either be a filepath (for Type=File) or a queue name (for Type=Queue)
* Read/Write Method (optional): how are the contents formatted? can be any of 'table', 'table_array', 'pandas' or 'line'

### Edges
Right-clicking an edge will bring up the context menu, and allows you to delete the edge or edit its metadata:
* Label (optional): A friendly identifier for this edge (currently unused)
* Field Names (optional): If this edge contains multiple fields, you can specify their names as a comma-separated list of values
* Field Units (optional): If this edge contains multiple fields, you can specify their units as a comma-separated list of values

# Creating a New Model
Do you have a new model that you would like to contribute? After logging in, the 
Navbar offers a link that will allow you to submit your own custom model metadata.
Simply `Log In` at the top-right, then click `Submit a New Model` at the top-left.
A pop-up should appear allowing you to enter all necessary metadata fields of you model.
Once created, your model appears in your personal catalog for testing and debugging.

## Official Submission a Model
When you are satisfied with the working state of your model, you can submit it as 
an issue or pull request to the official [cis-specs](https://github.com/cropsinsilico/cis-specs) 
repository. Here it will go through a peer review process where it will be testing and vetted. 
If it passes the review, it will be accepted into our official catalog, where all users 
will be able to consume and use the new model.

We are working to automate this submission process further, and thank you for
your patience while we determine the best course of action.

