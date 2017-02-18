var EventEmitter = require("events").EventEmitter;

var MapManager = require("./managers/mapManager.js").MapManager;
var ActorsManager = require("./managers/actorsManager.js").ActorsManager;
var FightManager = require("./managers/fightManager.js").FightManager;
var InventoryManager = require("./managers/inventoryManager.js").InventoryManager;
var ExchangeManager = require("./managers/exchangeManager.js").ExchangeManager;
var JobsManager = require("./managers/jobsManager.js").JobsManager;
var ConfigManager = require("./managers/configManager.js");
var staticConetentManager = require("./managers/staticContentManager.js");

exports.BotData = function(clientId,clientGroupe,bot){
	this.dispatcher=new EventEmitter();

	this.state="DISCONNECTED";
	this.context = "NONE";
	this.characterInfos = null;
	this.userConfig = null;
    this.breedInfos = null;

	this.clientId = clientId;
	this.clientGroupe =  clientGroupe;
	
	this.mapManager = new MapManager(bot);
	this.actorsManager = new ActorsManager(bot);
	this.fightManager = new FightManager(bot);
	this.inventoryManager = new InventoryManager(bot);
    this.exchangeManager = new ExchangeManager(bot);
    this.jobsManager = new JobsManager(bot);

	bot.connection.dispatcher.on("CharacterSelectedSuccessMessage",(m)=>{
		this.characterInfos=m.infos;
		this.characterInfos.contextualId = m.infos.id;
        staticConetentManager.getBreedsInfos([this.characterInfos.breed],(breedNfo)=>{
            this.breedInfos = breedNfo[this.characterInfos.breed];
            ConfigManager.getConfig(this.characterInfos.name,(loadedConfig)=>{
                this.userConfig = loadedConfig;
                this.dispatcher.emit("characterSelected",{character:this.characterInfos,config:this.userConfig});
            });   
            
        });;

	});
}

exports.BotData.prototype.saveUserConfig = function(){
    ConfigManager.saveConfig(this.characterInfos.name,this.userConfig);
    console.log("[botData]Config for "+this.characterInfos.name+" saved !");
}