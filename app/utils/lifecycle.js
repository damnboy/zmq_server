var Promise = require("bluebird")

var logger = require("./logger")
var log = logger.createLogger("util:lifecycle")
var _ = require("lodash")

function Lifecycle() {
  this.resCleanupHandlers = []
  this.ending = false
  //避免功能碎片化，将所有的功能代码编写在Lifecycle对象内
  //通过bind，绑定callback到特定对象上
  //OS级别上信号事件的触发是异步的，但由于Nodejs的单线程特性，所以这里不需要考虑同步的问题
  //唯一需要考虑的就是信号能被多次触发，
  process.on("SIGINT", this.resCleanup.bind(this))
  process.on("SIGTERM", this.resCleanup.bind(this))
}


/*
不注册对象引用，而是选择监听对象上的emit出来的消息
TODO，一些关键对象后期考虑实现成单个对象，在进程中引用
*/
Lifecycle.prototype.trackingObject = function(name, emitter, options) {
/*
    参数合并（将options中提供的参数合并如运行时的opts中）
    这里用到了lodash（js中的一个utility lib）

    google： Combining Settings Objects with Lodash:_.assign or _.merge
*/
  var opts = _.assign({
      end: true
    , error: true
    }
  , options
  )

  if (opts.end) {
    emitter.on("end", function() {
      if (!this.ending) {
        log.fatal("%s ended; we shall share its fate", name)
        this.fatal()
      }
    }.bind(this)/*将callback绑定到当前对象 */)
  }

  if (opts.error) {
    emitter.on("error", function(err) {
      if (!this.ending) {
        log.fatal("%s had an error", name, err.stack)
        this.fatal()
      }
    }.bind(this))
  }

  if (emitter.end) {    //某对象包含其自定义的清理函数，将其注册到
    this.observe(function() {
      emitter.end()
    })
  }

  return emitter
}



Lifecycle.prototype.fatal = function(fatal) {

  log.fatal("Shutting down due to fatal error")
      if(fatal){
        log.fatal(fatal)
    }
  this.ending = true
  process.exit(1)
}

Lifecycle.prototype.resCleanup = function() {
  log.info("Winding down for graceful exit")

  this.ending = true

    /*
    没有正常处理cleanupHandler中的异常
    */
  var wait = Promise.all(this.resCleanupHandlers.map(function(handler) {
    return handler()
  }))

  return wait.then(function() {
    //process.exit(0)
  })
}
/*
    请务必在所注册的自定义资源释放函数中使用try－catch
    否则将资源无法完全释放（可能间接导致进程无法正常退出）
*/
Lifecycle.prototype.regCleanupHandler = function(promise) {
  this.resCleanupHandlers.push(promise)
}

module.exports = new Lifecycle()
