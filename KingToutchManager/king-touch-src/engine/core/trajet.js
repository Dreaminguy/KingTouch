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
	var self = this;
    if(this.bot.data.context != "ROLEPLAY" || typeof this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id] == "undefined"){
        console.log("**Trajet execution canceled !**");
        return;
    }
	if(this.hasTrajet === false){
		console.log("[Trajet]No trajet loaded !");
		return;
	}
	this.bot.logger.log("[Trajet]Execution map " + this.bot.data.mapManager.mapId +' .');
	if(self.bot.data.state == "OVERLOAD" && !this.bankMode){
			self.bankMode = true;
			console.log("[TRAJET]Execution du trajet banque .");
	}
	if(self.bankMode){
		if(!this.parseMove(this.hasActionOnMap(this.currentTrajet.trajet["bank"]))) {
			console.log("Le bot est full pods mais pas de trajet de banque sur la map " + this.bot.data.mapManager.mapId +" , arrêt du trajet .");
			this.stop();
		}
		return;
    }
	if(this.bot.data.context =="GHOST"){
		if(this.parsePhoenix(this.hasActionOnMap(this.currentTrajet["phoenix"]))){
			console.log("[Trajet]Execution du trajet vers le phoenix ...");
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
	else if(this.parseGather(this.hasActionOnMap(this.currentTrajet.trajet["recolte"]))){
		this.bot.logger.log("[Trajet]Execution de la récolte...");
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
exports.Trajet.prototype.parseGather = function(gather){
	if(gather=="undefined"){return false;}
	this.bot.gather.gatherFirstAvailableRessource((result)=>{
		if(result) {
			this.parseGather(gather);
		}
		else{
			console.log("Plus de ressources à récolter disponibles , on passe à la map suivante .");
			this.execMove(gather);
		}
	});
	return true;
}

exports.Trajet.prototype.parseMove = function(move){
	if(move=="undefined"){return false}
	this.execMove(move);
	return true;
}

exports.Trajet.prototype.execMove = function(action){
	var self = this;
	if(typeof(action.sun) != "undefined"){
		this.bot.player.move(action.sun);
		this.bot.logger.log("On va sur le soleil...");
		return;
	}
	else if(typeof action.interactive != "undefined" && typeof action.skill !="undefined"){
		self.bot.player.useInteractive(action.interactive,action.skill);
	}
	else if(typeof action.npc != "undefined"){
		self.bot.player.npcActionRequest(action.npc , action.replies , action.actionId);//gestion interne des inconnus .
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
		this.bot.logger.log("[Trajet]Changement de carte sur une cellule aléatoire .");
	}
	else{
		this.bot.logger.log("[Trajet]Action invalide ("+JSON.stringify(action)+") !");
	}
}
