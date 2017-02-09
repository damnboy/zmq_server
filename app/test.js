var msgdef = require("./protoc/msgdef.js")
var msgutil = require("./protoc/msgutil.js")
var sessionId = '';
console.log(msgdef.com.example.ponytail.testjeromq.MessageTypes.Name)
var message = new msgdef.com.example.ponytail.testjeromq.DeviceRegisteredMessage('ok1', 'ok2').encodeNB()
var type = msgdef.ReverseMessageType[115];
console.log(type)
return msgutil.envelope(new msgdef.com.example.ponytail.testjeromq.TransactionDoneMessage(true, type, message), sessionId)