var assert = require('assert');
var estream = require('../lib');
var reduce = require('../modules/reduce');
var sum = function(acc, value) { return acc + value; };

describe('reduce', function() {
  it('reduces the values of a single stream', function(done) {
    var called = 0;
    var s = estream({
      start: function(push, error, end) {
        push(5);
        push(10);
        error(new Error('blah'));
        push(3);
        end(2);
      }
    });

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
    var s1 = estream({
      start: function(push, error, end) {
        push(5);
        setTimeout(function() {
          push(3);
        }, 50);
        setTimeout(function() {
          end(4);
        }, 200);
      }
    });
    var s2 = estream({
      start: function(push, error, end) {
        push(10);
        setTimeout(function() {
          end(6);
        }, 500);
      }
    });
    var s3 = estream.combine([s1, s2]);

    reduce(sum, 0, s3).on(function(event) {
      assert.equal(event.value, 28);
      done();
    });
  });
});
