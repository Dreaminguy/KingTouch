var EventEmitter = require("events").EventEmitter;
var fs = require("fs");
var util = require('util');

exports.Logger = function(contextName){
	this.dispatcher = new EventEmitter();
	this.context=contextName;
}
exports.Logger.prototype.log=function(log,level){
	if(typeof level == "undefined"){
		level = "info";
	}
	var d = new Date();
	console.log("["+this.context+":"+level+"]"+log);
	this.dispatcher.emit("log",{ log:log,level:level,context:this.context});
}

exports.redirectConsole = function(identificator){
    let identificatorBase = identificator;
    identificator = Date.now() + identificator;
    var fs = require('fs');
    var log_file = fs.createWriteStream(__dirname + '/../../logs/'+identificator+'.log', {flags : 'w'});
    var log_stdout = process.stdout;

    console.log = function(d) { 
      log_file.write(util.format(d) + '\n');
      log_stdout.write(util.format("["+identificatorBase+"]"+d) + '\n');
    };
}
