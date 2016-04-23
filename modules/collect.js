var curryN = require('ramda/src/curryN');
var createPipe;

/**
 * Returns a Pipe that collects next values.
 *
 * __Signature__: `Int|Boolean -> Pipe a -> Pipe a
 *
 * @name collect
 * @param {number|boolean} count - the amount of next values to collect.
 *  If false, collect them all.
 * @param {pipe} parentPipe - the parent pipe
 * @return {pipe} the pipe with the collected next values
 *
 * @example
 * var pipe1 = PH.pipe();
 * var mPipe = PH.collect(false, pipe1);
 */
function collect(count, parentPipe) {
  var p = createPipe(parentPipe);
  var history = [];
  p._pipeValue = function(value) {
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
      p._notify(value);
    });
    // restore this method.
    p._pipeValue = function(value) {
      p._notify(value);
    };
    history = false;
  };
  return p;
}

module.exports = function(createPipeParam) {
  if (!createPipeParam) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs!');
  }
  createPipe = createPipeParam;
  return curryN(2, collect);
};
