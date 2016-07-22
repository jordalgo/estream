var estream = require('../lib');
var curryN = require('ramda/src/curryN');

/**
 * Returns a estream that filters the values of data events.
 * As opposed to `filter` this will catch errors generated by the filtering function
 * and send them down the stream as an EsError
 *
 * __Signature__: `(a -> Boolean) -> Estream -> Estream`
 *
 * @name safeFilter
 * @param {Function} fn - the filtering function
 * @param {Estream} es
 * @return {estream}
 *
 * @example
 * var estream1 = ES();
 * var mEstream = safeFilter(isEven, estream1);
 */
function safeFilter(fn, es) {
  return estream({
    start: function(push, error) {
      return es.on(function(event) {
        if (event.isData) {
          try {
            if (fn(event.value)) {
              push(event);
            }
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

module.exports = curryN(2, safeFilter);
