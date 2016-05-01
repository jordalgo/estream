var assert = require('assert');
var ES = require('../estream');
var safeMap = require('../modules/safeMap')(ES);

ES.addEstreamMethods([{
  name: 'safeMap',
  fn: safeMap
}]);

describe('safeMap', function() {
  it('catches errors and sends them down the stream', function(done) {
    var s1 = ES();
    var throwError = function() { throw new Error('boom'); };

    s1.safeMap(throwError)
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

