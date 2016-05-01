module.exports = function(ES) {
  if (!ES || (typeof ES !== 'function')) {
    throw new Error('Estream module functions need main Estream lib' +
                    'passed in to work. See docs.');
  }
};
