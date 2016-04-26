var curryN = require('ramda/src/curryN');
var EVENT_TYPE = ['data', 'error', 'end'];

// Exposed Functions

/**
 * Returns an Estream that maps non-error values.
 *
 * __Signature__: `(a -> b) -> Estream a -> Estream b`
 *
 * @name map
 * @param {Function} fn - the mapping function
 * @param {Boolean} safe - if true, wraps the map in a try/catch (default: false)
 * @param {Estream} parentEstream
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * var mEstream = estream.map(add1, true);
 * // or
 * var mEstream = ES.map(add1, estream);
 */
function map(fn, safe, parentEstream) {
  var s = createEstream(parentEstream);
  if (!safe) {
    s._pushData = function(value) {
      this._emitData(fn(value));
    };
  } else {
    s._pushData = function(value) {
      var mValue;
      try {
        mValue = fn(value);
        this._emitData(mValue);
      } catch (e) {
        this._emitError(e);
      }
    };
  }
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
 * @param {Boolean} safe - if true, wraps the scan in a try/catch (default: false)
 * @param {Estream} parentEstream - the parent pipe
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * var sEstream = estream1.scan(sum, 0, true);
 * // or
 * var sEstream = ES.scan(sum, 0, estream1);
 */
function scan(fn, acc, safe, parentEstream) {
  var s = createEstream(parentEstream);
  if (safe) {
    s._pushData = function(value) {
      var accValue;
      try {
        accValue = fn(acc, value);
        this._emitData(acc = accValue);
      } catch (e) {
        this._emitError(e);
      }
    };
  } else {
    s._pushData = function(value) {
      this._emitData(acc = fn(acc, value));
    };
  }
  return s;
}

/**
 * Returns a estream that filters non-error data.
 *
 * __Signature__: `(a -> Boolean) -> estream a -> estream a`
 *
 * @name filter
 * @param {Function} fn - the filtering function
 * @param {Boolean} safe - if true, wraps the scan in a try/catch (default: false)
 * @param {estream} parentEstream - the parent estream
 * @return {estream}
 *
 * @example
 * var estream1 = ES();
 * var mEstream = estream1.filter(isEven);
 * // or
 * var mEstream = ES.filter(isEven, estream1);
 */
function filter(fn, safe, parentEstream) {
  var s = createEstream(parentEstream);
  if (safe) {
    s._pushData = function(value) {
      try {
        if (fn(value)) {
          this._emitData(value);
        }
      } catch (e) {
        this._emitError(e);
      }
    };
  } else {
    s._pushData = function(value) {
      if (fn(value)) {
        this._emitData(value);
      }
    };
  }
  return s;
}

/**
 * The Estream Object. To create use the exposed factory function.
 *
 * @constructor
 */
function Estream() {
  this.sourceCount = 0;
  this._isBuffering = false;
  this.buffer = [];
  this.consumers = {
    data: [],
    error: [],
    end: []
  };
}

/**
 * Set _isBuffering property. If buffering is turned on then any value pushed
 * into an Estream will be stored in memory (in pushed order) until there is a consumer.
 *
 * @name setBuffer
 * @param {Boolean} bool
 * @return {Estream}
 */
Estream.prototype.setBuffer = function(bool) {
  this._isBuffering = bool === true;
  return this;
};

/**
 * Emit a non-error, non-end value or buffer it into memory.
 *
 * @name _emitData
 * @private
 */
Estream.prototype._emitData = function(data) {
  if (!this.consumers.data.length && this._isBuffering) {
    this.buffer.push(data);
    return;
  }
  this.consumers.data.forEach(function(consumer) {
    consumer(data);
  });
};

/**
 * Emit an error value or buffer it into memory.
 * If there are any consumers (of either data or end value) but no error,
 * and we're not buffering re-throw the error.
 *
 * @name _emitError
 * @private
 */
Estream.prototype._emitError = function(err) {
  if (!this.consumers.error.length && this._isBuffering) {
    this.buffer.push(err);
    return;
  }
  if ((this.consumers.data.length || this.consumers.end.length) && !this.consumers.error.length) {
    throw err;
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
  this.consumers.end.forEach(function(consumer) {
    consumer();
  });
  Object.keys(this.consumers).forEach(function(key) {
    this.consumers[key] = [];
  }.bind(this));
  this._ended = true;
};

/**
 * Estreams non-error, non-end values.
 * This exists to get overwritten by transformations (map, scan, etc...)
 *
 * @name _pushData
 * @private
 * @param {*} value - a non error value
 */
Estream.prototype._pushData = function(data) {
  this._emitData(data);
};

/**
 * Pass data down the estream.
 * If the data is an instanceof Error, it will get routed differently.
 * If you call this function with no arguments, you end the estream.
 * This will also throw if you try to push data into an ended estream.
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
 * estream1.push(new Error('boom'));
 * estream1.push(); // ends the estream.
 */
Estream.prototype.push = function(value) {
  if (this._ended) {
    throw new Error('Estream has ended. Can no longer push values.');
  }
  if (arguments.length === 0) {
    this._emitEnd();
    return;
  }
  if (value instanceof Error) {
    this._emitError(value);
  } else {
    this._pushData(value);
  }
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
  this.consumers.error.push(s.push.bind(s));
  this.consumers.end.push(s._parentEnd.bind(s));
  return this;
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
  if (EVENT_TYPE.indexOf(type) === -1) {
    throw new Error('Event type does not exist: ', type);
  }
  if (!this.buffer.length && this._ended) {
    throw new Error('The estream has ended and the buffer is empty.');
  }
  this.consumers[type].push(consumer);
  if (this.buffer.length) {
    setTimeout(function() {
      this._drain();
    }.bind(this), 0);
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
  if (EVENT_TYPE.indexOf(type) === -1) {
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
 * Drain the values out of the buffer
 *
 * @name _drain
 * @private
 */
Estream.prototype._drain = function() {
  this.buffer.forEach(function(value) {
    if (value instanceof Error) {
      this._emitError(value);
    } else {
      this._emitData(value);
    }
  }.bind(this));
  this.buffer = [];
  if (this._ended) {
    this._emitEnd();
  }
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
  var s = createEstream(this);
  s._emitError = function() {
    Estream.prototype._emitError.apply(this, arguments);
    this._emitEnd();
  };
  return s;
};


// Add Utility Methods for chaining
Estream.prototype.map = function(fn, safe) {
  return map(fn, safe, this);
};

Estream.prototype.scan = function(fn, acc, safe) {
  return scan(fn, acc, safe, this);
};

Estream.prototype.filter = function(fn, safe) {
  return filter(fn, safe, this);
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
    source.addEstream(estream);
  });

  estream.sourceCount = sources.length;
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
createEstream.map = curryN(3, map);
createEstream.scan = curryN(4, scan);
createEstream.filter = curryN(3, filter);

module.exports = createEstream;

