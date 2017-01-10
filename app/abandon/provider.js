var NetworkDevicesTracker = require("./networkdevtracker.js")
var msgdef = require("./protoc/msgdef.js")

//Tracking everything sended by devices(android, ...)
var tracker = new NetworkDevicesTracker();
tracker.startTracking();

tracker.on(msgdef.com.example.ponytail.testjeromq.MessageTestConnection, function(deviceId, message){
	//console.log(deviceId);
	//console.log(message)

	tracker.replyWithSuccess(deviceId,
		msgdef.com.example.ponytail.testjeromq.MessageType.Type.MessageTestConnection,
				new Buffer("pong","utf-8"))
})

//发送到auth svc进行登录验证处理
tracker.on(msgdef.com.example.ponytail.testjeromq.MessageLogin, function(deviceId, message){

})

//发送到auth svc进行登出处理
tracker.on(msgdef.com.example.ponytail.testjeromq.MessageLogoff, function(deviceId, message){

})