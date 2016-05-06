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
    var s3 = ES([s1, s2]);
    var called = 0;

    s3
    .on('data', function(x, streamId) {
      if (called === 0) {
        assert.equal(x, 1);
        assert.equal(streamId, s1.id);
      } else if (called === 1) {
        assert.equal(x, 10);
        assert.equal(streamId, s2.id);
      } else {
        assert.equal(x, 20);
        assert.equal(streamId, s3.id);
      }
      called++;
    })
    .on('error', function(x, streamId) {
      called++;
      assert.equal(x.message, 'error');
      assert.equal(streamId, s2.id);
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

  it('passes unsubscribe functions to consumers when events are emitted', function(done) {
    var s = ES();
    var dataCalled;
    var errorCalled;

    s.on('data', function(x, id, estream, unsubscribe) {
      assert.equal(x, 1);
      if (!dataCalled) {
        dataCalled = true;
        unsubscribe();
      } else {
        assert.fail();
      }
    })
    .on('error', function(x, id, estream, unsubscribe) {
      assert.equal(x.message, 'boom');
      if (!errorCalled) {
        errorCalled = true;
        unsubscribe();
      } else {
        assert.fail();
      }
    });

    s.push(1);
    s.push(2);
    s.error(new Error('boom'));
    s.error(new Error('boom2'));
    done();
  });

  it('returns history with `getHistory`', function() {
    var s = ES(null, { history: true });
    var s2 = ES([s], { history: true });
    s2.push(3);
    s.push(5);
    s2.push(4);

    var history = s2.getHistory(0, 2);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].id, s2.id);
    assert.equal(history[0].esType, 'data');
    assert.equal(history[1].value, 5);
    assert.equal(history[1].id, s.id);

    assert.equal(s.getHistory(0).length, 1);
    assert.equal(s2.getHistory(0).length, 3);

    s.error('boom');

    history = s2.getHistory(0);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].id, s2.id);
    assert.equal(history[0].esType, 'data');
    assert.equal(history[1].value, 5);
    assert.equal(history[1].id, s.id);
    assert.equal(history[2].value, 4);
    assert.equal(history[2].id, s2.id);
    assert.equal(history[3].value, 'boom');
    assert.equal(history[3].esType, 'error');
    assert.equal(history[3].id, s.id);
  });

  it('clears the history with `clearHistory`', function() {
    var s = ES(null, { history: true });
    var s2 = ES([s], { history: true });
    s2.push(3);
    s.push(5);
    s2.push(4);

    var history = s2.getHistory(0, 2);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].id, s2.id);
    assert.equal(history[0].esType, 'data');
    assert.equal(history[1].value, 5);
    assert.equal(history[1].id, s.id);

    s2.clearHistory();
    history = s2.getHistory(0);
    assert.deepEqual(history, []);
  });

  describe('replay', function() {
    it('can replay the event history', function(done) {
      var s = ES(null, { history: true });
      var called = 0;

      s.push(3);
      s.push(4);
      s.push(5);
      s.push(6);
      s.error(new Error('boom'));
      s.end();

      s.on('data', function(x) {
        assert.equal(x, called + 3);
        called++;
      })
      .on('error', function(x) {
        assert.equal(called, 4);
        assert.equal(x.message, 'boom');
        called++;
      })
      .on('end', function() {
        assert.equal(called, 5);
        done();
      });

      s.replay(10);
    });

    it('can replay the event history based on when they occurred', function(done) {
      var s = ES(null, { history: true });
      var called = 0;
      var trackedTime;

      s.push(3);

      setTimeout(function() {
        s.push(4);

        setTimeout(function() {
          s.error(new Error('boom'));

          s.on('data', function(x) {
            assert.equal(x, called + 3);
            if (called === 0) {
              trackedTime = new Date().getTime();
            } else {
              assert.ok(new Date().getTime() - trackedTime < 1000);
              trackedTime = new Date().getTime();
            }
            called++;
          })
          .on('error', function(x) {
            assert.equal(called, 2);
            assert.equal(x.message, 'boom');
            assert.ok(new Date().getTime() - trackedTime < 1000);
            done();
          });

          s.replay(10);
        }, 500);
      }, 500);
    });
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

  describe('debounce', function() {
    it('delays data events', function(done) {
      var s = ES();
      var val = 0;

      s.debounce(500).on('data', function(data) {
        val = data;
      });

      s.push(1);
      s.push(2);
      assert.equal(val, 0);

      setTimeout(function() {
        assert.equal(val, 2);
        done();
      }, 1000);
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
});

