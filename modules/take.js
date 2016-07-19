var estream = require('../lib');
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
  return estream({
    start: function(push, error, end) {
      return es.on(function(event, history, self, off) {
        if (event.isData) {
          count--;
        }
        push(event);
        if (count < 1) {
          end();
          off();
        }
      });
    }
  });
}

module.exports = curryN(2, take);

