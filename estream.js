var uuid = require('node-uuid');
var EVENT_TYPES = ['data', 'error', 'end'];

// Default settings for new streams;
var keepHistory = true;
var startFlowing = true;

/**
 * Add metadata to errors for history replay.
 *
 * @private
 * @param {*} error
 * @param {String} estreamId
 * @return {Object}
 */
function wrapError(error, estreamId) {
  return {
    value: error,
    esType: 'error',
    id: estreamId
  };
}

/**
 * Add metadata to data for history replay.
 *
 * @private
 * @param {*} data
 * @param {String} estreamId
 * @return {Object}
 */
function wrapData(data, estreamId) {
  return {
    value: data,
    esType: 'data',
    id: estreamId
  };
}

/**
 * The Estream Object. To create use the exposed factory function.
 * @example
 * var ES = require('estream');
 * var estream1 = ES();
 *
 * @constructor
 * @param {Object} opts - stream options
 */
function Estream(opts) {
  this.id = uuid.v4();
  this._isFlowing = startFlowing;
  this._lastIndex = 0;
  this._keepHistory = keepHistory;
  this.history = [];
  this.sources = [];
  this.consumers = {
    data: [],
    error: [],
    end: []
  };
}

/**
 * Set _isFlowing property to false. If an estream is not flowing then any value pushed
 * into it will be stored in the history (if _keepHistory is also true).
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
 * into it will be stored in the history (if _keepHistory is also true).
 *
 * @name resume
 * @return {Estream}
 */
Estream.prototype.resume = function() {
  this._isFlowing = true;
  return this;
};

/**
 * Update the history array with either a wrapped data or a wrapped error.
 *
 * @private
 * @param {Object} message - wrapped data or wrapped error
 */
Estream.prototype._updateHistory = function(message) {
  if (this._isFlowing) {
    this._lastIndex++;
  }
  this.history.push(message);
};

/**
 * Emit a non-error, non-end value or history it into memory.
 *
 * @name _emitData
 * @param {*} data
 * @param {String} estreamId - id of the estream emitting the data
 * @private
 */
Estream.prototype._emitData = function(data, estreamId) {
  if (this._ended) {
    return;
  }
  if (!this._isFlowing && !this._keepHistory) {
    return;
  }
  if (this._isFlowing) {
    this.consumers.data.forEach(function(consumer) {
      consumer(data, estreamId);
    });
  }
  if (this._keepHistory) {
    this._updateHistory(wrapData(data, estreamId));
  }
};

/**
 * Emit an error value
 * if there are any consumers of error messages.
 *
 * @name _emitError
 * @param {*} err
 * @param {String} estreamId - id of the estream emitting the data
 * @private
 */
Estream.prototype._emitError = function(err, estreamId) {
  if (this._ended) {
    return;
  }
  if (!this._isFlowing && !this._keepHistory) {
    return;
  }
  if (this._isFlowing) {
    this.consumers.error.forEach(function(consumer) {
      consumer(err, estreamId);
    });
  }
  if (this._keepHistory) {
    this._updateHistory(wrapError(err, estreamId));
  }
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
    consumer(this.id);
  }.bind(this));
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
Estream.prototype.push = function(data, estreamId) {
  this._emitData(data, estreamId || this.id);
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
Estream.prototype.error = function(error, estreamId) {
  this._emitError(error, estreamId || this.id);
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
 * @param {String} estreamId
 */
Estream.prototype._parentEnd = function(estreamId) {
  var foundId = this.sources.indexOf(estreamId);
  if (foundId !== -1) {
    this.sources.splice(foundId, 1);
  }
  if (this.sources.length === 0) {
    this._emitEnd();
  }
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
      childStream.addSource(this.id);
    } else if (event === 'data') {
      this.on(event, childStream.push.bind(childStream));
    } else {
      this.on(event, childStream.error.bind(childStream));
    }
  }.bind(this));
};

Estream.prototype.addSource = function(estreamId) {
  if (this.sources.indexOf(estreamId) === -1) {
    this.sources.push(estreamId);
  }
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
 * If the stream has data in the history,
 * the consuming functions will start receiving the data in the history on nextTick.
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
  if (!this.history.length && this._ended) {
    throw new Error('The estream has ended and the history is empty.');
  }
  if (this.consumers[type].indexOf(consumer) === -1) {
    this.consumers[type].push(consumer);
  }
  return this;
};

/**
 * Removes a consumer from a estream.
 * If the stream has data in the history,
 * the consuming functions will start receiving the data in the history on nextTick.
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
 * Sets the _keepHistory property. Set to true by default.
 * If this is set to true then an Estream keeps a record of all it's pushed data and errors.
 *
 * @name keepHistory
 * @param {Boolean} keep
 * @return {Estream}
 */
Estream.prototype.keepHistory = function(keep) {
  this._keepHistory = keep === true;
  return this;
};

/**
 * Drain any history messages that have accumulated while estream is paused
 * and turns flowing on.
 *
 * @name drain
 */
Estream.prototype.drain = function() {
  this._isFlowing = true;
  this.history.slice(this._lastIndex, this.history.length).forEach(function(data) {
    if (data.esType && data.esType === 'error') {
      this.consumers.error.forEach(function(consumer) {
        consumer(data.value, data.source || this);
      });
      this._emitError(data.value, data.sourceStream);
    } else {
      this.consumers.data.forEach(function(consumer) {
        consumer(data.value, data.source || this);
      });
    }
  }.bind(this));
  this._lastIndex = this.history.length;
};

/**
 * Get data out of the history
 *
 * @name getHistory
 * @param {Number} start - when to start in reading from the history
 * @param {Number} end - when to end when reading from the history
 * @return {Array} - an array of historyed events
 */
Estream.prototype.getHistory = function(start, end) {
  return this.history.slice(start || 0, end || this.history.length);
};

/**
 * Clear the history queue.
 *
 * @param clearHistory
 */
Estream.prototype.clearHistory = function() {
  this.history = [];
  this._lastIndex = 0;
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
 * Returns an Estream that maps data.
 * Does not catch errors that occur in the mapping function,
 * for that use safeMap in modules.
 *
 * __Signature__: `(a -> b) -> Estream a -> Estream b`
 *
 * @name map
 * @param {Function} fn - the mapping function
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * var mEstream = estream.map(add1);
 */
Estream.prototype.map = function(fn) {
  var s = createEstream();
  this.on('data', function(data) {
    s.push(fn(data));
  });
  this.connect(['error', 'end'], s);
  return s;
};

/**
 * Returns a Estream that scans data.
 * Does not catch errors that occur in the scanning (reducing) function,
 * for that use safeScan in modules.
 *
 * __Signature__: `(b -> a -> c) -> b -> Estream a -> Estream c`
 *
 * @name scan
 * @param {Function} fn - the reducing function
 * @param {Object} acc - intial value
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * var sEstream = estream1.scan(sum, 0);
 */
Estream.prototype.scan = function(fn, acc) {
  var s = createEstream();
  this.on('data', function(data) {
    s.push(acc = fn(acc, data));
  });
  this.connect(['error', 'end'], s);
  return s;
};

/**
 * Returns a estream that filters non-error data.
 * Does not catch errors that occur in the filtering function,
 * for that use safeFilter in modules.
 *
 * __Signature__: `(a -> Boolean) -> estream a -> estream a`
 *
 * @name filter
 * @param {Function} fn - the filtering function
 * @return {estream}
 *
 * @example
 * var estream1 = ES();
 * var mEstream = estream1.filter(isEven);
 */
Estream.prototype.filter = function(fn) {
  var s = createEstream();
  this.on('data', function(data) {
    if (fn(data)) {
      s.push(data);
    }
  });
  this.connect(['error', 'end'], s);
  return s;
};

/**
 * Create a new estream and update parent estreams if passed.
 *
 * __Signature__: `Estream a -> estream b`
 *
 * @name createEstream
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

function setOptions(options) {
  if (options.hasOwnProperty('keepHistory')) {
    keepHistory = options.keepHistory;
  }
  if (options.hasOwnProperty('startFlowing')) {
    startFlowing = options.startFlowing;
  }
}

createEstream.addEstreamMethods = addEstreamMethods;
createEstream.setOptions = setOptions;

module.exports = createEstream;

