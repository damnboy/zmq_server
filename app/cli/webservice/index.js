module.exports.command = 'webservice [description]'

module.exports.describe = 'WebService for interact with rethinkdb'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    /*
    .option('description', {
      describe: 'WebService for interact with rethinkdb'
    , type: 'string'
    , default : 'WEBSERVICE'
  })
  */
}

module.exports.handler = function(argv) {
  return require('../../webservice')({
    description: argv.description
  })
}
