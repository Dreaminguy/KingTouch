var processDelay = require("./../managers/delayManager.js").processDelay;
var staticContent = require("./../managers/staticContentManager.js");
exports.Trajet = function(bot){
	this.currentTrajet;
	this.regenMode = false;
	this.bankMode = false;
	this.bankSteep = 0;
	this.fightStarting=false;
	this.trajetRunning = false;
	this.lastChangMapCell = 0;
	this.hasTrajet=false;
	this.bot=bot;
	var self=this;
}
exports.Trajet.prototype.load = function(trajet){
	this.currentTrajet = trajet
	this.hasTrajet=true;
	this.trajetRunning=true;
}
exports.Trajet.prototype.stop = function(){
	trajetRunning=false;
}
exports.Trajet.prototype.start = function(){
	trajetRunning=true;
	this.trajetExecute();
}
exports.Trajet.prototype.startPhoenix = function(){
	this.trajetRunning=false;
}
exports.Trajet.prototype.trajetExecute = function(){

    if(this.bot.data.context != "ROLEPLAY" || typeof this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id] == "undefined"){
        console.log("**Trajet execution canceled !**");
        return;
    }
	if(this.hasTrajet === false){
		console.log("[Trajet]No trajet loaded !");
		return;
	}
	this.bot.logger.log("[Trajt]Execution ...");
	if(this.bot.data.context =="GHOST"){
		if(this.parsePhoenix(this.hasActionOnMap(this.currentTrajet["phoenix"]))){
			console.log("[Trajt]Execution du trajet vers le phoenix ...");
		}
		else{
			console.log("[Trajet]Aucun trajet vers le phoenix !");//todo worldpath <3
		}
	}
	else if(this.parseMove(this.hasActionOnMap(this.currentTrajet.trajet["moves"]))){
		this.bot.logger.log("[Trajet]Execution du mouvement ...");
	}
	else if(this.parseFight(this.hasActionOnMap(this.currentTrajet.trajet["fights"]))){
		this.bot.logger.log("[Trajet]Execution du fight ...")
	}
	else{
		this.bot.logger.log("[Trajet]Rien a faire sur cette map ("+this.bot.data.mapManager.mapId+") !");
	}
}
exports.Trajet.prototype.hasActionOnMap = function(actions){
	try{
		if(actions.length<=0){return "undefined";}
	}
	catch(e){
		return "undefined";
	}
	for(var i = 0;i<actions.length;i++){
		if(actions[i].map == this.bot.data.mapManager.mapId){
			return actions[i];
		}
	}
	return "undefined";
}
exports.Trajet.prototype.parsePhoenix = function(action){
	var phoenix = staticContent.getPhoenixInfos(this.bot.data.mapManager.mapId)
	if(typeof phoenix != "undefined"){
		processDelay("frist_interactive_use",() => {
			this.bot.player.useInteractive(phoenix.id,phoenix.skill,phoenix.cell,() =>{
				processDelay("frist_interactive_use",() => {
					console.log("[Trajet]On reprend le trajet !");
					this.bot.context = "ROLEPLAY";
					this.trajetExecute();
				});
			});
		});
		return true;
	}
	else if(typeof action != "undefined"){
		return this.execMove(action);
	}
	return false;
}
exports.Trajet.prototype.parseFight = function(fight){
	var self = this;
	if(fight=="undefined"){return false;}
	self.bot.player.attackBestAvaibleFighter(function(){
		self.bot.logger.log("[Trajet]Aucun combat on change de carte...")
		self.execMove(fight);
	});
	return true;
}

exports.Trajet.prototype.parseMove = function(move){
	if(move=="undefined"){return false}
	this.execMove(move);
	return true;
}

exports.Trajet.prototype.execMove = function(action){
	if(typeof(action.sun) != "undefined"){
		this.bot.player.move(action.sun);
		this.bot.logger.log("On va sur le soleil...");
		return;
	}
	else if(typeof action.interactive != "undefined" && typeof action.skill !="undefined"){
		self.bot.player.useInteractive(action.interactive,action.skill);
	}
	else if (typeof action.cell !="undefined" && action.dir == "undefined"){
		this.bot.player.gotoNeighbourMap(action.cell);
		console.log("[Trajet]Changement de carte, cellid pre-definis");
	}
	else if(typeof action.cell !="undefined"){
		this.bot.player.gotoNeighbourMap(action.cell,action.flag);
	}
	else if(typeof action.dir != "undefined"){
		this.bot.player.gotoNeighbourMap(-1,action.dir);
		this.bot.logger.log("[Trajet]Changement de carte, premiere cellid disponble");
	}
	else{
		this.bot.logger.log("[Trajet]Action invalide ("+JSON.stringify(action)+") !");
	}
}