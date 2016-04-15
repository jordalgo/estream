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
});
