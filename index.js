var curryN = require('ramda/src/curryN');

/**
 * Transformation Functions
 * Exported curried and added as methods to the Pipe object
 **/

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

/**
 * The Pipe Object. Use pipe to create.
 *
 * @constructor
 */
function Pipe() {
  this.sourceCount = 0;
  this.pipes = [];
  this.observers = {
    next: [],
    error: [],
    complete: []
  };
}

/**
 * Notify observers and childpipes of a next value.
 *
 * @name _next
 * @private
 */
Pipe.prototype._next = function _next(value) {
  if (this._isComplete) {
    return;
  }
  this.observers.next.forEach(function(observer) {
    observer(value);
  });
  this.pipes.forEach(function(p) {
    p.next(value);
  });
};

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
Pipe.prototype.next = function next(value) {
  this._next(value);
};

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
Pipe.prototype.error = function error(err) {
  this._error(err);
};

/**
 * Notify observers and childpipes of an error.
 *
 * @name _error
 * @private
 */
Pipe.prototype._error = function _error(err) {
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
};

/**
 * Pass a complete value down the pipe.
 * Once a complete is passed, a pipe does not pass any more
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
Pipe.prototype.complete = function complete(value) {
  if (this._isComplete) {
    return;
  }
  this.observers.complete.forEach(function(observer) {
    observer(value);
  });
  this.pipes.forEach(function(p) {
    p._parentComplete(value);
  });
  this.pipes = [];
  Object.keys(this.observers).forEach(function(key) {
    this.observers[key] = [];
  }.bind(this));
  this._isComplete = true;
};

/**
 * To only be called by parent pipes.
 *
 * @name _complete
 * @private
 */
Pipe.prototype._parentComplete = function _parentComplete(value) {
  if (this.sourceCount < 2) {
    this.complete(value);
  }
  this.sourceCount--;
};

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
Pipe.prototype.addPipe = function addPipe(p) {
  if (this.pipes.indexOf(p) === -1) {
    this.pipes.push(p);
  }
  return this;
};

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
Pipe.prototype.addSources = function addSources() {
  var sources = [this].concat(Array.prototype.slice.call(arguments));
  return createPipe(sources);
};

/**
 * Ads an observer to a pipe.
 *
 * __Signature__: `Object -> Pipe a`
 *
 * @name subscribe
 * @param {Object} observer - the observing object
 * @return {Function} unsubcribe
 *
 * @example
 * var pipe1 = PH.pipe();
 * var unsubscribe = pipe1.subscribe({
 *  next: function(x) { console.log('Got a next value', x); },
 *  error: function(e) { console.log('Got an error', e); },
 *  complete: function() { console.log('The pipe completed'); }
 * });
 * unsubscribe();
 */
Pipe.prototype.subscribe = function subscribe(observer) {
  if (typeof observer.next === 'function') {
    this.observers.next.push(observer.next);
  }
  if (typeof observer.error === 'function') {
    this.observers.error.push(observer.error);
  }
  if (typeof observer.complete === 'function') {
    this.observers.complete.push(observer.complete);
  }
  return unsubscribe.bind(
    this,
    observer.next,
    observer.error,
    observer.complete
  );
};

/**
 * Unsubscribes from next, error, and complete.
 *
 * @name unsubscribe
 *
 * @example
 * var pipe1 = PH.pipe();
 * var unsubscribe = pipe1.subscribe({
 *  next: function(x) { console.log('Got a next value', x); },
 *  error: function(e) { console.log('Got an error', e); },
 *  complete: function() { console.log('The pipe completed'); }
 * });
 * unsubscribe();
 */
function unsubscribe(oNext, oError, oComplete) {
  if (oNext) {
    _removeObserver(this, 'next', oNext);
  }
  if (oError) {
    _removeObserver(this, 'error', oError);
  }
  if (oComplete) {
    _removeObserver(this, 'complete', oComplete);
  }
}

function _removeObserver(pipe, type, observer) {
  var foundIndex = -1;
  for (var i = 0; i < pipe.observers[type].length; ++i) {
    if (pipe.observers[type][i] === observer) {
      foundIndex = i;
      break;
    }
  }
  if (foundIndex !== -1) {
    pipe.observers[type].splice(foundIndex, 1);
  }
}

/**
 * Ads an observer to a pipe's next values.
 *
 * __Signature__: `(a -> *) -> Pipe a`
 *
 * @name forEach
 * @param {Function} fn - the observing function
 * @return {pipe}
 *
 * @example
 * var pipe1 = PH.pipe();
 * pipe1.forEach(console.log.bind(console));
 */
Pipe.prototype.forEach = function forEach(fn) {
  this.observers.next.push(fn);
  return this;
};

/**
 * Reroutes a pipe to a passed function.
 * This effectively breaks a pipe chain
 * and puts the responsiblity of reconnecting it
 * on the passed function.
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
 *  parentPipe.subscribe({
 *    next: function() {
 *      // do something async
 *      childPipe.next(asyncValue);
 *    }
 *  });
 * });
 */
Pipe.prototype.reroute = function reroute(fn) {
  var p = createPipe();
  fn(this, p);
  return p;
};

Pipe.prototype.map = function(fn) {
  return map(fn, this);
};

Pipe.prototype.ap = function(value) {
  return ap(value, this);
};

Pipe.prototype.scan = function(fn, acc) {
  return scan(fn, acc, this);
};

Pipe.prototype.filter = function(fn) {
  return filter(fn, this);
};

Pipe.prototype.completeOnError = function() {
  return completeOnError(this);
};

Pipe.prototype.take = function(count) {
  return take(count, this);
};

/**
 * Create a new pipe and update parent pipes if passed.
 *
 * __Signature__: `Pipe a -> Pipe b`
 *
 * @name createPipe
 * @private
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

  var pipe = new Pipe();

  sources.forEach(function(source) {
    source.addPipe(pipe);
  });

  pipe.sourceCount = sources.length;
  return pipe;
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
    Pipe.prototype[method.name] = function() {
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

