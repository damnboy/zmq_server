//NetworkTransactionRouter.js

var zmq = require("zmq");
var messageDefines = require("./protoc/msgdef.js")
var messageUtils = require("./protoc/msgutil.js")
var processUtils = require("./ProcessUtil.js")


//TODO
//所有消息转发到LogManager服务进行日志记录
module.exports = function(options){
	var pub = zmq.socket("pub");
	pub.connect(options.deviceManagerServiceUri.sub)
	pub.connect(options.authManagerUri.sub)

	var incomingTransaction = zmq.socket("router");
	incomingTransaction.bind(options.servicesUri.router, function(error){
		if(error){
			console.log(error)
		}
		console.log("[NETWORK TRANSACTION ROUTER]" + options.servicesUri.router);
	})

	//入站消息
	incomingTransaction.on("message", function(deviceId, networkEnvelope){
		
		console.log("[NETWORK TRANSACTION ROUTER] incoming networkEnvelope["+networkEnvelope.length+"]")
		pub.send(["NETWORKTRANSACTIONROUTER", deviceId, networkEnvelope])
		
	})
	
	var pull = zmq.socket("pull");
	pull.bind(options.servicesUri.pull)
	//出站消息
	pull.on("message", function(deviceId, networkEnvelope){
		console.log("[NETWORK TRANSACTION ROUTER] outgoing networkEnvelope["+ networkEnvelope.length + "]")
		incomingTransaction.send([deviceId, networkEnvelope])
	})
}