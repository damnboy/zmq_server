var procutil = require('../submodules/stf/lib/util/procutil.js')
var Promise = require('bluebird')
var argv = require('yargs');
argv
.option('bind-app-dealer', {
  describe: 'The address to bind the app-side ZeroMQ DEALER endpoint to.'
, type: 'string'
, default: 'tcp://127.0.0.1:7112'
})
.option('bind-app-pub', {
  describe: 'The address to bind the app-side ZeroMQ PUB endpoint to.'
, type: 'string'
, default: 'tcp://127.0.0.1:7111'
})
.option('bind-app-pull', {
  describe: 'The address to bind the app-side ZeroMQ PULL endpoint to.'
, type: 'string'
, default: 'tcp://127.0.0.1:7113'
})
.option('bind-dev-dealer', {
  describe: 'The address to bind the device-side ZeroMQ DEALER endpoint to.'
, type: 'string'
, default: 'tcp://127.0.0.1:7115'
})
.option('bind-dev-pub', {
  describe: 'The address to bind the device-side ZeroMQ PUB endpoint to.'
, type: 'string'
, default: 'tcp://127.0.0.1:7114'
})
.option('bind-dev-pull', {
  describe: 'The address to bind the device-side ZeroMQ PULL endpoint to.'
, type: 'string'
, default: 'tcp://127.0.0.1:7116'
})
.argv


function launch(argv){
    var procs = [
			procutil.fork('./cli',[
				'webservice', 'WEBSERVICE'
			])
			
			,procutil.fork('./cli',[
				'triproxy', 
				,'--description', 'TRIPROXY FOR DEVICES'
				,'--bind-pub',argv.bindDevPub
				,'--bind-pull',argv.bindDevPull
				,'--bind-dealer',argv.bindDevDealer
			])
			,procutil.fork('./cli',[
				'triproxy', 
				,'--description', 'TRIPROXY FOR APP'
				,'--bind-pub',argv.bindAppPub
				,'--bind-pull',argv.bindAppPull
				,'--bind-dealer',argv.bindAppDealer
			])
			,procutil.fork('./cli',[
				'servicemanager', 
				,'--connect-dev-dealer',argv.bindDevDealer
				,'--connect-app-dealer',argv.bindAppDealer
			])
			,procutil.fork('./cli',[
          'heartbeat' 
					,'--heartbeat-timeout', 10000
          ,'--connect-push', argv.bindDevPull
          ,'--connect-sub', argv.bindAppPub
      ])
			,procutil.fork('./cli',[
          'websocketserver' 
					,'--port', 7110
          ,'--connect-push', argv.bindAppPull
          ,'--connect-sub', argv.bindAppPub
      ])
			,procutil.fork('./cli',[
          'devicemanager', 'DEVICE MANAGER'
          ,'--interface', 'en5'
          ,'--connect-push', argv.bindDevPull
          ,'--connect-sub', argv.bindDevPub
      ])
			
    ]
    Promise.all(procs)
    .then(function(){
        console.log('All process exited')
    })
    .catch(function(error){
        console.log('An error @master process')
    })
    .finally(function(){
        console.log('Cleanup res @master process')
    })
}

var dbSetup = require('./db/setup.js')()
dbSetup
.then(function(){
	launch(argv.argv)
})
.catch(function(err){
	console.log('Database setup with error: ')
	console.log(err)
})

	/*
require("./triproxy")({
	endpoints : {
		dealer : argv.bindDevDealer
		,pull : argv.bindDevPull
		,pub : argv.bindDevPub
	}
	,description:'device side triproxy'
})

require("./triproxy")({
	endpoints : {
		dealer : argv.bindAppDealer
		,pull : argv.bindAppPull
		,pub : argv.bindAppPub
	}
	,description:'device side triproxy'
})

require("./heartbeat")({
	endpoints : {
		pull :	argv.bindDevPull
		,pub :	argv.bindAppPub
	}
})

require("./devicemanager")({
	endpoints : {
		pull :	argv.bindDevPull
		,pub :	argv.bindDevPub
	}
	,interface : argv.interface
	,ports : cliutil.range(60000,60010)
})

require("./servicemanager")({
	endpoints : {
		devdealer : argv.bindDevDealer
		,appdealer : argv.bindAppDealer
	}
})

require("./websocketserver")({
	endpoints : {
		pull: argv.bindAppPull
		,pub : argv.bindDevPub
	}
})
*/

