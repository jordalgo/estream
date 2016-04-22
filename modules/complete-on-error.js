module.exports = function(createPipe) {
  if (!createPipe) {
    throw new Error('Piping Hot module functions need the createPipe' +
                    'function passed in to work. See docs!');
  }
  /**
   * Returns a pipe that completes on any error.
   *
   * __Signature__: `Pipe a -> Pipe a`
   *
   * @name completeOnError
   * @param {pipe} parentPipe - the parent pipe
   * @return {pipe} the pipe that will complete on error
   *
   * @example
   * var pipe1 = PH.pipe();
   * var mPipe = pipe1.completeOnError();
   * // or
   * var mPipe = PH.completeOnError(pipe1);
   */
  function completeOnError(parentPipe) {
    var p = createPipe(parentPipe);
    p.error = function(err) {
      p._error(err);
      p.complete();
    };
    return p;
  }
  return completeOnError;
};

