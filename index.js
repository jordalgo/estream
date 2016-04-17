var objectAssign = require('object-assign');

var pipe = {
  next: function(value) {
    this._next(value);
  },
  _next: function(value) {
    if (this._isComplete) {
      return;
    }
    this.observers.next.forEach(function(observer) {
      observer(value);
    });
    this.pipes.forEach(function(p) {
      p.next(value);
    });
  },
  error: function(error) {
    this._error(error);
  },
  _error: function(error) {
    if (this._isComplete) {
      return;
    }
    this.observers.error.forEach(function(observer) {
      observer(error);
    });
    this.pipes.forEach(function(p) {
      p.error(error);
    });
    if (!this.pipes.length && !this.observers.error.length) {
      throw error;
    }
  },
  complete: function(value) {
    this._complete(value);
  },
  _complete: function(value) {
    if (this._isComplete) {
      return;
    }
    if (this.sourceCount < 2) {
      this.observers.complete.forEach(function(observer) {
        observer(value);
      });
      this.pipes.forEach(function(p) {
        p.complete(value);
      });
      this.pipes = [];
      Object.keys(this.observers).forEach(function(key) {
        this.observers[key] = [];
      }.bind(this));
      this._isComplete = true;
    }
    this.sourceCount--;
  },
  addPipe: function(p) {
    if (this.pipes.indexOf(p) === -1) {
      this.pipes.push(p);
    }
    return this;
  },
  addSources: function() {
    var sources = [this].concat(Array.prototype.slice.call(arguments));
    return createPipe(sources);
  },
  onNext: function(fn) {
    this.observers.next.push(fn);
    return this;
  },
  onError: function(fn) {
    this.observers.error.push(fn);
    return this;
  },
  onComplete: function(fn) {
    this.observers.complete.push(fn);
    return this;
  },
  map: function(fn) {
    var p = createPipe(this);
    p.next = function(value) {
      var mValue;
      try {
        mValue = fn(value);
        this._next(mValue);
      } catch (e) {
        this._error(e);
      }
    };
    return p;
  },
  completeOnError: function() {
    var p = createPipe(this);
    p.error = function(error) {
      p._error(error);
      p.complete();
    };
    return p;
  },
  reroute: function(fn) {
    var p = createPipe();
    fn(this, p);
    return p;
  },
  take: function(count) {
    var p = createPipe(this);
    p._nextPre = p._next;
    p._next = function(value) {
      if (count > 0) {
        p._nextPre(value);
        count--;
      } else {
        p.complete();
      }
    };
    return p;
  },
  collect: function(count) {
    var p = createPipe(this);
    var history = [];
    p.next = function(value) {
      history.push(value);
      if (count) {
        if (count > 1) {
          count--;
        } else {
          p.drain();
        }
      }
    };
    p.drain = function() {
      history.forEach(function(value) {
        p._next(value);
      });
      p.next = function(value) {
        p._next(value);
      };
      history = [];
    };
    return p;
  }
};

function createPipe() {
  var sources = Array.prototype.slice.call(arguments);
  if (Array.isArray(sources[0])) {
    sources = sources[0];
  }
  var p = objectAssign(Object.create(pipe), {
    sourceCount: 0,
    pipes: [],
    observers: {
      next: [],
      error: [],
      complete: []
    }
  });
  sources.forEach(function(source) {
    source.addPipe(p);
  });
  p.sourceCount = sources.length;
  return p;
}

module.exports = {
  pipe: createPipe
};
