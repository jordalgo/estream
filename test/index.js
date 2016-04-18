var assert = require('assert');
var PH = require('../index')();

var sum = function(acc, value) { return acc + value; };

describe('pipe', function() {
  it('can create a pipe', function() {
    assert.equal(typeof PH.pipe, 'function');
  });

  it('has a next and onNext', function(done) {
    var p = PH.pipe();
    p.onNext(function(x) {
      assert.equal(x, 5);
      done();
    });
    p.next(5);
  });

  it('has a error and onError', function(done) {
    var p = PH.pipe();
    p.onError(function(x) {
      assert.equal(x.message, 'error');
      done();
    });
    p.error(new Error('error'));
  });

  it('has a complete and onComplete', function(done) {
    var p = PH.pipe();
    p.onComplete(function() {
      done();
    });
    p.complete();
  });

  it('pipes messages to child pipes', function(done) {
    var p1 = PH.pipe();
    var p2 = PH.pipe(p1);
    var called = 0;

    p2
    .onNext(function(x) {
      called++;
      assert.equal(x, 1);
    })
    .onError(function(x) {
      called++;
      assert.equal(x.message, 'error');
    })
    .onComplete(function() {
      assert.equal(called, 2);
      done();
    });

    p1.next(1);
    p1.error(new Error('error'));
    p1.complete();
  });

  it('wont pipe any messages after complete', function(done) {
    var p = PH.pipe();
    var completeCalled = 0;

    p
    .onNext(function() {
      assert.fail();
    })
    .onError(function() {
      assert.fail();
    })
    .onComplete(function() {
      if (completeCalled === 1) {
        assert.fail();
      } else {
        completeCalled++;
      }
    });

    p.complete();
    p.next(1);
    p.error(new Error('error'));

    setTimeout(function() {
      done();
    }, 1);
  });

  it('can have multiple sources', function(done) {
    var p1 = PH.pipe();
    var p2 = PH.pipe();
    var p3 = PH.pipe(p1, p2);
    var called = 0;

    p3
    .onNext(function(x) {
      if (called === 0) {
        assert.equal(x, 1);
      } else {
        assert.equal(x, 10);
      }
      called++;
    })
    .onError(function(x) {
      called++;
      assert.equal(x.message, 'error');
    })
    .onComplete(function() {
      assert.equal(called, 3);
      done();
    });

    p1.next(1);
    p2.next(10);
    p2.error(new Error('error'));
    p1.complete();
    p2.complete();
  });

  it('has a map method', function(done) {
    var p1 = PH.pipe();
    var add1 = function(val) { return val + 1; };

    p1
    .map(add1)
    .onNext(function(x) {
      assert.equal(x, 5);
      done();
    });

    p1.next(4);
  });

  it('has a complete on error method', function(done) {
    var p1 = PH.pipe();
    var errorCalled;
    var completeCalled;

    p1
    .completeOnError()
    .onNext(function() {
      assert.fail('onNext called');
    })
    .onError(function() {
      errorCalled = true;
    })
    .onComplete(function() {
      assert.equal(errorCalled, true);
      completeCalled = true;
    });

    p1.error(new Error('error'));
    p1.next(1);

    setTimeout(function() {
      assert.equal(completeCalled, true);
      done();
    }, 10);
  });

  it('has a reroute method', function(done) {
    var p = PH.pipe();
    var errorCalled;

    p
    .reroute(function(parentPipe, childPipe) {
      parentPipe.onNext(function() {
        setTimeout(function() {
          childPipe.next(5);
        }, 50);
        parentPipe.onError(childPipe.error.bind(childPipe));
      });
    })
    .onNext(function(x) {
      assert.equal(x, 5);
      assert.equal(errorCalled, true);
      done();
    })
    .onError(function(e) {
      assert.equal(e.message, 'error');
      errorCalled = true;
    });

    p.next(1);
    p.error(new Error('error'));
  });

  describe('scan', function() {
    it('reduces next values', function(done) {
      var p = PH.pipe();
      var called = 0;

      p.scan(sum, 5).onNext(function(x) {
        if (called === 0) {
          assert.equal(x, 10);
          called++;
        } else {
          assert.equal(x, 20);
          done();
        }
      });

      p.next(5);
      p.next(10);
    });

    it('is exported as a function', function(done) {
      var p = PH.pipe();
      var called = 0;

      PH.scan(sum, 5, p).onNext(function(x) {
        if (called === 0) {
          assert.equal(x, 10);
          called++;
        } else {
          assert.equal(x, 20);
          done();
        }
      });

      p.next(5);
      p.next(10);
    });

    it('catches errors', function(done) {
      var p = PH.pipe();
      var sumError = function() { throw new Error('error'); };

      p.scan(sumError, 0).onError(function(e) {
        assert.equal(e.message, 'error');
        done();
      });

      p.next(10);
    });
  });
});

