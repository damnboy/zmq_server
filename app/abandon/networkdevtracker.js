
/*
	因为events对象仅包含一个EventEmitter类，因此可以见到大多数这种写法
	但这两种写法好像没什么区别，console.log出来的东西是相同的
		var eventEmitter = require("events").EventEmitter;
		var eventEmitter = require("events");
*/
var EventEmitter = require("events").EventEmitter;
var Util = require("util");
var zmq = require("zmq");
var service = zmq.socket("router");
var msgdef = require("./protoc/msgdef.js")
var msgrouter = require("./protoc/msgrouter.js")
var msgutil = require("./protoc/msgutil.js")
//console.log(msgdef.com.example.ponytail.testjeromq.MessageLogin)
/*
	继承EventEmitter，实现一个自定义类NetworkDevicesTracker

	与class－based类型的语言不同，prototype－based类型的javaScript通过原型赋值来实现继承。
	js中，要实现对象继承，需要完成两项工作：
		1.为新的对象类型提供一个构造函数，用以完成对象的初始化工作，在继承的场景下，还需要完成父类构造函数的调用。
		2.提供一个在构造函数种通过[[proto]]应用的prototype对象

	js中实现继承的难点：
		1.js将对象的行为分为constructor与prototype两种，
		2.js是一门可塑性很强的语言，基于你对继承的理解不同，你可以实现自己的继承方法
		3.

构造函数实现的注意事项：
	无论Util.inherits(NetworkDevicesTracker, EventEmitter);是否执行
	如果没有在构造函数种调用父类EventEmitter的构造函数，继承关系则无法生效。


prototype初始化的注意事项：
	即便调用了父类EventEmitter的构造函数，但是没有给prototype赋值，同样无法调用EventEmitter上的方法。
	
	创建一个EventEmitter实例（new EventEmitter）来初始化 NetworkDeviceTracker.prototype
	而不是选择在 NetworkDeviceTracker 的构造函数种调用EventEmitter的构造函数。这种方式并不能应付所有场景。

	直接赋值构造函数的做法（NetworkDevicesTracker.prototype = EventEmitter.prototype）,在monykeypatch出现的时候，
	并不能保证所有代码都正常工作。比较稳妥的做法，使用Object.create。（additional layer of object）
	NetworkDevicesTracker.prototype ＝ Object.create(EventEmitter.prototype)


	为了确保能够正确的继承一个现有的对象
		在实现构造函数的时候，确保调用了父类的构造函数
		在实现prototype的时候，确保继承了父类的所有prototype

	参考链接：
		ES5标准下的继承http://robotlolita.me/2011/10/09/understanding-javascript-oop.html
		http://stackoverflow.com/questions/8898399/node-js-inheriting-from-eventemitter
		http://www.bennadel.com/blog/2187-Extending-EventEmitter-To-Create-An-Evented-Cache-In-Node-js.htm
*/

//NodeJS中常见的继承方法
function NetworkDevicesTracker(options){

	EventEmitter.call(this);

	this.serviceUri = "tcp://*:33333";

	

}

Util.inherits(NetworkDevicesTracker, EventEmitter);

NetworkDevicesTracker.prototype.on = function(message, handler) {
  return EventEmitter.prototype.on.call(
    this
    , message.$code
    , handler
    )
}

NetworkDevicesTracker.prototype.removeListener = function(message, handler) {
  return EventEmitter.prototype.removeListener.call(
    this
  , message.$code
  , handler
  )
}


//变量的初始化放在构造函数中，函数的初始化，直接往prototype上赋值
NetworkDevicesTracker.prototype.startTracking = function(){

	var _this = this;
	service.bind(this.serviceUri, function(error){
		if (error) {
			console.log("Failed to start NetworkDevicesTracker " + error.message);
			process.exit(0);
		}
		else{
			console.log("NetworkDevicesTracker Service started at " + _this.serviceUri);
		}
	});

	/*
		实现一个emit("add", ...), emit("change", ...), emit("remove", ...)
		的方法，与openstf中的AdbClient返回的Tracker适配的功能

		zmq router监听接口，不适合处理执行时间较长的逻辑
		接收到消息之后，立刻执行转发
	*/
	//解包NetworkTransactionMessage
	service.on("message", function(deviceId, transactionMessage){

		var envelope = msgdef.com.example.ponytail.testjeromq.MessageNetworkTransaction.decode(transactionMessage);
		var msgType = msgdef.ReverseMessageType[envelope.type];
		if(msgType){
			console.log("message["+ msgType + "] coming from "+ deviceId +" handled by network device tracker")
			//msgContent = msgdef.com.example.ponytail.testjeromq[msgType].decode(envelope.message)
			_this.emit(envelope.type, deviceId, transactionMessage);
		}
		else{
			console.log("未知消息类型: " + envelope.type);
		}
		
		/*
		var envelope = msgdef.com.example.ponytail.testjeromq.MessageNetworkTransaction.decode(envelope);
		var router = msgrouter();
		router
		.on(msgdef.com.example.ponytail.testjeromq.MessageLogin, function(id, message){
			message = msgdef.com.example.ponytail.testjeromq.MessageLogin.decode(message)
			_this.emit("login"
				, message.username
				, message.pwdhash
				, message.deviceid
				, message.email)			
		})
		.on(msgdef.com.example.ponytail.testjeromq.MessageLogoff, function(id, message){
			message = msgdef.com.example.ponytail.testjeromq.MessageLogoff.decode(message)
			_this.emit("logoff"
				, message.svctoken)

		})
		.on(msgdef.com.example.ponytail.testjeromq.MessageTestConnection, function(id, message){
			message = msgdef.com.example.ponytail.testjeromq.MessageLogoff.decode(message);

			var envlope = msgutil.
			reply().
			success(msgdef.com.example.ponytail.testjeromq.MessageType.Type.MessageTestConnection,
				new Buffer("pong","utf-8"))

			_this.replyTo(id, envlope);
		})
		.generalHandler(deviceid, envelope.type, envelope.message)
		*/
		
	})

}

NetworkDevicesTracker.prototype.stopTracking = function(){

}

//打包成NetworkTransactionMessage && 发送
NetworkDevicesTracker.prototype.replyWithSuccess = function(deviceId, msgType, msgContent){
	var success = new msgdef.com.example.ponytail.testjeromq.MessageNetworkTransactionSuccess(msgType, msgContent).encodeNB();
	var envlope = new msgdef.com.example.ponytail.testjeromq.MessageNetworkTransaction(
		msgdef.com.example.ponytail.testjeromq.MessageType.Type.MessageNetworkTransactionSuccess, 
		success).encodeNB(); 
	service.send([deviceId, envlope])
}

NetworkDevicesTracker.prototype.replyWithFailed = function(id, envlope){
	var failed = new msgdef.com.example.ponytail.testjeromq.MessageNetworkTransactionFailed(type, message).encodeNB();
	var envlope = new msgdef.com.example.ponytail.testjeromq.MessageNetworkTransaction(
		msgdef.com.example.ponytail.testjeromq.MessageType.Type.MessageNetworkTransactionFailed, 
		failed).encodeNB(); 
	service.send([deviceId, envlope])
}
//初始化NetworkDevicesTracker.prototype实例，并且调用NetworkDevicesTracker的构造函数
//var tracker = new NetworkDevicesTracker();
//console.log(tracker);
//tracker.startTracking();


/*
	从ES6开始，增加了许多用于实现继承的关键字（语法糖，JS本质上就没有类继承这种东西）

	ES6风格的类继承的写法与class－based类型的语言没太大差别

//ES6风格的类继承，需要启用restrict mode
class Test extends EventEmitter{
	super();
}
*/

//https://www.sitepoint.com/nodejs-events-and-eventemitter/
//相同事件可以注册多个callback


/*
	包装
https://segmentfault.com/a/1190000002640469
https://segmentfault.com/a/1190000005084960
*/


module.exports = NetworkDevicesTracker