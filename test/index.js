var assert = require('assert');
var estream = require('../lib');
var R = require('ramda');

var add1 = function(x) { return x + 1; };
var sum = function(acc, value) { return acc + value; };
var isGt10 = function(a) { return a > 10; };

describe('Estream', function() {
  it('can create a Estream', function() {
    assert.equal(typeof estream, 'function');
  });

  it('has a method to push data into it and a consume that data', function(done) {
    var s = estream();
    s.push(5);
    s.on(function(data) {
      assert.equal(data.isData, true);
      assert.equal(data.value, 5);
      done();
    });
  });

  it('routes errors', function(done) {
    var s = estream();
    s.error('error');
    s.on(function(err) {
      assert.equal(err.isError, true);
      assert.equal(err.value, 'error');
      done();
    });
  });

  it('routes ends', function(done) {
    var s = estream();
    s.end('byebye');
    s.on(function(end) {
      assert.equal(end.isEnd, true);
      assert.deepEqual(end.value, ['byebye']);
      done();
    });
  });

  it('can combine multiple source estreams', function(done) {
    var s1 = estream();
    setTimeout(s1.push.bind(s1, 1));
    setTimeout(s1.end.bind(s1, 'hello'), 150);
    var s2 = estream();
    setTimeout(s2.push.bind(s2, 10));
    setTimeout(s2.error.bind(s2, 'error'), 50);
    setTimeout(s2.end.bind(s2, 'bye'), 300);
    var s3 = estream.combine([s1, s2]);
    var s4 = estream.combine([s3]);
    var called = 0;

    s3
    .on(function(x, sourceEstream) {
      if (called === 0) {
        assert.equal(x.value, 1);
        assert.equal(sourceEstream, s1);
      } else if (called === 1) {
        assert.equal(x.value, 10);
        assert.equal(sourceEstream, s2);
      } else if (called === 2) {
        assert.equal(x.value, 'error');
        assert.equal(sourceEstream, s2);
      } else if (called === 3) {
        assert.deepEqual(x.value, ['hello', 'bye']);
        assert.equal(sourceEstream, s3);
        done();
      }
      called++;
    });

    s4.on(function(x, sourceEstream, off) {
      if (called === 0) {
        assert.equal(x.value, 1);
        assert.equal(sourceEstream, s1);
      }
      off();
    });
  });

  it('has helper methods for consuming error and end messages', function(done) {
    var s = estream();
    s.push(5);
    s.error('error');
    s.end('bye');
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

  it('passes unsubscribe functions to consumers when events are emitted', function(done) {
    var called;
    var s = estream();
    setTimeout(function() {
      s.push(1);
      assert.ok(called);
      s.error(new Error('boom'));
    });

    s.on(function(x, sref, unsubscribe) {
      if (!called) {
        assert.equal(x.value, 1);
        assert.equal(sref, s);
        unsubscribe();
        called = true;
      } else {
        assert.fail();
      }
    });

    setTimeout(done, 10);
  });

  it('emits unique event objects', function(done) {
    var s = estream();
    s.push(5);

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

  it('returns the buffer with `getBuffer`', function(done) {
    var s = estream();
    s.push(3);
    s.push(5);
    s.push(4);
    setTimeout(s.error.bind(s, 'boom'), 100);

    var buffer = s.getBuffer(2);
    assert.equal(buffer[0].value, 3);
    assert.equal(buffer[0].isData, true);
    assert.equal(buffer[1].value, 5);

    assert.equal(s._buffer.length, 1);

    setTimeout(function() {
      buffer = s.getBuffer(0);
      assert.equal(buffer[0].value, 4);
      assert.equal(buffer[1].value, 'boom');
      assert.equal(buffer[1].isError, true);
      done();
    }, 200);
  });

  it('clears the buffer with `clearbuffer`', function() {
    var s = estream();
    s.push(3);
    s.push(5);
    s.push(4);
    setTimeout(s.error.bind(s, 'boom'), 100);

    var buffer = s.getBuffer(2);
    assert.equal(buffer[0].value, 3);
    assert.equal(buffer[0].isData, true);
    assert.equal(buffer[1].value, 5);

    s.clearBuffer();
    assert.deepEqual(s.getBuffer(0), []);
  });

  it('does not buffers messages with buffer set to false', function(done) {
    var s = estream({ buffer: false });
    s.push(3);
    s.push(4);
    s.error(new Error('boom'));
    setTimeout(s.push.bind(s, 1), 50);

    s.on(function(x) {
      assert.equal(x.value, 1);
      done();
    });
  });

  it('has an addMethods method', function() {
    estream.addMethods([{
      name: 'fmap',
      fn: function() {}
    }]);
    var p = estream();
    assert.equal(typeof p.fmap, 'function');
  });

  it('empties the buffer if events happened before a consumer was added', function(done) {
    var s = estream();
    s.push(3);

    s.on(function(x) {
      assert.equal(x.value, 3);
    });

    setTimeout(function() {
      assert.equal(s.getBuffer().length, 0);
      done();
    }, 50);
  });

  it('doesnt keep a buffer if buffer option set to false', function(done) {
    var s = estream({ buffer: false });
    s.push(3);

    s.on(function() {
      assert.fail();
    });

    setTimeout(function() {
      done();
    }, 10);
  });

  it('is a functor', function() {
    var s = estream();
    s.push(1);
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

    assert.equal(composedValue, serialValue);
  });

  describe('map', function() {
    it('maps a function over data values', function(done) {
      var called = 0;
      var s1 = estream();
      s1.error('error');
      s1.push(4);

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
  });

  describe('scan', function() {
    it('reduces pushed data events', function(done) {
      var called = 0;
      var s = estream();
      s.push(5);
      s.push(10);

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
  });

  describe('filter', function() {
    it('filters data event values', function(done) {
      var called = 0;
      var s = estream();
      s.push(5);
      s.push(11);

      s.filter(isGt10)
      .on(function(x) {
        assert.equal(x.value, 11);
        assert.equal(called, 0);
        done();
      });
    });
  });
});

