var EventWrapper = require('event-wrapper');
var logger;
var auth = {
	username: null,
	token: null,
	salt: null,
	key: null
};
exports.processIdentification = function(logg,connection,token,username,cb,identificationTimeoutCallBack){
	global.serversInfos = {appVersion:"1.9.27", buildVersion:"0.60.0", client:"android", language:global.config.language};//todo mettre les value qq part jais pas encore fais le systeme de config static ....
	logger=logg;
	logger.log("[processIdentification]...")
	auth.token=token;
	auth.username=username;
	var loginSessionId;
	var identificationTimeout;
	var failCount = 0;
	var wrap = EventWrapper(connection.dispatcher, function (error) {
		if(typeof error != "undefined"){
			logger.log("[processIdentification]"+JSON.stringify(error),"error");
		}
	});
	wrap('open', function () {
		logger.log("Identification connection opened !");
		var infos = global.serversInfos;
		infos.server = "login";
		connection.send('connecting', infos);
	});
	wrap('serverDisconnecting', function (error) {
		wrap.done(error);
		logger.log("Disconnected by server");
	});
	wrap("LoginQueueStatusMessage",function(msg){
		logger.log(msg.position+"/"+msg.total+" in login queue...");
	});
	wrap('HelloConnectMessage', function (msg) {
		auth.salt = msg.salt;
		auth.key = msg.key;
		connection.send('checkAssetsVersion', {assetsVersion : "2.15.15",staticDataVersion:"25"});//pareille il faut caler les value qq part
	});

	wrap('assetsVersionChecked', function (instructions) {
		connection.send('login', auth);
	});

	wrap(
		'IdentificationSuccessMessage',
		function (msg) {
			clearTimeout(identificationTimeout);
			logger.log("Identification success ("+msg.login+") !");
			loginSessionId=msg.login;
		}
	);
	wrap('IdentificationSuccessWithLoginTokenMessage',
		function (msg) {
			clearTimeout(identificationTimeout);
			logger.log("Identification success but no token !");
			loginSessionId=msg.login;
		}
	);

	wrap(
		'IdentificationFailedMessage',
		'IdentificationFailedForBadVersionMessage',
		'IdentificationFailedBannedMessage',
		function (msg) {
			wrap.done(msg);
		}
	);

	wrap('ServersListMessage', function (msg) {
		logger.log("Servers list received !");
		wrap.done();
		cb(msg.servers,loginSessionId);
	});

}
