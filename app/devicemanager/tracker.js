/*
	因为events对象仅包含一个EventEmitter类，因此可以见到大多数这种写法
	但这两种写法好像没什么区别，console.log出来的东西是相同的
		var eventEmitter = require("events").EventEmitter;
		var eventEmitter = require("events");
*/

var Util = require("util");
var zmq = require("zmq");
var _ = require("lodash");
var Promise = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var messageDefines = require("../protoc/msgdef.js");
var messageRouter = require("../protoc/msgrouter.js");
var msgUtil = require("../protoc/msgutil.js");
var logger = require("../utils/logger.js");

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
function NetworkDevicesTracker(){
	EventEmitter.call(this);
}

Util.inherits(NetworkDevicesTracker, EventEmitter);


//变量的初始化放在构造函数中，函数的初始化，直接往prototype上赋值
NetworkDevicesTracker.prototype.startTracking = function(options){
    var _this = this;

    var router = zmq.socket("router");

    var promise = Promise.map(options.endpoints, function(endpoint) {
        router.bind(endpoint)
        router.on("message", function(deviceId, networkEnvelopMessage){
            var device = _.assign({}, {id : deviceId.toString()})

            messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.LoginMessage, function(deviceid, loginMessage){
                _this.emit("login", device);
                _this.emit("registed", device);
            })
            .on(messageDefines.com.example.ponytail.testjeromq.LogoffMessage, function(deviceId, logoffMessage){
                _this.emit("logoff", device);
                _this.replySuccess(deviceId, 
                    messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.TestConnectionMessage,
                    new messageDefines.com.example.ponytail.testjeromq.TestConnectionMessage("PONG").encodeNB())

            })
            .on(messageDefines.com.example.ponytail.testjeromq.TestConnectionMessage, function(deviceId, testConnMessage){

            })
            .generalHandler(deviceId, networkEnvelopMessage)
        })
        return Promise.resolve(true)
    })

    this.router = router;
    return promise;//不可用final释放资源，因为then也会触发final
}

NetworkDevicesTracker.prototype.stopTracking = function(){
    if(this.router){
        this.router.close();
    }
}

NetworkDevicesTracker.prototype.replySuccess = function(deviceId, type, message){
    if(this.router){
        var envlope = msgUtil.reply().success(type,message);
        this.router.send([deviceId, envlope]);
    }
}

NetworkDevicesTracker.prototype.replyFailed = function(deviceId, type, message){
    if(this.router){
        var envlope = msgUtil.reply().failed(type,message);
        this.router.send([deviceId, envlope]);
    }
}



module.exports = new NetworkDevicesTracker;