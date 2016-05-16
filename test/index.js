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
    s.push(new ES.Error('error'));
  });

  it('routes ends', function(done) {
    var s = ES();
    s.on(function(end) {
      assert.equal(end.isEnd, true);
      assert.deepEqual(end.value, ['byebye']);
      done();
    });
    s.push(new ES.End('byebye'));
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
    s2.push(new ES.Error('error'));
    s1.push(new ES.End('hello'));
    s2.push(new ES.End('bye'));
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

  it('freezes event objects that are emitted', function(done) {
    var s = ES();

    s.on(function(event) {
      event.value = 'bad';
      assert.equal(event.value, 5);
      done();
    });

    s.push(5);
  });

  it('returns history with `getHistory`', function() {
    var s = ES(null, { history: true });
    var s2 = ES([s], { history: true });
    s2.push(3);
    s.push(5);
    s2.push(4);

    var history = s2.getHistory(0, 2);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].estreamId, s2.id);
    assert.equal(history[0].isData, true);
    assert.equal(history[1].value, 5);
    assert.equal(history[1].estreamId, s.id);

    assert.equal(s.getHistory(0).length, 1);
    assert.equal(s2.getHistory(0).length, 3);

    s.error('boom');

    history = s2.getHistory(0);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].estreamId, s2.id);
    assert.equal(history[0].isData, true);
    assert.equal(history[1].value, 5);
    assert.equal(history[1].estreamId, s.id);
    assert.equal(history[2].value, 4);
    assert.equal(history[2].estreamId, s2.id);
    assert.equal(history[3].value, 'boom');
    assert.equal(history[3].isError, true);
    assert.equal(history[3].estreamId, s.id);
  });

  it('clears the history with `clearHistory`', function() {
    var s = ES(null, { history: true });
    var s2 = ES([s], { history: true });
    s2.push(3);
    s.push(5);
    s2.push(4);

    var history = s2.getHistory(0, 2);
    assert.equal(history[0].value, 3);
    assert.equal(history[0].estreamId, s2.id);
    assert.equal(history[0].isData, true);
    assert.equal(history[1].value, 5);
    assert.equal(history[1].estreamId, s.id);

    s2.clearHistory();
    history = s2.getHistory(0);
    assert.deepEqual(history, []);
  });

  describe('replay', function() {
    it('can replay the event history', function(done) {
      var s = ES(null, { history: true, buffer: false });
      var called = 0;

      s.push(3);
      s.push(4);
      s.push(5);
      s.push(6);
      s.error(new Error('boom'));
      s.end();

      s.on(function(x) {
        if (called < 4) {
          assert.ok(x.isData);
          assert.equal(x.value, called + 3);
        } else if (called === 4) {
          assert.ok(x.isError);
          assert.equal(x.value.message, 'boom');
        } else {
          assert.ok(x.isEnd);
          done();
        }
        called++;
      });

      s.replay(10);
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

  it('has an addMethods method', function() {
    ES.addMethods([{
      name: 'fmap',
      fn: function() {}
    }]);
    var p = ES();
    assert.equal(typeof p.fmap, 'function');
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

  it('is a functor', function() {
    var s = ES();
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
    });

    s.push(1);
    assert.equal(composedValue, serialValue);
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
    it('reduces pushed data events', function(done) {
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
    it('filters data event values', function(done) {
      var s = ES();
      var called = 0;

      s.filter(isGt10)
      .on(function(x) {
        assert.equal(x.value, 11);
        assert.equal(called, 0);
        done();
      });

      s.push(5);
      s.push(11);
    });

    it('catches errors', function(done) {
      var s1 = ES();
      var errorFn = function() { throw new Error('boom'); };
      s1
      .filter(errorFn)
      .on(function(x) {
        assert.ok(x.isError);
        assert.equal(x.value.message, 'boom');
        done();
      });
      s1.push(4);
    });
  });

  describe('filterEvent', function() {
    it('filters events', function(done) {
      var s = ES();

      s.filterEvent(function (e) {
        return e.isEnd;
      })
      .on(function(x) {
        assert.ok(x.isEnd);
        assert.deepEqual(x.value, ['end']);
        done();
      });

      s.push(5);
      s.push('hello');
      s.error('boom');
      s.end('end');
    });
  });

  describe('reduce', function() {
    it('reduces the values of a single stream', function(done) {
      var s = ES();
      var called = 0;

      s.reduce(sum, 0)
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

      s.push(5);
      s.push(10);
      s.error(new Error('blah'));
      s.push(3);
      s.end(2);
    });

    it('reduces the values of multiple streams', function(done) {
      var s1 = ES();
      var s2 = ES();
      var s3 = ES([s1, s2]);

      s3.reduce(sum, 0).on(function(event) {
        assert.equal(event.value, 28);
        done();
      });

      s1.push(5);
      s2.push(10);
      s1.push(3);
      s1.end(4);
      s2.end(6);
    });
  });
});

