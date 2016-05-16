var assert = require('assert');
var ES = require('../estream');
var endOnError = require('../modules/end-on-error');

describe('endOnError', function() {
  it('creates an estream that ends on an error', function(done) {
    var s1 = ES();
    var called = 0;

    endOnError(s1).on(function(x) {
      if (called === 0) {
        assert.equal(x.value.message, 'error');
        called++;
      } else {
        assert.deepEqual(x.value, []);
        done();
      }
    });

    s1.error(new Error('error'));
  });
});
