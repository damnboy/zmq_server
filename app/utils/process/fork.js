var Promise = require("bluebird")
var childProcess = require("child_process")

var proc;

var kill = function(customSignal){
	var onExit;

	//new Promise时申请的资源，在finally中释放
	//将构造以及finally控制在一个scope内，方便引用资源的变量，不需要跨context传递
	//方便操作
	console.log("sending " + customSignal)
	var promise =  new Promise(function(resolve){

		onExit = function (){
			resolve()
		}

		proc.on("exit", onExit)//无法bind this，该函数调用绑定的context并不是promise
		
		proc.kill(customSignal)
	
	})

	return promise.finally(function(){
		proc.removeListener("exit", onExit)
	})
}

var stop = function(){
	kill("SIGTERM")
	.timeout(5000)
	.then(function(){
		console.log("Process killed by SIGTERM")
	})
	.catch(function(error){
		console.log("SIGTERM process with error: " + error)
		console.log("Trying to KILL process")
		kill("SIGKILL").
		then(function(){
			console.log("Process killed by SIGKILL")
		})
	})
}


var instance = function(file){
	var onExit;
	var onMessage;
	var promise = new Promise(function(resolve, reject){
		proc = childProcess.fork(file);
		console.log(proc._events)
		
		onExit = function(code, signal){
			if(code === 0 ){
				resolve();
			}
			else{
				reject("code("+code+"),signal("+signal+") ");
			}
		}
		onMessage = function(message){
			console.log("childProcess is ready");
		}

		proc.on("exit", onExit);
		proc.on("message", onMessage);
		console.log(proc._events)

	})
	return promise.finally(function(){
		proc.removeListener("exit", onExit);
		proc.removeListener("message", onMessage);
	})
}

var trackingInstance = function(file){
	instance(file)
	.then(function(resolve){
		console.log("process terminated...")
	})
	.catch(function(error){
		console.log("process unexpected terminated with error " + error +" trying to restart...")
		instanceDemo(file)
	})
}

process.stdin.on("data", function(message){
	var message = message.toString().replace("\n","");
	if(message === "stop"){
		stop()
	}
})

instanceDemo("./exec.js")




