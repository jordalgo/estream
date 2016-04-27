var assert = require('assert');
var ES = require('../estream');
var R = require('ramda');

var add1 = function(x) { return x + 1; };
var sum = function(acc, value) { return acc + value; };
var isGt10 = function(a) { return a > 10; };

describe('Estream', function() {
  it('can create a Estream', function() {
    assert.equal(typeof ES, 'function');
  });

  it('has a method to push data into it and a consume that data', function(done) {
    var s = ES();
    s.on('data', function(x) {
      assert.equal(x, 5);
      done();
    });
    s.push(5);
  });

  it('routes errors', function(done) {
    var s = ES();
    s.on('error', function(x) {
      assert.equal(x.message, 'error');
      done();
    });
    s.push(new Error('error'));
  });

  it('can have multiple source estreams', function(done) {
    var s1 = ES();
    var s2 = ES();
    var s3 = ES(s1, s2);
    var called = 0;

    s3
    .on('data', function(x) {
      if (called === 0) {
        assert.equal(x, 1);
      } else {
        assert.equal(x, 10);
      }
      called++;
    })
    .on('error', function(x) {
      called++;
      assert.equal(x.message, 'error');
    })
    .on('end', function() {
      assert.equal(called, 3);
      done();
    });

    s1.push(1);
    s2.push(10);
    s2.push(new Error('error'));
    s1.push();
    s2.push();
  });

  it('buffers messages with no consumers - buffering on', function() {
    var s = ES();
    s.setBuffer(true);
    s.push(3);
    s.push(4);

    s.on('data', function(x) {
      assert.deepEqual(x, [3, 4]);
    });
  });

  it('does not buffers messages with no consumers - buffering off (default)', function(done) {
    var s = ES();
    var called = 0;
    s.push(3);
    s.push(4);
    s.push(new Error('boom'));

    s
    .on('data', function(x) {
      if (called === 0) {
        assert.equal(x, 1);
      } else if (called === 1) {
        assert.equal(x, 2);
      }
      called++;
    })
    .on('error', function(x) {
      assert.equal(called, 2);
      assert.equal(x.message, 'boom2');
      done();
    });

    s.push(1);
    s.push(2);
    s.push(new Error('boom2'));
  });

  it('has a method to remove a consumer', function() {
    var s = ES();
    var dataConsumer = function() {
      assert.fail();
    };
    s.on('data', dataConsumer);
    s.off('data', dataConsumer);
    s.push(5);
  });

  it('throws if you push into an ended estream', function() {
    var s = ES();
    s.push();
    try {
      s.push(5);
      assert.fail();
    } catch (e) {
      assert.equal(typeof e.message, 'string');
    }
  });

  it('ends if parent Estreams have not ended and end called explicitly', function() {
    var s0 = ES();
    var s1 = ES();
    var s2 = ES();
    var s3 = ES(s0, s1, s2);
    var s3Complete = false;

    s3.on('end', function() {
      s3Complete = true;
    });

    s1.push();
    s2.push();
    assert.equal(s3Complete, false);
    s3.push();
    assert.equal(s3Complete, true);
  });

  xit('has a reroute method', function(done) {
    var p = ES();
    var errorCalled;

    p
    .reroute(function(parentPipe, childPipe) {
      parentPipe.subscribe({
        data: function() {
          setTimeout(function() {
            childPipe.push(5);
          }, 50);
        },
        error: childPipe.next.bind(childPipe)
      });
    })
    .subscribe({
      data: function(x) {
        assert.equal(x, 5);
        assert.equal(errorCalled, true);
        done();
      },
      error: function(e) {
        assert.equal(e.message, 'error');
        errorCalled = true;
      }
    });

    p.push(1);
    p.push(new Error('error'));
  });

  xit('has an addPipeMethods', function(done) {
    ES.addPipeMethods([{
      name: 'collect',
      fn: require('../modules/collect')(ES.pipe)
    }]);
    var p = ES();
    assert.equal(typeof p.collect, 'function');

    // make sure collect works
    var called = 0;
    p.collect(2)
    .subscribe({
      data: function(x) {
        if (called === 0) {
          assert.equal(x, 1);
          called++;
        } else {
          assert.equal(x, 2);
          done();
        }
      }
    });

    p.push(1);
    setTimeout(function() {
      assert.equal(called, 0);
      p.push(2);
    }, 10);
  });

  it('is a functor', function() {
    var s = ES();
    var add2 = function(x) { return x + 2; };
    var composedMap = R.pipe(add1, add2);

    var composedValue;
    var serialValue;

    s.map(composedMap).on('data', function(x) {
      composedValue = x;
    });

    s.map(add1).map(add2).on('data', function(x) {
      serialValue = x;
    });

    // test identity
    s.map(R.identity).on('data', function(x) {
      assert.equal(x, 1);
    });

    // test fmap
    R.map(add1, s).on('data', function(x) {
      assert.equal(x, 2);
    });

    s.push(1);
    assert.equal(composedValue, serialValue);
    s.push();
  });

  describe('map', function() {
    it('maps a function over next values', function(done) {
      var s1 = ES();
      s1
      .map(add1)
      .on('data', function(x) {
        assert.equal(x, 5);
        done();
      });
      s1.push(4);
    });

    it('is exported as a function', function(done) {
      var s1 = ES();
      ES.map(add1, null, s1)
      .on('data', function(x) {
        assert.equal(x, 5);
        done();
      });
      s1.push(4);
    });

    it('catches errors if safe is true', function(done) {
      var s1 = ES();
      var throwError = function() { throw new Error('boom'); };

      s1.map(throwError, true)
      .on('data', function() {
        assert.fail();
      })
      .on('error', function(e) {
        assert.equal(e.message, 'boom');
        done();
      });

      s1.push(4);
    });
  });

  describe('scan', function() {
    it('reduces pushed data', function(done) {
      var s = ES();
      var called = 0;

      s.scan(sum, 5)
      .on('data', function(x) {
        if (called === 0) {
          assert.equal(x, 10);
          called++;
        } else {
          assert.equal(x, 20);
          done();
        }
      });

      s.push(5);
      s.push(10);
    });

    it('is exported as a function', function(done) {
      var s = ES();
      var called = 0;

      ES.scan(sum, 5, null, s)
      .on('data', function(x) {
        if (called === 0) {
          assert.equal(x, 10);
          called++;
        } else {
          assert.equal(x, 20);
          done();
        }
      });

      s.push(5);
      s.push(10);
    });

    it('catches errors if safe is true', function(done) {
      var s = ES();
      var sumError = function() { throw new Error('boom'); };

      s.scan(sumError, 0, true)
      .on('data', function() {
        assert.fail();
      })
      .on('error', function(e) {
        assert.equal(e.message, 'boom');
        done();
      });

      s.push(10);
    });
  });

  describe('filter', function() {
    it('filters non-error data', function(done) {
      var s = ES();
      var called = 0;

      s.filter(isGt10)
      .on('data', function(x) {
        assert.equal(x, 11);
        assert.equal(called, 0);
        done();
      });

      s.push(5);
      s.push(11);
    });

    it('is exported as a function', function(done) {
      var s = ES();
      var called = 0;

      s.filter(isGt10)
      .on('data', function(x) {
        assert.equal(x, 11);
        assert.equal(called, 0);
        done();
      });

      s.push(5);
      s.push(11);
    });

    it('catches errors if safe is true', function(done) {
      var s = ES();
      var filterError = function() { throw new Error('boom'); };

      s.filter(filterError, true)
      .on('data', function() {
        assert.fail();
      })
      .on('error', function(e) {
        assert.equal(e.message, 'boom');
        done();
      });

      s.push(10);
    });
  });

  describe('endOnError', function() {
    it('ends on an error', function(done) {
      var s1 = ES();
      var errorCalled;
      var endCalled;

      s1
      .endOnError()
      .on('data', function() {
        assert.fail('data called');
      })
      .on('error', function() {
        errorCalled = true;
      })
      .on('end', function() {
        assert.equal(errorCalled, true);
        endCalled = true;
      });

      s1.push(new Error('error'));

      setTimeout(function() {
        assert.equal(endCalled, true);
        done();
      }, 10);
    });
  });
});

