var ES_EVENT_TYPE = '@@EsEvent';
function callParam(x) { return x(); }

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
 * var ES = require('estream');
 * var estream1 = ES(function(push) {
 *  push(5);
 * });
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
 *
 * @example
 * var ES = require('estream');
 * var estream1 = ES(function(push, error) {
 *  error(new Error('boom'));
 * });
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
 * var ES = require('estream');
 * var estream1 = ES(function(push, error, end) {
 *  end();
 * });
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
 * Start the stream
 */
function start(estream) {
  estream._startArtifact = estream._sink.start(
    push.bind(null, estream),
    error.bind(null, estream),
    end.bind(null, estream)
  );
}

/**
 * Stop the stream.
 * Note: a stream creator is not required to have a stop function, so this may fire a noop.
 */
function stop(estream) {
  estream._sink.stop(estream._startArtifact);
  estream._stopTimeout = false;
}

/**
 * A pre-bound function that unsubscribes a consumer/subscriber from a stream.
 * This is returned for every "on" function.
 *
 * @name off
 * @param {Estream} estream
 * @param {Function} consumer
 * @return {Boolean}
 */
function off(estream, consumer) {
  var foundIndex = -1;
  estream._consumers.some(function(obj, index) {
    if (obj.fn === consumer) {
      foundIndex = index;
      return true;
    }
    return false;
  });
  if (foundIndex !== -1) {
    estream._consumers.splice(foundIndex, 1);
    if (estream._consumers.length === 0) {
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
 * @param {Estream} estream
 * @param {*} value - the value
 * @return {Estream}
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
 * @param {Estream} estream
 * @param {*} value - the value
 * @return {Estream}
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
 * @param {Estream} estream
 * @param {*} value - the value
 * @return this
 */
function end(estream, value) {
  if (arguments.length > 0) {
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
    estream._consumers = [];
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
  // Create new raw JS objects for each consumer as shallow form of immutability for events.
  estream._consumers.forEach(function(obj) {
    obj.fn(
      event,
      estream._history.slice(),
      sourceEstream || estream,
      obj.off
    );
  });
}

/**
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
 * The Estream Object. To create use the exposed factory function (createEstream).
 *
 * @example
 * var ES = require('estream');
 * // the passed function is called on the next event loop
 * var estream1 = ES(function(estream1){});
 *
 * @constructor
 * @param {Function} startFn - the function to fire when the first subscriber is added
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
  this._consumers = [];
  this._sink = sink;
  this._startArtifact = false;
  this._startTimeout = false;
  this._stopTimeout = false;

  if (!this._sink.stop) {
    this._sink.stop = function() {};
  }
}

/**
 * Adds a consumer/subscriber to an estream.
 * When an event gets pushed down an estream, the consumer will get as params:
 * - the event (EsData | EsError | EsEnd)
 * - a reference to the estream
 * - the off/unsubscribe function
 *
 * @name on
 * @param {Function} consumer - the consuming function
 * @return {Function} off - the unsubscribe function
 *
 * @example
 * var estream1 = es();
 * var estream1.on(function(event, estream1, off) {
 *   console.log('got an event', event.value);
 * });
 */
Estream.prototype.on = function(consumer) {
  if (typeof consumer !== 'function') {
    throw new Error('Consumer needs to be a function.');
  }
  if (!this._history.length && this._ended) {
    console.warn('The estream has ended and the history is empty.');
  }
  var foundIndex = -1;
  this._consumers.some(function(obj, index) {
    if (obj.fn === consumer) {
      foundIndex = index;
      return true;
    }
    return false;
  });
  if (foundIndex === -1) {
    var offFn = off.bind(null, this, consumer);
    this._consumers.push({ fn: consumer, off: offFn });

    if (this._consumers.length === 1) {
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
  return this._consumers[foundIndex].off;
};

/**
 * A helper function for getting only data event values from Estreams.
 *
 * @name onData
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 *
 * @example
 * var estream1 = es();
 * var estream1.onData(function(eventValue, history, estream1, off) {
 *   console.log('got an data event value', eventValue);
 * });
 */
Estream.prototype.onData = function(consumer) {
  return this.on(function(event, history, estream, offFn) {
    if (event.isData) consumer(event.value, history, estream, offFn);
  });
};

/**
 * A helper function for getting only error event values from Estreams.
 *
 * @name onError
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 *
 * @example
 * var estream1 = es();
 * var estream1.onError(function(eventValue, history, estream1, off) {
 *   console.log('got a error event value', eventValue);
 * });
 */
Estream.prototype.onError = function(consumer) {
  return this.on(function(event, history, estream, offFn) {
    if (event.isError) consumer(event.value, history, estream, offFn);
  });
};

/**
 * A helper function for getting only end event values from Estreams.
 *
 * @name onError
 * @param {Function} consumer - the consuming function
 * @return {Estream}
 *
 * @example
 * var estream1 = es();
 * var estream1.onEnd(function(eventValue, history, estream1, off) {
 *   console.log('got a end event value', eventValue);
 * });
 */
Estream.prototype.onEnd = function(consumer) {
  return this.on(function(event, history, estream, offFn) {
    if (event.isEnd) consumer(event.value, history, estream, offFn);
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
 * var estream = ES();
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
    }.bind(this),
    stop: callParam
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
 * var estream1 = ES();
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
    }.bind(this),
    stop: callParam
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
 * var estream1 = ES();
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
    }.bind(this),
    stop: callParam
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
      offArray.forEach(callParam);
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
 * var es1 = estream({ buffer: false });
 */
function createEstream(startFn, options) {
  var estream = new Estream(startFn, options);
  return estream;
}

createEstream.addMethods = addMethods;
createEstream.combine = combine;

module.exports = createEstream;

