# Configuration

The Pipe constructor is configurable in that you can add functions to it's prototype for chainability. The [index.js](../index.js) does this to provide some basic transformation methods but if you know you're not going to use all of these, you can configure your own piping-hot pipe object. For example:

```javascript
var PH = require('piping-hot/piping-hot');

var map = require('./modules/map')(PH.pipe);
var scan = require('./modules/scan')(PH.pipe);

PH.addPipeMethods([
  { name: 'map', fn: map },
  { name: 'scan', fn: scan },
]);

module.exports = PH;
```

# Available Modules
- [map](./map.md) (included in index.js)
- [scan](./scan.md) (included in index.js)
- [filter](./filter.md) (included in index.js)
- [take](./take.md) (included in index.js)
- [ap](./ap.md) (included in index.js)
- [completeOnError](./complete-on-error.md) (included in index.js)
- [collect](./collect.md)
