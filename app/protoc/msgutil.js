
var msgdef = require("./msgdef.js")


var envelop = function(message, sessionId){
	var typecode = message.$code;
	var networkEnvelop = new msgdef.com.example.ponytail.testjeromq.NetworkEnvelope(typecode, message.encodeNB(), sessionId).encodeNB();
	return networkEnvelop
}
/*
var transaction = function(sessionId){
	return {
		reply : function(){
			return {
				success : function( message ){
					var type = message.$code;
					return envelop(new msgdef.com.example.ponytail.testjeromq.TransactionDoneMessage(true, type, message).encodeNB(), sessionId)
				}
				,
				failed : function(message){
					var type = message.$code;
					return envelop(new msgdef.com.example.ponytail.testjeromq.TransactionDoneMessage(true, type, message).encodeNB(), sessionId)
				}
			}
		}
	}
}

var reply = function(){
	return transaction('')
}
*/
var msgutil = {
	envelope : function(message, sessionId){
		if(sessionId === undefined){
			sessionId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
		}
		var typecode = message.$code;
		var networkEnvelop = new msgdef.com.example.ponytail.testjeromq.NetworkEnvelope(typecode, message.encodeNB(), sessionId).encodeNB();
		return networkEnvelop
	}

	,
	transaction : function(sessionId){
		//console.log('Pack envelope with session id: ' + sessionId)
		return {
			//reply : function(){
			//	return {
					success : function( message ){
						//console.log('Pack success envelope with session id: ' + sessionId)
						var type = msgdef.ReverseMessageType[message.$code];
						console.log(type)
						return msgutil.envelope(new msgdef.com.example.ponytail.testjeromq.TransactionDoneMessage(true, type, message.encodeNB()), sessionId)
					}
					,
					failed : function(message){
						//console.log('Pack failed envelope with session id: ' + sessionId)
						var type = msgdef.ReverseMessageType[message.$code];
						return msgutil.envelope(new msgdef.com.example.ponytail.testjeromq.TransactionDoneMessage(true, type, message.encodeNB()), sessionId)
					}
				//}
			//}
		}
	}

	,
	reply : function(){
		return msgutil.transaction('')
	}

}

module.exports = msgutil;