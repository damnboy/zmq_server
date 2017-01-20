module.exports.command = 'devicemanager [interface..]'

module.exports.describe = 'Start a device manager & network tracker'

module.exports.builder = function(yargs){

    yargs
    .strict()
    .option('network-interface-name', {
        describe : 'Register listener for network device tracker on specifical local network interface'
        , type : 'string'
        , choices : (function(){
            var devs=require('os').networkInterfaces();
            var devnames = [];
            for(var name in devs){
                devnames.push(name)
            }
            return devnames
        })()
        , demand: true
    })
    .option('connect-push', {
        demand: true,
        type : 'string'
        , describe: 'Device-side ZeroMQ PULL endpoint to connect to.'
    })
    .option('connect-sub', {
        demand: true
        , type : 'string'
        , describe: 'Device-side ZeroMQ PUB endpoint to connect to.'
    })
    .option('min-port',{
        demand: true
        , describe: 'Lowest port number for device workers to use.'
        , type: 'number'
        , default : 7400

    })
    .option('max-port',{
        demand: true
        , describe: 'Highest port number for device workers to use.'
        , type: 'number'
        , default: 7700
    })
    .option('description', {
      describe: 'An easily identifiable name for log output.'
    , type: 'string'
    , default : 'DEVICE MANAGER'
    })
}

module.exports.handler = function(argv){
    function range(from, to) {
        var items = []
        for (var i = from; i <= to; ++i) {
        items.push(i)
        }
        return items
    }

    return require('../../devicemanager')({
        description : argv.description
        , interface : argv.networkInterfaceName
        ,endpoints : {
            pull :	argv.connectPush
            ,pub :	argv.connectSub
        }
        ,ports : range(argv.minPort, argv.maxPort)
        ,fork : function(device, host, ports){
            var fork = require('child_process').fork;
            var args = [
                'device', device.id
                ,'--screen-port' , port.shift()
                ,'--connect-port', port.shift()
                ,'--network-interface-name' , argv.networkInterfaceName
                ,'--connect-sub' , argv.connectSub
                ,'--connect-push' , argv.connectPush
            ]
        }
    })
}