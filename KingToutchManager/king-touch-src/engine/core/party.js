var eventEmitter = require("events").EventEmitter;

exports.Party = function(bot){
    this.partyId = false;
    this.isFollower = false;
    this.isGuru = false;
    this.bot = bot;
    this.dispatcher = new eventEmitter();
}

exports.Party.prototype.setAsFollower = function(partyId){
    this.isFollower = true;
    this.isGuru = false;
    this.partyId = partyId;
}

exports.Party.prototype.setAsGuru = function(partyId){
    this.isGuru = true;
    this.isFollower = false;
    this.partyId = partyId;
}
exports.Party.prototype.requestForFollowers = function(callBack){
    
}
exports.Party.prototype.send(call,data){
    this.dispatcher.emit(call,data);
}