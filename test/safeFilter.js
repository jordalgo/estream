var assert = require('assert');
var ES = require('../estream');
var safeFilter = require('../modules/safeFilter')(ES);

ES.addEstreamMethods([{
  name: 'safeFilter',
  fn: safeFilter
}]);

describe('safeFilter', function() {
  it('catches errors and sends them down stream', function(done) {
    var s = ES();
    var filterError = function() { throw new Error('boom'); };

    s.safeFilter(filterError)
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

