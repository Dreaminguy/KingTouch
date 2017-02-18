var EventEmitter = require("events").EventEmitter;
var Logger = require("./utils/logger.js");
var sessionManager = require("./engine/sessionManager.js");
var webSocket = require("ws");
var bot = null;
var processSocket = null;
var id = -1;
exports = module.exports = new EventEmitter();
exports.open = function(botManager,id_,username){
    
    
    //le truque qui doit tout niquer, desactiver pour le debug (merci la gestion d'erreur de node)
    /*process.on('uncaughtException',(err) => {
        console.log("********** Uncaught exception in "+username+" process *********");
        try{
            console.log("Exporting session ...");
            sessionManager.export(botManager.currentBot,()=>{
                console.log("Session exported !");
            });
        }
        catch(e){
            console.log("Can't export session ! c'est la merde on est dans le male !");
        }
        process.send({err});
    });*/
    
    process.on('message',(m)=>{
        console.log("********* Server request for session loading ! **********");
        sessionManager.load(username,function(result,sess){
            if(result){
                console.log("Loading succes !");
             //   this.bot.rescureSession(sess);
            }
            else{
                console.log("Can't load session ! dans le cul poto");
            }
        });

    });
    
    
    id=id_;
	bot = botManager;
	exports.register();
    processSocket = new webSocket("ws://localhost:8082/");
    processSocket.on("open",()=>{
       exports.send("connect-process") 
    });
	processSocket.on('message', (data)=>{
        console.log(data);
            let m = JSON.parse(data);
            exports.emit(m.call,m.data);
	});
}
exports.send = function(call,data){
	processSocket.send(JSON.stringify({call : call, data : data }));
}
exports.sendUI = function(call,data){
    processSocket.send(JSON.stringify({call : "ui-message",data : {call : call, data : data}}));
}
exports.register = function(){
	exports.on("load-accompt",(accompt)=>{
                Logger.redirectConsole(accompt.username);
		console.log("Server request connecting ...");
		bot.connect(accompt);
        exports.send("accompt-loaded",exports.getBotInfo());
	});
	exports.on("global-state-request",()=>{
		console.log("Server request for state ...");
		exports.send("state-update",exports.getBotInfo());
	});
    exports.on("trajet-load",(m)=>{
        console.log("[mainProcessFrame]Ui request for trajet loading ...");
        bot.currentBot.trajet.load(m.trajet);
        bot.currentBot.sync.process();
    });
    
    //-------fight---------
    exports.on("set-ia-type",(type)=>{
        bot.currentBot.data.userConfig.fight.type = type;
        bot.currentBot.data.saveUserConfig();
        console.log("[mainProcessFrame]Fight mode updated to "+type);
    });
    exports.on("spells-request",()=>{
        if(typeof bot.currentBot.data.fightManager.spellsData != "undefined"){
            exports.sendUI("spells-update",exports.getSpellsInfos());
            console.log("[mainProcessFrame]Spells sended to ui");
        }
        else{
            console.log("[mainProcessFrame]Waiting for spells ...");
            bot.currentBot.data.fightManager.on("spellsLoaded",check);
            function check(){
                bot.currentBot.data.fightManager.removeEventListener("spellsLoaded",check);
                exports.sendUI("spells-update",exports.getSpellsInfos());
                console.log("[mainProcessFrame]Spells sended to ui");
            }
        }
    });
    exports.on("update-fight-min-fighters",(minFighters)=>{
        bot.currentBot.data.userConfig.fight.minFighter = minFighters;
        bot.currentBot.data.saveUserConfig();
    });
    exports.on("update-fight-max-fighters",(maxFighters)=>{
        bot.currentBot.data.userConfig.fight.maxFighter = maxFighters;
        bot.currentBot.data.saveUserConfig();
    });
    exports.on("update-spells",(spells)=>{
        console.log("Spells pile updating ...");
        exports.exportSpellsInfos(spells);
    });
    
    //------inventory----
    exports.on("inventory-request",()=>{
        let toSend = exports.getInventoryInfos();
        console.log("Send inventory to ui ...");
        exports.sendUI("inventory-update",toSend);
    });
    exports.on("inventory-update",(m)=>{
        bot.currentBot.data.userConfig.inventory.sellList = []
        for(var i = 0;i<m.length;i++){
            var obj = m[i];
            if(obj.sellMode != 0){
                console.log(obj.name+" sell mode updated !");
                bot.currentBot.data.userConfig.inventory.sellList.push({ objectId : parseInt(obj.id), objectGID : obj.gid, mode : obj.sellMode });
            }
        }
        bot.currentBot.data.saveUserConfig();
    });
}

exports.getInventoryInfos = function(){
    var inventory = [];
    
    for(var i in bot.currentBot.data.inventoryManager.objects){
        try{
        base = bot.currentBot.data.inventoryManager.objects[i];
        var item = {
            id: i,
            gid: base.objectGID,
            name: base.static.nameId,
            weight: base.static.realWeight,
            sellMode: 0,
            quantity: base.quantity,
            level: base.static.level ? base.static.level : 0
        }
        item.imageUrl = "https://ankama.akamaized.net/games/dofus-tablette/assets/2.15.15/gfx/items/"+base.static.iconId+".png";
        
        for(var x = 0;x < bot.currentBot.data.userConfig.inventory.sellList.length;x++){
            var sell = bot.currentBot.data.userConfig.inventory.sellList.length;
            if(sell.id == item.id){
                sell.sellMode = sell.mode;
            }
        }
        inventory.push(item);
        }
        catch(e){
            console.log("Undefined item "+item.id);
        }
    }
    
    return inventory;
}

exports.exportSpellsInfos = function(spells){
    bot.currentBot.data.userConfig.fight.spells = [];
    for(var i = 0;i<spells.length;i++){
        var s = spells[i];
        if(s.inPile == true){
            console.log("spell found : "+s.name);
            bot.currentBot.data.userConfig.fight.spells.push({ id : s.id, index : s.index, type : s.type });
        }
    }
    bot.currentBot.data.saveUserConfig();
}

exports.getSpellsInfos = function(){
    var ret = [];
    
    for (var iData in bot.currentBot.data.fightManager.spells){
        var data = bot.currentBot.data.fightManager.spells[iData];
        var push = {
            id : iData,
            name : data.nameId,
            level : data.spellLevel+1,
            inPile : false
        }
        
        for(var iCustom in bot.currentBot.data.userConfig.fight.spells){
            var custom = bot.currentBot.data.userConfig.fight.spells[iCustom];
            
            if(custom.id == iData){
                push.inPile = true;
                push.index = custom.index;
                push.type = custom.type;
            }
        }
        
        ret.push(push);
    }
    
    console.log(JSON.stringify(ret));
    return ret;
}

exports.getBotInfo = function(){
    var infos = {
        state: bot.currentBot.data.state
    };
    infos.id=id;
    infos.accompt = bot.currentBot.data.accompt.username;
    if(typeof bot.currentBot.data.characterInfos != "undefined"){
        infos.characterInfos = bot.currentBot.data.characterInfos;
    }
    else{
        infos.characterInfos = { 
            name : "[Chargement ...]",
            class : "[Chargement ...]",
            level : "0"
        };
    }
    if(typeof bot.currentBot.data.actorsManager.userActorStats != "undefined"){
        infos.stats = bot.currentBot.data.actorsManager.userActorStats;
    }
    if(typeof bot.currentBot.data.userConfig != "undefined"){
        infos.config=bot.currentBot.data.userConfig;
    }
    else{
        infos.stats = {
            life : 0,
            maxLife : 1,
            energyPoints : 0,
            maxEnergyPoints : 1
        }
    }
    infos.inv = {
        kamas : bot.currentBot.data.inventoryManager.kamas,
        pods : bot.currentBot.data.inventoryManager.pods,
        maxPods : bot.currentBot.data.inventoryManager.maxPods,
    }
    
    return infos;
}