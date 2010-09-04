function atilla_timer(xmlArray){
	var that = this;
	// Variables du timer, privées
	var timerID = 0;
	var tStart  = null;
	var timerValue = 0;
	// Variables de l'Ajax, publiques
	this.xmlArray = xmlArray; // Tableau dimension deux représentant le XML chargé issu des requetes AJAX (cf atilla.js pour spec.)
	this.slideNumber = 0; // Numero du slide affiché a l'écran
	this.ajaxHtmlArray = []; // Tableau de requetes AJAX récupérant les slides HTML 
	this.htmlArray = []; // Tableau contenant le content HTML des slides HTML a afficher
//	this.htmlArray = []; // Tableau dimension deux contenant les slides HTML parsés façon xml. : TODO pour remplacer methode brute
	this.initValue=0; // variable pour le callback xml
	
	this.init = function() { // ToDo : ne charger que les slides html via case? Tout charger puis insérer?
		for (var i=0; i<that.xmlArray.length; i++) {
			that.ajaxHtmlArray[i] = new ajaxObject(that.xmlArray[i][2],that.callback);
		}
		for (i=0; i<that.xmlArray.length; i++) {
			that.ajaxHtmlArray[i].update('id='+i);
		}
	}
	this.callback = function(responseText, responseStatus, responseXML) {
		if (responseStatus==200) {
			that.htmlArray[that.initValue] = responseText; // Version simple ou on injecte directement l'ensemble du code html dans un div
			//that.htmlArray[that.initValue] = responseXML; // Version avec parsage XML
		} else {
			alert(responseStatus + ' -- Error Processing Request');
		}
		that.initValue++;
	}
	//ToDo : exporter le timer vers une autre classe?
	this.start = function() {
		tStart = new Date();
		timerValue = 0;
		that.changeSlide();
		//timerID = window.setTimeout(function(){that.updateTimer()}, 1000); // remplacer par un appel simple d'updatetimer?
		if (that.slideNumber >= that.xmlArray.length) that.slideNumber = 0; // idem
		
	}
/*
	this.stop = function(){
		if(timerID)
		{
			clearTimeout(timerID);
			timerID = 0;
		}
		tStart = null;
	}

	this.reset = function(){
		tStart = null;
		timerValue = 0;
	}

	this.updateTimer = function(){
		if(that.timerID)
		{
			clearTimeout(this.timerID);
			clockID  = 0;
		}
		if(!that.tStart)
			that.tStart   = new Date();
		var tDate = new Date();
		var tDiff = tDate.getTime() - that.tStart.getTime();
		tDate.setTime(tDiff);
		timerValue = (60*tDate.getMinutes()) + tDate.getSeconds();
		timerID = setTimeout(function(){that.updateTimer()}, 1000);

				
		
		if(timerValue>that.xmlArray[slideNumber][1])
		{
			that.reset();
			that.start();
			slideNumber++;
		}
	}
	*/
	this.changeSlide = function () {
		// On chope le div qui nous interesse
		var content = document.getElementById("content");
		// On supprime le slide précédent. Si pas de slide précédent (i.e. init) c'est pareil pour sa gueule.
		while (content.hasChildNodes()) {
			content.removeChild(content.lastChild);
		}
		
		var child;
		switch(that.xmlArray[that.slideNumber][0]) {
			case("html"): // Pour HTML : on insère le code HTML dans "content"
//				child = document.createElement("div");
//				child.innerHTML = that.htmlArray[that.slideNumber];
				child = document.createElement("iframe");
				child.setAttribute('src', that.xmlArray[that.slideNumber][2]);
				child.setAttribute('WIDTH', '1366');
				child.setAttribute('HEIGHT', '768');
				child.setAttribute('SCROLLING', 'no');
				break;
			case("image"): // Pour les images
				child = document.createElement("img");
				child.setAttribute('src', that.xmlArray[that.slideNumber][2]);
				break;
			case("video"): // Pour les videos
				child = document.createElement("video");
				child.setAttribute('src',that.xmlArray[that.slideNumber][2]);
				child.setAttribute('autoplay', 'true');
				break;
			case("flash"): // Pour Flash/ppt
				child = document.createElement('object');
				child.setAttribute('type','text/html');
				child.setAttribute('data',that.htmlArray[that.slideNumber]);
			default: // Format non défini dans le cahier des charges.
				alert("Non defini.");
		}
		// Dans tous les cas, on ajoute le fils cree dans le div 'content'
		content.appendChild(child);
		that.slideNumber++;
	}

}
