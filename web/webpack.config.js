var webpack = require('webpack');
module.exports = {
  entry: './app.js',
  output: {
    path: __dirname,
    filename: './entry.js'
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
