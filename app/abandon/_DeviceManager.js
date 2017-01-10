var zmq = require("zmq")
var messageDefines = require("./protoc/msgdef.js")
var messageUtils = require("./protoc/msgutil.js")
var messageRouter = require("./protoc/msgrouter.js")
module.exports = function(options){

	var router = zmq.socket("router");
	router.bind(options.serviceUri.router, function(error){
		if(error){

		}
		console.log("[DEVICE MANAGER]" + options.serviceUri.router)
	})


	
	var push = zmq.socket("push")
	push.connect(options.routerServicesUri.pull)


	var sub = zmq.socket("sub");
	//subscribe操作在bind／connect之前执行
	sub.subscribe("");
	sub.bind(options.serviceUri.sub, function(error){
		if(error){

		}
		console.log("[DEVICE MANAGER]" + options.serviceUri.sub)
	})


	function onNetworkEnvelope(channelId, deviceId, networkEnvelope){
		messageRouter()
		.on(messageDefines.com.example.ponytail.testjeromq.TransactionDoneMessage, function(deviceId, message){
				console.log(message)
				//发送AuthticatedDevice消息
				pub.send(["AUTHMANAGER",deviceId, message])
		})
		.on(messageDefines.com.example.ponytail.testjeromq.TestConnectionMessage, function(deviceId, message){
			console.log("[DEVICE MANAGER] " + "GOT Client(" + deviceId + ")PING Message")
			push.send([deviceId, 
				messageUtils.reply().success(
					messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.TestConnectionMessage,
				new messageDefines.com.example.ponytail.testjeromq.TestConnectionMessage("pong").encodeNB())])
		})
		.on(messageDefines.com.example.ponytail.testjeromq.DeviceAuthticatedMessage, function(deviceId, message){
			console.log("AuthticatedDevice")
				console.log(message)
				//发送AuthticatedDevice消息

		})
		.generalHandler(deviceId, networkEnvelope)
	}
	sub.on("message", onNetworkEnvelope)

}



	/*
	function onNetworkEnvelope(channelId, deviceId, networkEnvelope){
		var envelope = messageDefines.com.example.ponytail.testjeromq.NetworkEnvelope.decode(networkEnvelope);

		switch(envelope.type){
		//TransactionDone消息
		case messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.TransactionDoneMessage:
			return onNetworkEnvelope(deviceId, envelope);

		//服务器连通性测试
		case messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.TestConnectionMessage:
			console.log("[DEVICE MANAGER] " + "GOT Client(" + deviceId + ")PING Message")
			pub.send(["DEVICE MANAGER", deviceId, 
				messageUtils.reply().success(
					messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.TestConnectionMessage,
				new messageDefines.com.example.ponytail.testjeromq.TestConnectionMessage("pong").encodeNB())])
			break;

		//登录消息转发到AuthManager服务
		case messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.LoginMessage:
		case messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.LogoffMessage:
			push.send([deviceId, networkEnvelope]);
			break;

		//设备消息转发到DeviceManager服务
		case messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceDisplayMessage:
		case messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DevicePhoneMessage:
		case messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceIdentityMessage:
			break;

		default:
			console.log["default"]
			break;
		}
	}
	*/