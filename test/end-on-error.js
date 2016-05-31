var assert = require('assert');
var ES = require('../estream');
var endOnError = require('../modules/end-on-error');

describe('endOnError', function() {
  it('creates an estream that ends on an error', function(done) {
    var s1 = ES(function(push, error) {
      setTimeout(error.bind(null, 'error'));
    });
    var called = 0;

    endOnError(s1).on(function(x) {
      if (called === 0) {
        assert.equal(x.value, 'error');
        called++;
      } else {
        assert.deepEqual(x.value, []);
        done();
      }
    });
  });
});
