var estream = require('../estream');
var curryN = require('ramda/src/curryN');

/**
 * Returns a Estream that reduces all data and end values,
 * emitting the final value on Estream end in an EsEnd object.
 *
 * __Signature__: `(b -> a -> c) -> b -> Estream b`
 *
 * @name reduce
 * @param {Function} fn - the reducing function
 * @param {Object} acc - intial value
 * @param {Estream} es - the source estream
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * estream1.reduce(sum, 0).on(function(event) {
 *  if (event.isEnd) console.log(event.value);
 * });
 */
function reduce(fn, acc, es) {
  return estream(function(push, error, end) {
    es.on(function(event) {
      if (event.isData) {
        try {
          acc = fn(acc, event.value);
        } catch (err) {
          error(err);
        }
      } else if (event.isError) {
        push(event);
      } else {
        try {
          end(event.value.reduce(fn, acc));
        } catch (err) {
          error(err);
          end();
        }
      }
    });
  });
}

module.exports = curryN(3, reduce);

