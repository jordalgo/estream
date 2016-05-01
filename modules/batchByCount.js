var curryN = require('ramda/src/curryN');
var checkESimport = require('./checkESimport');
var ES;

module.exports = function(ESimport) {
  checkESimport(ESimport);
  ES = ESimport;
  return curryN(2, batchByCount);
};

/**
 * Returns an Estream that batches data by count.
 *
 * __Signature__: `Number -> estream a`
 *
 * @name batchByCount
 * @param {Number} count - the amount to batch
 * @param {Estream} source - the source Estream
 * @return {Estream}
 */
function batchByCount(count, source) {
  var s = ES();
  var countState = count;
  var batch = [];
  source.on('data', function(data) {
    batch.push(data);
    countState--;
    if (countState === 0) {
      s.push(batch);
      batch = [];
      countState = count;
    }
  });
  source.connect(['error', 'end'], s);
  return s;
}

