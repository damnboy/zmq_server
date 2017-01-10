

var net = require("net");
var server = net.createServer();

server.on("error", (err) => {
  throw err;
});

server.on("connection", function(socket){
    socket.on("data", function(buffer){
        process.exit(0)
    })
})
var port = 8000;
server.listen(port, () => {
  console.log("server bound on: " + port);
});