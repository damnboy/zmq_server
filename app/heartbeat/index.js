/*
Heartbead
	原实现相关文件
	/lib/units/reaper/index.js
	/lib/units/device/plugins/heartbeat.js

	原实现逻辑
	    provider/index.js 
            启动的device/index.js进程，其中的heartbeat.js代码负责定期发送DeviceHeartbeatMessage。
	    reaper/index.js
	        内部维护了一个TTLSet对象，一种包含一组TTLItem（链表），每个TTLItem记录了最后一次接收DeviceHeartbeatMessage消息的时间戳，TTLSet定期检查TTLSet内部链表上的每个对象，如果最后一次接收DeviceHeartbeatMessage与当前时间的差值大于特定的超时参数（options.heartbeatInterval），则将设备视为离线设备。
        utils/ttlset.js
            以链表形式维护一组TTLItem，其中存放了设备最后一次heartbeat的时间，以及设备的adb串号。
            当链表不为空时，开始执行超时检测。
            有Heartbeat的设备，会被移动到链表尾部，因此链表头部很可能是一个长时间没有收到Heartbeat消息的设备。
            由setTimeout调度的检测逻辑，对链表头部做检测，排除最可能存在超时的设备

	修改后的逻辑
	DeviceHeartbeatMessage由服务端的device/index.js进程定时发送，修改为
		由Android端定时发送。
		device/index.js进程接收该消息，并将其转发。

	因为原实现中，用过adb来检测设备的在线状态，实时性很高。如果将设备从在线到离线视为一个生命周期，那么device/index.js进程的生命周期，既等价于设备的生命周期。
	而当前实现中，设备通过网络连接到服务器，存在超时，掉线等行为。无法实时侦测到设备是否在线。因此将DeviceHeartbeatMessage的发送逻辑移到Android端。

*/

var childProcess = require("child_process");
var EventEmitter = require("events").EventEmitter;
var Promise = require("bluebird")
var zmq = require("zmq");
var _ = require("lodash")
var stf = require('../db/stf.js')
var messageDefines = require("../protoc/msgdef.js")
var messageRouter = require("../protoc/msgrouter.js")
var messageUtil = require("../protoc/msgutil.js")
var logger = require("../utils/logger.js")
var lifecycle = require("../utils/lifecycle.js")
var TtlSet = require('../../submodules/stf/lib/util/ttlset.js')
/*
    zmq mapper
    push -> pull@devDealer
    pub@appDealer ->sub
*/
module.exports = function(options){
    var log = new logger.createLogger("[HEARTBEAT]");
    var ttlset = new TtlSet(options.heartbeatTimeout)

  ttlset.on('insert', function(deviceId) {
    log.info('Device "%s" is present', deviceId)
    push.send([
      deviceId
    , messageUtil.envelope(new messageDefines.com.example.ponytail.testjeromq.DevicePresentMessage(deviceId))
    ])
  })

  ttlset.on('drop', function(deviceId) {
    log.info('Reaping device "%s" due to heartbeat timeout', deviceId)
    push.send([
      deviceId
    , messageUtil.envelope(new messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage(deviceId))
    ])
  })

    var sub = zmq.socket('sub');
    log.info('Subscribing input from "%s"', options.endpoints.sub)
    sub.subscribe('');
    sub.connect(options.endpoints.sub);
    sub.on('message', function(deviceId, networkEnvelopMessage){
        //log.info('message')
        deviceId = deviceId.toString()
        messageRouter()
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceIntroductionMessage, function(deviceId, message) {
                //log.info('DeviceIntroductionMessage')
                ttlset.drop(deviceId, TtlSet.SILENT)
                ttlset.bump(deviceId, Date.now())
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceHeartbeatMessage, function(deviceId, message) {
                //log.info('DeviceHeartbeatMessage')
                ttlset.bump(deviceId, Date.now())
            })
            .on(messageDefines.com.example.ponytail.testjeromq.DeviceAbsentMessage, function(deviceId, message) {
                log.info('DeviceAbsentMessage')
                ttlset.drop(deviceId, TtlSet.SILENT)
            })
            .generalHandler(deviceId, networkEnvelopMessage)
    })

    var push = zmq.socket('push');
    log.info('Pushing output to "%s"', options.endpoints.push)
    push.connect(options.endpoints.push);

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
            log.info('closing ttlset')
            ttlset.stop()
    })


    stf.getPresentDevices()
    .then(function(cursor){
        return cursor.toArray()
    })
    .then(function(devices){
        devices.forEach(function(device){
            ttlset.bump(device.serial, device.presentAt, TtlSet.SILENT)
        })
    })
    .catch(function(err){
        log.warn(err)
    })
}
