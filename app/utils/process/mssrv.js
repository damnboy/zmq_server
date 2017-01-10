/*
var childProcess = require("child_process")
var cp = childProcess.fork("./msg.js")
cp.on("message", function(message){
    var promise = new Promise(function(resolve){
        //resolve(message)
    });
    promise.then(function(resolve){
        console.log(resolve)
    })
})
*/
var i = 0;
var EventEmitter = require("events").EventEmitter;
var events = []
var eventLoop = new EventEmitter()
eventLoop.on("loop", function(){
    //events.push(new EventEmitter())
    var promise = new Promise(function(resolve, reject){
        //resolve(1)
    })
    promise.then(function(resolve){
        //console.log(i + " on loop resolved");
        //i++;
    })
})



setInterval(function(){
eventLoop.emit("loop")
}, 1)