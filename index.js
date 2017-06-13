var path = require('path');
var fs = require('fs');
var os = require('os');
var spawn = require('child_process').spawn;
var debug = require('debug')('electron-squirrel-startup');
var app = require('electron').app;

var run = function(args, done) {
  var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  debug('Spawning `%s` with args `%s`', updateExe, args);
  spawn(updateExe, args, {
    detached: true
  }).on('close', done);
};

var getShortcut = function() {
  return path.join(os.homedir(), 'Desktop', app.getName(), '.lnk');
};

var removeShortcut = function(shortcutPath) {
  fs.unlinkSync(shortcutPath);
};

var shortcutExists = function(shortcutPath) {
  var exists = false;
  try {
    exists = fs.accessSync(shortcutPath) === fs.constants.F_OK;
  } catch (error) {
    debug('fs.access error on shortcutExists: `%s`', error.message);
  }
  return exists;
};

var check = function() {
  if (process.platform === 'win32') {
    var cmd = process.argv[1];
    debug('processing squirrel command `%s`', cmd);
    var target = path.basename(process.execPath);

    if (cmd === '--squirrel-install') {
      run(['--createShortcut=' + target + ''], app.quit);
      return true;
    }
    if (cmd === '--squirrel-updated') {
      var shortcutPath = getShortcut();
      var ret = false;
      if (shortcutExists(shortcutPath)) {
        run(['--createShortcut=' + target + ''], app.quit);
        ret = true;
      } else {
        // Remove the unwanted desktop shortcut that was recreated
        removeShortcut(shortcutPath);
        ret = false;
      }
      return ret;
    }
    if (cmd === '--squirrel-uninstall') {
      run(['--removeShortcut=' + target + ''], app.quit);
      return true;
    }
    if (cmd === '--squirrel-obsolete') {
      app.quit();
      return true;
    }
  }
  return false;
};

module.exports = check();
