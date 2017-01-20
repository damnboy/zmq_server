module.exports.command = 'triproxy [name]'

module.exports.describe = 'Start a triproxy unit.'

module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .strict()
    .option('bind-dealer', {
      alias: 'd'
    , describe: 'The address to bind the ZeroMQ DEALER endpoint to.'
    , type: 'string'
    , demand : true
    //, default: 'tcp://*:7112'
    //, default: 'tcp://127.0.0.1:7112'
    })
    .option('bind-pub', {
      alias: 'u'
    , describe: 'The address to bind the ZeroMQ PUB endpoint to.'
    , type: 'string'
    , demand : true
    //, default: 'tcp://*:7111'
    //, default: 'tcp://127.0.0.1:7111'
    })
    .option('bind-pull', {
      alias: 'p'
    , describe: 'The address to bind the ZeroMQ PULL endpoint to.'
    , type: 'string'
    , demand : true
    //, default: 'tcp://*:7113'
    //, default: 'tcp://127.0.0.1:7113'
    })
    .option('description', {
      describe: 'An easily identifiable name for log output.'
    , type: 'string'
    , default : 'TRIPROXY'
    })
    .option('name', {
      describe: 'An easily identifiable name for log output.'
    , type: 'string'
    , default: os.hostname()
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_TRIPROXY_` (e.g. ' +
      '`STF_TRIPROXY_BIND_PUB`).')
}

module.exports.handler = function(argv) {
  return require('../../triproxy')({
    description: argv.description
  , endpoints: {
      pub: argv.bindPub
    , dealer: argv.bindDealer
    , pull: argv.bindPull
    }
  })
}
