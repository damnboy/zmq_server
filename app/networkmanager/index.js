var zmq = require("zmq");
var Promise = require("bluebird")
var lifecycle = require("../utils/lifecycle.js")
var logger = require("../utils/logger.js")
/*
params:
options = {
    endpoints : { //for connecting
        pull: [""] 
    }
    ,connectionpoints : {   //bind for incoming connections
        router: [""],
        dealer: [""]
    }
}
*/
module.exports = function(options){    

    var log = new logger.createLogger("[NETWORKMANAGER]");

    function proxyTo(destination){
        return function(){
            destination.send([].slice.call(arguments))
        }
    }
    var push = zmq.socket("push");
    /*
          var push = zmqutil.socket("push") 
  Promise.map(options.endpoints.push, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info("Sending output to "%s"", record.url)
        push.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  
*/
    Promise.map(options.endpoints.pull, function(endpoint){
        //验证endpoint字符串的正确性
        return endpoint;
    }).then(function(validEndpoints){
        Promise.map(/*validEndpoints*/options.endpoints.pull, function(endpoint){
            //调用connect进行连接
            push.connect(endpoint)
        })
        .then(function(){
            log.info("所有pull 到 push的连接建立成功")
        })
        .catch(function(error){

        })
    })
    .catch(function(error){
        log.error("目标地址解析失败: " + error);
    })

    

    var router = zmq.socket("router")
    router.bind(options.connectionpoints.router, function(error){
        if(error){
            lifecycle.fatal(error)
        }

        log.info("ROUTER socket bound on " + options.connectionpoints.router)
    })
    router.on("message", function(){//将所有入站请求代理到push上
        /*TODO
        需要对此处的参数进行验证，fuzz zeromq的特定端口将会导致onmessage接收到异常数据
        为了尽快转发数据，将数据的验证工作提交到上一级节点进行
        */
        //log.debug("Incoming ZMQ message with " + arguments.length + " frames")
        var frames = [].slice.call(arguments);
        push.send(frames)
    })

    
    var dealer = zmq.socket("dealer");
    dealer.bind(options.connectionpoints.dealer, function(error){
        if(error){
            lifecycle.fatal(error)
        }

        log.info("DEALER socket bound on " + options.connectionpoints.dealer)
    })
    dealer.on("message", function(){//负责代理所有出站请求
        var frames = [].slice.call(arguments);
        router.send(frames)
    })

    lifecycle.regCleanupHandler(function(){
        log.info("Closing sockets");

        [push, router, dealer].forEach(function(socket){
            try{
                socket.close();
            }catch(error){
                //TypeError: Socket is closed
                log.error("closing socket with error: " + error)
            }
        })
    })
}




/*
var logger = require("../../util/logger")
var lifecycle = require("../../util/lifecycle")
var zmqutil = require("../../util/zmqutil")

module.exports = function(options) {
  var log = logger.createLogger("triproxy")

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

  lifecycle.observe(function() {
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
*/