const DEFAULT_MAPS_DATABASE_PATH = "/db/maps.nosql";

var dataBase = null;

exports.init = function(callBack,mapUri){
    exports.update(callBack);
}

exports.update = function(callBack){
    callBack();
}