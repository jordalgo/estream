var curryN = require('ramda/src/curryN');
var checkESimport = require('./checkESimport');
var ES;

module.exports = function(ESimport) {
  checkESimport(ESimport);
  ES = ESimport;
  return curryN(2, safeScan);
};

/**
 * Returns an Estream that safely scans data
 * by wrapping the applied function in a try/catch.
 * Sending errors down the stream when there is an error.
 *
 * __Signature__: `(b -> a -> c) -> b -> Estream a -> Estream c`
 *
 * @name safeScan
 * @param {Function} fn - the reducing function
 * @param {Object} acc - intial value
 * @param {Estream} parentEstream - the parent pipe
 * @return {Estream}
 *
 * @example
 * var estream1 = ES();
 * var sEstream = estream1.safeScan(sum, 0);
 * // or
 * var sEstream = ES.safeScan(sum, 0, estream1);
 */
function safeScan(fn, acc, parentEstream) {
  var s = ES();
  parentEstream.on('data', function(data) {
    var accValue;
    try {
      accValue = fn(data, acc);
      s.push(acc = accValue);
    } catch (e) {
      s.error(e);
    }
  });
  parentEstream.connect(['error', 'end'], s);
  return s;
}

