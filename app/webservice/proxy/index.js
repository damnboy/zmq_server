var http = require('http')

var express = require('express')
var httpProxy = require('http-proxy')

var logger = require('../../../submodules/stf/lib/util/logger')

var options = {
  port : 8000
}
  var log = logger.createLogger('poorxy')
  var app = express()
  var server = http.createServer(app)
  var proxy = httpProxy.createProxyServer()

  proxy.on('error', function(err) {
    log.error('Proxy had an error', err.stack)
  })

  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  ;['/api/*'].forEach(function(route) {
    app.all(route, function(req, res) {
      proxy.web(req, res, {
        target: 'http://127.0.0.1:8002/'
      })
    })
  })

  app.use(function(req, res) {
    proxy.web(req, res, {
      target: 'http://127.0.0.1:8001/'
    })
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)

