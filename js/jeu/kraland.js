var game;
var delimiters = true;

function init() {

	game=new Game(30);
	game.init();
	game.addToScore(500);
	game.addToPointsPerClick(1);

	game.addSet("MULES");
	game.sets.MULES.addEntity("PC du CDI", m1Options);
	game.sets.MULES.addEntity("Cousin du bled",m2Options);
	game.sets.MULES.addEntity("LAN de geeks", m3Options);
	//game.sets.MULES.addEntity("BotNet", m4Options);
	//game.sets.MULES.addEntity("Pirates Tinois", m5Options);
	
	mules_list=game.sets.MULES.getSet();//obtain the set of houses
	for (i in mules_list) 
	{	
		$("#available_mules").append("<div class='set-element'><strong class='titre'>"+mules_list[i].getName()+"</strong><p class='description'>"+mules_list[i].attributes.description+"</p><p class='prix'>Prix: <strong id='"+mules_list[i].attributes.type+"'>"+mules_list[i].attributes.cost+" FK</strong></span><button onclick=\"buyMule('"+i+"')\">Acheter</button></div>");
	}	

	game.addSet("PIOCHES");
	game.sets.PIOCHES.addEntity("Bois", p1Options);
	game.sets.PIOCHES.addEntity("Pierre",p2Options);
	game.sets.PIOCHES.addEntity("Metal", p3Options);
	game.sets.PIOCHES.addEntity("Titane", p4Options);
	
	pioches_list=game.sets.PIOCHES.getSet();//obtain the set of houses
	for (i in pioches_list) 
	{	
		$("#available_pioches").append("<div class='set-element' id='div"+pioches_list[i].attributes.type+"'><strong class='titre'>"+pioches_list[i].getName()+"</strong><p class='description'>"+pioches_list[i].attributes.description+"</p><p class='prix'>Prix: <strong id='"+pioches_list[i].attributes.type+"'>"+pioches_list[i].attributes.cost+" FK</strong><br><button onclick=\"buyPioche('"+i+"')\">Acheter</button></p></div>");
	}

	game.addSet("REGEN");
	game.sets.REGEN.addEntity("Dormir", r1Options);
	game.sets.REGEN.addEntity("Red Boule", r2Options);
	game.sets.REGEN.addEntity("Pastille du Bonheur", r3Options);
	game.sets.REGEN.addEntity("Sommeil de Québécois", r4Options);
	
	regen_list=game.sets.REGEN.getSet();//obtain the set of houses
	for (i in regen_list) 
	{	
		$("#available_regen").append("<div class='set-element'><strong class='titre'>"+regen_list[i].getName()+"</strong><p class='description'>"+regen_list[i].attributes.description+"</p><p class='prix'>Prix: <strong id='"+regen_list[i].attributes.type+"'>"+regen_list[i].attributes.cost+" FK</strong><br><button onclick=\"buyRegen('"+i+"')\">Acheter</button></p></div>");
	}	

	game.addSet("FONCTIONS");
	game.sets.FONCTIONS.addEntity("Citoyen", f1Options);
	game.sets.FONCTIONS.addEntity("Juge", f2Options);
	game.sets.FONCTIONS.addEntity("Bourgmestre", f3Options);
	game.sets.FONCTIONS.addEntity("Intendant", f4Options);
	game.sets.FONCTIONS.addEntity("Gouverneur", f5Options);
	game.sets.FONCTIONS.addEntity("Inspecteur", f6Options);
	game.sets.FONCTIONS.addEntity("Minfo", f7Options);
	game.sets.FONCTIONS.addEntity("Ministre des Affaires Etrangères", f8Options);
	game.sets.FONCTIONS.addEntity("Premier Ministre", f9Options);
	game.sets.FONCTIONS.addEntity("PREMIER ELU §§", f10Options);

	ce_list=game.sets.FONCTIONS.getSet();

	for(i in ce_list) {
		$("#available_usurping .menu_ordres").append("<span class=\"loadOrder\" data-ordre=\""+ce_list[i].attributes.className+"\">"+ce_list[i].attributes.type+" - </span>");
		$("#available_usurping").append("<div class=\"od "+ce_list[i].attributes.className+"\"><div class=\"op\"> <span class=\"oh\">[?]</span> <h4>Usurper un "+ce_list[i].attributes.type+"</h4> <div class=\"mini\">"+ce_list[i].attributes.description+"</div> <p class=\"os\"><button class='ordreBtn' onclick=\"usurping('"+i+"')\">Ok!</button></p> </div> <div class=\"of\"> Coût: "+ce_list[i].attributes.cost+" FK | Fatigue: "+ce_list[i].attributes.costPDV+" PdV | "+ce_list[i].attributes.txtChance+" "+(game.getPP()/10+ce_list[i].attributes.chance)+"%</div> </div>");
	}

/*
	game.addSet("CHANCE");
	game.sets.CHANCE.addEntity("Bakchich au staff", fc1Options);
	
	chance_list=game.sets.CHANCE.getSet();//obtain the set of houses
	for (i in chance_list) 
	{	
		$("#available_fc").append("<div class='fc'><strong>"+chance_list[i].getName()+"</strong><br>Prix: <strong id='bakchich'>"+chance_list[i].attributes.cost+" FK</strong><br><button onclick=\"buyFacteurChance('"+i+"')\">Acheter</button></div>");
	}
*/
	game.addSet("ORDRES");
	game.sets.ORDRES.addEntity("Auto-Soutien", o1Options);
	game.sets.ORDRES.addEntity("Consommer un repas", o2Options);
	game.sets.ORDRES.addEntity("Augmenter PdV", o3Options);

	ordres_list=game.sets.ORDRES.getSet();

	for(i in ordres_list) {
		$("#available_ordres .menu_ordres").append("<span class=\"loadOrder\" data-ordre=\""+ordres_list[i].attributes.className+"\">"+ordres_list[i].getName()+"</span> - ");
		$("#available_ordres").append("<div class=\"od "+ordres_list[i].attributes.className+"\"><div class=\"op\"> <span class=\"oh\">[?]</span> <h4>"+ordres_list[i].getName()+"</h4> <div class=\"mini\">"+ordres_list[i].attributes.description+"</div> <p class=\"os\"><button class='ordreBtn' onclick=\""+ordres_list[i].attributes.fnName+"()\">Ok!</button></p> </div> <div class=\"of\"> Coût: <span class='"+ordres_list[i].attributes.type+"'>"+ordres_list[i].attributes.cost+"</span> FK | Fatigue: "+ordres_list[i].attributes.costPDV+" PdV | "+ordres_list[i].attributes.txtChance+" "+(game.getPP()/10+ordres_list[i].attributes.chance)+"%</div> </div>");
	}
	
	play();
};


function play() {
	setInterval(function() {
		//game code
		incrementalGame();
	},1000/game.getFPS());
};


function incrementalGame() {
	//our game code
	
	//display stuff
	$("#money_value").html(prettify(game.getScore()));
	$("#perSecond").html(prettify(Math.round(10*game.getPointsPerSecond(),1)/10));
	$("#perClick").html(prettify(Math.round(10*game.getPointsPerClick(),1)/10));
	$("#pp_value").html(prettify(Math.round(10*game.getPP())/10));
	$("#ppPerSecond_value").html(prettify(game.getPPperSecond()));
	$("#pdv_value").html(prettify(Math.round(100*game.getPdv(),1)/100));
	$("#pdvmax_value").html(prettify(Math.round(100*game.getPdvMax(),1)/100));
	$("#pdvpersecond").html(prettify(Math.round(100*game.getPdvPerSecond(),1)/100));
	$("#fonction_value").html(game.getFonction());
	$("#facteurChance").html(game.getFacteurChance());
	
	//do stuff
	game.increaseScorePerSecond();
	game.increasePdvPerSecond();
	game.increasePPperSecond();

};

$(document).ready(function() {

	init(); //run initialization code

	$("#tabs").tabs();

	$(document).on('click', '.loadOrder',function(e){
		var ordre=$(this).data("ordre");
		
		$('.od').hide();
		$("." + ordre).fadeIn();
	});
});

function resultatJet(chance, jet, titre, message){
	var details = "(chances: "+prettify(Math.round(10*chance)/10)+"% - jet: "+jet+")";
	if(chance === 100){ details = "";}
	var classe = "display";
	if(titre === "Erreur"){ classe="error";}

	$('#resultatJet').html("<div class=\""+classe+"\"> <h3>"+titre+" "+details+"</h3> <p>"+message+"</p> </div>");
}

function randeaume(n){
	return Math.floor(Math.random()*n) + 1;
}
function gtfo(dom){
	$('.'+dom).hide();
	$('span[data-ordre='+dom+']').hide();
}
function prettify(input){
	//kudos to civClicker
	var output = '';
	if (delimiters){
		output = input.toString();
		var characteristic = '', //the bit that comes before the decimal point
			mantissa = '', //the bit that comes afterwards
			digitCount = 0;
			delimiter = "&#8239;"; //thin space is the ISO standard thousands delimiter. we need a non-breaking version

		//first split the string on the decimal point, and assign to the characteristic and mantissa
		var parts = output.split('.');
		if (typeof parts[1] === 'string') var mantissa = '.' + parts[1]; //check it's defined first, and tack a decimal point to the start of it

		//then insert the commas in the characteristic
		var charArray = parts[0].split(""); //breaks it into an array
		for (var i=charArray.length; i>0; i--){ //counting backwards through the array
			characteristic = charArray[i-1] + characteristic; //add the array item at the front of the string
			digitCount++;
			if (digitCount == 3 && i!=1){ //once every three digits (but not at the head of the number)
				characteristic = delimiter + characteristic; //add the delimiter at the front of the string
				digitCount = 0;
			}
		}
		output = characteristic + mantissa; //reassemble the number
	} else {
		output = input;
	}
	return output;
}