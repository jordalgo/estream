var uuid = require('node-uuid');
var merge = require('ramda/src/merge');

var defaultOptions = {
  history: false,
  buffer: true,
  detach: true
};

/**
 * Base Estream event object.
 *
 * @private
 * @constructor
 * @param {*} value
 * @param {String} id
 */
function EsEvent(value, id) {
  this.value = value;
  this.estreamId = id;
}

EsEvent.prototype.isData = false;
EsEvent.prototype.isError = false;
EsEvent.prototype.isEnd = false;

EsEvent.prototype._setEstreamId = function(id) {
  this.estreamId = id;
};

/**
 * Estream Data Event object.
 *
 * @constructor
 */
function EsData() {
  EsEvent.apply(this, arguments);
}

EsData.prototype = Object.create(EsEvent.prototype);
EsData.prototype.constructor = EsData;
EsData.prototype.isData = true;

/**
 * Estream Error Event object.
 *
 * @constructor
 */
function EsError() {
  EsEvent.apply(this, arguments);
}

EsError.prototype = Object.create(EsEvent.prototype);
EsError.prototype.constructor = EsError;
EsError.prototype.isError = true;

/**
 * Estream End Event object.
 * The value kept inside this object will always be an array
 * since a stream can have multiple source/parent streams
 * and we want to keep a list of all the end event values.
 *
 * @constructor
 */
function EsEnd() {
  EsEvent.apply(this, arguments);
  this.value = (arguments.length === 0) ? [] : [arguments[0]];
}

EsEnd.prototype = Object.create(EsEvent.prototype);
EsEnd.prototype.constructor = EsEnd;
EsEnd.prototype.isEnd = true;

/**
 * @private
 * @param {EsEnd} esEnd
 */
EsEnd.prototype.concat = function(esEnd) {
  this.value = this.value.concat(esEnd.value);
};

/**
 * The Estream Object. To create use the exposed factory function.
 *
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
  this._lastSentIndex = 0;
  this._isBuffering = options.buffer;
  this._keepHistory = options.history;
  this._detach = options.detach;
  this._concatEnd = new EsEnd();

  this.history = [];
  this.sources = [];
  this.consumers = [];
}

/**
 * @private
 * @param {EsEvent} event - EsData | EsError | EsEnd
 * @param {String} estreamId - id of the estream emitting the data
 */
Estream.prototype._processEvent = function(esEvent) {
  if (this._ended) return;
  var updateHistory;
  if (!esEvent.estreamId) esEvent._setEstreamId(this.id);
  this._emitEvent(esEvent);
  if (this._keepHistory) updateHistory = true;
  if (!this.consumers.length && this._isBuffering) {
    updateHistory = true;
  } else {
    this._lastSentIndex++;
  }
  if (updateHistory) this.history.push(esEvent);
  if (esEvent.isEnd) {
    if (this._detach) {
      this.consumers = [];
    }
    this._ended = true;
  }
};

/**
 * @private
 * @param {EsEvent} event - EsData | EsError | EsEnd
 * @param {String} estreamId - id of the estream emitting the data
 */
Estream.prototype._emitEvent = function(event) {
  this.consumers.forEach(function(obj) {
    obj.fn(event, this, obj.unsubcribe);
  }.bind(this));
};

/**
 * @private
 * @param {EsEnd} esEnd
 */
Estream.prototype._parentEnd = function(esEnd) {
  var foundId = this.sources.indexOf(esEnd.estreamId);
  if (foundId !== -1) {
    this.sources.splice(foundId, 1);
    this._concatEnd.concat(esEnd);
  }
  if (this.sources.length === 0) {
    this._processEvent(this._concatEnd);
  }
};

/**
 * Add a source/parent estream id to list of sources.
 *
 * @private
 * @param {String} estreamId
 */
Estream.prototype._addSource = function(estreamId) {
  if (this.sources.indexOf(estreamId) === -1) {
    this.sources.push(estreamId);
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
 * @private
 */
Estream.prototype._emptyBuffer = function() {
  var max = this.history.length;
  this.history.slice(this._lastSentIndex, this.history.length).forEach(function(event) {
    this.consumers.forEach(function(consumer) {
      consumer.fn(event, consumer.unsubcribe);
    });
  }.bind(this));
  this._lastSentIndex = max;
};

/**
 * Pushes an event down the estream.
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
Estream.prototype.push = function(value) {
  if (arguments.length === 0) {
    return;
  }
  if (value) {
    if (value.isError) {
      this._processEvent(value);
    } else if (value.isEnd) {
      this._processEvent(value);
    } else {
      var wrappedValue = (value.isData) ? value : new EsData(value);
      this._processEvent(wrappedValue);
    }
  } else {
    this._processEvent(new EsData(value));
  }
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
  var wrappedError = (error instanceof EsError) ? error : new EsError(error);
  this._processEvent(wrappedError, estreamId || this.id);
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
Estream.prototype.end = function(value) {
  var wrappedEnd = (value instanceof EsEnd) ? value : new EsEnd(value);
  this._processEvent(wrappedEnd);
};

/**
 * Connects a child Estream to a Parent Estream
 *
 * @name connect
 * @param {Estream} childStream
 */
Estream.prototype.connect = function(childStream) {
  this.on(function(value) {
    if (value.isData || value.isError) {
      childStream.push(value);
    } else {
      childStream._parentEnd(value);
    }
  });
  childStream._addSource(this.id);
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
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 *
 * @example
 * var estream1 = es();
 * estream1.on(function(x, estream1, unsubscribe) {
 *   console.log('got some data', x);
 * });
 */
Estream.prototype.on = function(consumer) {
  if (typeof consumer !== 'function') {
    throw new Error('Consumer needs to be a function.');
  }
  if (!this.history.length && this._ended) {
    console.warn('The estream has ended and the history is empty.');
  }
  var found = this.consumers.some(function(obj) {
    return obj.fn === consumer;
  });
  if (!found) {
    this.consumers.push({ fn: consumer, unsubcribe: this.off.bind(this, consumer) });
    if (this._isBuffering && (this._lastSentIndex < this.history.length)) {
      setTimeout(this._emptyBuffer.bind(this), 0);
    }
  }
  return this;
};

/**
 * Removes a consumer from a estream.
 *
 * __Signature__: `(a -> *) -> Estream a`
 *
 * @name off
 * @param {Function} consumer - the consuming function
 * @return {Boolean} if the consumer was found and removed.
 *
 * @example
 * var estream1 = es();
 * var onEvent = function(x) { console.log(x); };
 * estream1.on(onEvent);
 * estream1.off(onEvent);
 */
Estream.prototype.off = function(consumer) {
  var foundIndex = -1;
  this.consumers.some(function(obj, index) {
    if (obj.fn === consumer) {
      foundIndex = index;
      return true;
    }
    return false;
  });
  if (foundIndex !== -1) {
    this.consumers.splice(foundIndex, 1);
    return true;
  }
  return false;
};

/**
 * A helper function for getting only data event values from Estreams.
 *
 * @name forEach
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 */
Estream.prototype.forEach = function(consumer) {
  return this.on(function(event) {
    consumer(event.value);
  });
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
 * Returns an Estream that maps data events only.
 * Catches errors that occur in the mapping fn
 * and sends the error event down the Estream.
 *
 * __Signature__: `(a -> b) -> Estream EsEvent b`
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
  this.on(function(event) {
    if (event.isData) {
      var mappedValue;
      try {
        mappedValue = fn(event.value);
        s.push(mappedValue);
      } catch (e) {
        s.error(e);
      }
    } else {
      s.push(event);
    }
  });
  return s;
};

/**
 * Returns a Estream that scans data events only.
 * Catches errors that occur in the reducing function
 * and sends the error event down the Estream.
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
  this.on(function(event) {
    if (event.isData) {
      var nextAcc;
      try {
        nextAcc = fn(acc, event.value);
        s.push(acc = nextAcc);
      } catch (e) {
        s.error(e);
      }
    } else {
      s.push(event);
    }
  });
  return s;
};

/**
 * Returns a Estream that reduces all data and end values,
 * emitting the final value on end.
 *
 * __Signature__: `(b -> a -> c) -> b -> Estream b`
 *
 * @name reduce
 * @param {Function} fn - the reducing function
 * @param {Object} acc - intial value
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * estream1.reduce(sum, 0).on('end', function(finalValue) {});
 */
Estream.prototype.reduce = function(fn, acc) {
  var s = createEstream();
  this.on('data', function(data) {
    acc = fn(acc, data);
    s.push(data);
  });
  this.on('end', function(value) {
    s.end(value.reduce(fn, acc));
  });
  this.connect(['error'], s);
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
      source.connect(estream);
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
    defaultOptions.history = true;
    defaultOptions.buffer = true;
    defaultOptions.detach = false;
  } else {
    defaultOptions = merge(defaultOptions, options);
  }
}

createEstream.addEstreamMethods = addEstreamMethods;
createEstream.setDefaultOptions = setDefaultOptions;
createEstream.error = EsError;
createEstream.end = EsEnd;

module.exports = createEstream;

