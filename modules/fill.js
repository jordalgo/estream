var curry = require('ramda/src/curry');
var curryN = require('ramda/src/curryN');

module.exports = function(createPipe) {
  if (!createPipe) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs.');
  }
  /**
   * Takes a function and returns a pipe that wait until it fills all
   * the args of the function with next values before notifying subscribers.
   *
   * __Signature__: `(* -> *) -> Pipe a -> Pipe b`
   *
   * @name fill
   * @param {Function} fn - the function to fill
   * @param {pipe} parentPipe - the parent pipe
   * @return {pipe}
   *
   * @example
   * var pipe1 = PH.pipe();
   * var sum3 = function(a, b, c) { return a + b + c; };
   * var mPipe = pipe1.fill(sum3);
   * // or
   * var mPipe = PH.fill(sum3, pipe1);
   * pipe1.next(1);
   * pipe1.next(2);
   * pipe1.next(3);
   * // notifies with a 6 value
   */
  function fill(fn, parentPipe) {
    var p = createPipe(parentPipe);
    var filled = fn.length;
    var cValue = curry(fn);
    p._pipeValue = function(value) {
      filled--;
      try {
        cValue = cValue(value);
      } catch (e) {
        this._error(e);
      }
      if (filled === 0) {
        this._notify(cValue);
        // reset
        filled = fn.length;
        cValue = curry(fn);
      }
    };
    return p;
  }
  return curryN(2, fill);
};

