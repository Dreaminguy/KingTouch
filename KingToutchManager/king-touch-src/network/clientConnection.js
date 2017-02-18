var Primus = require("./primus.js");
var EventEmitter = require("events").EventEmitter;

exports.ClientConnection = function(){
	this.currentConnection;
	this.dispatcher = new EventEmitter();
	this.currentSessionId;
}
exports.ClientConnection.prototype.connect = function(sessionId,url,logger){
    this.logger = logger;
	this.connectionCount++;
	this.currentSessionId=sessionId;
	var currentUrl = makeSticky(url,this.currentSessionId);
	console.log("Connecting to login server ("+currentUrl+") ...");

	this.currentConnection = new Primus(currentUrl, {
		strategy: 'disconnect,timeout',//todo il faut voir si on utilise vraiment cette strategie ou pas faudrais se renseigner un peut plus sur primus
		reconnect: {
			max: Infinity,
			min: 500,
			retries: 10
		}
	});

	this.setCurrentConnection();
	this.currentConnection.open();
}
exports.ClientConnection.prototype.migrate = function(url){
	migrating=true;
	this.send('disconnecting', "SWITCHING_TO_GAME");
	this.currentConnection.destroy(); 
	this.currentConnection = new Primus(makeSticky(url,this.currentSessionId),{

		strategy: 'disconnect,timeout',
		reconnect: {
			max: Infinity,
			min: 500,
			retries: 10
		}
	});
	this.setCurrentConnection();
	this.currentConnection.open();
};
exports.ClientConnection.prototype.send = function (callName, data) {
	var msg = {
		call: callName,
		data: data
	};

    this.logger.log("packet-send",{call:callName,data:data});

	this.currentConnection.write(msg);
};
exports.ClientConnection.prototype.sendMessage = function(messageName,data){
	this.send("sendMessage",{type: messageName,data:data})
};
exports.ClientConnection.prototype.setCurrentConnection = function(){
	var self = this;
	self.currentConnection.on("open",()=>{
		console.log("Connection opened !");
		self.dispatcher.emit("open");
	});
	self.currentConnection.on("data",function(data){
		self.logger.log(data);
		self.dispatcher.emit(data._messageType, data);
	});//todo gérer la reconnection avec primus il semble y avoir deux trois trucs a faire 
	self.currentConnection.on("error",function(error){
		console.log("[Primus error]"+error);
	});
	self.currentConnection.on("reconnect",function(data){
		console.log("[Primus reconnect]"+JSON.stringify(data));
		self.dispatcher.emit("closed","reconnect");//je fais sa en attendant de gerer comme le  client
	});
	self.currentConnection.on("reconnected",function(data){
		console.log("[Prmius reconnected]");
	});
	self.currentConnection.on('reconnect timeout', function (err, opts) {
  		console.log('Timeout expired: %s', err.message);
		self.dispatcher.emit("closed","reconnet_timeout");
	});
	self.currentConnection.on('reconnect failed', function (err, opts) {
		console.log('The reconnection failed: %s', err.message);
		self.dispatcher.emit("closed","reconnect_failed");
	});
	self.currentConnection.on('end', function () {
        console.log("Prmus close connection !");
		self.dispatcher.emit("closed","end");
	});
}

function makeSticky(url,sessionId){
	var seperator = url.indexOf('?') === -1 ? '?' : '&';
	return url + seperator + "STICKER" + '=' + encodeURIComponent(sessionId);
}
