/*

  如何将到处都是的switch－case简化成一个route对象


  考虑EventEmitter对象on方法的函数签名
  on("消息类型", function 自定义消息处理方法(通过emit传递过来的n个参数){
  
  })

  用zmq的router与dealer可以完成协议的自定义，初定消息结构为：
  ----------------------------------------------------
  |消息类型(32bit)  | 序列化对象（加密，压缩支持）        ｜
  ----------------------------------------------------

  因此zmq.socket.bind之后
  on_message上的消息处理方法为function(id, type, message)


  定义一个消息路由对象（继承自eventEmitter），用on方法注册消息处理方法。
  并实现统一的消息处理方法，根据消息类型，自动emit对应的消息类型。

  利用on调用返回eventEmitter对象的特性。在一系列on之后，返回一个通用的消息处理方法。

*/

var EventEmitter = require("events").EventEmitter;

var util = require("util");

var messageDefines = require("./msgdef.js")
function Router(){
  if (!(this instanceof Router)) {
    return new Router()
  }
  EventEmitter.call(this);

}

util.inherits(Router, EventEmitter)

/*
  无法在一个proto文件解析出来的消息对象上实现监听。
  只能基于msg.js处理之后，给每个消息对象附带上code属性之后
  才能基于code做on与emit操作
*/
Router.prototype.on = function(message, handler) {
  return EventEmitter.prototype.on.call(
    this
    , message.$code
    , handler
    )
}

Router.prototype.removeListener = function(message, handler) {
  return EventEmitter.prototype.removeListener.call(
    this
  , message.$code
  , handler
  )
}

//TODO 整个generalHandler代码快try－catch会捕获到emit之后，消息处理函数的异常，
//因此仅仅捕获两个decode调用即可
Router.prototype.generalHandler = function(deviceId, networkEnvelope){
  //try{
    var envelope = messageDefines.com.example.ponytail.testjeromq.NetworkEnvelope.decode(networkEnvelope);
    var messageType = messageDefines.ReverseMessageType[envelope.type];
    var messageDef = messageDefines.com.example.ponytail.testjeromq[messageType];
    var sessionId = envelope.sessionId;
    var decodedMessage = messageDef.decode(envelope.message);
    this.emit(messageDef.$code, deviceId, decodedMessage, sessionId);
  //}
  //catch(error){
    //console.log("illegal protocol buffer message: " + error);
  //}
}


/* example
var router = new Router();
router.customHandler = function(id, type, message){
  if( type != 4){
    console.log("未知消息类型");
    return
  }
  return this.generalHandler(id, type, message);
}
router
.on(msgdefs.tutorial.MessageLogin, function(id, message){
  console.log(id + " login with msg: " + message)
})
.on(msgdefs.tutorial.MessageLogoff, function(id, message){
  console.log(id + " logoff with msg: " + message)

}).customHandler("android", 5, "bytebyte")

*/
module.exports = Router