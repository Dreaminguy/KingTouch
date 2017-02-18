var fs = require("fs");
var util = require('util');

exports.NetworkLogger = function(identificator){
    this.log_file = fs.createWriteStream(__dirname + '/../../logs/network/'+identificator+'.log', {flags : 'w'});
}

exports.NetworkLogger.prototype.log = function(str){
    this.log_file.write(util.inspect(str) + '\n');
}