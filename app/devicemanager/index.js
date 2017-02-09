
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

/*
    debug command
        node ./cli devicemanager --network-interface-name en4 --connect-push tcp://127.0.0.1:8100 --connect-sub tcp://127.0.0.1:8200
*/
module.exports = function(options){


    var log = new logger.createLogger('['+ options.description +']');
    //TODO 一个临时的websocket server，用于获取设备列表

    var push = zmq.socket("push")
    log.info('Pushing output to "%s"', options.endpoints.pull)
    push.connect(options.endpoints.pull)

    var sub = zmq.socket("sub")
    log.info('Subscribing input from "%s"', options.endpoints.pub)
    sub.subscribe("")
    sub.connect(options.endpoints.pub)

    var deviceInstances = {}

    //TODO 可用端口列表
    log.info('Avaliable port range: ' + options.ports[0] + '~' + options.ports[options.ports.length -1])
    var ports = options.ports.slice(
        0
        , options.ports.length - options.ports.length % 4
    )


    log.info('Try Detecting inet address on ' + options.interface)
    var inetAddrs = osutil.localInetAddress(options.interface);
    
    var proxyTracker = new EventEmitter();
    tracker.startTracking({
        endpoints : cliutil.buildUriArray(inetAddrs, 10000)
    })
    .then(function(){
        log.info("start tracking devices " + cliutil.buildUriArray(inetAddrs, 10000))

        tracker.on("registed", function(device, sessionId){
            if(undefined != deviceInstances[device.id]){
                deviceInstances[device.id].send({
                    message: 'relogin',
                    sessionId: sessionId
                })
            }else{
                proxyTracker.emit(device.id, "registed")
            }
            
        })

        tracker.on("login", function(device, sessionId){

            push.send([device.id, msgUtil.envelope(
                new messageDefines.com.example.ponytail.testjeromq.DeviceIntroductionMessage(device.id)
            )])
            
            //检查进程是否存在
            if(undefined !== deviceInstances[device.id]){
                log.info("detect relogin device: " + device.id)
            }
            else{   
                log.info("detect login device: " + device.id)
                var privateTracker = new EventEmitter()
                function proxyTrackerListener(event){
                    privateTracker.emit(event)
                }
                proxyTracker.on(device.id, proxyTrackerListener)

                function forkDeviceInstance(){
                    var allocatedPorts = ports.splice(0, 4);
                    log.info('Forking process for device[' +device.id +']')
                    var proc = childProcess.fork('./cli',
                        [
                            'device', 'okvm',//new Buffer(device.id)
                            ,'--serial', device.id
                            ,'--connect-push', options.endpoints.pull //'tcp://127.0.0.1:8100' 
                            ,'--connect-sub', options.endpoints.pub //tcp://127.0.0.1:8200'
                            ,'--screen-port', allocatedPorts.shift() 
                            ,'--connect-port', allocatedPorts.shift() 
                            ,'--interface', options.interface
                            ,'--session-id', sessionId
                        ]
                    )

                    log.info('available port remains: ' + ports.length);
                    proc.on("exit", function(code, signal){
                        if(code === 0 || signal){   //不需要处理unregisted时，发送的SIG 
                            delete deviceInstances[device.id];
                            allocatedPorts.forEach(function(p){
                                ports.push(p);
                            })
                            log.info('after exit available port remains: ' + ports.length)
                            push.send([device.id, msgUtil.envelope(
                                new messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage(device.id))])
                        }
                        else{
                            log.info("restart device instance[" + device.id + "]")
                            deviceInstances[device.id] = forkDeviceInstance()
                            //TODO n次启动失败时候，或启动进程超时，通过tracker返回信息给设备端
                        }
                    })
                    proc.on("message", function(message){
                        if(message.message === "ready"){
                            log.info("device instance[" + device.id + "] is ready")
                            log.info("device instance[" + device.id + "] open control service at: " + message.dealer)

                            //向前端发送设备上线消息
                            push.send([device.id, msgUtil.envelope(
                                new messageDefines.com.example.ponytail.testjeromq.DevicePresentMessage(device.id)
                            )])

                            //向后端发送注册信息
                            tracker.reply(device.id, 
                                msgUtil.transaction(message.sessionId).success(
                                    new messageDefines.com.example.ponytail.testjeromq.DeviceRegisteredMessage(device.id, message.dealer)))

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
                            //TODO 发送成功登出消息
                        })
                        .catch(function(error){
                            kill(deviceInstances[device.id], "SIGKILL")
                            .then(function(){
                                log.info("Device Instance["+ device.id+"] killed")
                                //TODO 发送异常登出消息
                            })
                        })
                    }
                })
            }

        })

        tracker.on("logoff", function(device, sessionId){
            log.info("detect logoff device: " + device.id)
            proxyTracker.emit(device.id, "unregisted")
        })

    })
    .catch(function(error){
        log.error(error);
        lifecycle.fatal();
    })

    lifecycle.regCleanupHandler(function(){
        
        try{
            log.info("closing zmq sockets");
            [push, sub].forEach(function(socket){
                socket.close();
            })
            log.info("stop tracking devices");
            tracker.stopTracking();
        }
        catch(error){
            log.error(error)
        }
        
    })
}
