var execSync = require('child_process').execSync;
var fs = require('fs');
var cmdBase = 'node_modules/.bin/documentation -f md build ';
var moduleFolder = 'modules/';
var modules = fs.readdirSync(moduleFolder);

modules.forEach(function(module) {
  execSync(cmdBase + moduleFolder + module + ' -o api/' + module.replace('.js', '.md'));
});

execSync(cmdBase + 'piping-hot.js -o api/piping-hot.md');

