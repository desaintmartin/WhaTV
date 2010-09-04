function temps_horloge(idhorloge){
	var that=this;
	
	this.update = function() {
		if(document.getElementById(idhorloge))
		{
			var dt = new Date();
			if (that.dt.getMinutes()<10)
				document.getElementById(idhorloge).innerHTML = that.dt.getHours() + ":0" + that.dt.getMinutes();
			else
				document.getElementById(idhorloge).innerHTML = that.dt.getHours() + ":" + that.dt.getMinutes();
		}
	}
}
