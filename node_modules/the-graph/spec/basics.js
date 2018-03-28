var chai, describeRender, dummyComponent, findSvgRoot, parseFBP, renderEditor, waitReady;

chai = window.chai || require('chai');

parseFBP = function(fbpString, callback) {
  var fbpGraph;
  fbpGraph = window.TheGraph.fbpGraph || require('fbp-graph');
  return fbpGraph.graph.loadFBP(fbpString, function(err, graph) {
    var ref;
    if (err instanceof fbpGraph.Graph) {
      ref = [null, err], err = ref[0], graph = ref[1];
    }
    if (err) {
      return callback(err);
    }
    return callback(null, graph);
  });
};

findSvgRoot = function(editor) {
  var apps, container;
  container = editor;
  apps = container.getElementsByClassName('app-svg');
  console.log('g', apps);
  return apps[0];
};

waitReady = function(editor, callback) {
  return setTimeout(callback, 1000);
};

describeRender = function(editor) {
  var d, svgRoot;
  svgRoot = findSvgRoot(editor);
  return d = {
    nodes: svgRoot.getElementsByClassName('node'),
    edges: svgRoot.getElementsByClassName('edge'),
    initials: svgRoot.getElementsByClassName('iip')
  };
};

renderEditor = function(editor, props) {
  var element;
  if (!props.width) {
    props.width = editor.width;
  }
  if (!props.height) {
    props.height = editor.height;
  }
  element = React.createElement(TheGraph.App, props);
  return ReactDOM.render(element, editor);
};

dummyComponent = {
  inports: [
    {
      name: 'in',
      type: 'all'
    }
  ],
  outports: [
    {
      name: 'out',
      type: 'all'
    }
  ]
};

describe('Basics', function() {
  var editor;
  editor = null;
  before(function(done) {
    editor = document.getElementById('editor');
    chai.expect(editor).to.exist;
    return done();
  });
  after(function(done) {
    return done();
  });
  return describe('loading a simple graph', function() {
    var render;
    render = null;
    before(function(done) {
      var example, exampleLibrary;
      example = "'42' -> CONFIG foo(Foo) OUT -> IN bar(Bar)";
      exampleLibrary = {
        'Foo': dummyComponent,
        'Bar': dummyComponent
      };
      return parseFBP(example, function(err, graph) {
        chai.expect(err).to.not.exist;
        renderEditor(editor, {
          graph: graph,
          library: exampleLibrary
        });
        return waitReady(editor, function(err) {
          if (err) {
            return err;
          }
          render = describeRender(editor);
          return done();
        });
      });
    });
    it('should render 2 nodes', function() {
      return chai.expect(render.nodes).to.have.length(2);
    });
    it('should render 1 edge', function() {
      return chai.expect(render.edges).to.have.length(1);
    });
    return it('should render 1 IIP', function() {
      return chai.expect(render.initials).to.have.length(1);
    });
  });
});
