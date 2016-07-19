var estream = require('../lib');
var curryN = require('ramda/src/curryN');

/**
 * Creates an Estream that emits all events from a parent stream
 * until the passed function which takes an event, evaluates to true.
 *
 * __Signature__: `(EsEvent -> Bool) -> Estream -> Estream`
 *
 * @name takeUntil
 * @param {Function} fn - the function that accepts an EsEvent
 * and returns a boolean.
 * @param {Estream} es
 * @return {Estream}
 *
 * @example
 * var stream2 = stream1.takeUntil(function(event) {
 *   return event.isData && event.value === 5;
 * });
 */
function takeUntil(fn, es) {
  return estream({
    start: function(push, error, end) {
      return es.on(function(event, h, _, off) {
        push(event);
        if (fn(event)) {
          end();
          off();
        }
      });
    }
  });
}

module.exports = curryN(2, takeUntil);

