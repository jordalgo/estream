var curryN = require('ramda/src/curryN');

module.exports = function(createPipe) {
  if (!createPipe) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs!');
  }
  /**
   * Returns a Pipe that filters next values.
   *
   * __Signature__: `(a -> Boolean) -> Pipe a -> Pipe a`
   *
   * @name filter
   * @param {Function} fn - the filtering function
   * @param {pipe} parentPipe - the parent pipe
   * @return {pipe}
   *
   * @example
   * var pipe1 = PH.pipe();
   * var mPipe = pipe1.filter(isEven);
   * // or
   * var mPipe = PH.filter(isEven, pipe1);
   */
  function filter(fn, parentPipe) {
    var p = createPipe(parentPipe);
    p._pipeValue = function(value) {
      try {
        if (fn(value)) {
          this._notify(value);
        }
      } catch (e) {
        this._error(e);
      }
    };
    return p;
  }
  return curryN(2, filter);
};

