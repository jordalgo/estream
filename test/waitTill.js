var assert = require('assert');
var PH = require('../piping-hot');
var fill = require('../modules/fill')(PH.pipe);

PH.addPipeMethods([{
  name: 'fill',
  fn: fill
}]);

describe('fill', function() {
  it('waits till the function is filled', function(done) {
    var p = PH.pipe();
    var called;
    var sum3 = function(x, y, z) {
      return x + y + z;
    };

    var unsubscribe = p
    .fill(sum3)
    .subscribe({
      next: function(x) {
        if (!called) {
          assert.equal(x, 6);
          called = true;
        } else {
          assert.equal(x, 10);
          unsubscribe();
          done();
        }
      }
    });

    p.next(1);
    p.next(2);
    p.next(3);

    setTimeout(function() {
      p.next(4);
      p.next(1);
      p.next(5);
    }, 10);
  });
});
