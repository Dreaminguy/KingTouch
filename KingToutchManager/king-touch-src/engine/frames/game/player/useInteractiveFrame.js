var processKeyMovements = require("./movementFrame.js").processKeyMovement;
var eventWrapper = require("event-wrapper");
exports.processUseInteractive = function(bot,id,skill,keys,cb,waitForUseEnded){
    var self = this;
    var wrap = eventWrapper(bot.connection.dispatcher,function(result){
        cb(result);
    });
    wrap("InteractiveUseErrorMessage",function(m){
        console.trace("[useInteractiveFrame]InteractiveUseErrorMessage");
        wrap.done(false);
    });
    wrap("InteractiveUsedMessage",function(m){
        if(m.elemId == id && typeof waitForUseEnded == "undefined"){
            wrap.done(true);
        }
    });
    wrap("InteractiveUseEndedMessage",function(m){
        if(m.elemId == id){
            wrap.done(true);
        }
    });
    console.log("Exectution du trajet vers l'interactive .")
    processKeyMovements(bot,keys,function(result){
        if(result){
            console.log("Utlisiation de l'interactive (id : " + id + ',skill : ' + skill +')' );
            bot.connection.sendMessage("InteractiveUseRequestMessage",{elemId: id, skillInstanceUid: skill});
        }
        else{
            console.log("Mouvement vers l'interactive échoué .");
            wrap.done(false);
        }
    })
}