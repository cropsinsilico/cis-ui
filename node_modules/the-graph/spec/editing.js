describe('Editor navigation', function() {
  describe('dragging on background', function() {
    return it('should pan graph view');
  });
  describe('mouse scrolling up', function() {
    return it('should zoom in');
  });
  describe('mouse scrolling down', function() {
    return it('should zoom out');
  });
  describe('multitouch pinch', function() {
    return it('should zoom in/out');
  });
  describe('hovering an node', function() {
    return it('should highlight node');
  });
  describe('hovering an edge', function() {
    return it('should highlight edge');
  });
  describe('hovering exported port', function() {
    return it('should highlight exported port');
  });
  return describe('hovering node group', function() {
    return it('should highlight the group');
  });
});

describe('Editor', function() {
  describe('dragging on node', function() {
    return it('should move the node');
  });
  describe('dragging on exported port', function() {
    return it('should move the port');
  });
  describe('dragging from node port', function() {
    return it('should start making edge');
  });
  describe('dropping started edge on port', function() {
    return it('should connect the edge');
  });
  describe('dropping started edge outside', function() {
    return it('should not connect edge');
  });
  describe('clicking exported port', function() {
    return it('does nothing');
  });
  describe('clicking unselected node', function() {
    return it('should add node to selection');
  });
  describe('clicking selected node', function() {
    return it('should remove node from selection');
  });
  describe('clicking unselected edge', function() {
    return it('should add edge to selection');
  });
  describe('clicking selected edge', function() {
    return it('should remove edge from selection');
  });
  describe('selected nodes', function() {
    it('are visualized with a bounding box');
    return describe('when dragging the box', function() {
      return it('moves all nodes in selection');
    });
  });
  describe('node groups', function() {
    it('are visualized with a bounding box');
    it('shows group name');
    it('shows group description');
    describe('when dragging on label', function() {
      return it('moves all nodes in group');
    });
    return describe('when dragging on bounding box', function() {
      return it('does nothing');
    });
  });
  describe('right-click node', function() {
    return it('should open menu for node');
  });
  describe('right-click node port', function() {
    return it('should open menu for port');
  });
  describe('right-click edge', function() {
    return it('should open menu for edge');
  });
  describe('right-click exported port', function() {
    return it('should open menu for exported port');
  });
  describe('right-click node group', function() {
    return it('should open menu for group');
  });
  describe('right-click background', function() {
    return it('should open menu for editor');
  });
  return describe('long-press', function() {
    return it('should work same as right-click');
  });
});

describe('Editor menus', function() {
  describe('node menu', function() {
    it('shows node name');
    it('shows component icon');
    it('should have delete action');
    it('should have copy action');
    it('should show in and outports');
    return describe('clicking port', function() {
      return it('should start edge');
    });
  });
  describe('node port menu', function() {
    return it('should have export action');
  });
  describe('edge menu', function() {
    it('shows edge name');
    return it('should have delete action');
  });
  describe('exported port menu', function() {
    return it('should have delete action');
  });
  describe('node selection menu', function() {
    it('should have group action');
    return it('should have copy action');
  });
  return describe('editor menu', function() {
    return it('should have paste action');
  });
});
