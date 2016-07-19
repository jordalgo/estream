var assert = require('assert');
var estream = require('../lib');
var safeMap = require('../modules/safeMap');

describe('safeMap', function() {
  it('maps a function over data values', function(done) {
    var called = 0;
    var add1 = function(x) { return x + 1; };
    var s1 = estream({
      start: function(push, error) {
        error('error');
        push(4);
      }
    });

    safeMap(add1, s1)
    .on(function(x) {
      if (called === 0) {
        assert.equal(x.value, 'error');
        called++;
      } else {
        assert.equal(x.value, 5);
        done();
      }
    });
  });

  it('catches errors', function(done) {
    var s1 = estream({
      start: function(push) {
        push(4);
      }
    });
    var errorFn = function() { throw new Error('boom'); };
    safeMap(errorFn, s1)
    .on(function(x) {
      assert.ok(x.isError);
      assert.equal(x.value.message, 'boom');
      done();
    });
  });
});
