'use strict';

var quickMessages = (function() {
  var defaults = {
    // Default time, in milliseconds, to show a message
    timeout: 500,
    // Default time before starting the loop again
    timeBeforeStartingAgain: 10000,
    // Default speed of animation between two messages
    transitionSpeed: 'slow',
    // Default time after showing div but before showing first message
    timeBeforeFirstMessage: 500
    // If you want to customize other values, please add them here before
    // And commit it. Thanks.
  },
      // A pointer to the current message
      currentMessage = -1,
      // The list of messages
      messages = [],
      // The quickMessage div
      node,
      // the quickMessage div wrapper
      nodeWrapper,
      // The height of a message
      height,
      // The width of the wrapper
      footerWidth;

  /**
    * The constructor of quickMessages
    * The animation is as follow : 
    * We put the content one 'div height' under
    * We put the wrapper under the window.
    * We show it with an animation
    * while there is messages : we move the content one 'div height' up
    */
  function init() {
    var index, message, div;
    // No message at all, we hide and return
    if (!messages.length) {
      return;
    }
    // Set fontsize relatively to footer height
    height = Number(getComputedStyle(nodeWrapper).height.replace('px', ''));
    footerWidth = Number(getComputedStyle(nodeWrapper.parentNode).
                         width.replace('px', ''));
    nodeWrapper.style.fontSize = height * 0.8 + 'px';
    nodeWrapper.style.lineHeight = height + 'px';
    // Put the div under the window
    nodeWrapper.style.left = - footerWidth + 'px';
    // Set the display from 'none' to 'block'
    nodeWrapper.style.opacity = 1;

    // Adding each message in the div
    for (index in messages) {
      message = document.createElement('span');
      message.innerHTML = messages[index].replace(' ', '&nbsp');
      div = document.createElement('div');
      div.style.height = height + 'px';
      div.appendChild(message)
      node.appendChild(div);
    }
    // Putting the content one 'div size' under, a first time
    // Before we move up the wrapper
    node.style.marginTop = height + 'px';
    // Let's go.
    showMessages();
  }

  /**
    * The main loop
    */
  function showMessages() {
    // Move up the div with an animation
    // and launch message loop as callback
    // Reset when we begin the loop
    node.style.marginTop = height + 'px';
    currentMessage = -1;
    $(nodeWrapper).animate({'left': '+=' + footerWidth + 'px'},
                           1000,
                           function() {
                             setTimeout(showNextMessage,
                                        defaults.timeBeforeFirstMessage);
                           });
  }

  /**
    * When the end of the loop is reached, we hide everything for a while
    * Then start again!
    */
  function hideMessages() {
    $(nodeWrapper).animate({'left': '-=' + footerWidth + 'px'},
                           1000,
                           function() {
                             setTimeout(showMessages,
	                                    defaults.timeBeforeStartingAgain);
                           });
  }
  /**
    * Show a message, then increment the pointer and call itself when finished
    */
  function showNextMessage() {
    incrementPointer();
    // If beginning of the loop : 
    // We put the content one 'div size' under
    if (currentMessage === messages.length) {
      $(node).animate({'marginTop': '-=' + height},
                     defaults.transitionSpeed,
                     function() {setTimeout(hideMessages, 1000);});
      return;
    }
    // attendre x secondes
    //  faire défiler de droite à gauche
    //    quand arrivé à la fin, next
    //  sinon next dans x secondes*/
    $(node).animate({'marginTop': '-=' + height},
                    defaults.transitionSpeed,
                    function() {
                      setTimeout(marqueeIfNeeded, defaults.timeout);
                    });
  }

  /**
    * If message too long : we animate it.
    **/
  function marqueeIfNeeded() {
    var span = messages[currentMessage] ?
            node.children[currentMessage].children[0] : null,
        difference = span ?
                     getSizeFromStyle(getComputedStyle(span).width) -
                       getSizeFromStyle(getComputedStyle(nodeWrapper).width) :
                     null;
    // If message too large for div, we "marquee" it
    if (difference) {
      $(span).animate({'marginLeft': '-=' + difference},
                      15 * difference,
                      function() {
                        setTimeout(showNextMessage, defaults.timeout);
                      });
    } else {
      showNextMessage();
    }
  }

  /**
    * This function increment the pointer, obviously.
    * When reaching end of messages array, we start again.
    */
  function incrementPointer() {
    currentMessage = currentMessage + 1;
    if (currentMessage === messages.length + 1) {
      currentMessage = 0;
    }
  }

  function getSizeFromStyle(CSSSize) {
    return Number(CSSSize.replace('px', ''));
  }

  return {
    /**
      * Initiate the quickMessages
      * @param {Element} messages an array of strings
      * @param {Element} div the div containing messages
      */
    create: function(messageArray, divId) {
      node = document.getElementById(divId);
      nodeWrapper = node.parentNode;
      messages = messageArray;
      init();
    }
  }
})()