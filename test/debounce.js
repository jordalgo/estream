var assert = require('assert');
var ES = require('../estream');
var debounce = require('../modules/debounce');

describe('debounce', function() {
  it('delays all events', function(done) {
    var s = ES();
    var val = 0;
    var debounce500 = debounce(500); // this tests the auto-curry

    debounce500(s).on(function(event) {
      val = event.value;
    });

    s.push(1);
    s.push(2);
    assert.equal(val, 0);

    setTimeout(function() {
      assert.equal(val, 2);
      done();
    }, 1000);
  });
});
