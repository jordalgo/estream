var ES = require('../estream');

/**
 * Returns a new Estream that ends on any error.
 * The new Estream will have _this_ as a parent/source Estream.
 *
 * @name endOnError
 * @param {Estream} estream
 * @return {Estream} that will end on error
 */
function endOnError(estream) {
  var s = ES();
  estream.on(function(event) {
    s.push(event);
    if (event.isError) {
      s.end();
    }
  });
  return s;
}

module.exports = endOnError;
