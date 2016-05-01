var curryN = require('ramda/src/curryN');
var checkESimport = require('./checkESimport');
var ES;

module.exports = function(ESimport) {
  checkESimport(ESimport);
  ES = ESimport;
  return curryN(2, safeMap);
};

/**
 * Returns an Estream that safely maps data
 * by wrapping the applied function in a try/catch.
 * Sending errors down the stream when there is an error.
 *
 * __Signature__: `(a -> b) -> Estream a -> Estream b`
 *
 * @name safeMap
 * @param {Function} fn - the mapping function
 * @param {Estream} parentEstream
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * var mEstream = estream.safeMap(add1);
 * // or
 * var mEstream = ES.safeMap(add1, estream);
 */
function safeMap(fn, parentEstream) {
  var s = ES();
  parentEstream.on('data', function(data) {
    var mData;
    try {
      mData = fn(data);
      s.push(mData);
    } catch (e) {
      s.error(e);
    }
  });
  parentEstream.connect(['error', 'end'], s);
  return s;
}

