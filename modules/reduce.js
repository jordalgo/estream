var estream = require('../lib');
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
  var s = estream();
  es.on(function(event) {
    if (event.isData) {
      try {
        acc = fn(acc, event.value);
      } catch (err) {
        s.error(err);
      }
    } else if (event.isError) {
      s.push(event);
    } else {
      try {
        s.end(event.value.reduce(fn, acc));
      } catch (err) {
        s.error(err).end();
      }
    }
  });
  return s;
}

module.exports = curryN(3, reduce);

