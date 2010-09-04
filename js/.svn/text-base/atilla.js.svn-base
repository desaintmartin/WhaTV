var slideAjax;
var timer;
var horloge;
var tabSlide;	//Structure :
				//tabSlide[index][valeur]
				//valeur : 3 valeur (0: type (html, flash...), 1: timeout (durée d'exctinction), 2: ressource (url, url image...)

window.onload = function demarrage(){
	// On récupère la liste des slides, qu'on transorme en quelque chose de lisible (tableau)
	slideAjax = new ajaxObject('/eistv.xml');
	tabSlide = new Array();
	slideAjax.callback = function (responseText, responseStatus, responseXML) { // On dŽfinit le callback de l'ajax comme Žtant ce bordel
		if (responseStatus==200) {
			var slides = responseXML.getElementsByTagName("slide");
			for(var i=0; i<slides.length ; i++) {
				tabSlide[i] = new Array();
				tabSlide[i].push(getElementTextNS("type", slides[i], 0));
				tabSlide[i].push(getElementTextNS("timeout", slides[i], 0));
				tabSlide[i].push(getElementTextNS("ressource", slides[i], 0));
			}
			
			// Initialisation du timer
			timer = new atilla_timer(tabSlide);
			timer.init();
			setInterval('timer.start()', 5000);
		} 
		else {
			alert(responseStatus + ' -- Error Processing Request');
		}
	}
	slideAjax.update();
	//Timer pour mettre à jour l'heure
	horloge = new horloge('horloge');
//	var temps = setInterval("temps_horloge('horloge')", 500);
	var temps = setInterval("that.horloge.update()", 500);
}	


// Fonction servant à récupérer le texte d'un xml
function getElementTextNS (local, parentElem, index){
	var result = "";
	result = parentElem.getElementsByTagName(local)[index];
	if (result)
	{
		if (result.childNodes.length > 1)
			return result.childNodes[1].nodeValue;
		else
			return result.firstChild.nodeValue;
	}
	else
		return "n/a";
}

