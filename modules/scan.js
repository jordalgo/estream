var curryN = require('ramda/src/curryN');

module.exports = function(createPipe) {
  if (!createPipe) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs!');
  }
  /**
   * Returns a Pipe that scans next values.
   *
   * __Signature__: `(b -> a -> c) -> b -> Pipe a -> Pipe c`
   *
   * @name scan
   * @param {Function} fn - the mapping function
   * @param {Object} acc - intial value
   * @param {pipe} parentPipe - the parent pipe
   * @return {pipe}
   *
   * @example
   * var pipe1 = PH.pipe();
   * var mPipe = pipe1.scan(sum, 0);
   * // or
   * var mPipe = PH.scan(sum, 0, pipe1);
   */
  function scan(fn, acc, parentPipe) {
    var p = createPipe(parentPipe);
    p.next = function(value) {
      var accValue;
      try {
        accValue = fn(acc, value);
        this._next(acc = accValue);
      } catch (e) {
        this.error(e);
      }
    };
    return p;
  }
  return curryN(3, scan);
};

