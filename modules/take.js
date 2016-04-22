var curryN = require('ramda/src/curryN');

module.exports = function(createPipe) {
  if (!createPipe) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs!');
  }
  /**
   * Returns a Pipe that takes x number of next values then completes.
   *
   * __Signature__: `Int -> Pipe a -> Pipe a`
   *
   * @name take
   * @param {number} count - the number of next values to take
   * @param {pipe} parentPipe - the parent pipe
   * @return {pipe}
   *
   * @example
   * var pipe1 = PH.pipe();
   * var mPipe = pipe1.take(3);
   * // or
   * var mPipe = PH.take(3, pipe1);
   */
  function take(count, parentPipe) {
    var p = createPipe(parentPipe);
    p.next = function(value) {
      p._next(value);
      count--;
      if (count === 0) {
        p.complete();
      }
    };
    return p;
  }
  return curryN(2, take);
};

