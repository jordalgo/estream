var curryN = require('ramda/src/curryN');

module.exports = function(createPipe) {
  if (!createPipe) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs.');
  }
  /**
   * Returns a Pipe that lifts a next value.
   *
   * __Signature__: `(a -> b) -> Pipe f a -> Pipe f b`
   *
   * @name fmap
   * @param {Function} fn - the mapping function
   * @param {pipe} parentPipe - the parent pipe passing a functor
   * @return {pipe}
   *
   * @example
   * var pipe1 = PH.pipe();
   * var mPipe = pipe1.fmap(add1);
   * // or
   * var mPipe = PH.fmap(add1, pipe1);
   * pipe1.next([1, 1, 1]);
   * // mPipe emits [2, 2, 2]
   */
  function fmap(fn, parentPipe) {
    var p = createPipe(parentPipe);
    p._pipeValue = function(value) {
      var mValue;
      try {
        mValue = value.map(fn);
        this._notify(mValue);
      } catch (e) {
        this._error(e);
      }
    };
    return p;
  }
  return curryN(2, fmap);
};

