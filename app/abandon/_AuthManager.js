var zmq = require("zmq");
var messageDefines = require("./protoc/msgdef.js")
var messageRouter = require("./protoc/msgrouter.js")
var messageUtil = require("./protoc/msgutil.js")
/*
push/pull 以轮训的方式进行消息分发（仅一个pull会收到消息）
pub/sub 广播的方式进行消息分发（所有的sub都会收到消息）
*/
module.exports = function(options){
	var pub = zmq.socket("pub");
	pub.connect(options.deviceManagerServiceUri.sub)


	var sub = zmq.socket("sub");
	sub.subscribe("")
	sub.bind(options.servicesUri.sub, function(error){
		if(error){
			console.log
		}
		console.log("[AUTH MANAGER]" + options.servicesUri.sub)
	})
	sub.on("message", function(channelId, deviceId, networkEnvelope){
		messageRouter()
		.on(messageDefines.com.example.ponytail.testjeromq.LoginMessage, function(deviceId, loginMessage){
			console.log("[AUTH MANAGER]GOT Auth request from device(" + deviceId + ")")
			var auth_ok = true;
			var deviceAuthticatedMessage = undefined;
			if(auth_ok){
				deviceAuthticatedMessage = messageUtil.envelope(
					messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceAuthticatedMessage,
					new messageDefines.com.example.ponytail.testjeromq.DeviceAuthticatedMessage(
					new messageDefines.com.example.ponytail.testjeromq.AuthTokenMessage("***token***"),
					loginMessage).encodeNB())
			}
			else{

			}
			pub.send(["AUTHMANAGER", deviceId, deviceAuthticatedMessage])
		})
		.on(messageDefines.com.example.ponytail.testjeromq.LogoffMessage, function(deviceId, logoffMessage){
				console.log(logoffMessage)
		})
		.generalHandler(deviceId, networkEnvelope)
	})
}

