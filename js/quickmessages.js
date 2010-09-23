'use strict';

var quickMessages = (function() {
// Inside of our object, we will always refer to 'quickMessage' to fetch attributes.
  var defaults = {
    // The speed. Can be in pixel per second, or in % of window.innerWidth
    speed: '10%',
    // The height of the messages. Can be in pixel, or
    // in % of window.innerHeight.
    height: '7%'
  };

      // A pointer to the current message
  var currentMessage = 0,
      // The list of messages
      messages = [];

  /**
    * The constructor of quickMessages
    */
  function init(messages, node) {
    if (!messages.length) {
      node.style.opacity = '0px';
      return;
    }
    
  }

  return {
    /**
      * Initiate the quickMessages
      * @param {Element} messages an array of strings
      * @param {Element} div the div containing messages
      */
    create: function(messages, div) {
      init(messages, div);
    }
  }
})()