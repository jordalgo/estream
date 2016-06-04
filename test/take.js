var assert = require('assert');
var ES = require('../estream');
var take = require('../modules/take');

describe('take', function() {
  it('takes X number of data events then ends', function(done) {
    var count = 0;
    var s = ES(function(push, error) {
      setTimeout(function() {
        push(1);
        error('boom');
        push(2);
        push(3);
      });
    });

    take(2)(s).on(function(event) {
      if (count === 0) {
        assert.equal(event.value, 1);
      } else if (count === 1) {
        assert.equal(event.value, 'boom');
      } else if (count === 2) {
        assert.equal(event.value, 2);
      } else if (count === 3) {
        assert.ok(event.isEnd);
      } else {
        assert.fail();
      }
      count++;
    });

    setTimeout(done, 50);
  });
});
