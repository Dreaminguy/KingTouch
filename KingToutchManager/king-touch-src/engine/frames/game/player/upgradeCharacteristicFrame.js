var eventWrapper = require("event-wrapper");
exports.processUprgradeCharacteristic = function(bot,characteristic,count,callBack){
    var wrap = eventWrapper(bot.connection.dispatcher,(success)=>{
        callBack(success);
    });
    var result = false;
    wrap("CharacterStatsListMessage",()=>{
        result = true;
        console.log("[UpgradeChraracteristicFrame]Uprgrade success !")
    });
    wrap("CharacterStatsListMessage",()=>{
        result = true;
        console.log("[UpgradeChraracteristicFrame]Uprgrade success !")
    });
    wrap("BasicNoOperationMessage",()=>{
        if(result == false){
            console.log("upgrading fail !");
        }
        wrap.done(result);
    });
    console.log("Send upgrading request ...");
    bot.connection.sendMessage("StatsUpgradeRequestMessage",{statId: characteristic, boostPoint: count});
}