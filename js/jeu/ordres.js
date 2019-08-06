function buyMule(mulan){
	var mule = game.sets.MULES.getSet()[mulan].attributes;
	var cout = parseInt($('#'+mule.type).html());
	if(cout <= game.getScore()) {
		game.addToScore(-cout);
		game.addToPointsPerSecond(mule.perSecondModifier);
		game.addToPointsPerClick(mule.perSecondModifier/10);
		cout+= Math.floor(cout*0.15);
		$('#'+mule.type).html(cout + ' FK');
	}
};

function buyPioche(pioche){
	var pioche = game.sets.PIOCHES.getSet()[pioche].attributes;
	var cout = parseInt($('#'+pioche.type).html());
	if(cout <= game.getScore()) {
		game.addToScore(-cout);
		game.addToPointsPerClick(pioche.perClickModifier);
		//Retrait de la pioche
		game.sets.PIOCHES.removeEntity(pioche.type);
		$('#div'+pioche.type).fadeOut();
	}
};

function buyRegen(item){
	var regen = game.sets.REGEN.getSet()[item].attributes;
	var cout = parseInt($('#'+regen.type).html());
	if(cout <= game.getScore()) {
		game.addToScore(-cout);
		game.addToPdvPerSecond(regen.regenAdd);
		cout+= Math.floor(cout*0.40);
		$('#'+regen.type).html(cout+' FK');
	}
};

function buyFacteurChance(item){
	var fc = game.sets.CHANCE.getSet()[item].attributes;
	var cout = $('#bakchich').html();
	if(cout <= game.getScore()) {
		game.addToScore(-cout);
		game.addToFacteurChance(0.5);
		cout+= Math.floor(cout*1.80);
		$("#bakchich").html(cout + " FK");
	}
};

function autoSoutien(){
	var ordre = game.sets.ORDRES.getSet()["Auto-Soutien"].attributes;
	if(ordre.costPDV <= game.getPdv() && ordre.cost <= game.getScore()){
		game.addToPDV(-ordre.costPDV);
		var jet = randeaume(100);
		var ppAdd = randeaume(ordre.ppAdd);

		console.log(jet);

		var chance = Math.round(10*(game.getPP()/10 + ordre.chance + game.getFacteurChance()),1)/10;
		if(chance>95){ chance = 95; }
		console.log(chance);

		if(jet === 1){
			ppAdd+= randeaume(ordre.ppAdd);
			var titre = "Réussite Critique";
			var message = "KEL DISKOUR !! Si peu de caractères et pourtant tellement d'ovations ! Sans doute le meilleur monoligne EVAR. Un seul mot: WOAH!<br/>Votre PP augmente de "+ppAdd+"."
			game.addToPP(ppAdd);
		} else if(chance>=jet){
			var titre = "Action Réussie";
			var message = "Votre discours résonne comme une symphonie mêlant intelligence, répartie, organisation et haleine fraîche.<br/>Votre PP augmente de "+ppAdd+".";
			game.addToPP(ppAdd);
		}else if(jet === 100){
			var pdvAdd = randeaume(ordre.ppAdd);
			game.addToPDV(-pdvAdd);
			game.addToPP(-ppAdd);
			var titre = "Echec Critique";
			var message = "Vous êtes totalement ridicule: vous avez bafouillé, vous vous êtes mordu la langue deux fois, avez postillonné sur vos plus fidèles soutiens, en plus votre braguette était ouverte et dans la panique vous l'avez fermée un peu brutalement, occasionnant quelques légers dégats autant physique que médiatique (PdV -"+pdvAdd+", PP -"+ppAdd+")";
		} else {
			var titre = "Action Ratée";
			var message = "Vous aviez oublié qu'aujourd'hui c'était la kermesse de l'école primaire et que par conséquent, personne n'est venu à votre meeting."
		}

		$('.od').fadeOut();
		resultatJet(chance, jet, titre, message);
	} else if(ordre.costPDV > game.getPdv()){
		resultatJet(100, 0, "Erreur", "Vous n'avez pas assez de points de vie.");
	} else {
		resultatJet(100, 0, "Erreur", "Vous n'avez pas assez de francs-kra.");
	}
}

function consommerRepasDeLuxe(){
	var ordre = game.sets.ORDRES.getSet()["Consommer un repas"].attributes;
	if(ordre.costPDV <= game.getPdv() && ordre.cost <= game.getScore()){
		var gain = randeaume(ordre.pdvAdd) - ordre.costPDV;
		game.addToPDV(gain);
		game.addToScore(-ordre.cost);
		var titre = "Action Réussie";
		var message = "Vous dégustez un succulent repas d'une auberge non farouche.<br/>Vos PdV augmentent de "+gain+".";
		resultatJet(ordre.chance,0,titre,message);
	} else if(ordre.costPDV > game.getPdv()){
		resultatJet(100, 0, "Erreur", "Vous n'avez pas assez de points de vie.");
	} else {
		resultatJet(100, 0, "Erreur", "Vous n'avez pas assez de francs-kra.");
	}
}

function ajoutPdvMax(){
	var ordre = game.sets.ORDRES.getSet()["Augmenter PdV"].attributes;
	var cout = parseInt($('.AjouterPDVMax').html());
	if(cout <= game.getScore()){
		game.addToScore(-cout);
		game.addToPDVMax(ordre.pdvMax)
		var titre = "Action Réussie";
		var message = "Vous avez ajouté <strong>"+ordre.pdvMax+" PdV max.</strong> au prix fort de "+cout+" FK.";

		cout+= Math.floor(100 * (game.getPdvMax() - 25) * Math.pow(1.05,game.getPdvMax()));
		//cout+= Math.round(((game.getPdvMax() - 25) * (game.getPdvPerSecond())) + cout);
		
		$('.AjouterPDVMax').html(cout);
		
		resultatJet(ordre.chance,0,titre,message);
	} else {
		resultatJet(100, 0, "Erreur", "Vous n'avez pas assez de francs-kra.");
	}
}

function usurping(poste){
	var poste = game.sets.FONCTIONS.getSet()[poste].attributes;
	if(poste.cost <= game.getScore() && poste.costPDV <= game.getPdv()) {
		var jet = randeaume(100);
		var chance = poste.chance + (game.getPP()/10) + game.getFacteurChance();

		game.addToScore(-poste.cost);
		game.addToPDV(-poste.costPDV);

		if(jet === 1){
			var ppAdd=randeaume(poste.ppModifier*2);
			var titre = "Réussite Critique";
			var message = "<strong>Coup d'Etat!</strong> En plus d'avoir chopé ce tant convoité titre de "+poste.type+", le peuple vous acclame et vous gagnez de la puissance politique à foison, à perte de vue. Une quantité siiiii énorme !! (PP +"+ppAdd;
			game.setFonctionCourante(poste.type);
			game.addToPP(ppAdd);
			game.addToPPperSecond(poste.ppModifier);
			game.addToPointsPerClick(poste.salaire);

			gtfo(poste.className);
		} else if(jet === 100){
			var titre = "Echec Critique";
			var message = "<strong>Scandale !</strong> Alors que vous vous apprêtiez à usurper, un groupe de clic-opti vous tombe dessus, vous mets dans le coma, vous dépouille de votre argent et vous dépose à l'eau, mouillant vos élégantes bobettes que vous ne gardiez uniquement pour cette occasion spéciale ! (PP -"+poste.ppModifier+", PdV -"+game.getPdv()+", Argent -"+game.getScore()+")";
			game.addToPDV(-game.getPdv());
			game.addToScore(-game.getScore());
		} else if(jet <= chance){
			var titre = "Action Réussie";
			var message = "Vous êtes maintenant un parfait <strong>"+poste.type+"</strong>.";
			game.setFonctionCourante(poste.type);
			game.addToPPperSecond(poste.ppModifier);
			game.addToPointsPerClick(poste.salaire);
			gtfo(poste.className);
		} else{
			var titre = "Action Ratée";
			var message = "Vous n'avez pas réussi votre usurpation.";
		}

		resultatJet(chance,jet,titre,message);
	} else if(poste.costPDV > game.getPdv()){
		resultatJet(100, 0, "Erreur", "Vous n'avez pas assez de points de vie.");
	} else {
		resultatJet(100, 0, "Erreur", "Vous n'avez pas assez de francs-kra.");
	}
}