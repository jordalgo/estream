var assert = require('assert');
var estream = require('../lib');
var R = require('ramda');

var add1 = function(x) { return x + 1; };
var sum = function(acc, value) { return acc + value; };
var isGt10 = function(a) { return a > 10; };

describe('Estream', function() {
  describe('basics', function() {
    it('can create a Estream', function() {
      assert.equal(typeof estream, 'function');
    });

    it('has a method to push data into it and a consume that data', function(done) {
      var s = estream({
        start: function(push) {
          push(5);
        }
      });
      s.on(function(data) {
        assert.equal(data.isData, true);
        assert.equal(data.value, 5);
        done();
      });
    });

    it('routes errors', function(done) {
      var s = estream({
        start: function(push, error) {
          error('error');
        }
      });
      s.on(function(err) {
        assert.equal(err.isError, true);
        assert.equal(err.value, 'error');
        done();
      });
    });

    it('routes ends', function(done) {
      var s = estream({
        start: function(push, error, end) {
          end('byebye');
        }
      });
      s.on(function(end) {
        assert.equal(end.isEnd, true);
        assert.deepEqual(end.value, ['byebye']);
        done();
      });
    });

    it('has helper methods for consuming error and end messages', function(done) {
      var s = estream({
        start: function(push, error, end) {
          push(5);
          error('error');
          end('bye');
        }
      });
      var errorCalled;

      s.onError(function(x) {
        assert.equal(x, 'error');
        errorCalled = true;
      });
      s.onEnd(function(x) {
        assert.deepEqual(x, ['bye']);
        assert.ok(errorCalled);
        done();
      });
    });

    it('emits unique event objects', function(done) {
      var s = estream({
        start: function(push) {
          push(5);
        }
      });

      s.on(function(event) {
        // try to mess up this event's value and isData
        event.value = 'bad';
        event.isData = false;
      });

      s.on(function(event) {
        assert.deepEqual(event.value, 5);
        assert.ok(event.isData);
        done();
      });
    });
  });

  describe('subscriptions', function() {
    it('calls the passed function when a subscriber is added', function(done) {
      var called = false;
      var s = estream({ start: function(push) { called = true; push(5); } });
      assert.ok(!called);
      s.on(function(data) {
        assert.equal(data.isData, true);
        assert.equal(data.value, 5);
        assert.ok(called);
        done();
      });
    });

    it('wont push an event that has occured before a subscriber is added', function(done) {
      var s = estream({
        start: function(push) {
          push(5);
        }
      });
      s.on(function(data) {
        assert.equal(data.isData, true);
        assert.equal(data.value, 5);
        done();
      });
    });

    it('will call stop if there are no more subscribers', function(done) {
      var s = estream({
        start: function(push) { push(1); },
        stop: function() {
          done();
        }
      });

      s.on(function(d, h, _, off) {
        off();
      });
    });

    it('passes the return of start to the stop function', function(done) {
      var s = estream({
        start: function(push) { push(1); return 'hello'; },
        stop: function(artifact) {
          assert.equal(artifact, 'hello');
          done();
        }
      });

      s.on(function(d, h, _, off) {
        off();
      });
    });

    it('re-calls start if new subscribers added after stop & stop fn exists', function(done) {
      var startCalled = 0;
      var s = estream({
        start: function(push) {
          startCalled++;
          if (startCalled === 2) {
            done();
          } else {
            push(1);
          }
        },
        stop: function() {}
      });

      s.on(function(d, h, _, off) {
        off();
        setTimeout(function() {
          s.on(function() {});
        }, 500);
      });
    });

    it('re-calls start if new subscribers added after stop & start returns a fn', function(done) {
      var startCalled = 0;
      var s = estream({
        start: function(push) {
          startCalled++;
          if (startCalled === 2) {
            done();
          } else {
            push(1);
          }
          return function stop() {};
        }
      });

      s.on(function(d, h, _, off) {
        off();
        setTimeout(function() {
          s.on(function() {});
        }, 500);
      });
    });

    it('will not re-call start if new subscribers added after stop' +
        '& no stop & start does not return a fn', function(done) {
      var startCalled = 0;
      var s = estream({
        start: function(push) {
          startCalled++;
          if (startCalled === 2) {
            assert.fail();
          } else {
            push(1);
          }
        }
      });

      s.on(function(d, h, _, off) {
        off();
        setTimeout(function() {
          s.on(function() {});
        }, 500);
      });

      setTimeout(done, 1000);
    });

    it('will not re-call start if estream has ended', function(done) {
      var startCalled = 0;
      var s = estream({
        start: function(push, error, end) {
          startCalled++;
          if (startCalled === 2) {
            assert.fail();
          } else {
            end();
          }
        }
      });

      s.on(function(d, h, _, off) {
        off();
        setTimeout(function() {
          s.on(function() {});
        }, 500);
      });

      setTimeout(done, 1000);
    });

    it('wont call stop if a subscriber is added ' +
       'in the same stack as a subscriber is removed', function(done) {
      var s = estream({
        start: function(push) {
          push(3);
          setTimeout(function() {
            push(4);
          }, 500);
        },
        stop: function() {
          assert.fail();
        }
      });

      var off = s.on(function(x) {
        assert.equal(x.value, 3);
      });

      setTimeout(function() {
        off();
        s.on(function(y) {
          assert.equal(y.value, 4);
          done();
        });
      }, 100);
    });

    it('passes unsubscribe functions to consumers when events are emitted', function(done) {
      var called;
      var s = estream({
        start: function(push, error) {
          push(1);
          assert.ok(called);
          error(new Error('boom'));
        }
      });

      s.on(function(x, _, sref, off) {
        if (!called) {
          assert.equal(x.value, 1);
          assert.equal(sref, s);
          off();
          called = true;
        } else {
          assert.fail();
        }
      });

      setTimeout(done, 10);
    });
  });

  describe('history', function() {
    it('always sends the history when a new event occurs', function(done) {
      var s = estream(
        {
          start: function(push) {
            push(1);
            push(2);

            setTimeout(push.bind(null, 4), 500);
          }
        },
        { history: 2 }
      );

      // start the stream flowing
      s.on(function() {});

      setTimeout(function() {
        s.on(function(event, history) {
          assert.equal(history[0].value, 1);
          assert.equal(history[1].value, 2);
          assert.equal(event.value, 4);
          done();
        });
      }, 100);
    });

    it('returns the history with `getHistory`', function(done) {
      var s = estream({
        start: function(push, error) {
          push(3);
          push(5);
          push(4);
          setTimeout(error.bind(s, 'boom'), 200);
        }
      }, { history: 100 });

      s.on(function() {});

      var history;

      setTimeout(function() {
        history = s.getHistory();
        assert.equal(history[0].value, 3);
        assert.equal(history[0].isData, true);
        assert.equal(history[1].value, 5);
        assert.equal(history[2].value, 4);
        assert.equal(s._history.length, 3);
      }, 100);

      setTimeout(function() {
        history = s.getHistory();
        assert.equal(history[0].value, 3);
        assert.equal(history[1].value, 5);
        assert.equal(history[2].value, 4);
        assert.equal(history[3].value, 'boom');
        assert.equal(history[3].isError, true);
        done();
      }, 500);
    });

    it('clears the history with `clearhistory`', function() {
      var s = estream({
        start: function(push) {
          push(3);
          push(5);
          push(4);
        }
      }, { history: 100 });

      s.on(function() {});

      setTimeout(function() {
        assert.equal(s.getHistory().length, 3);
        s.clearHistory();
        assert.deepEqual(s.getHistory(), []);
      }, 100);
    });

    it('doesnt keep a history if no history number is passed as an option', function(done) {
      var s = estream({
        start: function(push) {
          push(3);
        }
      });

      s.on(function() { });

      setTimeout(function() {
        assert.equal(s.getHistory().length, 0);
        done();
      }, 100);
    });
  });

  describe('combine', function() {
    it('can combine multiple source estreams', function(done) {
      var s1 = estream({
        start: function(push) {
          push(1);
          setTimeout(function() {
            push('hello');
          }, 100);
        }
      });
      var s2 = estream({
        start: function(push) {
          push(2);
          setTimeout(function() {
            push('bye');
          }, 200);
        }
      });
      var s3 = estream.combine([s1, s2]);

      var called = 0;
      s3
      .on(function(x, _, sourceEstream) {
        if (called === 0) {
          assert.equal(x.value, 1);
          assert.equal(sourceEstream, s1);
        } else if (called === 1) {
          assert.equal(x.value, 2);
          assert.equal(sourceEstream, s2);
        } else if (called === 2) {
          assert.equal(x.value, 'hello');
          assert.equal(sourceEstream, s1);
        } else if (called === 3) {
          assert.deepEqual(x.value, 'bye');
          assert.equal(sourceEstream, s2);
          done();
        }
        called++;
      });
    });

    it('calls stop on both source streams when the combined subscriber is removed', function(done) {
      var s1StopCalled = false;
      var s2StopCalled = false;
      var s1 = estream({
        start: function(push) {
          push(1);
        },
        stop: function() {
          s1StopCalled = true;
        }
      });
      var s2 = estream({
        start: function(push) {
          push(2);
        },
        stop: function() {
          s2StopCalled = true;
        }
      });

      estream
      .combine([s1, s2])
      .on(function(x, _, sourceEstream, off) {
        off();
      });

      setTimeout(function() {
        assert(s1StopCalled);
        assert(s2StopCalled);
        done();
      }, 100);
    });
  });

  it('has an addMethods method', function() {
    estream.addMethods([{
      name: 'fmap',
      fn: function() {}
    }]);
    var p = estream({ start: function() {} });
    assert.equal(typeof p.fmap, 'function');
  });

  it('is a functor', function(done) {
    var s = estream({
      start: function(push) {
        push(1);
      }
    });
    var add2 = function(x) { return x + 2; };
    var composedMap = R.pipe(add1, add2);

    var composedValue;
    var serialValue;

    s.map(composedMap).on(function(x) {
      composedValue = x.value;
    });

    s.map(add1).map(add2).on(function(x) {
      serialValue = x.value;
    });

    // test identity
    s.map(R.identity).on(function(x) {
      assert.equal(x.value, 1);
    });

    // test fmap
    R.map(add1, s).on(function(x) {
      assert.equal(x.value, 2);
      done();
    });

    assert.equal(composedValue, serialValue);
  });

  describe('map', function() {
    it('maps a function over data values', function(done) {
      var called = 0;
      var s1 = estream({
        start: function(push, error) {
          error('error');
          push(4);
        }
      });

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
    });

    it('stops the parent stream if you remove the map subscriber', function(done) {
      var s1 = estream({
        start: function(push) {
          push(4);
        },
        stop: function() {
          done();
        }
      });

      s1
      .map(add1)
      .on(function(x, h, st, off) {
        off();
      });
    });

    it('can have a history', function(done) {
      var called = 0;
      var s1 = estream({
        start: function(push, error) {
          error('error');
          push(4);
        }
      });

      s1
      .map(add1, { history: 1 })
      .on(function(x, history) {
        if (called === 0) {
          assert.equal(x.value, 'error');
          called++;
        } else {
          assert.equal(history[0].value, 'error');
          assert.equal(x.value, 5);
          done();
        }
      });
    });
  });

  describe('scan', function() {
    it('reduces pushed data events', function(done) {
      var called = 0;
      var s = estream({
        start: function(push) {
          push(5);
          push(10);
        }
      });

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
    });

    it('stops the parent stream if you remove the subscriber', function(done) {
      var s1 = estream({
        start: function(push) {
          push(4);
        },
        stop: function() {
          done();
        }
      });

      s1
      .scan(sum, 5)
      .on(function(x, h, st, off) {
        off();
      });
    });
  });

  describe('filter', function() {
    it('filters data event values', function(done) {
      var called = 0;
      var s = estream({
        start: function(push) {
          push(5);
          push(11);
        }
      });

      s.filter(isGt10)
      .on(function(x) {
        assert.equal(x.value, 11);
        assert.equal(called, 0);
        done();
      });
    });

    it('stops the parent stream if you remove the subscriber', function(done) {
      var s1 = estream({
        start: function(push) {
          push(14);
        },
        stop: function() {
          done();
        }
      });

      s1
      .filter(isGt10)
      .on(function(x, h, st, off) {
        off();
      });
    });
  });
});

