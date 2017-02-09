var zmq = require("zmq");
var logger = require("../utils/logger")
var lifecycle = require("../utils/lifecycle")
var messageDefines = require("../protoc/msgdef.js")
var messageRouter = require("../protoc/msgrouter.js")
var msgUtil = require("../protoc/msgutil.js")
var socketio = require("socket.io");
/*
创建websocket，首次连上websocket之后，获取所有在线设备信息
*/
module.exports = function(options){
    var log = logger.createLogger("[WEBSOCKET SERVER]")
    var push = zmq.socket("push");
    log.info('Pushing output to "%s"', options.endpoints.push)
    push.connect(options.endpoints.push);

    var sub = zmq.socket("sub");
    log.info('Subscribing input from "%s"', options.endpoints.sub)
    sub.subscribe("")
    sub.connect(options.endpoints.sub)
    sub.on("message", function(deviceid, networkenvelop){
        messageRouter()
        .on(messageDefines.com.example.ponytail.testjeromq.DeviceIntroductionMessage, function(deviceid, deviceIntroductionMessage){
            log.info('DeviceIntroductionMessage('+ deviceIntroductionMessage.serial +') ready')
            wsServer.emit('device.add', {
              important: true
            , data: {
                model: 'Unknown'
              , serial: deviceIntroductionMessage.serial
              , present: false
              , provider: 'message.provider'
              , owner: null
              , status: 3//'message.status'
              , ready: false
              , reverseForwards: []
              }
            })
        })
        .on(messageDefines.com.example.ponytail.testjeromq.DevicePresentMessage, function(deviceid, devicePresentMessage) {
          log.info('DevicePresentMessage('+ devicePresentMessage.serial +') changed')
          wsServer.emit('device.change', {
            important: true
          , data: {
              serial: devicePresentMessage.serial
            , present: true
            }
          })
        })
        .on(messageDefines.com.example.ponytail.testjeromq.DeviceIdentityMessage, function(deviceid, deviceIdentityMessage) {
          log.info('DeviceIdentityMessage('+ deviceIdentityMessage.serial +') changed')
          //与数据库数据进行比对
          //datautil.applyData(message)
          wsServer.emit('device.change', {
            important: true
          , data: deviceIdentityMessage
          })
        })
        .on(messageDefines.com.example.ponytail.testjeromq.DeviceReadyMessage, function(deviceid, deviceReadyMessage){
            log.info('DeviceReadyMessage('+ deviceReadyMessage.serial +') changed')
            wsServer.emit('device.change', {
                  important: true
                , data: {
                    serial: deviceReadyMessage.serial
                  , channel: 'message.channel'
                  , owner: null // @todo Get rid of need to reset this here.
                  , ready: true
                  , reverseForwards: [] // @todo Get rid of need to reset this here.
                  }
                })
        })
        .on(messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage, function(deviceid, deviceAbsentMessage){
            log.info('DeviceAbsentMessage('+ deviceAbsentMessage.serial +') remove')
            wsServer.emit('device.remove', {
                  important: true
                , data: {
                    serial: deviceAbsentMessage.serial
                  , present: false
                  , likelyLeaveReason: 'device_absent'
                  }
                })
        })
        .generalHandler(deviceid, networkenvelop)
    })

    var httpServer = require("http").createServer();
    var wsServer = socketio.listen(httpServer, {
          serveClient :false
        , transports : ['websocket']
    })

    //TODO 均通过PUSH发送
    wsServer.on("connection", function(socket){
        //在该socket上注册一组消息处理回调函数

        //设备使用状态
        socket.on('screen.stream.open', function(deviceId, data){
          push.send([deviceId, msgUtil.envelope(
                        new messageDefines.com.example.ponytail.testjeromq.ScreenStreamMessage(true))])

        })
        //设备触摸
        socket.on('screen.stream.close', function(deviceId, data){
          push.send([deviceId, msgUtil.envelope(
                        new messageDefines.com.example.ponytail.testjeromq.ScreenStreamMessage(false))])
        })
        //设备按键
        socket.on('key', function(){

        })
        //push.send()
    })
    httpServer.listen(options.port)
    log.info('Starting Websocket Server Port: ' + options.port)
    lifecycle.regCleanupHandler(function(){
        wsServer.close();
        log.info('closing zmq socket');
        [push, sub].forEach(function(sock){
            try{
                sock.close();
            }
            catch(error){

            }
        })
    })
}