var EventEmitter = require("events").EventEmitter;
var Logger = require("./../utils/logger.js").Logger;
var NetworkLogger = require("./../utils/networkLogger").NetworkLogger;

var HaapiConnection = require("./../network/haapiConnection.js").HaapiConnection;
var ClientConnection = require("./../network/clientConnection.js").ClientConnection;

var processGameContext = require("./frames/game/gameContextFrame.js").processGameContext;
var processIdentification = require("./frames/common/identificationFrame.js").processIdentification
var processServerSelection = require("./frames/common/serverSelectionFrame.js").processServerSelection
var processsCharacterSelection = require("./frames/common/characterSelectionFrame.js").processsCharacterSelection;

var BotData = require("./botData.js").BotData;
var Trajet = require("./core/trajet.js").Trajet;
var Player = require("./core/player.js").Player;
var Fight = require("./core/fight.js").Fight;
var Sync = require("./core/sync.js").Sync;
var Gather = require("./core/gather.js").Gather;

exports.Bot = function(groupeName,clientId,reconnectFunction){
	this.logger = new Logger(groupeName+":"+clientId);
	this.dispatcher = new EventEmitter();
	this.reconnect = reconnectFunction;
	this.migrating = false;

	this.haapi = new HaapiConnection();
	this.connection = new ClientConnection();
	this.data = new BotData(clientId,groupeName,this);

	this.player = new Player(this);
	this.trajet = new Trajet(this);
	this.fight = new Fight(this);
	this.sync = new Sync(this);
    this.gather = new Gather(this);
}

exports.Bot.prototype.connect = function(accompt){
    this.packetLogger = new NetworkLogger(new Date().getTime() + accompt.username);
	var reconnecting =false;
	self=this;
	this.data.accompt = accompt;
	this.connection.dispatcher.on("closed",() =>{
		if(!this.migrating){
			this.logger.log("<span color=\"red\">Connection closed, reloading client ...</span>");
			this.reconnect(this);
        }
        else{
            console.log("migrating...")
            this.migrating = false;
        }
	});
	self.haapi.processHaapi(accompt.username,accompt.password,function(config){
		self.data.config=config;
		if(typeof global.config == "undefined") global.config = config;

		processGameContext(self);
		if(typeof self.haapi.loadedToken != "undefined"){
			processIdentification(self.logger,self.connection,self.haapi.loadedToken.token,accompt.username,(servers,login) => {
				self.login = login;
				self.migrating=true;//todo localiser plus presisement le momens ou on fais la migration
				processServerSelection(self.logger,self.connection,servers,function(){
					processsCharacterSelection(self.logger,self.connection,reconnecting,function(character){
						self.migrating=false;
                        self.dispatcher.emit("characterSelected");
					});
				});
			});
			self.connection.connect(config.sessionId,self.data.config.dataUrl,self.packetLogger);
		}
		else{
			self.reconnect(self);
		}
	});
}
exports.Bot.prototype.unload = function(){
//todo
}