var assert = require('assert');
var estream = require('../lib');
var safeFilter = require('../modules/safeFilter');

describe('safeFilter', function() {
  it('filters data event values', function(done) {
    var called = 0;
    var s = estream();
    var isGt10 = function(a) { return a > 10; };
    s.push(5);
    s.push(11);

    safeFilter(isGt10, s)
    .on(function(x) {
      assert.equal(x.value, 11);
      assert.equal(called, 0);
      done();
    });
  });

  it('catches errors', function(done) {
    var s1 = estream();
    var errorFn = function() { throw new Error('boom'); };
    s1.push(4);
    safeFilter(errorFn, s1)
    .on(function(x) {
      assert.ok(x.isError);
      assert.equal(x.value.message, 'boom');
      done();
    });
  });
});
