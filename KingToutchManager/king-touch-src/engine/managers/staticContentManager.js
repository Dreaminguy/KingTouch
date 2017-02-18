 // Require
const WebRequest = require('request');
const PHOENIX_MAPS = {//todo il faut trouver le interactive corespondant et le element dans les gfx pour reprer le phoenix sans devoir le noter ici 
	84673546:{id:479466,skill:152192,cell:258},//astrub [2-12]
    80219143:{id:463535,skill:193341,cell:185}//incarnoob
}
const BANK_MAPS = {
     84674566:{"cell": 302, id: 465440, skill: 140242,inDoor: 83887104}//astrub
}
// Class
exports.sendWebRequestToDataUrl = function SendWebRequestToDataUrl(data, callback){
	WebRequest({ uri: "https://proxyconnection.touch.dofus.com/data/map?lang=fr&v=0.60.0", method: "POST", form: data }, (error, response, body) => { callback(JSON.parse(body)); })
}

exports.getSpellsInfos = function(ids, callback){
	exports.sendWebRequestToDataUrl({class: "Spells", ids}, (result) => { callback(result); });
}
exports.getSpellLevelsInfos = function(ids,id,callback){
	exports.sendWebRequestToDataUrl({class: "SpellLevels", ids}, (result) => { callback(id,result); });
}

exports.getItemsInfos = function(ids,callBack){
    exports.sendWebRequestToDataUrl({class: "Items", ids}, (result) => { callBack(result); });
}
exports.getBreedsInfos = function(ids,callBack){
    exports.sendWebRequestToDataUrl({class: "Breeds", ids}, (result) => { callBack(result); });
}
exports.getSubAreasInfos = function(callBack){
    exports.sendWebRequestToDataUrl({class: "SubAreas"}, (result) =>{ callBack(result); });
}
//return null if no phoenix on the map
exports.getPhoenixInfos = function(mapId){
	return PHOENIX_MAPS[mapId];
}
exports.getBankInfos = function(mapId){
    return BANK_MAPS[mapId];
}
exports.isBankIndoor = function(mapId){
    for(var i in BANK_MAPS){
        if(BANK_MAPS[i].inDoor == mapId){
            return true;
        }
    }
    return false;
}