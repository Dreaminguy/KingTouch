const ACCOMPTS_FILE = "./accompts.json";
var jsonfile = require('jsonfile');


exports.accompts = null;

exports.getAccompts = function(){
    var accompts = [];
    for(var i in exports.accompts){
        accompts.push(exports.accompts[i]);
    }
    return accompts;
}
exports.addAccompt = function(accompt){
    console.log(accompt);
    exports.accompts[accompt.username] = accompt;
    exports.saveFile();
}
exports.loadFile = function(){
    jsonfile.readFile(ACCOMPTS_FILE, (err, obj) => {
		if(err == null){
			exports.accompts = obj;
            console.log(JSON.stringify(obj));
		}
		else{
            console.log("No accompt file found !");
			exports.accompts = {};
            exports.saveFile();
		}
	});
}
exports.saveFile = function(){
    jsonfile.writeFile(ACCOMPTS_FILE, exports.accompts,  (err) => {

	});
}

exports.loadFile();