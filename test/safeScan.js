var assert = require('assert');
var ES = require('../estream');
var safeScan = require('../modules/safeScan')(ES);

ES.addEstreamMethods([{
  name: 'safeScan',
  fn: safeScan
}]);

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

