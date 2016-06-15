var estream = require('../lib');
var curryN = require('ramda/src/curryN');

/**
 * Creates an Estream that emits all events from a parent stream
 * until a second stream emits a specific event type.
 * If the passed eventType is any other value then if any event is emitted
 * from the second stream the created stream ends.
 *
 * __Signature__: `Number -> Estream`
 *
 * @name take
 * @param {String} eventType - 'data' | 'error' | 'end' or null
 * @param {Estream} parent - the source estream
 * @param {Estream} ender
 * @return {Estream}
 *
 * @example
 * var stream2 = stream1.take(3);
 */
function takeUntil(eventType, parent, ender) {
  var endRef;
  function endFn(event, _, off) {
    endRef();
    off();
  }
  if (eventType === 'data') {
    ender.onData(endFn);
  } else if (eventType === 'error') {
    ender.onError(endFn);
  } else if (eventType === 'end') {
    ender.onEnd(endFn);
  } else {
    ender.on(endFn);
  }
  var takeStream = estream(function(push, error, end) {
    endRef = end;
    parent.on(function(event) {
      push(event);
    });
  });
  return takeStream;
}

module.exports = curryN(2, takeUntil);

