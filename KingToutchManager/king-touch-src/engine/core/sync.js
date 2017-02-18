var processDelay = require("./../managers/delayManager.js").processDelay;
var staticContent = require("./../managers/staticContentManager.js");
var eventWrapper = require("event-wrapper");

exports.Sync = function(bot){
    this.bot=bot;
    this.bot.connection.dispatcher.on("GameContextCreateMessage",function(m){
		if(bot.data.context === "GHOST"){
			console.log("[Sync]Cant load ROLEPLAY context when player is ghost");//todo il y a une incoerence dans tout sa il faudrais que lorsque le joueur est un fantome on set state="GHOST" et context="ROLEPLAY"
		}
        else if(m.context == 1){
            bot.data.context = "ROLEPLAY";
        }
        else if(m.context == 2){
            bot.data.context="FIGHT";
            bot.data.state="FIGHTING";
        }
    });
      this.bot.connection.dispatcher.on("ChatServerMessage", (msg) => {
     	if(msg.content == "debug"){
 	    	console.log("Debug command received .");
 	    	try{
 	    		bot.player.npcActionRequest(0,[],0,()=>{});
 	    	}
 	    	catch(e){console.log(e);}
     	}
     });
    this.bot.connection.dispatcher.on("GameFightStartingMessage", () => {
        bot.data.state = "FIGHTING";
        bot.data.context="FIGHT";
    });
    this.bot.connection.dispatcher.on("MapComplementaryInformationsDataMessage",(m) => {
		if( typeof m.actors[0] == "undefined"){
			bot.data.context="FIGHT";
			bot.data.state="FIGHTING";
			console.log("[Sync]Reconnection en combat presumer le 226 est vide !");
		}
        setTimeout(()=>{ this.process(); },1000);
    });
    this.bot.connection.dispatcher.on("GameRolePlayPlayerLifeStatusMessage",(m)=>{
		if(m.state == 1){
			bot.data.context="DEAD";
			bot.logger.log("[Player]Le bot est six pieds sous terre ...");
			processDelay("free_soul",() => {
				bot.connection.sendMessage("GameRolePlayFreeSoulRequestMessage");
				bot.connection.sendMessage("LeaveDialogRequestMessage");
			});
		}
		else if (m.state == 2){
			bot.data.context="GHOST";
			console.log("On est un fantome !");
		}
	});
}

exports.Sync.prototype.process = function(){
	console.log("[Sync]Processing ...");
	//check map loading
	if(typeof this.bot.data.mapManager.map === null){
		console.log("[Sync]En attente de la map ...");
		var wrap = eventWrapper(this.bot.data.mapManager.dispatcher,(r)=>{ 			
			console.log("[Sync]La map est charger !");
			this.process() 
		});
		wrap("loaded",()=>{
			wrap.done();
		});
		return;
	}
	else{
		console.log("[Sync]Ready to process !");
	}
	//get a phoenix or play ghost trajet
    if( this.bot.data.context === "GHOST"){
		console.log("[Sync]On est un fantome ! ("+this.bot.data.mapManager.mapId+")");
		var phoenix = staticContent.getPhoenixInfos(this.bot.data.mapManager.mapId);
		if(typeof phoenix != "undefined"){
			console.log("[Sync]On a trouver un phoenix sur la cell "+phoenix.cell);
			this.bot.player.useInteractive(phoenix.id,phoenix.skill,phoenix.cell,()=>{
				console.log("[Sync]On reviens a la vie !");
				this.bot.data.context="ROLEPLAY";
					this.bot.trajet.trajetExecute();
			},false);
		}
		else{
			console.log("[Sync]Pas de phoenix on execute le trajet ...");
			this.bot.trajet.trajetExecute();
		}
	}
	//--
	//normale execution and regen
	//--
	else {
        
        if(this.checkTasks(()=>{this.process()}) === true){
           console.log("[Sync]On attends l'execution des taches ...");
           return; 
        }
        
        /*if(this.bot.data.inventoryManager.checkOverload() === true){
            console.log("[Sync]Plus de pods !");
            if(this.bot.data.userConfig.inventory.destroyObjectsOnOverload === true){
                console.log("[Sync]On detruit des objets pour continuer !");
                this.bot.data.inventoryManager.destroyForOverload(()=>{
                    this.process();
                });
            }
            else{
                console.log("[Sync]Fin d'execution");
            }
            return;
        }*/
        
		console.log("[Sync]Trajet ready ...");
		this.bot.data.context="ROLEPLAY";
		if(!this.bot.data.inventoryManager.checkOverload()) this.bot.data.state = "READY";
		processDelay("trajet_map_loaded",() => {
			if(this.bot.player.checkLife()){
				this.bot.trajet.trajetExecute();
			}
			else if(this.bot.data.userConfig.regen.useObject == true){
				console.log("[Sync]Regen par objet...");
				if(this.bot.data.inventoryManager.processRegen(()=>{
					console.log("[Sync]Regen par objet terminer !");
					this.bot.trajet.trajetExecute();
				}) == false){
					console.log("[Sync]Impossible de faire la regen par objet, regen normale ...");
					this.bot.player.processRegen(this.bot.data.actorsManager.userActorStats.maxLifePoints-this.bot.data.actorsManager.userActorStats.lifePoints,()=>{
						console.log("[Sync]Regen terminer !");
						this.bot.trajet.trajetExecute();
					});
				}
			}
			else{
				this.bot.player.processRegen(this.bot.data.actorsManager.userActorStats.maxLifePoints-this.bot.data.actorsManager.userActorStats.lifePoints,()=>{
					console.log("[Sync]Regen terminer !");
					this.bot.trajet.trajetExecute();
				});
			}
		});
	}
}

exports.Sync.prototype.checkTasks = function(callBack){
    if(this.bot.data.context != "ROLEPLAY"){
        console.log("[Sync]Impossible d'executer les taches, on est pas en roleplay !")
    }
    if(this.bot.player.canUpgradeCharacteristic(this.bot.data.userConfig.tasks.selectedCharacteristic)){
        console.log("[Sync]Upgrading stats ...");
        
        this.bot.player.upgradeCharacteristic(this.bot.data.userConfig.tasks.selectedCharacteristic,()=>{
            console.log("[Sync]Task done !");
            callBack();
        });
        return true;
    }
    
    if(this.bot.data.exchangeManager.canSellInventory()){
        console.log("[Sync]On commence la vente ...");
        this.bot.data.exchangeManager.sellInventory(callBack);
        return true;
    }
    
    return false;
}