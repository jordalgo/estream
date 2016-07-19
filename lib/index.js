var ES_EVENT_TYPE = '@@EsEvent';

/**
 * Base Estream event object.
 * This is not exposed.
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
EsEvent.prototype.type = ES_EVENT_TYPE;

/**
 * Estream Data Event object.
 *
 * @example
 * estream1.on(function(event) {
 *  event.isData // true
 *  event.value // 5
 * });
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
 * Passed value does not have to be of type Error.
 *
 * @example
 * estream1.on(function(event) {
 *  event.isError // true
 *  event.value.message // 'boom'
 * });
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
 * If you don't push a value, the array is empty.
 *
 * @example
 * estream1.on(function(event) {
 *  event.isEnd // true
 *  event.value // []
 * });
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
 * When an Estream has multiple source/parent streams
 * this will concat the end values together in an array.
 *
 * @private
 * @param {EsEnd} esEnd
 */
EsEnd.prototype.concat = function(esEnd) {
  this.value = this.value.concat(esEnd.value);
};

/**
 * Start the stream / call the start function
 * with bound push, error, and end functions.
 *
 * @private
 * @param {Estream} estream
 */
function start(estream) {
  estream._startArtifact = estream._sink.start(
    push.bind(null, estream),
    error.bind(null, estream),
    end.bind(null, estream)
  );
  estream._startTimeout = false;
}

/**
 * Stop the stream / call the stop function
 * with the return value from calling the start function.
 * Note: a stream creator is not required to have a stop function.
 *
 * @private
 * @param {Estream} estream
 */
function stop(estream) {
  estream._sink.stop(estream._startArtifact);
  estream._stopTimeout = false;
}

/**
 * A pre-bound function that unsubscribes a subscriber from a stream.
 * This is returned for every "on" function.
 *
 * @name off
 * @param {Estream} estream
 * @param {Function} subscriber
 * @return {Boolean} if the subscriber is found
 */
function off(estream, subscriber) {
  var foundIndex = -1;
  estream._subscribers.some(function(obj, index) {
    if (obj.fn === subscriber) {
      foundIndex = index;
      return true;
    }
    return false;
  });
  if (foundIndex !== -1) {
    estream._subscribers.splice(foundIndex, 1);
    if (estream._subscribers.length === 0) {
      clearTimeout(estream._startTimeout);
      estream._stopTimeout = setTimeout(stop.bind(null, estream), 0);
    }
    return true;
  }
  return false;
}

/**
 * Pushes a data event down the estream.
 *
 * @name push
 * @param {Estream} estream - this value is prebound
 * @param {*} value - the value
 * @return {Estream}
 *
 * @example
 * var estream1 = ES({
 *   start: function(push) {
 *      push(5);
 *   }
 * });
 */
function push(estream, value) {
  _processEvent(
    estream,
    (value && value.type === ES_EVENT_TYPE) ? value : new EsData(value)
  );
  return estream;
}

/**
 * Pushes an error event down the estream.
 *
 * @name error
 * @param {Estream} estream - this value is prebound
 * @param {*} value - the value
 * @return {Estream}
 *
 * @example
 * var estream1 = ES({
 *   start: function(push, error) {
 *     error(new Error('boom'));
 *   }
 * });
 */
function error(estream, value) {
  _processEvent(
    estream,
    (value && value.type === ES_EVENT_TYPE) ? value : new EsError(value)
  );
  return estream;
}

/**
 * Pushes an end event down the estream.
 *
 * @name end
 * @param {Estream} estream - this value is prebound
 * @param {*} value - the value
 * @return this
 *
 * @example
 * var estream1 = ES({
 *   start: function(push, error, end) {
 *     end();
 *   }
 * });
 */
function end(estream, value) {
  if (arguments.length > 1) {
    if (value.type === ES_EVENT_TYPE) {
      _processEvent(estream, value);
    } else {
      _processEvent(estream, new EsEnd(value));
    }
  } else {
    _processEvent(estream, new EsEnd());
  }
  return estream;
}

/**
 * @private
 * @param {Estream} estream
 * @param {EsEvent} event - EsData | EsError | EsEnd
 * @param {Estream} sourceEstream - the parent stream emitting event
 */
function _processEvent(estream, esEvent, sourceEstream) {
  if (estream._ended) return;

  Object.freeze(esEvent);
  _emitEvent(estream, esEvent, sourceEstream);

  if (estream._historyCount) {
    estream._history.push(esEvent);
    if (estream._historyCount < estream._history.length) {
      estream._history.shift();
    }
  }

  if (esEvent.isEnd) {
    estream._subscribers = [];
    estream._ended = true;
  }
}

/**
 * Notify subscribers of an event.
 *
 * @private
 * @param {Estream} estream
 * @param {EsEvent} event - EsData | EsError | EsEnd
 * @param {Estream} sourceEstream
 */
function _emitEvent(estream, event, sourceEstream) {
  estream._subscribers.forEach(function(obj) {
    obj.fn(
      event,
      estream._history.slice(),
      sourceEstream || estream,
      obj.off
    );
  });
}

/**
 * If an estream has multiple parents/sources,
 * we want to wait until all end before emitting an end event.
 *
 * @private
 * @param {Estream} estream
 * @param {EsEnd} esEnd
 * @param {Estream} endingStream
 */
function _parentEnd(estream, esEnd, endingStream) {
  var foundIndex = estream._sources.indexOf(endingStream);
  if (foundIndex !== -1) {
    estream._sources.splice(foundIndex, 1);
    estream._concatEnd.concat(esEnd);
  }
  if (estream._sources.length === 0) {
    _processEvent(estream, estream._concatEnd);
  }
}

/**
 * The Estream Object. To create use the exposed factory function.
 *
 * @example
 * var ES = require('estream');
 * var estream1 = ES({
 *  start: function(push, error, end) { return x; },
 *  stop: function(x) {}
 * });
 *
 * @constructor
 * @param {Object} sink - an object with a mandatory 'start' function
 * and optional 'stop' function
 * @param {Object} options - stream options
 */
function Estream(sink, options) {
  if (!sink || typeof sink.start !== 'function') {
    throw new Error('Estream first param needs to be an object with a start function');
  }
  // these are "private" properties of this object
  // if you attempt to access or alter them, you will get undesirable effects.
  this._historyCount = (options && options.hasOwnProperty('history')) ? options.history : 0;
  this._concatEnd = new EsEnd();
  this._history = [];
  this._sources = [];
  this._subscribers = [];
  this._sink = sink;
  this._startArtifact = false;
  this._startTimeout = false;
  this._stopTimeout = false;

  if (!this._sink.stop || typeof this._sink.stop !== 'function') {
    this._sink.stop = function(x) {
      if (x && typeof x === 'function') x();
    };
  }
}

/**
 * Adds a subscriber to an estream.
 * When an event gets pushed down an estream, the subscriber will get as params:
 * - the event (EsData | EsError | EsEnd)
 * - the history (an array of past events, if the stream is maintaining a history)
 * - a reference to the source estream
 * - the off/unsubscribe function
 *
 * @name on
 * @param {Function} subscriber - the consuming function
 * @return {Function} off - the unsubscribe function
 *
 * @example
 * var estream1 = es();
 * var estream1.on(function(event, history, estream1, off) {
 *   console.log('got an event', event.value);
 * });
 */
Estream.prototype.on = function(subscriber) {
  if (typeof subscriber !== 'function') {
    throw new Error('subscriber needs to be a function.');
  }
  if (!this._history.length && this._ended) {
    console.warn('The estream has ended and the history is empty.');
  }
  var foundIndex = -1;
  this._subscribers.some(function(obj, index) {
    if (obj.fn === subscriber) {
      foundIndex = index;
      return true;
    }
    return false;
  });
  if (foundIndex === -1) {
    var offFn = off.bind(null, this, subscriber);
    this._subscribers.push({ fn: subscriber, off: offFn });

    if (this._subscribers.length === 1) {
      if (this._stopTimeout) {
        clearTimeout(this._stopTimeout);
      } else {
        this._startTimeout = setTimeout(function() {
          start(this);
        }.bind(this), 0);
      }
    }
    return offFn;
  }
  return this._subscribers[foundIndex].off;
};

/**
 * A helper function for getting only data event values from Estreams.
 *
 * @name onData
 * @param {Function} subscriber - the consuming function
 * @return {Estream}
 *
 * @example
 * estream1.onData(function(eventValue, history, estream1, off) {
 *   console.log('got an data event value', eventValue);
 * });
 */
Estream.prototype.onData = function(subscriber) {
  return this.on(function(event, history, estream, offFn) {
    if (event.isData) subscriber(event.value, history, estream, offFn);
  });
};

/**
 * A helper function for getting only error event values from Estreams.
 *
 * @name onError
 * @param {Function} subscriber - the consuming function
 * @return {Estream}
 *
 * @example
 * estream1.onError(function(eventValue, history, estream1, off) {
 *   console.log('got a error event value', eventValue);
 * });
 */
Estream.prototype.onError = function(subscriber) {
  return this.on(function(event, history, estream, offFn) {
    if (event.isError) subscriber(event.value, history, estream, offFn);
  });
};

/**
 * A helper function for getting only end event values from Estreams.
 *
 * @name onError
 * @param {Function} subscriber - the consuming function
 * @return {Estream}
 *
 * @example
 * estream1.onEnd(function(eventValue, history, estream1, off) {
 *   console.log('got a end event value', eventValue);
 * });
 */
Estream.prototype.onEnd = function(subscriber) {
  return this.on(function(event, history, estream, offFn) {
    if (event.isEnd) subscriber(event.value, history, estream, offFn);
  });
};

/**
 * Returns a record of events that have occured (if the stream is keeping a history).
 *
 * @name getHistory
 * @return {Array} - an array of events that have already occured
 */
Estream.prototype.getHistory = function() {
  return this._history.slice();
};

/**
 * Remove all stored events from the history.
 *
 * @name clearHistory
 */
Estream.prototype.clearHistory = function() {
  this._history = [];
};


/**
 * Returns an Estream that maps the values from data events.
 *
 * __Signature__: `(a -> b) -> Estream EsEvent b`
 *
 * @name map
 * @param {Function} fn - the mapping function
 * @param {Object} options - set of estream options
 * @return {Estream}
 *
 * @example
 * var mEstream = estream.map(add1);
 */
Estream.prototype.map = function(fn, options) {
  return createEstream({
    start: function(pushE) {
      return this.on(function(event) {
        if (event.isData) {
          pushE(fn(event.value));
        } else {
          pushE(event);
        }
      });
    }.bind(this)
  }, options);
};

/**
 * Returns a Estream that scans the values from data events.
 *
 * __Signature__: `(b -> a -> c) -> b -> Estream EsEvent b`
 *
 * @name scan
 * @param {Function} fn - the reducing function
 * @param {Object} acc - intial value
 * @param {Object} options - set of estream options
 * @return {Estream}
 *
 * @example
 * var sEstream = estream1.scan(sum, 0);
 */
Estream.prototype.scan = function(fn, acc, options) {
  return createEstream({
    start: function(pushE) {
      return this.on(function(event) {
        if (event.isData) {
          pushE(acc = fn(acc, event.value));
        } else {
          pushE(event);
        }
      });
    }.bind(this)
  }, options);
};

/**
 * Returns a estream that filters the values of data events.
 *
 * __Signature__: `(a -> Boolean) -> Estream EsEvent a`
 *
 * @name filter
 * @param {Function} fn - the filtering function
 * @param {Object} options - set of estream options
 * @return {estream}
 *
 * @example
 * var mEstream = estream1.filter(isEven);
 */
Estream.prototype.filter = function(fn, options) {
  return createEstream({
    start: function(pushE) {
      return this.on(function(event) {
        if (event.isData) {
          if (fn(event.value)) {
            pushE(event);
          }
        } else {
          pushE(event);
        }
      });
    }.bind(this)
  }, options);
};

/**
 * Add methods to the base estream object.
 * This is so you can chain methods easier.
 *
 * __Signature__: `[Objects] -> undefined`
 *
 * @name addMethods
 * @param {Array} addedMethods - an array of objects
 *
 * @example
 * var estream = require('estream');
 * var take = require('estream/modules/take');
 * estream.addMethods([{
 *  name: 'take',
 *  fn: take
 * }]);
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
 * Combine estreams into a new estream.
 *
 * @name combine
 * @param {Array} sources - an array of Estreams
 * @param {Object} options - set of estream options
 * @return {Estream}
 *
 * @example
 * var estream3 = ES.combine([estream1, estream2]);
 */
function combine(sources, options) {
  if (!sources || !Array.isArray(sources)) {
    throw new Error('Combine requires an array of sources.');
  }
  var estream = new Estream({
    start: function() {
      return sources.map(function(source) {
        if (estream._sources.indexOf(source) === -1) {
          estream._sources.push(source);
        }
        return source.on(function(event, history, sRef) {
          if (event.isData || event.isError) {
            _processEvent(estream, event, sRef || source);
          } else {
            _parentEnd(estream, event, source);
          }
        });
      });
    },
    stop: function(offArray) {
      offArray.forEach(function(x) { return x(); });
    }
  }, options);
  return estream;
}

/**
 * Estream factory function.
 * The only way to create a new Estream.
 *
 * @name createEstream
 * @param {Object} options - set of estream options
 * @return {Estream}
 *
 * @example
 * var es1 = estream(
 *   {
 *     start: function(push, error, end) { return x; }
 *     stop: function(x) {}
 *   },
 *   { history: 1 }
 * );
 */
function createEstream(startFn, options) {
  var estream = new Estream(startFn, options);
  return estream;
}

createEstream.addMethods = addMethods;
createEstream.combine = combine;

module.exports = createEstream;

