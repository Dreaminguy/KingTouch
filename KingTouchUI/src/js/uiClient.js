const UI_SERVER = "ws://localhost:5555/";
var wsClient; 
var selectedClient;
function setClient(client){
    console.log("client selected ! "+JSON.stringify(client));
    selectedClient = client;
		window.dispatchEvent(new CustomEvent(
			"selected-client-changed",
			{
				detail: client,
				bubbles: true,
				cancelable: false
			}
		));}
function connectUI()
{
	wsClient = new WebSocket(UI_SERVER,'echo-protocol');
	wsClient.onopen = function()
	{
		console.log("UI connection opened !");
		sendUI("globalUpdateRequest",{});
	};

	wsClient.onmessage = function (data) 
	{ 
		var m = JSON.parse(data.data);
		if(typeof m.call == "undefined"){
			console.log("Undefined ui message received !");
		}
		window.dispatchEvent(new CustomEvent(
			m.call,
			{
				detail: m.data,
				bubbles: true,
				cancelable: false
			}
		));
	};
	wsClient.onerror = reconnect;
	wsClient.onclose = function()
	{ 
		console.log("Connection is closed..."); 
        alert("Disconnected from server !");
		reconnect();
	};
}

function sendUI(callName,data){
	wsClient.send(JSON.stringify({call: callName,data:data}));

}
function wrapCurrentBot(callName,callBack){
    var i = "accompt-"+selectedClient.accompt;
    window.addEventListener(i,check);
                            
    function check(e){
        m=e.detail;
        if(m.call == callName){
            window.removeEventListener(i,check);
            callBack(m.data);
        }
    }
}
function sendToBot(callName,data){
    if(typeof selectedClient == "undefined"){return;}
    console.log("send "+callName+" to "+selectedClient.accompt)
    sendUI("accompt-"+selectedClient.accompt,{call:callName,data:data});
}
function emitUI(callName,data){
	window.dispatchEvent(new CustomEvent(
			callName,
			{
				detail: data,
				bubbles: true,
				cancelable: false
			}
		));
}

function reconnect(){
	
}