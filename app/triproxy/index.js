var logger = require("../utils/logger")
var lifecycle = require("../utils/lifecycle")
//var zmqutil = require("../../util/zmqutil")
var zmqutil = require("zmq")
module.exports = function(options) {

  var log = logger.createLogger("[TRIPROXY]")

  if (options.name) {
    logger.setGlobalIdentifier(options.name)
  }

  function proxy(to) {
    return function() {
      to.send([].slice.call(arguments))
    }
  }

  // App/device output
  var pub = zmqutil.socket("pub")
  pub.bindSync(options.connectionpoints.pub)
  log.info("PUB socket bound on", options.connectionpoints.pub)

  // Coordinator input/output
  var dealer = zmqutil.socket("dealer")
  dealer.bindSync(options.connectionpoints.dealer)
  dealer.on("message", proxy(pub))
  log.info("DEALER socket bound on", options.connectionpoints.dealer)

  // App/device input
  var pull = zmqutil.socket("pull")
  pull.bindSync(options.connectionpoints.pull)
  pull.on("message", proxy(dealer))
  log.info("PULL socket bound on", options.connectionpoints.pull)
  
  lifecycle.regCleanupHandler(function() {
    //log.info("stop tracking devices");
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