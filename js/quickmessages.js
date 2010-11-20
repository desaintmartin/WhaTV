'use strict';

/**
  * Message management system, compatible with jQuery UI.
  **/
var quickMessages = (function() {
  var defaults = {
    // Default time, in milliseconds, to show a message
    timeout: 5000,
    // Default time before starting the loop again
    timeBeforeStartingAgain: 1500,
    // Default speed of animation between two messages
    transitionSpeed: 'slow',
    // Default time before showing first message
    timeBeforeFirstMessage: 1500
    // If you want to customize other values, please add them here before
    // And commit them. Thanks.
  },
      // A pointer to the current message
      // Starts at 1, ends at length + 1
      // It is used to refer to the current span (may be incremented by one
      // from the messages array)
      currentMessage,
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
    var length, index, message, div;
    // No message at all, we hide and return
    if (!messages.length) {
      return;
    }
    // Set fontsize relatively to footer height
    height = Number(getComputedStyle(nodeWrapper, '').height.replace('px', ''));
    footerWidth = Number(getComputedStyle(nodeWrapper.parentNode, '').
                         width.replace('px', ''));
    nodeWrapper.style.fontSize = height * 0.8 + 'px';
    nodeWrapper.style.lineHeight = height + 'px';
    // Put the div at the left the window
    nodeWrapper.style.left = - footerWidth + 'px';
    // Set the display from 'none' to 'block'
    nodeWrapper.style.opacity = 1;

    // Adding a first, blank message
    messages.unshift({title: '', content: ''});
    // Adding each message in the div
    for (index = 0, length = messages.length; index < length; index += 1) {
      message = document.createElement('span');
      message.innerHTML = messages[index].content;
      div = document.createElement('div');
      div.style.height = height + 'px';
      div.appendChild(message);
      node.appendChild(div);
    }
    // Let's go.
    setTimeout(showMessages, defaults.timeBeforeFirstMessage);
  }

  /**
    * The main loop
    */
  function showMessages() {
    // Move right the div with an animation
    // and launch message loop as callback
    // Reset when we begin the loop
    var messagesLength = messages.length, index, span;
    // TODO I still do not know what to do when showing messages div.
    // If I want to see at first a blank div, we need to set to "height"
    // Otherwise, if I want an empty message (in order to see background)
    // I will need "0px".
    node.style.marginTop = '0px';//height + 'px';
    currentMessage = 0;
    for (index = 0; index < messagesLength; index += 1) {
      span = node.children[index].children[0];
      span.style.marginLeft = '';
    }
    $(nodeWrapper).animate({'left': '+=' + footerWidth + 'px'},
                           1000,
                           function() {
                             setTimeout(showNextMessage,
                                        1000);
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
                     //TODO good easing
                     defaults.transitionSpeed,
                     function() {setTimeout(hideMessages, 1000);});
      return;
    } else {
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
  }

  /**
    * If message too long : we animate it.
    **/
  function marqueeIfNeeded() {
    var span = node.children[currentMessage].children[0],
        // Candidate to remove
        // span = messages[currentMessage] ?
            //node.children[currentMessage + 1].children[0] : null,
        difference = getSizeFromStyle(getComputedStyle(span, '').width) -
                     getSizeFromStyle(getComputedStyle(nodeWrapper, '').width);
    // If message too large for div, we "marquee" it
    if (difference > 0) {
      $(span).animate({'marginLeft': '-=' + difference},
                      15 * difference,
                      'easeInOutSine',
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
      * @param {Element} messages an array of strings.
      * @param {Element} div the div containing messages.
      */
    create: function(messageArray, divId) {
      node = document.getElementById(divId);
      nodeWrapper = node.parentNode;
      messages = messageArray;
      window.plop = messageArray;
      init();
    }
  };
})();
