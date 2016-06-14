var estream = require('../estream');
var curryN = require('ramda/src/curryN');

/**
 * Creates an Estream that takes X number of data events
 * then ends.
 *
 * __Signature__: `Number -> Estream`
 *
 * @name take
 * @param {Number} count - number of data events to take
 * @param {Estream} es
 * @return {Estream}
 *
 * @example
 * var stream2 = stream1.take(3);
 */
function take(count, es) {
  var s = estream();
  es.on(function(event, self, off) {
    if (event.isData) {
      count--;
    }
    s.push(event);
    if (count < 1) {
      s.end();
      off();
    }
  });
  return s;
}

module.exports = curryN(2, take);

