var zmq = require("zmq");
var net = require("net");
var messageDefines = require("../protoc/msgdef.js");
var messageRouter = require("../protoc/msgrouter.js");
var msgUtil = require("../protoc/msgutil.js");
var WebSocket = require('ws');
var EventEmitter = require('events').EventEmitter;

module.exports = function(options){
    
    options.deviceid = process.argv[2];
    options.serviceUris = process.argv[3].split(',');
    options.dealerUri = options.serviceUris[0]
    options.minicapUri = options.serviceUris[1]
    options.endpoints = {}
    options.endpoints.pull = process.argv[4];
    options.endpoints.pub = process.argv[5];

    //处理来自dealer的消息，通过push，推送到前端进行展现
    var push = zmq.socket("push");
    push.connect(options.endpoints.pull);   //connect to triproxy pull


    //处理来自前端的消息，并通过dealer发送到设备进行处理
    var sub = zmq.socket("sub");
    sub.subscribe(options.deviceid)
    sub.connect(options.endpoints.pub)   //connect to triproxy pub
    function onFrontendEnvelop(deviceid, frontendEnvelop){

    }
    sub.on("message", onFrontendEnvelop)

    var imgRouter = new EventEmitter();
    var wss = new WebSocket.Server({
        port: 12345
      , perMessageDeflate: false
      })

    wss.on('connection', function(ws){
        console.log('incoming websocket client')
        imgRouter.on('image', function(frame){
            ws.send(frame)
        })
    })



    //与设备直连的socket
    var dealer = zmq.socket("router");
    dealer.bind(options.dealerUri, function(error){
        if(error){

        }
        console.log('[DEVICE ' + options.deviceid + '] dealer: ' + options.dealerUri)
    });

    var readFrameBytes = 0
    var frameBodyLength = 0
    var frameBody = new Buffer(0)

    function onNetworkEnvelop(deviceId, networkenvelop){
        var device = {
            id : deviceId.toString()
        }
        messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceIdentityMessage, function(deviceId, identityMessage){
                //DeviceIdentityMessage
                push.send([device.id, msgUtil.envelope(
                    messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceIdentityMessage,
                    identityMessage.encode()
                )])
                //DeviceReadyMessage
                push.send([device.id, msgUtil.envelope(
                    messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name.DeviceReadyMessage,
                    new messageDefines.com.example.ponytail.testjeromq.DeviceReadyMessage(device.id, device.id).encodeNB()
                )])
            })
            .on(messageDefines.com.example.ponytail.testjeromq.ScreenFrameMessage, function(deviceId, screenFrameMessage){
                var chunk = screenFrameMessage.frame;
                chunk = chunk.copy(chunk.offset, chunk.limit);
                chunk = chunk.buffer;

                if(chunk.length != 24){

                    for (var cursor = 0, len = chunk.length; cursor < len;) {
                        if (readFrameBytes < 4) {
                          frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0
                          cursor += 1
                          readFrameBytes += 1
                          console.info('headerbyte%d(val=%d)', readFrameBytes, frameBodyLength)
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
                            //console.info('body(len=%d)', frameBody.length)
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
    process.send({
        message : 'ready',
        dealer : options.dealerUri
    })
}