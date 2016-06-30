var assert = require('assert');
var estream = require('../lib');
var safeScan = require('../modules/safeScan');

describe('safeScan', function() {
  it('reduces pushed data events', function(done) {
    var called = 0;
    var s = estream();
    var sum = function(acc, value) { return acc + value; };
    s.push(5);
    s.push(10);

    safeScan(sum, 5, s)
    .on(function(x) {
      if (called === 0) {
        assert.equal(x.value, 10);
        called++;
      } else {
        assert.equal(x.value, 20);
        done();
      }
    });
  });

  it('catches errors', function(done) {
    var s1 = estream();
    var errorFn = function() { throw new Error('boom'); };
    s1.push(4);

    safeScan(errorFn, 0, s1)
    .on(function(x) {
      assert.ok(x.isError);
      assert.equal(x.value.message, 'boom');
      done();
    });
  });
});

