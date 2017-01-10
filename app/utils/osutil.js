var os = require('os');

function networkInterface(name){
	var devs = os.networkInterfaces();
	return devs[name]
}

function sockAddress(name, family){
	var address = [];
	networkInterface(name).forEach(function(sockAddress){
		if(sockAddress.family === family){
			address.push(sockAddress.address);
		}
	})
	return address;
}

module.exports.localInetAddress = function (name){
	return sockAddress(name, 'IPv4');
}

module.exports.localInet6Address = function (name){
	return sockAddress(name, 'IPv6');
}



