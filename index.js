var PH = require('./piping-hot');

var map = require('./modules/map')(PH.pipe);
var scan = require('./modules/scan')(PH.pipe);
var filter = require('./modules/filter')(PH.pipe);
var ap = require('./modules/ap')(PH.pipe);
var take = require('./modules/take')(PH.pipe);
var completeOnError = require('./modules/complete-on-error')(PH.pipe);

PH.addPipeMethods([
  { name: 'map', fn: map },
  { name: 'scan', fn: scan },
  { name: 'filter', fn: filter },
  { name: 'ap', fn: ap },
  { name: 'take', fn: take },
  { name: 'completeOnError', fn: completeOnError }
]);

// Let's expose them as functions here just to be helpful.
PH.map = map;
PH.scan = scan;
PH.filter = filter;
PH.ap = ap;
PH.take = take;
PH.completeOnError = completeOnError;

module.exports = PH;
