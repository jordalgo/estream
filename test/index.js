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
    s.error(new Error('error'));
  });

  it('can have multiple source estreams', function(done) {
    var s1 = ES();
    var s2 = ES();
    var s3 = ES(s1, s2);
    var called = 0;

    s3
    .on('data', function(x, source) {
      if (called === 0) {
        assert.equal(x, 1);
        assert.equal(source, s1);
      } else if (called === 1) {
        assert.equal(x, 10);
        assert.equal(source, s2);
      } else {
        assert.equal(x, 20);
        assert.equal(source, s3);
      }
      called++;
    })
    .on('error', function(x, source) {
      called++;
      assert.equal(x.message, 'error');
      assert.equal(source, s2);
    })
    .on('end', function() {
      assert.equal(called, 4);
      done();
    });

    s1.push(1);
    s2.push(10);
    s3.push(20);
    s2.error(new Error('error'));
    s1.end();
    s2.end();
  });

  it('drains data into consumers and resumes flowing', function(done) {
    var s = ES();
    var called = 0;
    s.pause();
    s.push(3);

    s.on('data', function(x) {
      if (!called) {
        assert.equal(x, 3);
        called = true;
      } else {
        assert.equal(x, 5);
        done();
      }
    });

    s.drain();
    s.push(5);
  });

  it('returns history with `getHistory`', function() {
    var s = ES();
    var s2 = ES(s);
    s2.push(3);
    s.push(5);
    s2.push(4);

    var history = s2.getHistory(0, 2);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].source, null);
    assert.equal(history[0].esType, 'data');
    assert.equal(history[1].value, 5);
    assert.equal(history[1].source, s);

    assert.equal(s.getHistory(0).length, 1);
    assert.equal(s2.getHistory(0).length, 3);

    s.error('boom');

    history = s2.getHistory(0);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].source, null);
    assert.equal(history[0].esType, 'data');
    assert.equal(history[1].value, 5);
    assert.equal(history[1].source, s);
    assert.equal(history[2].value, 4);
    assert.equal(history[2].source, null);
    assert.equal(history[3].value, 'boom');
    assert.equal(history[3].esType, 'error');
    assert.equal(history[3].source, s);
  });

  it('clears the history with `clearHistory`', function() {
    var s = ES();
    var s2 = ES(s);
    s2.push(3);
    s.push(5);
    s2.push(4);

    var history = s2.getHistory(0, 2);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].source, null);
    assert.equal(history[0].esType, 'data');
    assert.equal(history[1].value, 5);
    assert.equal(history[1].source, s);

    s2.clearHistory();
    history = s2.getHistory(0);
    assert.deepEqual(history, []);
  });

  it('does not buffers messages with flowing on (default)', function(done) {
    var s = ES();
    var called = 0;
    s.push(3);
    s.push(4);
    s.error(new Error('boom'));

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
    s.error(new Error('boom2'));
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

    s1.end();
    s2.end();
    assert.equal(s3Complete, false);
    s3.end();
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
    s.end();
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
      ES.map(add1, s1)
      .on('data', function(x) {
        assert.equal(x, 5);
        done();
      });
      s1.push(4);
    });
  });

  describe('safeMap', function() {
    it('catches errors and sends them down the stream', function(done) {
      var s1 = ES();
      var throwError = function() { throw new Error('boom'); };

      s1.safeMap(throwError, true)
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

      ES.scan(sum, 5, s)
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
  });

  describe('safeScan', function() {
    it('catches errors and sends them down stream', function(done) {
      var s = ES();
      var sumError = function() { throw new Error('boom'); };

      s.safeScan(sumError, 0)
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
  });

  describe('safeFilter', function() {
    it('catches errors and sends them down stream', function(done) {
      var s = ES();
      var filterError = function() { throw new Error('boom'); };

      s.safeFilter(filterError)
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

      s1.error(new Error('error'));

      setTimeout(function() {
        assert.equal(endCalled, true);
        done();
      }, 10);
    });
  });

  describe('batchByCount', function() {
    it('batches data into the buffer by count', function(done) {
      var s = ES();
      var called;

      s
      .batchByCount(3)
      .on('data', function(x) {
        if (!called) {
          assert.deepEqual(x, [1, 2, 3]);
          called = true;
        } else {
          assert.deepEqual(x, [4, 5, 6]);
          done();
        }
      });

      s.push(1);
      s.push(2);
      s.push(3);
      s.push(4);
      s.push(5);
      s.push(6);
    });
  });
});

