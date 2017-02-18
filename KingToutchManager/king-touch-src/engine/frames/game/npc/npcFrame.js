var EventWrapper = require("event-wrapper");
/*
	*Bon là il est très claire que j'aurai pû mettre le tout dans une seule fonction , mais 
	je me suis dit que si jamais on aura besoin de parler au pnj sans envoyer de réponse (on
	 sait jamais mdr) , donc vaut mieux diviser , et c'est plus propre aussi .
*/
exports.processTalkToNpc = function(bot , npcId , actionId , cb) {
    var wrap = EventWrapper(bot.connection.dispatcher,function(error){
    });
    /**
		 * @event module:protocol/roleplay.client_NpcDialogQuestionMessage
		 *
		 * @param {object} msg - msg
		 * @param {number}    msg.messageId
		 * @param {Array}     msg.dialogParams
		 * @param {number[]}  msg.visibleReplies
		 */
    wrap("NpcDialogQuestionMessage",function(msg){
        cb(msg);//On a besoin des données du message dans le callBack pour gérer les réponses
        wrap.done();
    });
    console.log("On parle à le npc {npcId : " + npcId +',actionId : ' + actionId +'}');
    bot.connection.sendMessage("NpcGenericActionRequestMessage",{npcActionId : actionId , npcId : npcId , npcMapId : bot.data.mapManager.mapId});
};
//cette fonction marche correctement ; je peux mourir en paix maintenant . 
exports.processAnswers = function (bot , answers , cb) {//answers must be passed in ordre .
    var wrap = EventWrapper(bot.connection.dispatcher,function(error){
	});
	wrap("NpcDialogQuestionMessage" , (msg)=>{
		answers.shift();
		if(msg.visibleReplies.length > 0){
			if(answers.length > 0 ) this.processAnswers(bot , answers , cb);
			else this.processAnswers(bot , [msg.visibleReplies[0]] , cb) 
		}
		else{
			console.log("Fin du dialogue");
			cb();
		} //fin du dialogue ; il est pas forcément necessaire de recevoir le LeaveDialogMessage pour dire que le dialogue est fini .
		wrap.done();
	});
	wrap("LeaveDialogMessage" , ()=>{//Fin du dialogue 
		console.log("Fin du dialogue");
		cb(); 
		wrap.done();
	});
	if(answers.length == 0){
		wrap.done();
		return console.log("[NpcFrame] le tableau des reponses est vide !"); //Normalement ceci ne doit jamais arrivé mais pour éviter 
	}																		//d'envoyer de la merde au serveur je fais cette vérification
	console.log("Envoie de la reponse : " + answers[0]);
    bot.connection.sendMessage("NpcDialogReplyMessage",{replyId : answers[0]});
};

exports.processLeaveDialog = function (bot) {
    bot.connection.sendMessage("LeaveDialogRequestMessage");
};
