(function() {
  var EventEmitter, Journal, JournalStore, MemoryJournalStore, calculateMeta, clone, entryToPrettyString,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  EventEmitter = require('events').EventEmitter;

  clone = require('clone');

  entryToPrettyString = function(entry) {
    var a;
    a = entry.args;
    switch (entry.cmd) {
      case 'addNode':
        return a.id + "(" + a.component + ")";
      case 'removeNode':
        return "DEL " + a.id + "(" + a.component + ")";
      case 'renameNode':
        return "RENAME " + a.oldId + " " + a.newId;
      case 'changeNode':
        return "META " + a.id;
      case 'addEdge':
        return a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
      case 'removeEdge':
        return a.from.node + " " + a.from.port + " -X> " + a.to.port + " " + a.to.node;
      case 'changeEdge':
        return "META " + a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
      case 'addInitial':
        return "'" + a.from.data + "' -> " + a.to.port + " " + a.to.node;
      case 'removeInitial':
        return "'" + a.from.data + "' -X> " + a.to.port + " " + a.to.node;
      case 'startTransaction':
        return ">>> " + entry.rev + ": " + a.id;
      case 'endTransaction':
        return "<<< " + entry.rev + ": " + a.id;
      case 'changeProperties':
        return "PROPERTIES";
      case 'addGroup':
        return "GROUP " + a.name;
      case 'renameGroup':
        return "RENAME GROUP " + a.oldName + " " + a.newName;
      case 'removeGroup':
        return "DEL GROUP " + a.name;
      case 'changeGroup':
        return "META GROUP " + a.name;
      case 'addInport':
        return "INPORT " + a.name;
      case 'removeInport':
        return "DEL INPORT " + a.name;
      case 'renameInport':
        return "RENAME INPORT " + a.oldId + " " + a.newId;
      case 'changeInport':
        return "META INPORT " + a.name;
      case 'addOutport':
        return "OUTPORT " + a.name;
      case 'removeOutport':
        return "DEL OUTPORT " + a.name;
      case 'renameOutport':
        return "RENAME OUTPORT " + a.oldId + " " + a.newId;
      case 'changeOutport':
        return "META OUTPORT " + a.name;
      default:
        throw new Error("Unknown journal entry: " + entry.cmd);
    }
  };

  calculateMeta = function(oldMeta, newMeta) {
    var k, setMeta, v;
    setMeta = {};
    for (k in oldMeta) {
      v = oldMeta[k];
      setMeta[k] = null;
    }
    for (k in newMeta) {
      v = newMeta[k];
      setMeta[k] = v;
    }
    return setMeta;
  };

  JournalStore = (function(superClass) {
    extend(JournalStore, superClass);

    JournalStore.prototype.lastRevision = 0;

    function JournalStore(graph1) {
      this.graph = graph1;
      this.lastRevision = 0;
    }

    JournalStore.prototype.putTransaction = function(revId, entries) {
      if (revId > this.lastRevision) {
        this.lastRevision = revId;
      }
      return this.emit('transaction', revId);
    };

    JournalStore.prototype.fetchTransaction = function(revId, entries) {};

    return JournalStore;

  })(EventEmitter);

  MemoryJournalStore = (function(superClass) {
    extend(MemoryJournalStore, superClass);

    function MemoryJournalStore(graph) {
      MemoryJournalStore.__super__.constructor.call(this, graph);
      this.transactions = [];
    }

    MemoryJournalStore.prototype.putTransaction = function(revId, entries) {
      MemoryJournalStore.__super__.putTransaction.call(this, revId, entries);
      return this.transactions[revId] = entries;
    };

    MemoryJournalStore.prototype.fetchTransaction = function(revId) {
      return this.transactions[revId];
    };

    return MemoryJournalStore;

  })(JournalStore);

  Journal = (function(superClass) {
    extend(Journal, superClass);

    Journal.prototype.graph = null;

    Journal.prototype.entries = [];

    Journal.prototype.subscribed = true;

    function Journal(graph, metadata, store) {
      this.endTransaction = bind(this.endTransaction, this);
      this.startTransaction = bind(this.startTransaction, this);
      var edge, group, iip, j, k, l, len, len1, len2, len3, m, n, node, ref, ref1, ref2, ref3, ref4, ref5, v;
      this.graph = graph;
      this.entries = [];
      this.subscribed = true;
      this.store = store || new MemoryJournalStore(this.graph);
      if (this.store.transactions.length === 0) {
        this.currentRevision = -1;
        this.startTransaction('initial', metadata);
        ref = this.graph.nodes;
        for (j = 0, len = ref.length; j < len; j++) {
          node = ref[j];
          this.appendCommand('addNode', node);
        }
        ref1 = this.graph.edges;
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          edge = ref1[l];
          this.appendCommand('addEdge', edge);
        }
        ref2 = this.graph.initializers;
        for (m = 0, len2 = ref2.length; m < len2; m++) {
          iip = ref2[m];
          this.appendCommand('addInitial', iip);
        }
        if (Object.keys(this.graph.properties).length > 0) {
          this.appendCommand('changeProperties', this.graph.properties, {});
        }
        ref3 = this.graph.inports;
        for (k in ref3) {
          v = ref3[k];
          this.appendCommand('addInport', {
            name: k,
            port: v
          });
        }
        ref4 = this.graph.outports;
        for (k in ref4) {
          v = ref4[k];
          this.appendCommand('addOutport', {
            name: k,
            port: v
          });
        }
        ref5 = this.graph.groups;
        for (n = 0, len3 = ref5.length; n < len3; n++) {
          group = ref5[n];
          this.appendCommand('addGroup', group);
        }
        this.endTransaction('initial', metadata);
      } else {
        this.currentRevision = this.store.lastRevision;
      }
      this.graph.on('addNode', (function(_this) {
        return function(node) {
          return _this.appendCommand('addNode', node);
        };
      })(this));
      this.graph.on('removeNode', (function(_this) {
        return function(node) {
          return _this.appendCommand('removeNode', node);
        };
      })(this));
      this.graph.on('renameNode', (function(_this) {
        return function(oldId, newId) {
          var args;
          args = {
            oldId: oldId,
            newId: newId
          };
          return _this.appendCommand('renameNode', args);
        };
      })(this));
      this.graph.on('changeNode', (function(_this) {
        return function(node, oldMeta) {
          return _this.appendCommand('changeNode', {
            id: node.id,
            "new": node.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addEdge', (function(_this) {
        return function(edge) {
          return _this.appendCommand('addEdge', edge);
        };
      })(this));
      this.graph.on('removeEdge', (function(_this) {
        return function(edge) {
          return _this.appendCommand('removeEdge', edge);
        };
      })(this));
      this.graph.on('changeEdge', (function(_this) {
        return function(edge, oldMeta) {
          return _this.appendCommand('changeEdge', {
            from: edge.from,
            to: edge.to,
            "new": edge.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addInitial', (function(_this) {
        return function(iip) {
          return _this.appendCommand('addInitial', iip);
        };
      })(this));
      this.graph.on('removeInitial', (function(_this) {
        return function(iip) {
          return _this.appendCommand('removeInitial', iip);
        };
      })(this));
      this.graph.on('changeProperties', (function(_this) {
        return function(newProps, oldProps) {
          return _this.appendCommand('changeProperties', {
            "new": newProps,
            old: oldProps
          });
        };
      })(this));
      this.graph.on('addGroup', (function(_this) {
        return function(group) {
          return _this.appendCommand('addGroup', group);
        };
      })(this));
      this.graph.on('renameGroup', (function(_this) {
        return function(oldName, newName) {
          return _this.appendCommand('renameGroup', {
            oldName: oldName,
            newName: newName
          });
        };
      })(this));
      this.graph.on('removeGroup', (function(_this) {
        return function(group) {
          return _this.appendCommand('removeGroup', group);
        };
      })(this));
      this.graph.on('changeGroup', (function(_this) {
        return function(group, oldMeta) {
          return _this.appendCommand('changeGroup', {
            name: group.name,
            "new": group.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addExport', (function(_this) {
        return function(exported) {
          return _this.appendCommand('addExport', exported);
        };
      })(this));
      this.graph.on('removeExport', (function(_this) {
        return function(exported) {
          return _this.appendCommand('removeExport', exported);
        };
      })(this));
      this.graph.on('addInport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('addInport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('removeInport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('removeInport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('renameInport', (function(_this) {
        return function(oldId, newId) {
          return _this.appendCommand('renameInport', {
            oldId: oldId,
            newId: newId
          });
        };
      })(this));
      this.graph.on('changeInport', (function(_this) {
        return function(name, port, oldMeta) {
          return _this.appendCommand('changeInport', {
            name: name,
            "new": port.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addOutport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('addOutport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('removeOutport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('removeOutport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('renameOutport', (function(_this) {
        return function(oldId, newId) {
          return _this.appendCommand('renameOutport', {
            oldId: oldId,
            newId: newId
          });
        };
      })(this));
      this.graph.on('changeOutport', (function(_this) {
        return function(name, port, oldMeta) {
          return _this.appendCommand('changeOutport', {
            name: name,
            "new": port.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('startTransaction', (function(_this) {
        return function(id, meta) {
          return _this.startTransaction(id, meta);
        };
      })(this));
      this.graph.on('endTransaction', (function(_this) {
        return function(id, meta) {
          return _this.endTransaction(id, meta);
        };
      })(this));
    }

    Journal.prototype.startTransaction = function(id, meta) {
      if (!this.subscribed) {
        return;
      }
      if (this.entries.length > 0) {
        throw Error("Inconsistent @entries");
      }
      this.currentRevision++;
      return this.appendCommand('startTransaction', {
        id: id,
        metadata: meta
      }, this.currentRevision);
    };

    Journal.prototype.endTransaction = function(id, meta) {
      if (!this.subscribed) {
        return;
      }
      this.appendCommand('endTransaction', {
        id: id,
        metadata: meta
      }, this.currentRevision);
      this.store.putTransaction(this.currentRevision, this.entries);
      return this.entries = [];
    };

    Journal.prototype.appendCommand = function(cmd, args, rev) {
      var entry;
      if (!this.subscribed) {
        return;
      }
      entry = {
        cmd: cmd,
        args: clone(args)
      };
      if (rev != null) {
        entry.rev = rev;
      }
      return this.entries.push(entry);
    };

    Journal.prototype.executeEntry = function(entry) {
      var a;
      a = entry.args;
      switch (entry.cmd) {
        case 'addNode':
          return this.graph.addNode(a.id, a.component);
        case 'removeNode':
          return this.graph.removeNode(a.id);
        case 'renameNode':
          return this.graph.renameNode(a.oldId, a.newId);
        case 'changeNode':
          return this.graph.setNodeMetadata(a.id, calculateMeta(a.old, a["new"]));
        case 'addEdge':
          return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'removeEdge':
          return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'changeEdge':
          return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a.old, a["new"]));
        case 'addInitial':
          return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
        case 'removeInitial':
          return this.graph.removeInitial(a.to.node, a.to.port);
        case 'startTransaction':
          return null;
        case 'endTransaction':
          return null;
        case 'changeProperties':
          return this.graph.setProperties(a["new"]);
        case 'addGroup':
          return this.graph.addGroup(a.name, a.nodes, a.metadata);
        case 'renameGroup':
          return this.graph.renameGroup(a.oldName, a.newName);
        case 'removeGroup':
          return this.graph.removeGroup(a.name);
        case 'changeGroup':
          return this.graph.setGroupMetadata(a.name, calculateMeta(a.old, a["new"]));
        case 'addInport':
          return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
        case 'removeInport':
          return this.graph.removeInport(a.name);
        case 'renameInport':
          return this.graph.renameInport(a.oldId, a.newId);
        case 'changeInport':
          return this.graph.setInportMetadata(a.name, calculateMeta(a.old, a["new"]));
        case 'addOutport':
          return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata(a.name));
        case 'removeOutport':
          return this.graph.removeOutport;
        case 'renameOutport':
          return this.graph.renameOutport(a.oldId, a.newId);
        case 'changeOutport':
          return this.graph.setOutportMetadata(a.name, calculateMeta(a.old, a["new"]));
        default:
          throw new Error("Unknown journal entry: " + entry.cmd);
      }
    };

    Journal.prototype.executeEntryInversed = function(entry) {
      var a;
      a = entry.args;
      switch (entry.cmd) {
        case 'addNode':
          return this.graph.removeNode(a.id);
        case 'removeNode':
          return this.graph.addNode(a.id, a.component);
        case 'renameNode':
          return this.graph.renameNode(a.newId, a.oldId);
        case 'changeNode':
          return this.graph.setNodeMetadata(a.id, calculateMeta(a["new"], a.old));
        case 'addEdge':
          return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'removeEdge':
          return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'changeEdge':
          return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a["new"], a.old));
        case 'addInitial':
          return this.graph.removeInitial(a.to.node, a.to.port);
        case 'removeInitial':
          return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
        case 'startTransaction':
          return null;
        case 'endTransaction':
          return null;
        case 'changeProperties':
          return this.graph.setProperties(a.old);
        case 'addGroup':
          return this.graph.removeGroup(a.name);
        case 'renameGroup':
          return this.graph.renameGroup(a.newName, a.oldName);
        case 'removeGroup':
          return this.graph.addGroup(a.name, a.nodes, a.metadata);
        case 'changeGroup':
          return this.graph.setGroupMetadata(a.name, calculateMeta(a["new"], a.old));
        case 'addInport':
          return this.graph.removeInport(a.name);
        case 'removeInport':
          return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
        case 'renameInport':
          return this.graph.renameInport(a.newId, a.oldId);
        case 'changeInport':
          return this.graph.setInportMetadata(a.name, calculateMeta(a["new"], a.old));
        case 'addOutport':
          return this.graph.removeOutport(a.name);
        case 'removeOutport':
          return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata);
        case 'renameOutport':
          return this.graph.renameOutport(a.newId, a.oldId);
        case 'changeOutport':
          return this.graph.setOutportMetadata(a.name, calculateMeta(a["new"], a.old));
        default:
          throw new Error("Unknown journal entry: " + entry.cmd);
      }
    };

    Journal.prototype.moveToRevision = function(revId) {
      var entries, entry, i, j, l, len, m, n, r, ref, ref1, ref2, ref3, ref4, ref5;
      if (revId === this.currentRevision) {
        return;
      }
      this.subscribed = false;
      if (revId > this.currentRevision) {
        for (r = j = ref = this.currentRevision + 1, ref1 = revId; ref <= ref1 ? j <= ref1 : j >= ref1; r = ref <= ref1 ? ++j : --j) {
          ref2 = this.store.fetchTransaction(r);
          for (l = 0, len = ref2.length; l < len; l++) {
            entry = ref2[l];
            this.executeEntry(entry);
          }
        }
      } else {
        for (r = m = ref3 = this.currentRevision, ref4 = revId + 1; m >= ref4; r = m += -1) {
          entries = this.store.fetchTransaction(r);
          for (i = n = ref5 = entries.length - 1; n >= 0; i = n += -1) {
            this.executeEntryInversed(entries[i]);
          }
        }
      }
      this.currentRevision = revId;
      return this.subscribed = true;
    };

    Journal.prototype.undo = function() {
      if (!this.canUndo()) {
        return;
      }
      return this.moveToRevision(this.currentRevision - 1);
    };

    Journal.prototype.canUndo = function() {
      return this.currentRevision > 0;
    };

    Journal.prototype.redo = function() {
      if (!this.canRedo()) {
        return;
      }
      return this.moveToRevision(this.currentRevision + 1);
    };

    Journal.prototype.canRedo = function() {
      return this.currentRevision < this.store.lastRevision;
    };

    Journal.prototype.toPrettyString = function(startRev, endRev) {
      var e, entry, j, l, len, lines, r, ref, ref1;
      startRev |= 0;
      endRev |= this.store.lastRevision;
      lines = [];
      for (r = j = ref = startRev, ref1 = endRev; ref <= ref1 ? j < ref1 : j > ref1; r = ref <= ref1 ? ++j : --j) {
        e = this.store.fetchTransaction(r);
        for (l = 0, len = e.length; l < len; l++) {
          entry = e[l];
          lines.push(entryToPrettyString(entry));
        }
      }
      return lines.join('\n');
    };

    Journal.prototype.toJSON = function(startRev, endRev) {
      var entries, entry, j, l, len, r, ref, ref1, ref2;
      startRev |= 0;
      endRev |= this.store.lastRevision;
      entries = [];
      for (r = j = ref = startRev, ref1 = endRev; j < ref1; r = j += 1) {
        ref2 = this.store.fetchTransaction(r);
        for (l = 0, len = ref2.length; l < len; l++) {
          entry = ref2[l];
          entries.push(entryToPrettyString(entry));
        }
      }
      return entries;
    };

    Journal.prototype.save = function(file, success) {
      var json;
      json = JSON.stringify(this.toJSON(), null, 4);
      return require('fs').writeFile(file + ".json", json, "utf-8", function(err, data) {
        if (err) {
          throw err;
        }
        return success(file);
      });
    };

    return Journal;

  })(EventEmitter);

  exports.Journal = Journal;

  exports.JournalStore = JournalStore;

  exports.MemoryJournalStore = MemoryJournalStore;

}).call(this);
