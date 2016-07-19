var assert = require('assert');
var estream = require('../lib');
var safeFilter = require('../modules/safeFilter');

describe('safeFilter', function() {
  it('filters data event values', function(done) {
    var called = 0;
    var isGt10 = function(a) { return a > 10; };
    var s = estream({
      start: function(push) {
        push(5);
        push(11);
      }
    });

    safeFilter(isGt10, s)
    .on(function(x) {
      assert.equal(x.value, 11);
      assert.equal(called, 0);
      done();
    });
  });

  it('catches errors', function(done) {
    var s1 = estream({
      start: function(push) {
        push(4);
      }
    });
    var errorFn = function() { throw new Error('boom'); };
    safeFilter(errorFn, s1)
    .on(function(x) {
      assert.ok(x.isError);
      assert.equal(x.value.message, 'boom');
      done();
    });
  });
});
