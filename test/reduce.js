var assert = require('assert');
var ES = require('../estream');
var reduce = require('../modules/reduce');
var sum = function(acc, value) { return acc + value; };

describe('reduce', function() {
  it('reduces the values of a single stream', function(done) {
    var s = ES(function(push, error, end) {
      push(5);
      push(10);
      error(new Error('blah'));
      push(3);
      end(2);
    });
    var called = 0;

    reduce(sum, 0, s)
    .on(function(event) {
      if (called === 0) {
        assert.equal(event.value.message, 'blah');
        assert.ok(event.isError);
        called++;
      } else {
        assert.equal(event.value, 20);
        assert.ok(event.isEnd);
        done();
      }
    });
  });

  it('reduces the values of multiple streams', function(done) {
    var s1 = ES(function(push, error, end) {
      push(5);
      setTimeout(push.bind(null, 3), 50);
      setTimeout(end.bind(null, 4), 200);
    });
    var s2 = ES(function(push, error, end) {
      push(10);
      setTimeout(end.bind(null, 6), 500);
    });
    var s3 = ES.combine([s1, s2]);

    reduce(sum, 0, s3).on(function(event) {
      assert.equal(event.value, 28);
      done();
    });
  });
});
