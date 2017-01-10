//var util = require("util")
var cp = require("child_process")

//var Promise = require("bluebird")

//var log = require("./logger").createLogger("util:procutil")
/*
function ExitError(code) {
  Error.call(this)
  this.name = "ExitError"
  this.code = code
  this.message = util.format("Exit code "%d"", code)
  Error.captureStackTrace(this, ExitError)
}

util.inherits(ExitError, Error)

// Export
module.exports.ExitError = ExitError
*/
// Export
module.exports.fork = function(filename, args) {
  //log.info("Forking "%s %s"", filename, args.join(" "))
  console.log("Forking " + filename);
  //var resolver = Promise.defer()
  var proc = cp.fork.apply(cp, arguments)
  /*
  emitted when the stdio streams of a child process have been closed
  */
  proc.on("close", function(code,signal){

  })

  /*
  emitted after calling the child.disconnect() method in parent process or process.disconnect() in child process.
  After disconnecting it is no longer possible to send or receive messages, and the child.connected property is false
  */
  proc.on("disconnect", function(){

  })

  /*

      The process could not be spawned, or
      The process could not be killed, or
      Sending a message to the child process failed.


  event may or may not fire after an error has occurred
  */
  proc.on("error", function(error){

  })

  /*
  emitted after the child process ends

  Note that when the "exit" event is triggered, child process stdio streams might still be open.
  */

  proc.on("exit", function(code, signal){

  })


  /*

      message <Object> a parsed JSON object or primitive value.
      sendHandle <Handle> a net.Socket or net.Server object, or undefined.

  */
  proc.on("message", function(message){
  console.log(message)
  })

  return proc

/*
  function sigintListener() {
    proc.kill("SIGINT")
  }

  function sigtermListener() {
    proc.kill("SIGTERM")
  }

  process.on("SIGINT", sigintListener)
  process.on("SIGTERM", sigtermListener)

  proc.on("error", function(err) {
    //resolver.reject(err)
    proc.kill()
  })

  proc.on("exit", function(code, signal) {
    if (signal) {
      //resolver.resolve(code)
    }
    else if (code > 0 && code !== 130 && code !== 143) {
      //resolver.reject(new ExitError(code))
    }
    else {
      //resolver.resolve(code)
    }
  })
  return proc
  
  return resolver.promise.cancellable()
    .finally(function() {
      process.removeListener("SIGINT", sigintListener)
      process.removeListener("SIGTERM", sigtermListener)
    })
    .catch(Promise.CancellationError, function() {
      return new Promise(function(resolve) {
        proc.on("exit", function() {
          resolve()
        })
        proc.kill()
      })
    })
*/
}

// Export
/*
module.exports.gracefullyKill = function(proc, timeout) {
  function killer(signal) {
    var deferred = Promise.defer()

    function onExit() {
      deferred.resolve()
    }

    proc.once("exit", onExit)
    proc.kill(signal)

    return deferred.promise.finally(function() {
      proc.removeListener("exit", onExit)
    })
  }

  return killer("SIGTERM")
    .timeout(timeout)
    .catch(function() {
      return killer("SIGKILL")
        .timeout(timeout)
    })
}
*/