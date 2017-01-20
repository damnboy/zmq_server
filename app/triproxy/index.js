var logger = require("../utils/logger")
var lifecycle = require("../utils/lifecycle")
//var zmqutil = require("../../util/zmqutil")
var zmqutil = require("zmq")
module.exports = function(options) {
  var log = logger.createLogger('[' + options.description + ']')

  if (options.description) {
    logger.setGlobalIdentifier(options.description)
  }

  function proxy(to) {
    return function() {
      to.send([].slice.call(arguments))
    }
  }

  // App/device output
  var pub = zmqutil.socket("pub")
  pub.bindSync(options.endpoints.pub)
  log.info("PUB socket bound on", options.endpoints.pub)

  // Coordinator input/output
  var dealer = zmqutil.socket("dealer")
  dealer.bindSync(options.endpoints.dealer)
  dealer.on("message", proxy(pub))
  log.info("DEALER socket bound on", options.endpoints.dealer)

  // App/device input
  var pull = zmqutil.socket("pull")
  pull.bindSync(options.endpoints.pull)
  pull.on("message", proxy(dealer))
  log.info("PULL socket bound on", options.endpoints.pull)
  
  lifecycle.regCleanupHandler(function() {
    log.info("closing zmq socket");
    [pub, dealer, pull].forEach(function(sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })
  })

}