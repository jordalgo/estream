var objectAssign = require('object-assign');
var curryN = require('ramda/src/curryN');

/**
 * Pass a next value down the pipe.
 *
 * __Signature__: `a -> undefined`
 *
 * @name next
 * @param {*} value - the value
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.next(5);
 */
function next(value) {
  this._next(value);
}

/**
 * Notify observers and childpipes of a next value.
 *
 * @name _next
 * @private
 */
function _next(value) {
  if (this._isComplete) {
    return;
  }
  this.observers.next.forEach(function(observer) {
    observer(value);
  });
  this.pipes.forEach(function(p) {
    p.next(value);
  });
}

/**
 * Pass an error down the pipe.
 *
 * __Signature__: `Error -> undefined`
 *
 * @name error
 * @param {Error} err - the error
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.error(new Error('something bad happened'));
 */
function error(err) {
  this._error(err);
}

/**
 * Notify observers and childpipes of an error.
 *
 * @name _error
 * @private
 */
function _error(err) {
  if (this._isComplete) {
    return;
  }
  this.observers.error.forEach(function(observer) {
    observer(err);
  });
  this.pipes.forEach(function(p) {
    p.error(err);
  });
  if (!this.pipes.length && !this.observers.error.length) {
    throw err;
  }
}

/**
 * Pass a complete value down the pipe.
 * Once a complete is passed a pipe does not pass any more
 * next or error values and it severs all it's child pipes
 * and observing functions.
 *
 * __Signature__: `a -> undefined`
 *
 * @name complete
 * @param {*} value - the value
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.complete('The end');
 */
function complete(value) {
  this._complete(value);
}

/**
 * Notify observers and childpipes of a complete.
 *
 * @name _complete
 * @private
 */
function _complete(value) {
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
}

/**
 * Add a child pipe to a parent
 *
 * __Signature__: `Pipe b -> Pipe a`
 *
 * @name addPipe
 * @param {pipe} p - the pipe to add as a child pipe
 *
 * @example
 * var pipe1 = PH.pipe();
 * var pipe2 = PH.pipe();
 * pipe1.addPipe(pipe2);
 */
function addPipe(p) {
  if (this.pipes.indexOf(p) === -1) {
    this.pipes.push(p);
  }
  return this;
}

/**
 * Creates a new pipe with x amount of parent-pipes/sources.
 *
 * __Signature__: `[Pipe a] -> Pipe b`
 *
 * @name addSources
 * @param {pipe} args - a list of pipes
 *
 * @example
 * var pipe1 = PH.pipe();
 * var pipe2 = PH.pipe();
 * var pipe3 = PH.pipe();
 * var pipe4 = pipe1.addSources(pipe2, pipe3);
 */
function addSources() {
  var sources = [this].concat(Array.prototype.slice.call(arguments));
  return createPipe(sources);
}

/**
 * Ads an observer to a pipe's next values
 *
 * __Signature__: `(a -> *) -> Pipe a`
 *
 * @name onNext
 * @param {Function} fn - the observing function
 * @return {pipe}
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.onNext(console.log.bind(console));
 */
function onNext(fn) {
  this.observers.next.push(fn);
  return this;
}

/**
 * Ads an observer to a pipe's errors
 *
 * __Signature__: `(a -> *) -> Pipe a`
 *
 * @name onError
 * @param {Function} fn - the observing function
 * @return {pipe}
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.onError(console.log.bind(console));
 */
function onError(fn) {
  this.observers.error.push(fn);
  return this;
}

/**
 * Ads an observer to a pipe's complete
 *
 * __Signature__: `(a -> *) -> Pipe a`
 *
 * @name onComplete
 * @param {Function} fn - the observing function
 * @return {pipe}
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.onComplete(console.log.bind(console));
 */
function onComplete(fn) {
  this.observers.complete.push(fn);
  return this;
}

/**
 * Reroutes a pipe to a passed function.
 * This effectively breaks a pipe chain
 * and puts the responsiblity of reconnecting it
 * on the app developer.
 *
 * __Signature__: `(Pipe a -> Pipe b -> *) -> Pipe b`
 *
 * @name reroute
 * @param {Function} fn - the function that takes the parent and new pipe
 * @return {pipe}
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.reroute(function(parentPipe, childPipe) {
 *  parentPipe.onNext(childPipe.next);
 *  parentPipe.onError(childPipe.error);
 *  parentPipe.onComplete(childPipe.complete);
 * });
 */
function reroute(fn) {
  var p = createPipe();
  fn(this, p);
  return p;
}

/**
 * Returns a Pipe that maps next values.
 *
 * __Signature__: `(a -> b) -> Pipe a -> Pipe b`
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
 * Returns a Pipe that applies a value to a next function
 *
 * __Signature__: `a -> Pipe (a -> b) -> Pipe b`
 *
 * @name ap
 * @param {*} value - the value applied to the pipe function
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe with the new value
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = pipe1.ap(1);
 * // or
 * var mPipe = PH.map(add1, pipe1);
 * pipe1.next(function(x) { return x + 1; });
 */
function ap(value, parentPipe) {
  var p = createPipe(parentPipe);
  p.next = function(fnValue) {
    var apValue;
    try {
      apValue = fnValue(value);
      this._next(apValue);
    } catch (e) {
      this._error(e);
    }
  };
  return p;
}

/**
 * Returns a Pipe that scans next values.
 *
 * __Signature__: `(b -> a -> c) -> b -> Pipe a -> Pipe c`
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

/**
 * Returns a Pipe that filters next values.
 *
 * __Signature__: `(a -> Boolean) -> Pipe a -> Pipe a`
 *
 * @name filter
 * @param {Function} fn - the filtering function
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe with the filtered next values.
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = pipe1.filter(isEven);
 * // or
 * var mPipe = PH.filter(isEvent, pipe1);
 */
function filter(fn, parentPipe) {
  var p = createPipe(parentPipe);
  p.next = function(value) {
    try {
      if (fn(value)) {
        this._next(value);
      }
    } catch (e) {
      this.error(e);
    }
  };
  return p;
}

/**
 * Returns a Pipe that takes x number of next values then completes.
 *
 * __Signature__: `Int -> Pipe a -> Pipe a`
 *
 * @name take
 * @param {Integer} count - the number of next values to take
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe that will only accept x number of next values
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = pipe1.take(3);
 * // or
 * var mPipe = PH.take(3, pipe1);
 */
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

/**
 * Returns a pipe that completes on any error.
 *
 * __Signature__: `Pipe a -> Pipe a`
 *
 * @name completeOnError
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe that will complete on error
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = pipe1.completeOnError();
 * // or
 * var mPipe = PH.completeOnError(pipe1);
 */
function completeOnError(parentPipe) {
  var p = createPipe(parentPipe);
  p.error = function(err) {
    p._error(err);
    p.complete();
  };
  return p;
}

var pipe = {
  _next: _next,
  _error: _error,
  _complete: _complete,
  next: next,
  error: error,
  complete: complete,
  addPipe: addPipe,
  addSources: addSources,
  onNext: onNext,
  onError: onError,
  onComplete: onComplete,
  reroute: reroute,
  map: function(fn) {
    return map(fn, this);
  },
  ap: function(value) {
    return ap(value, this);
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
  take: function(count) {
    return take(count, this);
  }
};

/**
 * Create a new pipe and update parent pipes if passed.
 *
 * __Signature__: `Pipe a -> Pipe b`
 *
 * @name createPipe
 * @param {Pipe|Array} - an optional single or array of parent pipes
 * @return {pipe} the pipe
 *
 * @example
 * var pipe1 = PH.pipe();
 * var pipe2 = PH.pipe(pipe1);
 */
function createPipe() {
  var sources = Array.prototype.slice.call(arguments);
  if (Array.isArray(sources[0])) {
    sources = sources[0];
  }

  var p = function(err, value, completeValue) {
    if (completeValue) {
      p.complete(completeValue);
    } else if (err) {
      p.error(err);
    } else {
      p.next(value);
    }
  };

  objectAssign(p, pipe);

  p.sourceCount = 0;
  p.pipes = [];
  p.observers = {
    next: [],
    error: [],
    complete: []
  };

  sources.forEach(function(source) {
    source.addPipe(p);
  });
  p.sourceCount = sources.length;
  return p;
}

/**
 * Add methods to the base pipe object.
 *
 * __Signature__: `[Objects] -> undefined`
 *
 * @name addPipeMethods
 * @param {Array} addedMethods - an array of objects
 *
 * @example
 * var pipe1 = PH.addPipeMethods({
 *  name: 'collect',
 *  fn: require('piping-hot/modules/collect')(PH.pipe)
 * });
 */
function addPipeMethods(addedMethods) {
  // Add methods to the pipe object for chainability.
  addedMethods.forEach(function(method) {
    pipe[method.name] = function() {
      var args = Array.prototype.slice.call(arguments).concat([this]);
      return method.fn.apply(null, args);
    };
  });
}

module.exports = {
  pipe: createPipe,
  map: curryN(2, map),
  ap: curryN(2, ap),
  scan: curryN(3, scan),
  filter: curryN(2, filter),
  take: curryN(2, take),
  completeOnError: completeOnError,
  addPipeMethods: addPipeMethods
};

