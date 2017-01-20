module.exports.command = 'heartbeat [name]'

module.exports.describe = 'Start a heartbeat unit.'

module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .strict()
    .option('connect-push', {
      alias: 'p'
    , describe: 'Device-side ZeroMQ PULL endpoint to connect to.'
    //, array: true
    , demand: true
    })
    .option('connect-sub', {
      alias: 's'
    , describe: 'App-side ZeroMQ PUB endpoint to connect to.'
    //, array: true
    , demand: true
    })
    .option('heartbeat-timeout', {
      alias: 't'
    , describe: 'Consider devices with heartbeat older than the timeout ' +
        'value dead. Given in milliseconds.'
    , type: 'number'
    , default: 30000
    })
    .option('description', {
      describe: 'An easily identifiable name for log output.'
    , type: 'string'
    , default: 'HEARTBEAT'
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_REAPER_` (e.g. ' +
      '`STF_REAPER_CONNECT_PUSH`).')
}

module.exports.handler = function(argv) {
  return require('../../heartbeat')({
    description: argv.description
  , heartbeatTimeout: argv.heartbeatTimeout
  , endpoints: {
      push: argv.connectPush
    , sub: argv.connectSub
    }
  })
}
