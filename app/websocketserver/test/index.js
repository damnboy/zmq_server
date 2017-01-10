var httpServer = require("http").createServer();
/*
    传输方式的选择需要针对不同的浏览器进行适配
        Chrome, Firefox, Safari - WebSockets
        IE, Opera - XHR-Polling

        websocket
            Chrome, Firefox, Safari默认支持
            IE 10与Opera中，websocket默认处于禁用状态

        flash socket
             使用FlashSocket，需要下载额外的flash对象（swf文件）

        XHR－polling
            兼容性最好

       
    Engine.io包装后的产物，与浏览器中的WebSocket对象无法直接进行交互
    需要加上特定配置的QueryString 
    var socket = new WebSocket('ws://192.168.2.103:3000/socket.io/?EIO=2&transport=websocket'); 
    socket.onmessage = function(message){console.log(message)};

    chrome中调试websocket流量
    https://kaazing.com/2012/05/09/inspecting-websocket-traffic-with-chrome-developer-tools/

*/
var wsServer = require("socket.io")(httpServer, {serveClient:true});



wsServer.on("connection", function(socket){
    socket.on('message', function(message){
        console.log(message)
    })
})

wsServer.listen(3000);
