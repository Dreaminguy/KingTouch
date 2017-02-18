var EventEmitter = require("events").EventEmitter;
var cp = require('child_process');

exports.ProcessFrame = function(process,accompt,connection,reloadingFunction,rescure){
    this.connection = connection;
    this.loaded = false;
	this.dispatcher = new EventEmitter();
	this.process=process;
    this.accompt=accompt;
    
    this.process.on('message',(error)=>{
        console.trace(error);
        console.log("********** Child process handle error, reloading ("+accompt.username+") ! **********");
        reloadingFunction(accompt);
    });
    
    if(rescure){
        console.log("*********** trying to rescure client ... **********");
        this.process.send(accompt.username);//send rescure request to created child process
    }
}


exports.ProcessFrame.prototype.loadSocket = function(processConnection){
    this.processConnection = processConnection;
    this.loaded = true;
    this.processConnection.on("message",(data)=>{
        m = JSON.parse(data);
       if(typeof(m.call) != "undefined"){
           this.dispatcher.emit(m.call,m.data);
       } 
       else{ 
            console.log("Undefined ui message : "+m);
       }
    });
	this.send("load-accompt",this.accompt);
    this.dispatcher.on("accompt-loaded",(m)=>{
        m.accompt = this.accompt.username;
        this.connection.send("load-client",m);
    });

}

exports.ProcessFrame.prototype.send = function(call,data){
    if(this.loaded === true){
	   this.processConnection.send(JSON.stringify({ call : call, data : data }));
    }
    else{
        console.log("Process not connected !");
        
    }
}


exports.ProcessFrame.prototype.kill = function(){
    this.process.kill();
}