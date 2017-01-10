var childProcess = require("child_process")
var EventEmitter = require("events").EventEmitter
var tracker = require("./tracker.js")
var lifecycle = require("../utils/lifecycle.js")
var logger = require("../utils/logger.js")
var Promise = require("bluebird")
var zmq = require("zmq");
var messageDefines = require("../protoc/msgdef.js");
var messageRouter = require("../protoc/msgrouter.js");
var msgUtil = require("../protoc/msgutil.js");
var osutil = require('../utils/osutil.js');
var cliutil = require('../utils/cliutil.js');
module.exports = function(options){

    var log = new logger.createLogger("[DEVICE MANAGER]");
    //TODO 一个临时的websocket server，用于获取设备列表

    var push = zmq.socket("push")
    push.connect(options.endpoints.pull)

    var sub = zmq.socket("sub")
    sub.subscribe("")
    sub.connect(options.endpoints.pub)

    var deviceInstances = {}
    //TODO 可用端口列表
    var ports = options.ports.slice(
    0
    , options.ports.length - 1 //- options.ports.length % 4
    )

    var inetAddrs = osutil.localInetAddress('eth0');
    log.info('Local Inet Address: ' + inetAddrs);

    var proxyTracker = new EventEmitter();
    tracker.startTracking({
        endpoints : cliutil.buildUriArray(inetAddrs, 10000)
    })
    .then(function(){
        log.info("start tracking devices " + cliutil.buildUriArray(inetAddrs, 10000))

        tracker.on("registed", function(device){
            proxyTracker.emit(device.id, "registed")
        })

        tracker.on("login", function(device){

            push.send([device.id, msgUtil.envelope(
                messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceIntroductionMessage,
                new messageDefines.com.example.ponytail.testjeromq.DeviceIntroductionMessage(device.id).encodeNB()
            )])

            log.info("detect login device: " + device.id)
            var privateTracker = new EventEmitter()
            function proxyTrackerListener(event){
                privateTracker.emit(event)
            }
            proxyTracker.on(device.id, proxyTrackerListener)

            function forkDeviceInstance(){
                var allocatedPorts = ports.splice(0, 4);
                var proc = childProcess.fork("./device", [device.id
                    , (function(){
                        var uris = [];
                        allocatedPorts.forEach(function(port){
                            inetAddrs.forEach(function(addr){
                                uris.push(cliutil.buildUri('tcp', addr, port))
                            })
                        })
                        return uris.join();
                    })()
                    ,options.endpoints.pull
                    ,options.endpoints.pub]
                )
                log.info('available port remains: ' + ports.length);
                proc.on("exit", function(code, signal){
                    if(code === 0 || signal){   //不需要处理unregisted时，发送的SIG 
                        delete deviceInstances[device.id];
                        allocatedPorts.forEach(function(p){
                            ports.push(p);
                        })
                        log.info('available port remains: ' + ports.length)
                        push.send([device.id, msgUtil.envelope(
                            messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceAbsentMessage,
                            new messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage(device.id).encodeNB())])
                    }
                    else{
                        log.info("restart device instance[" + device.id + "]")
                         deviceInstances[device.id] = forkDeviceInstance()
                    }
                })
                proc.on("message", function(message){
                    if(message.message === "ready"){
                        log.info("device instance[" + device.id + "] is ready")
                        log.info("device instance[" + device.id + "] open control service at: " + message.dealer)
                        //TODO通过tracker发送设备注册成功消息,注册设备资源成功

                        //向前端发送设备上线消息
                        push.send([device.id, msgUtil.envelope(
                            messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DevicePresentMessage,
                            new messageDefines.com.example.ponytail.testjeromq.DevicePresentMessage(device.id).encodeNB()
                        )])

                        //向后端发送注册信息
                        tracker.replySuccess(device.id, messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceRegisteredMessage,
                            new messageDefines.com.example.ponytail.testjeromq.DeviceRegisteredMessage(device.id, message.dealer).encodeNB())
                    }
                })
                return proc;
            }
            //创建进程，如何确认进程已经成功启动
            privateTracker.on("registed", function(){
                deviceInstances[device.id] = forkDeviceInstance();
            })

            //终止进程，如何确认进程已经成功退出
            privateTracker.on("unregisted", function(){
                //TODO 设备离线消息
                function kill(proc, signal){
                    var onExit;
                    var promise = new Promise(function(resolve){
                        onExit = function (){
                            resolve()
                        }
                        proc.on("exit", onExit);
                        proc.kill()
                    }).finally(function(){
                        proc.removeListener("exit", onExit)
                    })
                    return promise;
                }
                //TODO 退出入口不统一
                proxyTracker.removeListener(device.id, proxyTrackerListener);

                if(deviceInstances[device.id]){
                    log.info("trying to terminate instance " + deviceInstances[device.id])
                    kill(deviceInstances[device.id], "SIGTERM")
                    .timeout(5000)
                    .then(function(){
                        log.info("Device Instance["+ device.id+"] terminated")
                    })
                    .catch(function(error){
                        kill(deviceInstances[device.id], "SIGKILL")
                        .then(function(){
                            log.info("Device Instance["+ device.id+"] killed")
                        })
                    })
                }
            })

        })

        tracker.on("logoff", function(device){
            log.info("detect logoff device: " + device.id)
            proxyTracker.emit(device.id, "unregisted")
        })

    })
    .catch(function(error){
        log.error(error);
        lifecycle.fatal();
    })

    lifecycle.regCleanupHandler(function(){
            log.info("closing zmq sockets")
            try{
                [push, sub].forEach(function(socket){
                    socket.close();
                })
            }
            catch(error){
                log.error(error)
            }
    })
    //将tracker注册为关键资源
    lifecycle.regCleanupHandler(function(){
            try{
            log.info("stop tracking devices")
            tracker.stopTracking()
            }catch(error){
                log.error(error)
            }
    })
}
