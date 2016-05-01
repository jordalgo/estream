var assert = require('assert');
var ES = require('../estream');
var batchByCount = require('../modules/batchByCount')(ES);

ES.addEstreamMethods([{
  name: 'batchByCount',
  fn: batchByCount
}]);

describe('batchByCount', function() {
  it('keeps a separate queue of messages count', function(done) {
    var s = ES();
    var called;

    s
    .batchByCount(3)
    .on('data', function(x) {
      if (!called) {
        assert.deepEqual(x, [1, 2, 3]);
        called = true;
      } else {
        assert.deepEqual(x, [4, 5, 6]);
        done();
      }
    });

    s.push(1);
    s.push(2);
    s.push(3);
    s.push(4);
    s.push(5);
    s.push(6);
  });
});
