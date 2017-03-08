var zmq = require("zmq");
var messageDefines = require("../protoc/msgdef.js")
var messageRouter = require("../protoc/msgrouter.js")
var messageUtil = require("../protoc/msgutil.js")
var EventEmitter = require("events").EventEmitter;
var logger = require("../utils/logger")
var lifecycle = require("../utils/lifecycle")

var dbapi = require('../db/stf.js')
module.exports = function(options){
    var log = logger.createLogger('['+ options.description + ']')

    var appdealer = zmq.socket("dealer");   
    log.info('App dealer connected to "%s"', options.endpoints.appDealer)
    appdealer.connect(options.endpoints.appDealer)
    appdealer.on("message", function(deviceId, networkenvelop){
            messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.ScreenStreamMessage, function(deviceId, screenStreamMessage){
                devdealer.send([deviceId, messageUtil.envelope(screenStreamMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchMoveMessage, function(deviceId, touchMoveMessage){
                //log.info('TouchDownMessage')
                //console.log(deviceId)
                //console.log(touchDownMessage)
                devdealer.send([deviceId, messageUtil.envelope(touchMoveMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchUpMessage, function(deviceId, touchUpMessage){
                //log.info('TouchDownMessage')
                //console.log(deviceId)
                //console.log(touchDownMessage)
                devdealer.send([deviceId, messageUtil.envelope(touchUpMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchDownMessage, function(deviceId, touchDownMessage){
                //log.info('TouchDownMessage')
                //console.log(deviceId)
                //console.log(touchDownMessage)
                devdealer.send([deviceId, messageUtil.envelope(touchDownMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchCommitMessage, function(deviceId, touchCommitMessage){
                //log.info('TouchCommitMessage')
                //console.log(deviceId)
                //console.log(touchCommitMessage)
                devdealer.send([deviceId, messageUtil.envelope(touchCommitMessage)])
            })
            .generalHandler(deviceId, networkenvelop)
    })

    var devdealer = zmq.socket("dealer");
    log.info('Device dealer connected to "%s"', options.endpoints.devDealer)
    devdealer.connect(options.endpoints.devDealer)

     
    function onMessage(){
        function isValidZmqMessage(args){
            return args.length === 2;
        }

        function onNetworkEnvelop(deviceid, networkenvelop){
            
            messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceIntroductionMessage, function(deviceid, devideIntroductionMessage){
                
                //log.info('DeviceIntroductionMessage')
                dbapi.saveDeviceInitialState(devideIntroductionMessage.serial)
                .then(function(state){
                    var deviceRegisteredMessage = new messageDefines.com.example.ponytail.testjeromq.DeviceRegisteredMessage(devideIntroductionMessage.serial);
                    devdealer.send(["provider", messageUtil.envelope(deviceRegisteredMessage)])
                    appdealer.send(["provider", messageUtil.envelope(deviceRegisteredMessage)])
                })
                .catch(function(err){
                    console.log(err)
                })
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceIdentityMessage, function(deviceid, devideIdentityMessage){
                log.info('DeviceIdentityMessage', deviceid.toString())
                dbapi.saveDeviceIdentity(deviceid.toString(), devideIdentityMessage)
                .then(function(){
                    log.info("Update Device Identity successed")
                    appdealer.send([deviceid, messageUtil.envelope(devideIdentityMessage)])
                })
                .catch(function(err){
                    log.warn("Update Device Identity failed")
                    log.warn(err)
                })
                
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceReadyMessage, function(deviceid, devideReadyMessage){
                dbapi.setDeviceReady(devideReadyMessage.serial)
                .then(function(){
                    log.info("Update Device Ready flag successed")
                    appdealer.send([deviceid, messageUtil.envelope(devideReadyMessage)])
                })
                .catch(function(){
                    log.warn("Update Device Ready flag failed")
                })
                
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DevicePresentMessage, function(deviceid, devidePresentMessage){
                //log.info('DevicePresentMessage')
                dbapi.setDevicePresent(devidePresentMessage.serial)
                .then(function(){
                    appdealer.send([deviceid, messageUtil.envelope(devidePresentMessage)])
                })
                .catch(function(err){
                    log.info(err)
                })
                
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage, function(deviceid, devideAbsentMessage){
                dbapi.setDeviceAbsent(devideAbsentMessage.serial)
                .then(function(){
                    //前段，提示设备离线
                    appdealer.send([deviceid, messageUtil.envelope(devideAbsentMessage)])
                    //后端，进程销毁
                devdealer.send([deviceid, messageUtil.envelope(devideAbsentMessage)])
                })
                .catch(function(err){
                    log.info(err)
                })
                

            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceHeartbeatMessage, function(deviceid, devideHeartbeatMessage){
                appdealer.send([deviceid, messageUtil.envelope(devideHeartbeatMessage)])
            })
            .generalHandler(deviceid, networkenvelop)
        }

        
        if(isValidZmqMessage(arguments)){
            return onNetworkEnvelop(arguments[0], arguments[1])
        }
        else{
            console.log(arguments[0].toString())
            log.warn("illegal zmq message received with " + arguments.length + " frames")
        }
    }

    devdealer.on("message", onMessage)

    lifecycle.regCleanupHandler(function(){
        log.info("closing zmq socket");
        [devdealer, appdealer].forEach(function(socket){
            try{
                socket.close()
            }
            catch(error){

            }
            
        })
    })
}

/*
            messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.LoginMessage, function(deviceid, loginMessage){
                var token = "3bdc63fc81beb107";

                //成功验证之后，先发送DeviceIntroductionMessage,再发送DeviceRegistedMessage
                var introductionMessage =  messageUtil.envelope(
                    messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceIntroductionMessage,
                    new messageDefines.com.example.ponytail.testjeromq.DeviceIntroductionMessage(deviceid.toString()).encodeNB())     

                var registedMessage = messageUtil.envelope(
                    messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceRegisteredMessage,
                    new messageDefines.com.example.ponytail.testjeromq.DeviceRegisteredMessage(deviceid.toString(), token).encodeNB())

                if(token.length === 0){
                    devdealer.send([deviceid, registedMessage]);
                }
                else{
                    [introductionMessage, registedMessage].forEach(function(msg){
                        devdealer.send([deviceid, msg]);
                        appdealer.send([deviceid, msg]);
                    })
                }

            })
            .on(messageDefines.com.example.ponytail.testjeromq.LogoffMessage, function(deviceId, logoffMessage){
                //发送DeviceAbsentMessage
                var msg = messageUtil.envelope(
                    messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceAbsentMessage,
                    new messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage(deviceid.toString()).encodeNB())

                appdealer.send([deviceId, msg]);
                devdealer.send([deviceId, msg]);

            })
            .generalHandler(deviceid, networkenvelop)
*/