var execSync = require('child_process').execSync;
var fs = require('fs');
var cmdBase = 'node_modules/.bin/documentation --shallow -f md build ';
var moduleFolder = 'modules/';
var modules = fs.readdirSync(moduleFolder);

modules.forEach(function(module) {
  console.log(cmdBase, moduleFolder, module);
  execSync(cmdBase + moduleFolder + module + ' -o api/' + module.replace('.js', '.md'));
});

execSync(cmdBase + 'lib/index.js -o api/estream.md');

