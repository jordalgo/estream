var assert = require('assert');
var PH = require('../piping-hot');
var fmap = require('../modules/fmap')(PH.pipe);
var S = require('sanctuary');
var R = require('ramda');
var add1 = function(x) { return x + 1; };

PH.addPipeMethods([{
  name: 'fmap',
  fn: fmap
}]);

describe('fmap', function() {
  it('maps over a functor - Array', function(done) {
    var p = PH.pipe();

    var unsubscribe = p
    .fmap(add1)
    .subscribe({
      data: function(x) {
        assert.deepEqual(x, [2, 2, 2]);
        unsubscribe();
        done();
      }
    });

    p.push([1, 1, 1]);
  });

  it('maps over a functor - Maybe', function(done) {
    var p = PH.pipe();
    var called;

    var unsubscribe = p
    .fmap(add1)
    .subscribe({
      data: function(x) {
        if (!called) {
          assert.deepEqual(x, S.Just(2));
          called = true;
        } else {
          assert.deepEqual(x, S.Nothing());
          unsubscribe();
          done();
        }
      }
    });

    p.push(S.Just(1));
    p.push(S.Nothing());
  });

  it('is autocurried', function(done) {
    var p = PH.pipe();
    var add2 = function(x) { return x + 2; };

    R.pipe(
      fmap(add1),
      fmap(add2)
    )(p).subscribe({
      data: function(x) {
        assert.deepEqual(x, S.Just(4));
        done();
      }
    });

    p.push(S.Just(1));
  });

  it('catches errors', function(done) {
    var p = PH.pipe();

    var unsubscribe = p
    .fmap(add1)
    .subscribe({
      data: function() {
        assert.fail();
      },
      error: function() {
        unsubscribe();
        done();
      }
    });

    p.push(1);
  });
});
