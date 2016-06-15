var estream = require('../lib');

/**
 * Returns a new Estream that ends on any error.
 * The new Estream will have _this_ as a parent/source Estream.
 *
 * @name endOnError
 * @param {Estream} es
 * @return {Estream} that will end on error
 */
function endOnError(es) {
  var s = estream();
  es.onError(function(err) {
    s.error(err).end();
  });
  return s;
}

module.exports = endOnError;
