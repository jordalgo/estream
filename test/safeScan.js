var assert = require('assert');
var estream = require('../lib');
var safeScan = require('../modules/safeScan');

describe('safeScan', function() {
  it('reduces pushed data events', function(done) {
    var called = 0;
    var sum = function(acc, value) { return acc + value; };
    var s = estream({
      start: function(push) {
        push(5);
        push(10);
      }
    });

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
    var s1 = estream({
      start: function(push) {
        push(4);
      }
    });
    var errorFn = function() { throw new Error('boom'); };

    safeScan(errorFn, 0, s1)
    .on(function(x) {
      assert.ok(x.isError);
      assert.equal(x.value.message, 'boom');
      done();
    });
  });
});

