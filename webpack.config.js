var webpack = require('webpack');
module.exports = {
  entry: './web/app.js',
  output: {
    path: __dirname,
    filename: './web/entry.js'
  }
  , resolve: {
      root: [
          './'
      ]
      , modulesDirectories: [
	'modules'
        , 'bower_components'
        , 'node_modules'
      ]
  }
}
