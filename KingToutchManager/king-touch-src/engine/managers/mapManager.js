const CHANGE_MAP_MASK_RIGHT  =  1 |  2 | 128;
const CHANGE_MAP_MASK_BOTTOM =  2 |  4 | 8;
const CHANGE_MAP_MASK_LEFT   =  8 | 16 | 32;
const CHANGE_MAP_MASK_TOP    = 32 | 64 | 128;
var getMapPointFromCellId = require("./../core/utils/pathfinding.js").getMapPoint;
var EventEmitter = require("events").EventEmitter;
var request = require("request");

exports.MapManager = function(bot){
	var self=this;
	this.bot = bot;
	this.dispatcher = new EventEmitter();
	this.map = null;
	this.mapId = null;
	this.hasMap = false;
	this.interactives = {};
	this.statedes = {};

	this.bot.connection.dispatcher.on("CurrentMapMessage",function(m){
		self.mapId=m.mapId;
		var mapUrl = global.config.assetsUrl+"/maps/"+m.mapId+".json";
		doRequest(mapUrl,m,(m,id)=>{self.update(m,id)});
		
		function doRequest(uri,m,u){
			request({uri: uri,method: "GET"}, function(error, response, body) {
				if(typeof body != "undefined"){
					var updatedMap = JSON.parse(body);
					u(updatedMap,m.mapId);
				}
				else{
					doRequest(uri,m,u);
				}
			});	
		}
	});
	this.bot.connection.dispatcher.on("InteractiveMapUpdateMessage",(m)=>{
		this.updateInteractiveElements(m.interactiveElements);
	});

	this.bot.connection.dispatcher.on("InteractiveElementUpdatedMessage",(m)=>{
		this.updateInteractiveElements([m.interactiveElement]);
	});

	this.bot.connection.dispatcher.on("StatedMapUpdateMessage",(m)=>{
		this.updateStatedElements(m.statedElements);
	});

	this.bot.connection.dispatcher.on("StatedElementUpdatedMessage",(m)=>{
		this.updateStatedElements([m.statedElement]);
	});
	this.bot.connection.dispatcher.on("MapComplementaryInformationsDataMessage",(m)=>{
		this.interactives = {};
		this.statedes = {};
		for(var i =0;i< m.interactiveElements.length;i++){
			this.interactives[m.interactiveElements[i].elementId] = m.interactiveElements[i];
		}
		for(var i=0;i< m.statedElements.length;i++){
			this.statedes[m.statedElements[i].elementId] = m.statedElements[i];
		}
	});

};
exports.MapManager.prototype.update = function(map,mapId){
	this.map=map;
	this.mapId=mapId;
	this.hasMap = true;
	this.path
	this.dispatcher.emit("loaded",map);
};
exports.MapManager.prototype.isWalkable = function (cellId, isFightMode) {
	var mask = isFightMode ? 5 : 1;
	return (this.map.cells[cellId].l & mask) === 1;
};
exports.MapManager.prototype.getChangeMapFlag = function (cellId) {
	var mapChangeData = this.map.cells[cellId].c || 0;
	if (mapChangeData === 0) { return {}; }
	var flags = {
		left:   mapChangeData & CHANGE_MAP_MASK_LEFT   && (cellId % 14 === 0),
		right:  mapChangeData & CHANGE_MAP_MASK_RIGHT  && (cellId % 14 === 13),
		top:    mapChangeData & CHANGE_MAP_MASK_TOP    && (cellId < 28),
		bottom: mapChangeData & CHANGE_MAP_MASK_BOTTOM && (cellId > 531)
	};
	if (flags.left)   { return 'left';   } else
	if (flags.right)  { return 'right';  } else
	if (flags.top)    { return 'top';    } else
	if (flags.bottom) { return 'bottom'; }
	return null;
};
exports.MapManager.prototype.getNeighbourId = function(flag){
	if (flag == "top"){
		return this.map.topNeighbourId;
	}
	else if(flag == "left"){
		return this.map.leftNeighbourId;
	}
	else if(flag =="right"){
		return this.map.rightNeighbourId;
	}
	else if(flag =="bottom"){
		return this.map.bottomNeighbourId;
	}
}
exports.MapManager.prototype.getDistance = function(source, target) {
	source = getMapPointFromCellId(source);
	target = getMapPointFromCellId(target);
	return Math.abs(source.x - target.x) + Math.abs(source.y - target.y);
}

exports.MapManager.prototype.checkChangeMapCell = function(cellId,direction){//todo j´ais remarquer que sur le client offi certaine change map cell ne fonctionnais pas il faudrais ajouter une blacklist comme sur le mitm pour etre 100%sur
	if (cellId >= 0 && cellId <= 559 && cellId != 13){//si la cellid est dansle coin a droite alors 1/2 le change map flag est faux donc on oublie 13 ok
		return (this.getChangeMapFlag(cellId) == direction && this.isWalkable(cellId));
	}
	else{
		return false;
	}
}
exports.MapManager.prototype.getRandomCellId = function(direction,source,wantRandom){
	source =this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id].disposition.cellId;
	occupiedCells = this.bot.data.actorsManager.getOccupiedCells();
	if(wantRandom)
	{
		var selected;
		var minDist=0;
		for(var i = 0; i<559;i++){
			if(this.checkChangeMapCell(i,direction) && i != source && !occupiedCells[i])
			{
				if(minDist==0 && this.getDistance(i,source) > 1){
					minDist=this.getDistance(source,i);
					selected=i;
				}
				else{
					var newDist=this.getDistance(source,i);
					if(newDist<minDist && this.getDistance(i,source) > 1){
						minDist=newDist;
						selected=i;
					}
				}
			}
		}
	
		return selected;
	}
	else
	{
		var possibleCells =[];//todo à voir
	        for (var j = 0; j < 559; j++) {
	            if (this.checkChangeMapCell(j, direction) && j != source && !occupiedCells[j]) {
	            	possibleCells.push(j);
				}
			}
		function randomIntFromInterval(min,max)
	    {
	        return Math.floor(Math.random()*(max-min+1)+min);
	    }
	    return possibleCells[randomIntFromInterval(0,possibleCells.length - 1)];
	}
}
/**
  * @descritption gives the interactives with the desired id(static id not dynamic one)
  * @param id - the id of the desired interactives
  * @return list elements{interactives , stated} - Important : the list is indexed with the dynamic id
*/
exports.MapManager.prototype.getInteractives = function(id){
	interactives = {};
	for (var i in this.interactives){//le i est unique par element donc c'est le lien stated/interactive 
		if (this.interactives[i].elementTypeId == id){
			interactives[i] = {interactive : this.interactives[i] , stated : this.statedes[i]}
		}
	}
	return interactives;
}
/** Update interactive elements data
	 *
	 * @param {Object[]} list - list of modified interactives elements
	 *        {number}   list[*].elementId      - interactive element id
	 *        {number}   list[*].elementTypeId  - interactive element type (-1 if none)
	 *        {Object[]} list[*].enabledSkills  - visible skills list
	 *        {Object[]} list[*].disabledSkills - visible but inactive skills list
	 */
exports.MapManager.prototype.updateInteractiveElements = function (list) {
		for (var i = 0; i < list.length; i++) {
			var updatedElement = list[i];
			if (!this.interactives[updatedElement.elementId]) {
				console.warn('Interactive element id ' + updatedElement.elementId + ' does not exist.');
				continue;
			}
			this.interactives[updatedElement.elementId].disabledSkills = updatedElement.disabledSkills;
			this.interactives[updatedElement.elementId].enabledSkills  = updatedElement.enabledSkills;
		}
	};
/** Update stated element states
 *
 * @param {Object[]} statedElements - updated stated element
 *        {number} statedElements[*].elementId     - element id
 *        {number} statedElements[*].elementCellId - element position
 *        {number} statedElements[*].elementState  - element state
 */
exports.MapManager.prototype.updateStatedElements = function (statedElementsData) {
	for (var i = 0, len = statedElementsData.length; i < len; i++) {
		var elemData = statedElementsData[i];
		if (!this.statedes[elemData.elementId]) {
			console.warn('Identified element ' + elemData.elementId + ' not found.');
			continue;
		}
		this.statedes[elemData.elementId].elementCellId = elemData.elementCellId;
		this.statedes[elemData.elementId].elementState = elemData.elementState;

	}
};