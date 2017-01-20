var fork = require('child_process').fork;

var proc = fork('./exec.js')

proc.on('exit', function(code, signal){
    console.log(proc.pid)
})


process.on('SIGINT', function(){
    console.log('SIGINT')
})

process.on('SIGTERM', function(){
    console.log('SIGTERM')
})