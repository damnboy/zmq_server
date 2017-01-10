var zmq = require("zmq");
var messageDefines = require("../protoc/msgdef.js")
var messageRouter = require("../protoc/msgrouter.js")
var messageUtil = require("../protoc/msgutil.js")
var EventEmitter = require("events").EventEmitter;
var logger = require("../utils/logger")
var lifecycle = require("../utils/lifecycle")


module.exports = function(options){

    var log = logger.createLogger("[SERVICE MANAGER]")

    var appdealer = zmq.socket("dealer");   
    appdealer.connect(options.endpoints.appdealer)
    appdealer.on("message", function(appid, networkenvelop){

    })

    var devdealer = zmq.socket("dealer");
    devdealer.connect(options.endpoints.devdealer)

     
    function onMessage(){
        function isValidZmqMessage(args){
            return args.length === 2;
        }

        function onNetworkEnvelop(deviceid, networkenvelop){
            messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceIntroductionMessage, function(deviceid, devideIntroductionMessage){
                appdealer.send([deviceid, 
                messageUtil.envelope(
                            messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceIntroductionMessage,
                            devideIntroductionMessage.encode())])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DevicePresentMessage, function(deviceid, devidePresentMessage){
                appdealer.send([deviceid, 
                messageUtil.envelope(
                            messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DevicePresentMessage,
                            devidePresentMessage.encode())])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceIdentityMessage, function(deviceid, devideIdentityMessage){
                appdealer.send([deviceid, 
                messageUtil.envelope(
                            messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceIdentityMessage,
                            devideIdentityMessage.encode())])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceReadyMessage, function(deviceid, devideReadyMessage){
                appdealer.send([deviceid, 
                messageUtil.envelope(
                            messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceReadyMessage,
                            devideReadyMessage.encode())])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage, function(deviceid, devideAbsentMessage){
                appdealer.send([deviceid, 
                messageUtil.envelope(
                            messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceAbsentMessage,
                            devideAbsentMessage.encode())])
            })
            .generalHandler(deviceid, networkenvelop)
        }

        if(isValidZmqMessage(arguments)){
            return onNetworkEnvelop(arguments[0], arguments[1])
        }
        else{
            log.warn("illegal zmq message received with " + arguments.length + " frames")
        }
    }

    devdealer.on("message", onMessage)

    lifecycle.regCleanupHandler(function(){
        //log.info("stop tracking devices")
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