
var msgdef = require("./msgdef.js")
var msgutil = {
	envelope:function(type, message){
		return new msgdef.com.example.ponytail.testjeromq.NetworkEnvelope(type, message).encodeNB();
	},
	reply:function(){
		return {
			success : function(type, message){
				return msgutil.envelope(msgdef.com.example.ponytail.testjeromq.MessageTypes.Name.TransactionDoneMessage,
					new msgdef.com.example.ponytail.testjeromq.TransactionDoneMessage(true, type, message).encodeNB());
			},
	
			failed: function(type, message){
				return msgutil.envelope(msgdef.com.example.ponytail.testjeromq.MessageTypes.Name.TransactionDoneMessage,
					new msgdef.com.example.ponytail.testjeromq.TransactionDoneMessage(false, type, message).encodeNB());
			}
		}
	}
}

var util = {
	envelop : function (message){
		var typecode = message.$code;
		var networkEnvelop = new msgdef.com.example.ponytail.testjeromq.NetworkEnvelope(typecode, message.encodeNB()).encodeNB();
	}
}
module.exports = msgutil;