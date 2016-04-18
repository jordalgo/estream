var PH = require('../index')();
var curryN = require('ramda/src/curryN');

/**
 * Returns a Pipe that collects next values.
 *
 * __Signature__: `Int|Boolean -> Pipe a -> Pipe a
 *
 * @name collect
 * @param {Integer|Boolean} count - the amount of next values to collect. If false, collect them all.
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe with the collected next values
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = PH.collect(false, pipe1);
 */
function collect(count, parentPipe) {
  var p = PH.pipe(parentPipe);
  var history = [];
  p.next = function(value) {
    history.push(value);
    if (count) {
      count--;
      if (count === 0) {
        p.drain();
      }
    }
  };
  p.drain = function() {
    history.forEach(function(value) {
      p._next(value);
    });
    p.next = function(value) {
      p._next(value);
    };
    history = false;
  };
  return p;
}

module.exports = curryN(2, collect);

