var estream = require('../lib');
var curryN = require('ramda/src/curryN');

/**
 * Creates an Estream that debounces all events from the source stream.
 *
 * __Signature__: `Number -> Estream`
 *
 * @name debounce
 * @param {Number} interval - the debounce timeout amount
 * @param {Estream} es
 * @return {Estream}
 *
 * @example
 * var stream2 = stream1.debounce(1000);
 */
function debounce(interval, es) {
  var dataTO;
  return estream({
    start: function(push) {
      return es.on(function(event) {
        clearTimeout(dataTO);
        dataTO = setTimeout(function() {
          push(event);
        }, interval);
      });
    }
  });
}

module.exports = curryN(2, debounce);

