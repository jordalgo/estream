var assert = require('assert');
var estream = require('../lib');
var debounce = require('../modules/debounce');

describe('debounce', function() {
  it('delays all events', function(done) {
    var val = 0;
    var debounce500 = debounce(500); // this tests the auto-curry
    var s = estream({
      start: function(push) {
        push(1);
        push(2);
        assert.equal(val, 0);
      }
    });
    setTimeout(function() {
    });

    debounce500(s).on(function(event) {
      val = event.value;
    });

    setTimeout(function() {
      assert.equal(val, 2);
      done();
    }, 1000);
  });
});
