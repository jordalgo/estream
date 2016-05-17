var ES = require('../estream');
var curryN = require('ramda/src/curryN');

/**
 * Creates an Estream that debounces all events from the source stream.
 *
 * __Signature__: `Number -> Estream`
 *
 * @name debounce
 * @param {Number} interval - the debounce timeout amount
 * @param {Estream} estream
 * @return {Estream}
 *
 * @example
 * var estream = ES();
 * var mEstream = estream.debounce(1000);
 */
function debounce(interval, estream) {
  var s = ES();
  var dataTO;
  estream.on(function(event) {
    clearTimeout(dataTO);
    dataTO = setTimeout(function() {
      s.push(event);
    }, interval);
  });
  return s;
}

module.exports = curryN(2, debounce);

