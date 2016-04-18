var objectAssign = require('object-assign');
var curryN = require('ramda/src/curryN');

/**
 * Returns a Pipe that maps next values.
 *
 * __Signature__: `(b -> c) -> Pipe -> Pipe
 *
 * @name map
 * @param {Function} fn - the mapping function
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe with the mapped next values
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = pipe1.map(add1);
 * // or
 * var mPipe = PH.map(add1, pipe1);
 */
function map(fn, parentPipe) {
  var p = createPipe(parentPipe);
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
}

/**
 * Returns a Pipe that scans next values.
 *
 * __Signature__: `(a -> b -> c) -> a -> Pipe -> Pipe
 *
 * @name scan
 * @param {Function} fn - the mapping function
 * @param {Object} acc - intial value
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe with the scanned next values
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = pipe1.scan(sum, 0);
 * // or
 * var mPipe = PH.scan(sum, 0, pipe1);
 */
function scan(fn, acc, parentPipe) {
  var p = createPipe(parentPipe);
  p.next = function(value) {
    var accValue;
    try {
      accValue = fn(acc, value);
      this._next(acc = accValue);
    } catch (e) {
      this.error(e);
    }
  };
  return p;
}

function filter(fn, parentPipe) {
  var p = createPipe(parentPipe);
  p.next = function(value) {
    try {
      if (fn(value)) {
        this.next(value);
      }
    } catch (e) {
      this.error(e);
    }
  };
  return p;
}

function take(count, parentPipe) {
  var p = createPipe(parentPipe);
  p.next = function(value) {
    p._next(value);
    count--;
    if (count === 0) {
      p.complete();
    }
  };
  return p;
}

function collect(count, parentPipe) {
  var p = createPipe(parentPipe);
  var history = [];
  p.next = function(value) {
    history.push(value);
    if (count) {
      count--;
      if (count === 0) {
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
    history = false;
  };
  return p;
}

function completeOnError(parentPipe) {
  var p = createPipe(parentPipe);
  p.error = function(error) {
    p._error(error);
    p.complete();
  };
  return p;
}

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
    return map(fn, this);
  },
  scan: function(fn, acc) {
    return scan(fn, acc, this);
  },
  filter: function(fn) {
    return filter(fn, this);
  },
  completeOnError: function() {
    return completeOnError(this);
  },
  reroute: function(fn) {
    var p = createPipe();
    fn(this, p);
    return p;
  },
  take: function(count) {
    return take(count);
  },
  collect: function(count) {
    return collect(count);
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

module.exports = function(addedMethods) {
  if (addedMethods) {
    // Add methods to the pipe object for chainability.
    addedMethods.forEach(function(method) {
      pipe[method.name] = function() {
        var args = Array.prototype.slice.call(arguments).concat([this]);
        return method.fn.apply(null, args);
      };
    });
  }

  return {
    pipe: createPipe,
    map: curryN(2, map),
    scan: curryN(3, scan),
    filter: curryN(2, filter),
    take: curryN(2, take),
    collect: curryN(2, collect),
    completeOnError: completeOnError
  };
};

