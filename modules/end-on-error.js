var estream = require('../estream');

/**
 * Returns a new Estream that ends on any error.
 * The new Estream will have _this_ as a parent/source Estream.
 *
 * @name endOnError
 * @param {Estream} es
 * @return {Estream} that will end on error
 */
function endOnError(es) {
  return estream(function(push, error, end) {
    es.onError(function(err) {
      error(err);
      end();
    });
  });
}

module.exports = endOnError;
