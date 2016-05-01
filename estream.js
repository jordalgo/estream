var curryN = require('ramda/src/curryN');
var EVENT_TYPES = ['data', 'error', 'end'];

// Exposed Functions

/**
 * Returns an Estream that safely maps non-error values
 * by wrapping the applied function in a try/catch.
 * Sending errors down the stream.
 *
 * __Signature__: `(a -> b) -> Estream a -> Estream b`
 *
 * @name map
 * @param {Function} fn - the mapping function
 * @param {Estream} parentEstream
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * var mEstream = estream.safeMap(add1);
 * // or
 * var mEstream = ES.safeMap(add1, estream);
 */
function safeMap(fn, parentEstream) {
  var s = createEstream();
  parentEstream.on('data', function(data) {
    var mData;
    try {
      mData = fn(data);
      s.push(mData);
    } catch (e) {
      s.error(e);
    }
  });
  parentEstream.connect(['error', 'end'], s);
  return s;
}

/**
 * Returns an Estream that maps non-error values.
 *
 * __Signature__: `(a -> b) -> Estream a -> Estream b`
 *
 * @name map
 * @param {Function} fn - the mapping function
 * @param {Estream} parentEstream
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * var mEstream = estream.map(add1);
 * // or
 * var mEstream = ES.map(add1, estream);
 */
function map(fn, parentEstream) {
  var s = createEstream();
  parentEstream.on('data', function(data) {
    s.push(fn(data));
  });
  parentEstream.connect(['error', 'end'], s);
  return s;
}

/**
 * Returns a Estream that scans non-error data.
 *
 * __Signature__: `(b -> a -> c) -> b -> Estream a -> Estream c`
 *
 * @name scan
 * @param {Function} fn - the mapping function
 * @param {Object} acc - intial value
 * @param {Estream} parentEstream - the parent pipe
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * var sEstream = estream1.scan(sum, 0);
 * // or
 * var sEstream = ES.scan(sum, 0, estream1);
 */
function scan(fn, acc, parentEstream) {
  var s = createEstream();
  parentEstream.on('data', function(data) {
    s.push(acc = fn(acc, data));
  });
  parentEstream.connect(['error', 'end'], s);
  return s;
}

/**
 * Returns a estream that filters non-error data.
 *
 * __Signature__: `(a -> Boolean) -> estream a -> estream a`
 *
 * @name filter
 * @param {Function} fn - the filtering function
 * @param {estream} parentEstream - the parent estream
 * @return {estream}
 *
 * @example
 * var estream1 = ES();
 * var mEstream = estream1.filter(isEven);
 * // or
 * var mEstream = ES.filter(isEven, estream1);
 */
function filter(fn, parentEstream) {
  var s = createEstream();
  parentEstream.on('data', function(data) {
    if (fn(data)) {
      s.push(data);
    }
  });
  parentEstream.connect(['error', 'end'], s);
  return s;
}

/**
 * The Estream Object. To create use the exposed factory function.
 *
 * @constructor
 */
function Estream() {
  this.sourceCount = 0;
  this._isFlowing = true;
  this.buffer = [];
  this.consumers = {
    data: [],
    error: [],
    end: []
  };
}

/**
 * Set _isFlowing property to false. If an estream is not flowing then any value pushed;
 * into an Estream will be stored in memory (in pushed order) until there is a consumer.
 *
 * @name pause
 * @return {Estream}
 */
Estream.prototype.pause = function() {
  this._isFlowing = false;
  return this;
};

/**
 * Set _isFlowing property to true. If an estream is not flowing then any value pushed
 * into an Estream will be stored in memory (in pushed order) until there is a consumer.
 *
 * @name resume
 * @return {Estream}
 */
Estream.prototype.resume = function() {
  this._isFlowing = true;
  if (this.buffer.length) {
    this._drain();
  }
  return this;
};

/**
 * Emit a non-error, non-end value or buffer it into memory.
 *
 * @name _emitData
 * @private
 */
Estream.prototype._emitData = function(data) {
  if (this._ended) {
    return;
  }
  if (!this._isFlowing) {
    this.buffer.push(data);
    return;
  }
  this.consumers.data.forEach(function(consumer) {
    consumer(data);
  });
};

/**
 * Emit an error value
 * if there are any consumers of error messages.
 *
 * @name _emitError
 * @private
 */
Estream.prototype._emitError = function(err) {
  if (this._ended) {
    return;
  }
  this.consumers.error.forEach(function(consumer) {
    consumer(err);
  });
};

/**
 * Pass a end value down the estream.
 * Once a end is passed, a estream does not pass any more
 * data or error values and it severs all its consumers.
 *
 * @name _end
 * @private
 */
Estream.prototype._emitEnd = function() {
  if (this._ended) {
    return;
  }
  this.consumers.end.forEach(function(consumer) {
    consumer();
  });
  Object.keys(this.consumers).forEach(function(key) {
    this.consumers[key] = [];
  }.bind(this));
  this._ended = true;
};

/**
 * Pushes data down stream.
 *
 * __Signature__: `a -> estream`
 *
 * @name push
 * @param {*} value - the value
 * @param {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.push(5);
 */
Estream.prototype.push = function(data) {
  this._emitData(data);
};

/**
 * Pushes an error down stream
 *
 * __Signature__: `a -> Estream`
 *
 * @name push
 * @param {*} value - the error
 * @param {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.error(5);
 */
Estream.prototype.error = function(error) {
  this._emitError(error);
};

/**
 * Pushes an end down stream.
 * After a stream ends no more errors or data can be pushed down stream.
 *
 * __Signature__: `a -> Estream`
 *
 * @name push
 * @param {*} value - the error
 * @param {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.end();
 */
Estream.prototype.end = function() {
  this._emitEnd();
};

/**
 * This function is passed as an observer to parent estreams.
 * So if there are multiple parent estreams we don't end when only one ends.
 *
 * @name _parentEnd
 * @private
 */
Estream.prototype._parentEnd = function() {
  if (this.sourceCount < 2) {
    this._emitEnd();
  }
  this.sourceCount--;
};

/**
 * Add a child estream to a parent
 *
 * __Signature__: `Estream b -> estream a`
 *
 * @name addEstream
 * @param {estream} s - the estream to add as a child estream.
 *
 * @example
 * var estream1 = ES();
 * var estream2 = ES();
 * estream1.addEstream(estream2);
 */
Estream.prototype.addEstream = function(s) {
  this.consumers.data.push(s.push.bind(s));
  this.consumers.error.push(s.error.bind(s));
  this.consumers.end.push(s._parentEnd.bind(s));
  return this;
};

/**
 * Connects a child Estream to a Parent Estream
 *
 * __Signature__: `[EVENT_TYPES] -> Estream a -> undefined`
 *
 * @name push
 * @param {Array} eventTypes - 'data', 'error', 'end'
 * @param {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.end();
 */
Estream.prototype.connect = function(eventTypes, childStream) {
  eventTypes.forEach(function(event) {
    if (event === 'end') {
      this.on(event, childStream._parentEnd.bind(childStream));
      childStream.sourceCount++;
    } else if (event === 'data') {
      this.on(event, childStream.push.bind(childStream));
    } else {
      this.on(event, childStream.error.bind(childStream));
    }
  }.bind(this));
};

/**
 * Creates a new estream with x amount of parent estreams.
 *
 * @name addSources
 * @param {estream} args - a list of pipes
 *
 * @example
 * var estream1 = ES();
 * var estream2 = ES();
 * var estream3 = ES();
 * var estream4 = estream1.addSources(estream2, estream3);
 */
Estream.prototype.addSources = function() {
  var sources = [this].concat(Array.prototype.slice.call(arguments));
  return createEstream(sources);
};

/**
 * Adds a consumer to a estream.
 * If the stream has data in the buffer,
 * the consuming functions will start receiving the data in the buffer on nextTick.
 *
 * __Signature__: `(a -> *) -> Estream a`
 *
 * @name on
 * @param {String} type - event type (data, error, end)
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 *
 * @example
 * var estream1 = es();
 * var off = estream1.on('data', function(x) {
 *   console.log('got some data', x);
 * });
 */
Estream.prototype.on = function(type, consumer) {
  if (EVENT_TYPES.indexOf(type) === -1) {
    throw new Error('Event type does not exist: ', type);
  }
  if (!this.buffer.length && this._ended) {
    throw new Error('The estream has ended and the buffer is empty.');
  }
  if (this.consumers[type].indexOf(consumer) === -1) {
    this.consumers[type].push(consumer);
  }
  return this;
};

/**
 * Removes a consumer from a estream.
 * If the stream has data in the buffer,
 * the consuming functions will start receiving the data in the buffer on nextTick.
 *
 * __Signature__: `(a -> *) -> Estream a`
 *
 * @name off
 * @param {String} type - event type (data, error, end)
 * @param {Function} consumer - the consuming function
 * @return {Boolean} if the consumer was found and removed.
 *
 * @example
 * var estream1 = es();
 * var off = estream1.off('data', function(x) {
 *   console.log('got some data', x);
 * });
 */
Estream.prototype.off = function(type, consumer) {
  if (EVENT_TYPES.indexOf(type) === -1) {
    throw new Error('Event type does not exist: ', type);
  }
  var foundIndex = -1;
  for (var i = 0; i < this.consumers[type].length; ++i) {
    if (this.consumers[type][i] === consumer) {
      foundIndex = i;
      break;
    }
  }
  if (foundIndex !== -1) {
    this.consumers[type].splice(foundIndex, 1);
    return true;
  }
  return false;
};

/**
 * Drain the buffer
 *
 * @name _drain
 * @private
 */
Estream.prototype._drain = function() {
  this._emitData(this.buffer);
  this.buffer = [];
};

/**
 * Reroutes an estream to a passed function.
 * This effectively breaks an estream chain
 * and puts the responsiblity of reconnecting it
 * on the passed function.
 *
 * __Signature__: `(Estream a -> estream b -> *) -> Estream b`
 *
 * @name reroute
 * @param {Function} fn - the function that takes the parent and new estream
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * estream1.reroute(function(parentEstream, childEstream) {
 *  parentEstream.on({
 *    data: function() {
 *      // do something async
 *      childEstream.push(asyncValue);
 *    }
 *  });
 * });
 */
Estream.prototype.reroute = function reroute(fn) {
  var p = createEstream();
  fn(this, p);
  return p;
};

/**
 * Returns an Estream that ends on any error.
 *
 * __Signature__: `* -> estream a`
 *
 * @name endOnError
 * @return {estream} the estream that will end on error
 */
Estream.prototype.endOnError = function() {
  var s = createEstream();
  this.on('error', function(error) {
    s.error(error);
    s.end();
  });
  this.connect(['data', 'end'], s);
  return s;
};

/**
 * Returns an Estream that batches data by count into the buffer.
 * Sets buffer to false when the count reaches 0 and emits the batched data.
 *
 * __Signature__: `Number -> estream a`
 *
 * @param {Number} count - the amount to batch
 * @return {Estream}
 */
Estream.prototype.batchByCount = function(count) {
  var s = createEstream();
  var countState = count;
  this.on('data', function(data) {
    s.push(data);
    if (countState === 1) {
      s.resume();
      countState = count;
      s.pause();
    } else {
      countState--;
    }
  });
  s.pause();
  this.connect(['error', 'end'], s);
  return s;
};


// Add Utility Methods for chaining
Estream.prototype.map = function(fn) {
  return map(fn, this);
};

Estream.prototype.scan = function(fn, acc) {
  return scan(fn, acc, this);
};

Estream.prototype.filter = function(fn) {
  return filter(fn, this);
};

/**
 * Create a new estream and update parent estreams if passed.
 *
 * __Signature__: `Estream a -> estream b`
 *
 * @name createEstream
 * @private
 * @param {Estream|Array} - an optional single or array of parent estreams
 * @return {estream} the pipe
 *
 * @example
 * var estream1 = ES();
 * var estream2 = ES(estream1);
 */
function createEstream() {
  var sources = Array.prototype.slice.call(arguments);
  if (Array.isArray(sources[0])) {
    sources = sources[0];
  }
  var estream = new Estream();
  sources.forEach(function(source) {
    source.connect(EVENT_TYPES, estream);
  });
  return estream;
}

/**
 * Add methods to the base estream object.
 *
 * __Signature__: `[Objects] -> undefined`
 *
 * @name addEstreamMethods
 * @param {Array} addedMethods - an array of objects
 *
 * @example
 * ES.addEstreamMethods({
 *  name: 'collect',
 *  fn: require('estream/modules/collect')(ES)
 * });
 */
function addEstreamMethods(addedMethods) {
  // Add methods to the estream object for chainability.
  addedMethods.forEach(function(method) {
    Estream.prototype[method.name] = function() {
      var args = Array.prototype.slice.call(arguments).concat([this]);
      return method.fn.apply(null, args);
    };
  });
}

createEstream.addEstreamMethods = addEstreamMethods;
createEstream.map = curryN(2, map);
createEstream.safeMap = curryN(2, safeMap);
createEstream.scan = curryN(3, scan);
createEstream.filter = curryN(2, filter);

module.exports = createEstream;

