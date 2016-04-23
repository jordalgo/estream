var curryN = require('ramda/src/curryN');

module.exports = function(createPipe) {
  if (!createPipe) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs!');
  }
  /**
   * Returns a Pipe that maps next values.
   *
   * __Signature__: `(a -> b) -> Pipe a -> Pipe b`
   *
   * @name map
   * @param {Function} fn - the mapping function
   * @param {pipe} parentPipe - the parent pipe
   * @return {pipe}
   *
   * @example
   * var pipe1 = PH.pipe();
   * var mPipe = pipe1.map(add1);
   * // or
   * var mPipe = PH.map(add1, pipe1);
   */
  function map(fn, parentPipe) {
    var p = createPipe(parentPipe);
    p._pipeValue = function(value) {
      var mValue;
      try {
        mValue = fn(value);
        this._notify(mValue);
      } catch (e) {
        this._error(e);
      }
    };
    return p;
  }
  return curryN(2, map);
};

