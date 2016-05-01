module.exports = function(ES) {
  return function merge() {
    var s = ES();
    var estreams = Array.prototype.slice.call(arguments);
    var count = estreams.length;
    var dataQueue = [];
    estreams.forEach(function(e) {
      e.connect(['error', 'end'], s);
      e.on('data', function(data, emitter) {
        var found = -1;
        dataQueue.some(function(obj, index) {
          if (obj.estream === emitter) {
            found = index;
            return true;
          }
          return false;
        });
        if (found === -1) {
          count--;
          dataQueue.push({
            estream: emitter,
            data: data
          });
        } else {
          dataQueue[found] = {
            estream: emitter,
            data: data
          };
        }
        if (count === 0) {
          s.push(dataQueue);
          dataQueue = [];
          count = estreams.length;
        }
      });
    });
    return s;
  };
};
