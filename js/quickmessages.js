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
  function init() {
    if (!messages.length) {
      //TODO opacity is already 0 by default.
      node.style.opacity = '0px';
      return;
    }
    // FIXME clean this : Hack to set fontsize relatively to footer height
    node.parentNode.parentNode.style.fontSize = 
        document.defaultView.getComputedStyle(node.parentNode).height;

    // We use setTimeout here to wait for other operations to finish
    // Here, we wait for the fontSize to be understood by browser
    setTimeout(function() {
        // Put the div under the window
        node.style.marginTop =
            document.defaultView.getComputedStyle(node).height;
        // Move up the div with an animation
        // and launch message loop as callback
        
        showNextMessage();
    }, 0);
    node.innerHTML = messages;
  }

  /**
    * Show a message, then increment the pointer and call itself when finished
    */
  function showNextMessage() {
    console.log(messages[currentMessage]);
    incrementPointer();
    //D'abord caché,
    //puis transition vers le haut pour faire apparaitre message
    //si message trop long pour écran,
    // attendre x secondes
    //  faire défiler de droite à gauche
    //    quand arrivé à la fin, next
    //  sinon next dans x secondes*/
  }

  /**
    * This function increment the pointer, obviously.
    * When reaching end of messages array, we start again.
    */
  function incrementPointer() {
    currentMessage = currentMessage + 1;
    if (currentMessage === messages.length) {
      currentMessage = 0;
    }
  }

  return {
    /**
      * Initiate the quickMessages
      * @param {Element} messages an array of strings
      * @param {Element} div the div containing messages
      */
    create: function(messageArray, divId) {
      node = document.getElementById(divId);
      messages = messageArray;
      init();
    }
  }
})()