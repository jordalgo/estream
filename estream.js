var uuid = require('node-uuid');
var merge = require('ramda/src/merge');
var EVENT_TYPES = ['data', 'error', 'end'];

var defaultOptions = {
  keepHistory: false,
  startFlowing: true,
  removeConsumersOnEnd: true
};

/**
 * Add metadata to data for history replay.
 *
 * @private
 * @param {String} event - 'data' or 'error'
 * @param {*} data
 * @param {String} estreamId
 * @return {Object}
 */
function wrapEvent(event, value, estreamId) {
  return {
    value: value,
    esType: event,
    id: estreamId,
    time: new Date().getTime()
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
  var options = merge(defaultOptions, opts || {});
  this.id = uuid.v4();
  this._isFlowing = options.startFlowing;
  this._keepHistory = options.keepHistory;
  this._removeConsumersOnEnd = options.removeConsumersOnEnd;
  this._lastIndex = 0;
  this.history = [];
  this.sources = [];
  this.consumers = {
    data: [],
    error: [],
    end: []
  };
}

/**
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
 * @private
 * @param {*} data
 * @param {String} estreamId - id of the estream emitting the data
 */
Estream.prototype._processData = function(data, estreamId) {
  if (this._ended) return;
  if (this._isFlowing) this._emitData(data, estreamId);
  if (this._keepHistory) this._updateHistory(wrapEvent('data', data, estreamId));
};

/**
 * @private
 * @param {*} data
 * @param {String} estreamId - id of the estream emitting the data
 */
Estream.prototype._emitData = function(data, estreamId) {
  this.consumers.data.forEach(function(consumer) {
    consumer(data, estreamId, this, this.off.bind(this, 'data', consumer));
  }.bind(this));
};

/**
 * @private
 * @param {*} err
 * @param {String} estreamId - id of the estream emitting the data
 */
Estream.prototype._processError = function(err, estreamId) {
  if (this._ended) return;
  if (this._isFlowing) this._emitError(err, estreamId);
  if (this._keepHistory) this._updateHistory(wrapEvent('error', err, estreamId));
};

/**
 * @private
 * @param {*} err
 * @param {String} estreamId - id of the estream emitting the data
 */
Estream.prototype._emitError = function(err, estreamId) {
  this.consumers.error.forEach(function(consumer) {
    consumer(err, estreamId, this, this.off.bind(this, 'error', consumer));
  }.bind(this));
};

/**
 * @private
 * @name _processEnd
 */
Estream.prototype._processEnd = function() {
  if (this._ended) {
    return;
  }
  this._emitEnd();
  if (this._removeConsumersOnEnd) {
    Object.keys(this.consumers).forEach(function(key) {
      this.consumers[key] = [];
    }.bind(this));
  }
  this._ended = true;
  if (this._keepHistory) {
    this._updateHistory(wrapEvent('end', null, this.id));
  }
};

/**
 * @private
 */
Estream.prototype._emitEnd = function() {
  this.consumers.end.forEach(function(consumer) {
    consumer(this.id, this, this.off.bind(this, 'end', consumer));
  }.bind(this));
};

/**
 * @private
 * @param {String} estreamId
 */
Estream.prototype._parentEnd = function(estreamId) {
  var foundId = this.sources.indexOf(estreamId);
  if (foundId !== -1) {
    this.sources.splice(foundId, 1);
  }
  if (this.sources.length === 0) {
    this._processEnd();
  }
};

/**
 * @private
 * @param {Number} count
 * @param {Number} interval
 */
Estream.prototype._replayEvent = function(count, interval) {
  var end = this.history.length - 1;
  var data = this.history[count];
  var id = data.id || this.id;
  this.consumers[data.esType].forEach(function(consumer) {
    consumer(data.value, id);
  });
  ++count;
  if (count < end || count === end) {
    var nextInterval = (this.history[count + 1]) ?
      (this.history[count + 1].time - data.time) : 0;
    setTimeout(this._replayEvent.bind(this, count, interval), interval || nextInterval);
  }
};

/**
 * Set _isFlowing property to false.
 * If a stream is not flowing it will not notify consumers of data and errors.
 *
 * @name pause
 * @return {Estream}
 */
Estream.prototype.pause = function() {
  this._isFlowing = false;
  return this;
};

/**
 * Set _isFlowing property to true.
 * If a stream is not flowing it will not notify consumers of data and errors.
 *
 * @name resume
 * @return {Estream}
 */
Estream.prototype.resume = function() {
  this._isFlowing = true;
  return this;
};

/**
 * Pushes data down the estream.
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
  this._processData(data, estreamId || this.id);
};

/**
 * Pushes an error down the estream
 *
 * __Signature__: `a -> Estream`
 *
 * @name error
 * @param {*} value - the error
 * @param {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.error(5);
 */
Estream.prototype.error = function(error, estreamId) {
  this._processError(error, estreamId || this.id);
};

/**
 * Pushes an end event down the estream.
 * After a stream ends no more errors or data can be pushed down stream.
 *
 * __Signature__: `a -> Estream`
 *
 * @name end
 * @param {*} value - the error
 * @param {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.end();
 */
Estream.prototype.end = function() {
  this._processEnd();
};

/**
 * Connects a child Estream to a Parent Estream
 *
 * __Signature__: `[EVENT_TYPES] -> Estream a -> undefined`
 *
 * @name push
 * @param {Array} eventTypes - 'data', 'error', 'end'
 * @param {Estream}
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
 * @param {estream} args - a list of estreams
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
 * estream1.on('data', function(x, estreamId, estream1, unsubscribe) {
 *   console.log('got some data', x);
 * });
 */
Estream.prototype.on = function(type, consumer) {
  if (EVENT_TYPES.indexOf(type) === -1) {
    throw new Error('Event type does not exist: ', type);
  }
  if (!this.history.length && this._ended) {
    console.warn('The estream has ended and the history is empty.');
  }
  if (this.consumers[type].indexOf(consumer) === -1) {
    this.consumers[type].push(consumer);
  }
  return this;
};

/**
 * Removes a consumer from a estream.
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
 * var onData = function(x) { console.log(x); };
 * estream1.on('data', onData);
 * estream1.off('data', onData);
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
 * An alias for calling `on('data', consumer)`.
 *
 * @name forEach
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 */
Estream.prototype.forEach = function(consumer) {
  return this.on('data', consumer);
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
        consumer(data.value, data.id || this.id);
      });
    } else {
      this.consumers.data.forEach(function(consumer) {
        consumer(data.value, data.id || this.id);
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
 * @return {Array} - an array of history events
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
 * Replay a streams events.
 * This will switch a stream back on and reflow all the events
 * in the history at that passed in interval.
 *
 *
 * @name replay
 * @param {Number} interval - the time between each replayed event
 * @param {Number} start - where to start in the history replay
 */
Estream.prototype.replay = function(interval, start) {
  setTimeout(this._replayEvent.bind(this, start || 0, interval), interval || 0);
};

/**
 * Returns an Estream that maps data.
 * Does not catch errors that occur in the mapping function,
 * for that use safeMap in modules.
 *
 * __Signature__: `(a -> b) -> Estream b`
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
 * __Signature__: `(b -> a -> c) -> b -> Estream b`
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
 * __Signature__: `(a -> Boolean) -> estream a`
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
 * Debounce data events.
 *
 * __Signature__: `Number -> Estream a`
 *
 * @name debounce
 * @param {Number} interval - the debounce timeout amount
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * var mEstream = estream.debounce(1000);
 */
Estream.prototype.debounce = function(interval) {
  var s = createEstream();
  var dataTO;
  this.on('data', function(data) {
    clearTimeout(dataTO);
    dataTO = setTimeout(function() {
      s.push(data);
    }, interval);
  });
  this.connect(['error', 'end'], s);
  return s;
};

/**
 * Create a new estream and update parent estreams if passed.
 *
 * @name createEstream
 * @param {Estream|Array} - an optional single or array of parent estreams
 * @return {estream} the pipe
 *
 * @example
 * var estream1 = ES();
 * var estream2 = ES(estream1);
 */
function createEstream(sources, options) {
  var estream = new Estream(options);
  if (sources && Array.isArray(sources)) {
    sources.forEach(function(source) {
      source.connect(EVENT_TYPES, estream);
    });
  }
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

function setDefaultOptions(options) {
  if (options.debug) {
    defaultOptions.keepHistory = true;
    defaultOptions.startFlowing = true;
    defaultOptions.removeConsumersOnEnd = false;
  } else {
    defaultOptions = merge(defaultOptions, options);
  }
}

createEstream.addEstreamMethods = addEstreamMethods;
createEstream.setDefaultOptions = setDefaultOptions;

module.exports = createEstream;

