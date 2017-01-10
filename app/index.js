var cliutil = require('./utils/cliutil.js');
var devtriproxysvcurl = {
	pull : cliutil.buildUri('tcp' ,'127.0.0.1', 30000)
	,pub : cliutil.buildUri('tcp' ,'127.0.0.1', 30001)
	,dealer : cliutil.buildUri('tcp' ,'127.0.0.1', 30002)
}

var apptriproxysvcurl = {
	pull : cliutil.buildUri('tcp' ,'127.0.0.1', 40000)
	,pub : cliutil.buildUri('tcp' ,'127.0.0.1', 40001)
	,dealer : cliutil.buildUri('tcp' ,'127.0.0.1', 40002)
}

require("./triproxy")({
	connectionpoints : devtriproxysvcurl
	//,name : "DEVICE SIDE"
})

require("./triproxy")({
	connectionpoints : apptriproxysvcurl
	//,name : "APP SIDE"
})


require("./devicemanager")({
	endpoints : {
		pull :	devtriproxysvcurl.pull
		,pub :	devtriproxysvcurl.pub
	}
	,ports : cliutil.range(60000,60010)
})

require("./servicemanager")({
	endpoints : {
		devdealer : devtriproxysvcurl.dealer
		,appdealer : apptriproxysvcurl.dealer
	}
})

require("./websocketserver")({
	endpoints : {
		pull: apptriproxysvcurl.pull
		,pub : apptriproxysvcurl.pub
	}
})

/*
require("./networkmanager")({
	connectionpoints : {
		router : networkmanagersvcuri.router
		,dealer : networkmanagersvcuri.dealer
	}
	,endpoints : {
		pull : [devtriproxysvcurl.pull]
		}

})

*/

/*

*/