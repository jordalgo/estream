var assert = require('assert');
var estream = require('../estream');
var reduce = require('../modules/reduce');
var sum = function(acc, value) { return acc + value; };

describe('reduce', function() {
  it('reduces the values of a single stream', function(done) {
    var s = estream();
    s.push(5);
    s.push(10);
    s.error(new Error('blah'));
    s.push(3);
    s.end(2);
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
    var s1 = estream();
    s1.push(5);
    setTimeout(s1.push.bind(s1, 3), 50);
    setTimeout(s1.end.bind(s1, 4), 200);
    var s2 = estream();
    s2.push(10);
    setTimeout(s2.end.bind(s2, 6), 500);
    var s3 = estream.combine([s1, s2]);

    reduce(sum, 0, s3).on(function(event) {
      assert.equal(event.value, 28);
      done();
    });
  });
});
