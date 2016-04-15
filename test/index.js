var assert = require('assert');
var PH = require('../index');

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
      assert.equal(x, 'error');
      done();
    });
    p.error('error');
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
      assert.equal(x, 2);
    })
    .onComplete(function() {
      assert.equal(called, 2);
      done();
    });

    p1.next(1);
    p1.error(2);
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
    p.error(2);

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
      assert.equal(x, 2);
    })
    .onComplete(function() {
      assert.equal(called, 3);
      done();
    });

    p1.next(1);
    p2.next(10);
    p2.error(2);
    p1.complete();
    p2.complete();
  });
});

