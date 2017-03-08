/*
    debug command
        node ./cli device okdev --connect-push tcp://127.0.0.1:8100 --connect-sub tcp://127.0.0.1:8200 --screen-port 8300 --connect-port 8400  --network-interface-name en0
*/
var zmq = require("zmq");
var net = require("net");
var messageDefines = require("../protoc/msgdef.js");
var messageRouter = require("../protoc/msgrouter.js");
var msgUtil = require("../protoc/msgutil.js");
var WebSocket = require('ws');
var EventEmitter = require('events').EventEmitter;
var logger = require("../utils/logger.js");
var osutil = require('../utils/osutil.js');

module.exports = function(options){

    var log = new logger.createLogger('[DEVICE ' + options.serial + ']');
    //处理来自dealer的消息，通过push，推送到前端进行展现
    var push = zmq.socket("push");
    push.connect(options.endpoints.push);   //connect to triproxy pull
    //处理来自前端的消息，并通过dealer发送到设备进行处理
    var sub = zmq.socket("sub");
    sub.subscribe(options.serial)
    sub.connect(options.endpoints.sub)   //connect to triproxy pub
    function onFrontendEnvelop(deviceId, frontendEnvelop){
        messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.ScreenStreamMessage, function(deviceId, screenStreamMessage){
                var word = screenStreamMessage.enable ? 'enable' : 'disable';
                log.info('Trying to ' + word + ' screen stream on remote deivce')
                dealer.send([deviceId, msgUtil.envelope(screenStreamMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchMoveMessage, function(deviceId, touchMoveMessage){
                //log.info('TouchDownMessage')
                //console.log(deviceId)
                //console.log(touchDownMessage)
                dealer.send([deviceId, msgUtil.envelope(touchMoveMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchUpMessage, function(deviceId, touchUpMessage){
                //log.info('TouchDownMessage')
                //console.log(deviceId)
                //console.log(touchDownMessage)
                dealer.send([deviceId, msgUtil.envelope(touchUpMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchDownMessage, function(deviceId, touchDownMessage){
                //log.info('TouchDownMessage')
                dealer.send([deviceId, msgUtil.envelope(touchDownMessage)])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.TouchCommitMessage, function(deviceId, touchCommitMessage){
                //log.info('TouchCommitMessage')
                dealer.send([deviceId, msgUtil.envelope(touchCommitMessage)])
            })
            .generalHandler(deviceId, frontendEnvelop)

    }
    sub.on("message", onFrontendEnvelop)

    log.info('Try Detecting inet address on ' + options.interface)
    var inetAddrs = osutil.localInetAddress(options.interface);
    var inetAddr = inetAddrs[0];
    var imgRouter = new EventEmitter();
    
    //inetAddrs.forEach(function(addr){
        var wss = new WebSocket.Server({
            port: options.screenPort
        , perMessageDeflate: false
        })

        log.info('Waiting incoming connection on ' + 'ws://' + inetAddr + ':' + options.screenPort )
        wss.on('connection', function(ws){
            log.info('incoming websocket client')
            imgRouter.on('image', function(frame){
                    ws.send(frame,{
                        binary: true
                    }, function(err) {
                        log.info(err)
                    })
            })
        })
    //})


    //inetAddrs.forEach(function(addr){
        var dealer = zmq.socket("router");
        var uri = 'tcp://' + inetAddr + ':' + options.connectPort;
        dealer.bind(uri, function(error){
            if(error){
                log.info(error)
            }
            log.info('Waiting incoming connection on ' + uri)
        });
        var readFrameBytes = 0
        var frameBodyLength = 0
        var frameBody = new Buffer(0)

        function onNetworkEnvelop(deviceId, networkenvelop){
            var device = {
                id : deviceId.toString()
            }
            messageRouter()
                //转发心跳包
                .on(messageDefines.com.example.ponytail.testjeromq.DeviceHeartbeatMessage, function(deviceId, heartBeatMessage){
                    //DeviceReadyMessage
                    //log.info('DeviceHeartbeatMessage')
                    push.send([device.id, msgUtil.envelope(heartBeatMessage)])
                })
                .on(messageDefines.com.example.ponytail.testjeromq.ScreenControlMessage, function(deviceId, screenControlMessage){
                    var enable = screenControlMessage.enable;
                    log.info(enable ? 'ScreenControlMessage: enable' : 'ScreenControlMessage: disable');

                    dealer.send([device.id, msgUtil.envelope(
                        new messageDefines.com.example.ponytail.testjeromq.ScreenControlMessage(enable))])
                })
                //模拟device/plugins/solo.js发送DeviceIdentityMessage，DeviceReadyMessage
                .on(messageDefines.com.example.ponytail.testjeromq.DeviceIdentityMessage, function(deviceId, identityMessage, sessionId){
                    log.info('DeviceIdentityMessage');

                    /*
                        将准备就绪的用于传输设备屏幕图像的Websocket服务器地址填充到
                        DeviceIdentityMessage
                            DeviceDisplayMessage(url)
                            DevicePhoneMessage

                        将视频信息存入特定的结构体内
                    */
                    identityMessage.display.url = ('ws://' + inetAddr + ':' + options.screenPort)
                    push.send([device.id, msgUtil.envelope(identityMessage)])

                })
                .on(messageDefines.com.example.ponytail.testjeromq.DeviceReadyMessage, function(deviceId, deviceReadyMessage){

                    //DeviceReadyMessage
                    log.info('DeviceReadyMessage');
                    push.send([device.id, msgUtil.envelope(deviceReadyMessage)])
                    dealer.send([device.id, msgUtil.envelope(new messageDefines.com.example.ponytail.testjeromq.DeviceProbeMessage())])

                })
                .on(messageDefines.com.example.ponytail.testjeromq.ScreenFrameMessage, function(deviceId, screenFrameMessage){
                    //log.info('ScreenFrameMessage')
                    var chunk = screenFrameMessage.frame;
                    chunk = chunk.copy(chunk.offset, chunk.limit);
                    chunk = chunk.buffer;
                    if(chunk.length === 24){ //解析banner帧
                        log.info('got banner frame')
                        readFrameBytes = 0
                        frameBodyLength = 0
                        frameBody = new Buffer(0)
                    }
                    else{ //拆帧，发送
                        for (var cursor = 0, len = chunk.length; cursor < len;) {
                            if (readFrameBytes < 4) {
                            frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0
                            cursor += 1
                            readFrameBytes += 1
                            //console.info('headerbyte%d(val=%d)', readFrameBytes, frameBodyLength)
                            }
                            else{
                                if (len - cursor >= frameBodyLength) {
                                    

                                    frameBody = Buffer.concat([
                                    frameBody
                                    , chunk.slice(cursor, cursor + frameBodyLength)
                                    ])
                                    
                                    // Sanity check for JPG header, only here for debugging purposes.
                                    if (frameBody[0] !== 0xFF || frameBody[1] !== 0xD8) {
                                    console.error(
                                        'Frame body does not start with JPG header', frameBody)
                                    break;
                                    }

                                    imgRouter.emit('image', frameBody)
                                    log.info('got new screenshot(len=%d)', frameBody.length)
                                    //console.log(frameBody)
                                    cursor += frameBodyLength
                                    frameBodyLength = readFrameBytes = 0
                                    frameBody = new Buffer(0)
                                    
                                }
                                else{
                                    frameBody = Buffer.concat([
                                    frameBody
                                    , chunk.slice(cursor, len)
                                    ])

                                    frameBodyLength -= len - cursor
                                    readFrameBytes += len - cursor
                                    cursor = len
                                }
                            }
                        }
                    }
                })
                .generalHandler(deviceId, networkenvelop)
        }
        dealer.on('message', onNetworkEnvelop)
    //})

    if(process.connected){
        process.send({
            message : 'ready',
            dealer : 'tcp://'+inetAddrs[0] + ':' + options.connectPort,
            sessionId: options.sessionId
        })
        
        process.on('message',function(message){
            process.send({
                message : 'ready',
                dealer : 'tcp://'+inetAddrs[0] + ':' + options.connectPort,
                sessionId: message.sessionId
            })
        })
    }
}