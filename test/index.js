var assert = require('assert');
var PH = require('../index');

describe('sources', function() {
  it('can be created', function() {
    var s = PH.source();
    assert.equal(typeof s.start, 'function');
    assert.equal(typeof s.open, 'function');
    assert.equal(typeof s.close, 'function');
    assert.equal(typeof s.hasCompleted, 'function');
    assert.equal(typeof s.addPipe, 'function');
  });

  it('only calls the passed function when start is called', function() {
    var called;
    var s = PH.source(function() {
      called = true;
    });
    assert.equal(called, undefined);
    s.start();
    assert.equal(called, true);
  });

  it('calls the passed function on a delay if a int is passed to start', function(done) {
    var called;
    var s = PH.source(function() {
      called = true;
    });
    assert.equal(called, undefined);
    s.start(0);
    assert.equal(called, undefined);
    setTimeout(function() {
      assert.equal(called, true);
      done();
    }, 10);
  });

  it('throws if you call next if the stream has completed', function() {
    var s = PH.source(function(next, end, complete) {
      complete();
      try {
        next(1);
        assert.fail();
      } catch (e) {
        assert.equal(typeof e, 'object');
      }
    });
    s.start();
  });

  it('throws if you call error if the stream has completed', function() {
    var s = PH.source(function(next, end, complete) {
      complete();
      try {
        error(1);
        assert.fail();
      } catch (e) {
        assert.equal(typeof e, 'object');
      }
    });
    s.start();
  });

  it('passes values to multiple pipes', function(done) {
    var pipeCalled = 0;
    var s = PH.source(function(next, end, complete) {
      next(5);
      complete();
    });

    PH.pipe(s)
    .onNext(function(x) {
      assert.equal(x, 5);
      pipeCalled++;
    });
    PH.pipe(s)
    .onNext(function(x) {
      assert.equal(x, 5);
      pipeCalled++;
    });
    PH.pipe(s)
    .onNext(function(x) {
      assert.equal(x, 5);
      pipeCalled++;
    })
    .onComplete(function() {
      assert.equal(pipeCalled, 3);
      done();
    });

    s.start();
  });

  it('does not pass values when not open', function(done) {
    var s = PH.source(function(next, end, complete) {
      setTimeout(function() {
        next(5);
        s.open();
      }, 50);
      setTimeout(function() {
        next(6);
      }, 100);
    });

    PH.pipe(s)
    .onNext(function(x) {
      assert.equal(x, 6);
      done();
    });

    s.start();
    s.close();
  });
});

// describe('pipes', function() {
//   it('')

// });

