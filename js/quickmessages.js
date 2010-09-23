'use strict';

var quickMessages = (function() {
  // A pointer to the current message
  var currentMessage = 0,
      // The list of messages
      messages = [],
      // The quickMessage div
      node;

  /**
    * The constructor of quickMessages
    */
  function init(messages) {
    // FIXME clean this : Hack to set fontsize relatively to footer height
    node.parentNode.style.fontSize = document.defaultView.getComputedStyle(
        document.getElementsByTagName('footer')[0]).height;
    if (!messages.length) {
      //TODO opacity is already 0 by default.
      node.style.opacity = '0px';
      return;
    }
    node.innerHTML = messages;
  }

  function showNextMessage(message) {
    /*quick message : 
      Initialisation : 
      Au début, monte le div pour qu'il soit visible (auparavant sous la fenêtre)
      messages : 
      D'abord caché,
      puis transition vers le haut pour faire apparaitre message
      si message trop long pour écran,
        faire défiler de droite à gauche
        quand arrivé à la fin, next
      sinon next dans x secondes*/

  }

  return {
    /**
      * Initiate the quickMessages
      * @param {Element} messages an array of strings
      * @param {Element} div the div containing messages
      */
    create: function(messages, divId) {
      node = document.getElementById(divId);
      init(messages);
    }
  }
})()