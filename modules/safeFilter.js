var curryN = require('ramda/src/curryN');
var checkESimport = require('./checkESimport');
var ES;

module.exports = function(ESimport) {
  checkESimport(ESimport);
  ES = ESimport;
  return curryN(2, safeFilter);
};

/**
 * Returns an Estream that safely filters data
 * by wrapping the applied function in a try/catch.
 * Sending errors down the stream when there is an error.
 *
 * __Signature__: `(a -> Boolean) -> estream a -> estream a`
 *
 * @name safeFilter
 * @param {Function} fn - the filtering function
 * @param {estream} parentEstream - the parent estream
 * @return {estream}
 *
 * @example
 * var estream1 = ES();
 * var mEstream = estream1.filter(isEven);
 * // or
 * var mEstream = ES.filter(isEven, estream1);
 */
function safeFilter(fn, parentEstream) {
  var s = ES();
  parentEstream.on('data', function(data) {
    try {
      if (fn(data)) {
        s.push(data);
      }
    } catch (e) {
      s.error(e);
    }
  });
  parentEstream.connect(['error', 'end'], s);
  return s;
}

