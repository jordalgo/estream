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
    s.on(function(data) {
      assert.equal(data.isData, true);
      assert.equal(data.value, 5);
      done();
    });
    s.push(5);
  });

  it('routes errors', function(done) {
    var s = ES();
    s.on(function(err) {
      assert.equal(err.isError, true);
      assert.equal(err.value, 'error');
      done();
    });
    s.push(new ES.error('error'));
  });

  it('routes ends', function(done) {
    var s = ES();
    s.on(function(end) {
      assert.equal(end.isEnd, true);
      assert.deepEqual(end.value, ['byebye']);
      done();
    });
    s.push(new ES.end('byebye'));
  });

  it('can have multiple source estreams', function(done) {
    var s1 = ES();
    var s2 = ES();
    var s3 = ES([s1, s2]);
    var called = 0;

    s3
    .on(function(x) {
      if (called === 0) {
        assert.equal(x.value, 1);
        assert.equal(x.estreamId, s1.id);
      } else if (called === 1) {
        assert.equal(x.value, 10);
        assert.equal(x.estreamId, s2.id);
      } else if (called === 2) {
        assert.equal(x.value, 20);
        assert.equal(x.estreamId, s3.id);
      } else if (called === 3) {
        assert.equal(x.value, 'error');
        assert.equal(x.estreamId, s2.id);
      } else if (called === 4) {
        assert.deepEqual(x.value, ['hello', 'bye']);
        assert.equal(called, 4);
        done();
      }
      called++;
    });

    s1.push(1);
    s2.push(10);
    s3.push(20);
    s2.push(new ES.error('error'));
    s1.push(new ES.end('hello'));
    s2.push(new ES.end('bye'));
  });

  it('ends if parent Estreams have not ended and end called explicitly', function() {
    var s0 = ES();
    var s1 = ES();
    var s2 = ES();
    var s3 = ES([s0, s1, s2]);
    var s3Complete = false;

    s3.on(function() {
      s3Complete = true;
    });

    s1.end();
    s2.end();
    assert.equal(s3Complete, false);
    s3.end();
    assert.equal(s3Complete, true);
  });

  it('has helper methods for passing error and end messages', function(done) {
    var s = ES();
    var called = 0;

    s.on(function(x) {
      if (called === 0) {
        assert.equal(x.value, 'error');
      } else if (called === 1) {
        assert.deepEqual(x.value, ['bye']);
        done();
      }
      called++;
    });

    s.error('error');
    s.end('bye');
  });

  it('passes unsubscribe functions to consumers when events are emitted', function(done) {
    var s = ES();
    var called;

    s.on(function(x, estream, unsubscribe) {
      if (!called) {
        assert.equal(x.value, 1);
        unsubscribe();
        called = true;
      } else {
        assert.fail();
      }
    });

    s.push(1);
    s.error(new Error('boom'));
    assert.ok(called);
    setTimeout(done, 10);
  });

  it('has a method to remove a consumer', function() {
    var s = ES();
    var dataConsumer = function() {
      assert.fail();
    };
    s.on(dataConsumer);
    s.off(dataConsumer);
    s.push(5);
  });

  xit('returns history with `getHistory`', function() {
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

  xit('clears the history with `clearHistory`', function() {
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
    xit('can replay the event history', function(done) {
      var s = ES(null, { history: true, buffer: false });
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

    xit('can replay the event history based on when they occurred', function(done) {
      var s = ES(null, { history: true, buffer: false });
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

    s.on(function(x) {
      if (called === 0) {
        assert.equal(x.value, 1);
      } else if (called === 1) {
        assert.equal(x.value, 2);
      } else {
        assert.equal(x.value.message, 'boom2');
        done();
      }
      called++;
    });

    s.push(1);
    s.push(2);
    s.error(new Error('boom2'));
  });

  xit('throws if you push into an ended estream', function() {
    var s = ES();
    s.push();
    try {
      s.push(5);
      assert.fail();
    } catch (e) {
      assert.equal(typeof e.message, 'string');
    }
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

  it('empties the buffer if events happened before a consumer was added', function(done) {
    var s = ES();

    s.push(3);
    s.push(4);
    s.error(new Error('boom'));
    s.end('ended');

    s.on(function(x) {
      assert.equal(x.value, 3);
      done();
    });
  });

  xit('is a functor', function() {
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
    it('maps a function over data values', function(done) {
      var s1 = ES();
      var called = 0;
      s1
      .map(add1)
      .on(function(x) {
        if (called === 0) {
          assert.equal(x.value, 'error');
          called++;
        } else {
          assert.equal(x.value, 5);
          done();
        }
      });
      s1.error('error');
      s1.push(4);
    });

    it('catches errors', function(done) {
      var s1 = ES();
      var errorFn = function() { throw new Error('boom'); };
      s1
      .map(errorFn)
      .on(function(x) {
        assert.ok(x.isError);
        assert.equal(x.value.message, 'boom');
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
      .on(function(x) {
        if (called === 0) {
          assert.equal(x.value, 10);
          called++;
        } else {
          assert.equal(x.value, 20);
          done();
        }
      });

      s.push(5);
      s.push(10);
    });

    it('catches errors', function(done) {
      var s1 = ES();
      var errorFn = function() { throw new Error('boom'); };
      s1
      .scan(errorFn, 0)
      .on(function(x) {
        assert.ok(x.isError);
        assert.equal(x.value.message, 'boom');
        done();
      });
      s1.push(4);
    });
  });

  describe('filter', function() {
    xit('filters non-error data', function(done) {
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

    xit('is exported as a function', function(done) {
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
    xit('delays data events', function(done) {
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

  describe('reduce', function() {
    xit('reduces the values of a single stream', function(done) {
      var s = ES();
      var errorCalled;

      s.reduce(sum, 0)
      .on('error', function() {
        errorCalled = true;
      })
      .on('end', function(value) {
        assert.equal(value, 20);
        assert.ok(errorCalled);
        done();
      });

      s.push(5);
      s.push(10);
      s.error(new Error('blah'));
      s.push(3);
      s.end(2);
    });

    xit('reduces the values of multiple streams', function(done) {
      var s1 = ES();
      var s2 = ES();
      var s3 = ES([s1, s2]);

      s3.reduce(sum, 0).on('end', function(value) {
        assert.equal(value, 28);
        done();
      });

      s1.push(5);
      s2.push(10);
      s1.push(3);
      s1.end(4);
      s2.end(6);
    });
  });

  describe('endOnError', function() {
    xit('ends on an error', function(done) {
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

