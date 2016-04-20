var assert = require('assert');
var PH = require('../index');

var sum = function(acc, value) { return acc + value; };
var isGt10 = function(a) { return a > 10; };

describe('pipe', function() {
  it('can create a pipe', function() {
    assert.equal(typeof PH.pipe, 'function');
  });

  it('is itself a function that routes messages', function(done) {
    var p = PH.pipe();
    var called = 0;
    p.subscribe({
      next: function(x) {
        assert.equal(x, 5);
        called++;
      },
      error: function(e) {
        assert.equal(e.message, 'error');
        called++;
      },
      complete: function() {
        assert.equal(called, 2);
        done();
      }
    });

    p(null, 5);
    p(new Error('error'));
    p(null, null, true);
  });

  it('has a next and forEach method', function(done) {
    var p = PH.pipe();
    p.forEach(function(x) {
      assert.equal(x, 5);
      done();
    });
    p.next(5);
  });

  it('has an error method', function(done) {
    var p = PH.pipe();
    p.subscribe({
      error: function(x) {
        assert.equal(x.message, 'error');
        done();
      }
    });
    p.error(new Error('error'));
  });

  it('throws if you dont have an onError observer', function() {
    var p = PH.pipe();

    p.subscribe({
      next: function() {
        assert.fail();
      }
    });

    try {
      p.error(new Error('boom'));
    } catch (e) {
      assert.equal(e.message, 'boom');
    }
  });

  it('pipes messages to child pipes', function(done) {
    var p1 = PH.pipe();
    var p2 = PH.pipe(p1);
    var called = 0;

    p2.subscribe({
      next: function(x) {
        called++;
        assert.equal(x, 1);
      },
      error: function(x) {
        called++;
        assert.equal(x.message, 'error');
      },
      complete: function() {
        assert.equal(called, 2);
        done();
      }
    });

    p1.next(1);
    p1.error(new Error('error'));
    p1.complete();
  });

  it('can have multiple sources', function(done) {
    var p1 = PH.pipe();
    var p2 = PH.pipe();
    var p3 = PH.pipe(p1, p2);
    var called = 0;

    p3.subscribe({
      next: function(x) {
        if (called === 0) {
          assert.equal(x, 1);
        } else {
          assert.equal(x, 10);
        }
        called++;
      },
      error: function(x) {
        called++;
        assert.equal(x.message, 'error');
      },
      complete: function() {
        assert.equal(called, 3);
        done();
      }
    });

    p1.next(1);
    p2.next(10);
    p2.error(new Error('error'));
    p1.complete();
    p2.complete();
  });

  it('has a reroute method', function(done) {
    var p = PH.pipe();
    var errorCalled;

    p
    .reroute(function(parentPipe, childPipe) {
      parentPipe.subscribe({
        next: function() {
          setTimeout(function() {
            childPipe.next(5);
          }, 50);
        },
        error: childPipe.error.bind(childPipe)
      });
    })
    .subscribe({
      next: function(x) {
        assert.equal(x, 5);
        assert.equal(errorCalled, true);
        done();
      },
      error: function(e) {
        assert.equal(e.message, 'error');
        errorCalled = true;
      }
    });

    p.next(1);
    p.error(new Error('error'));
  });

  it('has an addPipeMethods', function(done) {
    PH.addPipeMethods([{
      name: 'collect',
      fn: require('../modules/collect')(PH.pipe)
    }]);
    var p = PH.pipe();
    assert.equal(typeof p.collect, 'function');

    // make sure collect works
    var called = 0;
    p.collect(2)
    .subscribe({
      next: function(x) {
        if (called === 0) {
          assert.equal(x, 1);
          called++;
        } else {
          assert.equal(x, 2);
          done();
        }
      }
    });

    p.next(1);
    setTimeout(function() {
      assert.equal(called, 0);
      p.next(2);
    }, 10);
  });

  describe('complete', function() {
    it('has a complete and can subscribe to completes', function(done) {
      var p = PH.pipe();
      p.subscribe({
        complete: function() {
          done();
        }
      });
      p.complete();
    });

    it('wont pipe any messages after complete', function(done) {
      var p = PH.pipe();
      var completeCalled = 0;

      p.subscribe({
        next: function() {
          assert.fail();
        },
        error: function() {
          assert.fail();
        },
        complete: function() {
          if (completeCalled === 1) {
            assert.fail();
          } else {
            completeCalled++;
          }
        }
      });

      p.complete();
      p.next(1);
      p.error(new Error('error'));

      setTimeout(function() {
        done();
      }, 1);
    });

    it('completes when all parentPipes have completed', function() {
      var p1 = PH.pipe();
      var p2 = PH.pipe();
      var p3 = PH.pipe(p1, p2);
      var p3Complete = false;

      p3.subscribe({
        complete: function() {
          p3Complete = true;
        }
      });

      p1.complete();
      assert.equal(p3Complete, false);
      p2.complete();
      assert.equal(p3Complete, true);
    });

    it('completes if parentPipes have not completed if completed called explicitly', function() {
      var p0 = PH.pipe();
      var p1 = PH.pipe();
      var p2 = PH.pipe();
      var p3 = PH.pipe(p0, p1, p2);
      var p3Complete = false;

      p3.subscribe({
        complete: function() {
          p3Complete = true;
        }
      });

      p1.complete();
      assert.equal(p3Complete, false);
      p3.complete();
      assert.equal(p3Complete, true);
    });
  });

  describe('map', function() {
    it('maps a function over next values', function(done) {
      var p1 = PH.pipe();
      var add1 = function(val) { return val + 1; };

      p1.map(add1)
      .subscribe({
        next: function(x) {
          assert.equal(x, 5);
          done();
        }
      });

      p1.next(4);
    });

    it('is exported as a function', function(done) {
      var p1 = PH.pipe();
      var add1 = function(val) { return val + 1; };

      PH.map(add1, p1)
      .subscribe({
        next: function(x) {
          assert.equal(x, 5);
          done();
        }
      });

      p1.next(4);
    });

    it('catches errors', function(done) {
      var p1 = PH.pipe();
      var throwError = function() { throw new Error('boom'); };

      p1.map(throwError)
      .subscribe({
        next: function() {
          assert.fail();
        },
        error: function(e) {
          assert.equal(e.message, 'boom');
          done();
        }
      });

      p1.next(4);
    });
  });

  describe('ap', function() {
    it('applies a value to a pipe function', function(done) {
      var p = PH.pipe();

      p.ap(5).subscribe({
        next: function(x) {
          assert.equal(x, 6);
          done();
        }
      });

      p.next(function(x) { return x + 1; });
    });

    it('is exported as a function', function(done) {
      var p = PH.pipe();

      PH.ap(5, p).subscribe({
        next: function(x) {
          assert.equal(x, 6);
          done();
        }
      });

      p.next(function(x) { return x + 1; });
    });

    it('catches errors', function(done) {
      var p = PH.pipe();

      PH.ap(5, p).subscribe({
        next: function() {
          assert.fail();
        },
        error: function(e) {
          assert.equal(e.message, 'boom');
          done();
        }
      });

      p.next(function() { throw new Error('boom'); });
    });
  });

  describe('scan', function() {
    it('reduces next values', function(done) {
      var p = PH.pipe();
      var called = 0;

      p.scan(sum, 5).subscribe({
        next: function(x) {
          if (called === 0) {
            assert.equal(x, 10);
            called++;
          } else {
            assert.equal(x, 20);
            done();
          }
        }
      });

      p.next(5);
      p.next(10);
    });

    it('is exported as a function', function(done) {
      var p = PH.pipe();
      var called = 0;

      PH.scan(sum, 5, p).subscribe({
        next: function(x) {
          if (called === 0) {
            assert.equal(x, 10);
            called++;
          } else {
            assert.equal(x, 20);
            done();
          }
        }
      });

      p.next(5);
      p.next(10);
    });

    it('catches errors', function(done) {
      var p = PH.pipe();
      var sumError = function() { throw new Error('error'); };

      p.scan(sumError, 0).subscribe({
        next: function() {
          assert.fail();
        },
        error: function(e) {
          assert.equal(e.message, 'error');
          done();
        }
      });

      p.next(10);
    });
  });

  describe('filter', function() {
    it('filters next values', function(done) {
      var p = PH.pipe();
      var called = 0;

      p.filter(isGt10).subscribe({
        next: function(x) {
          assert.equal(x, 11);
          assert.equal(called, 0);
          done();
        }
      });

      p.next(5);
      p.next(11);
    });

    it('is exported as a function', function(done) {
      var p = PH.pipe();
      var called = 0;

      PH.filter(isGt10, p).subscribe({
        next: function(x) {
          assert.equal(x, 11);
          assert.equal(called, 0);
          done();
        }
      });

      p.next(5);
      p.next(11);
    });

    it('catches errors', function(done) {
      var p = PH.pipe();
      var filterError = function() { throw new Error('error'); };

      p.filter(filterError).subscribe({
        next: function() {
          assert.fail();
        },
        error: function(e) {
          assert.equal(e.message, 'error');
          done();
        }
      });

      p.next(10);
    });
  });

  describe('take', function() {
    it('accepts x number of next values', function(done) {
      var p = PH.pipe();
      var called = false;

      p.take(1)
      .subscribe({
        next: function(x) {
          assert.equal(x, 5);
          assert.equal(called, false);
          called = true;
        },
        complete: function() {
          setTimeout(function() {
            done();
          }, 10);
        }
      });

      p.next(5);
      p.next(3);
    });

    it('is exported as a function', function(done) {
      var p = PH.pipe();
      var called = false;

      PH.take(1, p)
      .subscribe({
        next: function(x) {
          assert.equal(x, 5);
          assert.equal(called, false);
          called = true;
        },
        complete: function() {
          setTimeout(function() {
            done();
          }, 10);
        }
      });

      p.next(5);
      p.next(3);
    });
  });

  describe('completeOnError', function() {
    it('has a completes on error', function(done) {
      var p1 = PH.pipe();
      var errorCalled;
      var completeCalled;

      p1
      .completeOnError()
      .subscribe({
        next: function() {
          assert.fail('subscribe called');
        },
        error: function() {
          errorCalled = true;
        },
        complete: function() {
          assert.equal(errorCalled, true);
          completeCalled = true;
        }
      });

      p1.error(new Error('error'));
      p1.next(1);

      setTimeout(function() {
        assert.equal(completeCalled, true);
        done();
      }, 10);
    });
  });
});

