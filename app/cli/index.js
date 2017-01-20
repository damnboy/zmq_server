var argv = require('yargs');
var Promise = require('bluebird')

argv
.strict()
.command(require('./devicemanager'))
.command(require('./triproxy'))
.command(require('./servicemanager'))
.command(require('./heartbeat'))
.command(require('./websocketserver'))
.command(require('./device'))
.help()
.argv





