var estream = require('../lib');
var curryN = require('ramda/src/curryN');

/**
 * Returns a Estream that scans the values from data events.
 * It catches errors from the scan and sends them down the stream
 * as EsErrors.
 *
 * __Signature__: `(b -> a -> c) -> b -> Estream -> Estream`
 *
 * @name safeScan
 * @param {Function} fn - the reducing function
 * @param {Object} acc - intial value
 * @param {Estream} es
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * var sEstream = safeScan(sum, 0, estream1);
 */
function safeScan(fn, acc, es) {
  return estream({
    start: function(push, error) {
      return es.on(function(event) {
        if (event.isData) {
          try {
            var nextAcc = fn(acc, event.value);
            push(acc = nextAcc);
          } catch (e) {
            error(e);
          }
        } else {
          push(event);
        }
      });
    }
  });
}

module.exports = curryN(3, safeScan);

