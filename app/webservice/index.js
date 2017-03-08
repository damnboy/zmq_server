const express = require('express');
const app = express();
var stf = require('../db/stf.js')
var logger = require("../utils/logger")
/*
Error: Most middleware (like logger) is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.
express中的logger对象已经分离出来，称为独立模块，并重命名为morgen。
*/
module.exports = function(options){

    var log = logger.createLogger('['+ options.description + ']')

    app.use(require('morgan')('dev'))

    app.get('/api/v1/devices', function(req, res){
        /*express deprecated res.json(status, obj): Use res.status(status).json(obj) instead index.js:11:9
        res.json(200, {
            "hello" : req.params.name
        });
        */
        stf.getDevices()
        .then(function(cursor){
            return cursor.toArray()
        })
        .then(function(devices){
            res
            .status(200)
            .json({
                success : true,
                devices : devices}
                )
        })
        .catch(function(err){
            res
            .status(500)
            .json(err)
        })
    })

    app.get('/api/v1/devices/:id', function(req, res){
        /*express deprecated res.json(status, obj): Use res.status(status).json(obj) instead index.js:11:9
        res.json(200, {
            "hello" : req.params.name
        });
        */
        stf.getDevice(req.params.id)
        .then(function(device){
            if(device){
                res
                .status(200)
                .json(device)
            }
            else{
                res.status(404)
                .json({
                    success: false
                    , description: 'Device not found'
                })
            }
        })
        .catch(function(err){
            //[TypeError: Cannot read property 'toArray' of null]
            res
            .status(500)
            .json(err)
        })
    })

    app.listen(8002, function(){
        log.info('webservice is ready')
    })

    require('./proxy')
}
