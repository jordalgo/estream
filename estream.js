var merge = require('ramda/src/merge');

var defaultOptions = {
  history: false,
  buffer: true,
  detach: true
};

/**
 * @name off
 * @private
 * @param {Estream} estream
 * @param {Function} consumer
 * @return {Boolean}
 */
function off(estream, consumer) {
  var foundIndex = -1;
  estream.consumers.some(function(obj, index) {
    if (obj.fn === consumer) {
      foundIndex = index;
      return true;
    }
    return false;
  });
  if (foundIndex !== -1) {
    estream.consumers.splice(foundIndex, 1);
    return true;
  }
  return false;
}

/**
 * @private
 * @param {Estream} estream
 * @param {EsEvent} event - EsData | EsError | EsEnd
 * @param {Estream} sourceEstream - the parent stream emitting event
 */
function _processEvent(estream, esEvent, sourceEstream) {
  if (estream._ended) return;

  var updateHistory;

  Object.freeze(esEvent);
  _emitEvent(estream, esEvent, sourceEstream);

  if (estream._keepHistory) updateHistory = true;
  if (!estream.consumers.length && estream._isBuffering) {
    updateHistory = true;
  } else {
    estream._lastSentIndex++;
  }
  if (updateHistory) estream.history.push(esEvent);
  if (esEvent.isEnd) {
    if (estream._detach) {
      estream.consumers = [];
    }
    estream._ended = true;
  }
}

/**
 * Notify consumers of an event.
 *
 * @private
 * @param {Estream} estream
 * @param {EsEvent} event - EsData | EsError | EsEnd
 * @param {Estream} sourceEstream
 */
function _emitEvent(estream, event, sourceEstream) {
  estream.consumers.forEach(function(obj) {
    obj.fn(event, sourceEstream || estream, obj.off);
  });
}

/**
 * @private
 * @param {Estream} estream
 * @param {EsEnd} esEnd
 * @param {Estream} endingStream
 */
function _parentEnd(estream, esEnd, endingStream) {
  var foundIndex = estream.sources.indexOf(endingStream);
  if (foundIndex !== -1) {
    estream.sources.splice(foundIndex, 1);
    estream._concatEnd.concat(esEnd);
  }
  if (estream.sources.length === 0) {
    _processEvent(estream, estream._concatEnd);
  }
}

/**
 * Add a source/parent estream to list of sources.
 *
 * @private
 * @param {Estream} estream
 * @param {Estream} sourceEstream
 */
function _addSource(estream, sourceEstream) {
  if (estream.sources.indexOf(sourceEstream) === -1) {
    estream.sources.push(sourceEstream);
  }
}

/**
 * Connects a child Estream to an Estream
 *
 * @private
 * @name connect
 * @param {Estream} parent
 * @param {Estream} child
 */
function _connect(parent, child) {
  parent.on(function(event, source) {
    if (event.isData || event.isError) {
      _processEvent(child, event, source || parent);
    } else {
      _parentEnd(child, event, parent);
    }
  });
  _addSource(child, parent);
}


/**
 * @private
 * @param {Estream} estream
 * @param {Number} count
 * @param {Number} interval
 */
function _replayEvent(estream, count, interval) {
  var end = estream.history.length - 1;
  var event = estream.history[count];
  _emitEvent(estream, event);
  ++count;
  if (count < end || count === end) {
    setTimeout(_replayEvent.bind(null, estream, count, interval), interval);
  }
}

/**
 * @private
 * @param {Estream} estream
 */
function _emptyBuffer(estream) {
  var max = estream.history.length;
  estream.history
  .slice(estream._lastSentIndex, estream.history.length)
  .forEach(function(event) {
    _emitEvent(estream, event);
  });
  estream._lastSentIndex = max;
}

/**
 * Base Estream event object.
 * This is not exposed directly. Please use:
 * EsData, EsEvent, or EsEnd - which inherit from this base object.
 *
 * @constructor
 * @param {*} value
 */
function EsEvent(value) {
  this.value = value;
}

EsEvent.prototype.isData = false;
EsEvent.prototype.isError = false;
EsEvent.prototype.isEnd = false;

/**
 * Estream Data Event object.
 *
 * @example
 * var ES = require('estream');
 * var estream1 = ES();
 * estream1.push(new Es.Data(5));
 * // or
 * estream1.push(5); // which wraps this value in an EsData object
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
 * @example
 * var ES = require('estream');
 * var estream1 = ES();
 * estream1.push(new Es.Error('bad thing'));
 * // or
 * estream1.error('bad thing'); // which wraps this value in an EsError object
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
 * If you don't push a value, the array is just empty.
 *
 * @example
 * var ES = require('estream');
 * var estream1 = ES();
 * estream1.push(new Es.End('my end val'));
 * // or
 * estream1.end('my end val'); // which wraps this value in an EsEnd object
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
 * Use when an Estream has multiple source/parent streams
 * to concat the end values together in an array.
 *
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
  this._isBuffering = options.buffer;
  this._keepHistory = options.history;
  this._detach = options.detach;

  this._concatEnd = new EsEnd();
  this._lastSentIndex = 0;
  this.history = [];
  this.sources = [];
  this.consumers = [];
}


/**
 * Pushes an event down the estream.
 * If the value isn't an EsData, EsError, or EsEnd object,
 * the value is wrapped in an EsData object.
 *
 * __Signature__: `* -> Estream`
 *
 * @name push
 * @param {*} value - the value
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.push(5);
 */
Estream.prototype.push = function(value) {
  if (arguments.length === 0) {
    return this;
  }
  if (value) {
    if (value.isError) {
      _processEvent(this, value);
    } else if (value.isEnd) {
      _processEvent(this, value);
    } else {
      var wrappedValue = (value.isData) ? value : new EsData(value);
      _processEvent(this, wrappedValue);
    }
  } else {
    _processEvent(this, new EsData(value));
  }
  return this;
};

/**
 * Pushes an error down the estream wrapped in an EsError.
 *
 * __Signature__: `* -> Estream`
 *
 * @name error
 * @param {*} value - the error
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.error(new Error('boom'));
 */
Estream.prototype.error = function(error) {
  var wrappedError = (error instanceof EsError) ? error : new EsError(error);
  _processEvent(this, wrappedError);
  return this;
};

/**
 * Pushes an end event down the estream.
 * After a stream ends no more errors or data can be pushed down stream.
 *
 * __Signature__: `a -> Estream`
 *
 * @name end
 * @param {*} value - the error
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * estream1.end();
 */
Estream.prototype.end = function(value) {
  if (arguments.length === 0) {
    _processEvent(this, new EsEnd());
    return this;
  }
  var wrappedEnd = (value instanceof EsEnd) ? value : new EsEnd(value);
  _processEvent(this, wrappedEnd);
  return this;
};

/**
 * Creates a new estream with X amount of parent estreams.
 *
 * @name addSources
 * @param {Array} estreams - an Array of estreams
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * var estream2 = ES();
 * var estream3 = ES();
 * var estream4 = estream1.addSources([estream2, estream3]);
 */
Estream.prototype.addSources = function(estreams) {
  return createEstream([this].concat(estreams));
};

/**
 * Adds a consumer to an estream.
 * When an event gets pushed down this estream,
 * the consumer will get as params:
 * - the event (EsData | EsError | EsEnd)
 * - a reference to the estream
 * - the off/unsubscribe function
 *
 * __Signature__: `(a -> *) -> Estream a`
 *
 * @name on
 * @param {Function} consumer - the consuming function
 * @return {Function} off - the unsubscribe function
 *
 * @example
 * var estream1 = es();
 * var estream1.on(function(event, estream1, unsubscribe) {
 *   console.log('got an event', event.value);
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
  var offFn;
  if (!found) {
    offFn = off.bind(null, this, consumer);
    this.consumers.push({ fn: consumer, off: offFn });
    if (this._isBuffering && (this._lastSentIndex < this.history.length)) {
      setTimeout(_emptyBuffer.bind(null, this), 0);
    }
  }
  return offFn;
};

/**
 * A helper function for getting only data events from Estreams.
 *
 * @name onData
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 */
Estream.prototype.onData = function(consumer) {
  return this.on(function(event, estream, offFn) {
    if (event.isData) consumer(event, estream, offFn);
  });
};

/**
 * A helper function for getting only error events from Estreams.
 *
 * @name onError
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 */
Estream.prototype.onError = function(consumer) {
  return this.on(function(event, estream, offFn) {
    if (event.isError) consumer(event, estream, offFn);
  });
};

/**
 * A helper function for getting only end events from Estreams.
 *
 * @name onError
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 */
Estream.prototype.onEnd = function(consumer) {
  return this.on(function(event, estream, offFn) {
    if (event.isEnd) consumer(event, estream, offFn);
  });
};

/**
 * Sets the _keepHistory property. Set to true by default.
 * If this is set to true then an Estream keeps a record of all it's pushed events.
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
 * Get events out of the history
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
 * Remove all stored events from the history.
 *
 * @name clearHistory
 */
Estream.prototype.clearHistory = function() {
  this.history = [];
};

/**
 * Replay a streams events.
 * This will switch a stream back on and reflow all the events
 * in the history at that passed in interval.
 *
 * @name replay
 * @param {Number} interval - the time between each replayed event
 * @param {Number} start - where to start in the history replay
 */
Estream.prototype.replay = function(interval, start) {
  setTimeout(_replayEvent.bind(null, this, start || 0, interval), interval || 0);
};

/**
 * Returns an Estream that maps the values from data events.
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
 * Returns a Estream that scans the values from data events.
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
 * Returns a estream that filters the values of data events.
 * Catches errors that occur in the filtering function
 * and sends the error event down the Estream.
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
  this.on(function(event) {
    if (event.isData) {
      try {
        if (fn(event.value)) {
          s.push(event);
        }
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
 * Creates a new Estream that filters EsEvents themselves,
 * as opposed to the data within an EsData event.
 *
 * @example
 * var estream1 = ES();
 * estream1.filterEvent(function(e) {
 *  return e.isData;
 * });
 *
 * @name filterEvent
 * @param {Function} fn - the filtering function
 * @return {Estream}
 */
Estream.prototype.filterEvent = function(fn) {
  var s = createEstream();
  this.on(function(event) {
    if (fn(event)) s.push(event);
  });
  return s;
};

/**
 * Returns a Estream that reduces all data and end values,
 * emitting the final value on Estream end in an EsEnd object.
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
 * estream1.reduce(sum, 0).on(function(event) {
 *  if (event.isEnd) console.log(event.value);
 * });
 */
Estream.prototype.reduce = function(fn, acc) {
  var s = createEstream();
  this.on(function(event) {
    if (event.isData) {
      try {
        acc = fn(acc, event.value);
      } catch (e) {
        s.error(e);
      }
    } else if (event.isError) {
      s.push(event);
    } else {
      try {
        s.end(event.value.reduce(fn, acc));
      } catch (e) {
        s.error(e);
        s.end();
      }
    }
  });
  return s;
};

/**
 * Add methods to the base estream object.
 *
 * __Signature__: `[Objects] -> undefined`
 *
 * @name addMethods
 * @param {Array} addedMethods - an array of objects
 *
 * @example
 * ES.addEstreamMethods({
 *  name: 'collect',
 *  fn: function collect() {}
 * });
 */
function addMethods(addedMethods) {
  // Add methods to the estream object for chainability.
  addedMethods.forEach(function(method) {
    Estream.prototype[method.name] = function() {
      var args = Array.prototype.slice.call(arguments).concat([this]);
      return method.fn.apply(null, args);
    };
  });
}

/**
 * Override the default options for all created Estreams
 *
 * @param {Object} options
 */
function setDefaultOptions(options) {
  if (options.debug) {
    defaultOptions.history = true;
    defaultOptions.buffer = true;
    defaultOptions.detach = false;
  } else {
    defaultOptions = merge(defaultOptions, options);
  }
}

/**
 * Estream factory function.
 * The only way to create a new blank Estream.
 *
 * @name createEstream
 * @param {Estream|Array} - an optional single or array of parent estreams
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * var estream2 = ES([estream1]);
 */
function createEstream(sources, options) {
  var estream = new Estream(options);
  if (sources && Array.isArray(sources)) {
    sources.forEach(function(source) {
      _connect(source, estream);
    });
  }
  return estream;
}

createEstream.addMethods = addMethods;
createEstream.setDefaultOptions = setDefaultOptions;
createEstream.Error = EsError;
createEstream.End = EsEnd;
createEstream.Data = EsData;

module.exports = createEstream;

