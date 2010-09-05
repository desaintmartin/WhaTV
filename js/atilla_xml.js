'use strict';

function ajaxObject(url, callbackFunction) {
  var that = this;
  this.updating = false;
  this.abort = function() {
    if (that.updating) {
      that.updating = false;
      that.AJAX.abort();
      that.AJAX = null;
    }
  }
  this.update = function(passData,postMethod) {
    if (that.updating) { return false; }
    that.AJAX = null;
    if (window.XMLHttpRequest) {
      that.AJAX = new XMLHttpRequest();
    }
    else {
      that.AJAX = new ActiveXObject('Microsoft.XMLHTTP');
    }
    if (that.AJAX == null) {
      return false;
    }
    else {
      that.AJAX.onreadystatechange = function() {
        if (that.AJAX.readyState == 4) {
          that.updating = false;
          that.callback(that.AJAX.responseText, that.AJAX.status, that.AJAX.responseXML);
          that.AJAX = null;
        }
      }
      that.updating = new Date();
      if (/post/i.test(postMethod)) {
        var uri = urlCall; // On peut également attacher un timestamp à l'url. Voir ci-dessous.
        //var uri=urlCall+'?'+that.updating.getTime(); Si problèmes de cache, alors remettre cette ligne.
        that.AJAX.open('POST', uri, true);
        that.AJAX.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        that.AJAX.setRequestHeader('Content-Length', passData.length);
        that.AJAX.send(passData);
      }
      else {
        var uri = urlCall; // Meme chose qu'au dessus. Marche tant qu'on ne bosse pas en pages dynamiques.
//        var uri=urlCall+'?'+passData+'&timestamp='+(that.updating.getTime());
        that.AJAX.open('GET', uri, true);
        that.AJAX.send(null);
      }
      return true;
    }
  }
  var urlCall = url;
  this.callback = callbackFunction || function() { };
}
