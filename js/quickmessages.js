window.WhaTV = window.WhaTV || {};

/**
 * Message management system, compatible with jQuery UI.
 */
WhaTV.quickMessages = (function() {
  'use strict';
  var defaults = {
    // Default time, in milliseconds, to show a message
    timeout: 5000,
    // Default time before starting the loop again
    timeBeforeStartingAgain: 7000,
    // Default speed of animation between two messages
    transitionSpeed: 'slow',
    // Default time before showing first message
    timeBeforeFirstMessage: 4000,
    // Default time before showing next message
    timeBeforeNextMessage: 1000
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
      footerWidth,
      messagePadding,
      shown = false,
      readyToShowEventName = 'readyToShowMessages',
      readyToHideEventName = 'readyToHideMessages',
      readyToShowNextEventName = 'readyToShowNextMessage',
      readyToMarqueeIfNeededEventName = 'readyToMarqueeMessage',
      currentTimeout;

  /**
   * The constructor of quickMessages
   * The animation is as follow :
   * We put the content one 'div height' under
   * We put the wrapper under the window.
   * We show it with an animation
   * while there is messages : we move the content one 'div height' up
   */
  function init(divId) {
    node = document.getElementById(divId);
    nodeWrapper = node.parentNode;
    // Set fontsize relatively to footer height
    height = Number(getComputedStyle(nodeWrapper, '').height.replace('px', ''));
    footerWidth = Number(getComputedStyle(nodeWrapper.parentNode, '').
                         width.replace('px', ''));
    messagePadding = footerWidth * 0.02;
    console.debug('quickMessages: height = ' + height + ', width = ' + footerWidth);
    nodeWrapper.style.fontSize = height * 0.8 + 'px';
    nodeWrapper.style.lineHeight = height + 'px';
    // Put the div at the left the window
    nodeWrapper.style.left = - footerWidth + 'px';
    // Set the display from 'none' to 'block'
    nodeWrapper.style.opacity = 1;
  }

  function populateMessageDiv() {
    var length, index, message, div, nodeChild;
    // No message at all, we hide and return
    // Adding a first, blank message
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    if (!messages.length) {
      return;
    }
    messages.unshift('');
    // Adding each message in the div
    for (index = 0, length = messages.length; index < length; index += 1) {
      message = document.createElement('span');
      message.innerHTML = messages[index];
      message.style.paddingLeft = messagePadding + 'px';
      message.style.paddingRight = messagePadding + 'px';
      div = document.createElement('div');
      div.style.height = height + 'px';
      div.appendChild(message);
      node.appendChild(div);
    }
  }

  /**
   * The main loop. At the beginning, the messages bar div is at the right of
   * the window, outside of user view. To show it, we move this div to the
   * left. Then , we call function responsible for showing a message.
   */
  function showMessages() {
    var messagesLength = messages.length, index, span;
    if (shown || !messages.length) { return; }
    shown = true;
    node.style.marginTop = '0px';
    currentMessage = 0;
    for (index = 0; index < messagesLength; index += 1) {
      span = node.children[index].children[0];
      span.style.marginLeft = '';
    }
    $(nodeWrapper).animate(
      {'left': '+=' + footerWidth + 'px'},
      1000,
      function() {
        dispatchEvent(readyToShowNextEventName, 1000);
      }
     );
  }

  /**
   * When the end of the loop is reached, we hide everything for a while
   * Then start again!
   */
  function hideMessages() {
    if (!shown) { return; }
    shown = false;
    $(nodeWrapper).animate(
      {'left': '-=' + footerWidth + 'px'},
      1000,
      function() {
        dispatchEvent(readyToShowEventName, defaults.timeBeforeStartingAgain);
      }
     );
  }
  /**
   * Show/animate a message, then increment the pointer.
   */
  function showNextMessage() {
    if (!shown) { return; }
    incrementPointer();
    // If last message has finished showing : we hide the message bar.
    if (currentMessage === messages.length) {
      $(node).animate({'marginTop': '-=' + height},
                     defaults.transitionSpeed,
                     function hideMessageBar() {
                       dispatchEvent(readyToHideEventName, defaults.timeBeforeNextMessage);
                     });
    } else {
      // Normal case : we show the message, then call marquee function
      $(node).animate({'marginTop': '-=' + height},
                      defaults.transitionSpeed,
                      function () {
                        dispatchEvent(readyToMarqueeIfNeededEventName, defaults.timeout);
                      });
    }
  }

  /**
   * If message too long : we animate it from right to left.
   */
  function marqueeIfNeeded() {
    if (!shown) { return; }
    var span = node.children[currentMessage].children[0],
        difference = messagePadding * 2 +
                     getSizeFromStyle(getComputedStyle(span, '').width) -
                     getSizeFromStyle(getComputedStyle(nodeWrapper, '').width);
    // If message too large for div, we "marquee" it
    if (difference > 0) {
      $(span).animate({'marginLeft': '-=' + difference},
                      15 * difference,
                      'easeInOutSine',
                      function() {
                          dispatchEvent(readyToShowNextEventName, defaults.timeout);
                      });
    } else {
      dispatchEvent(readyToShowNextEventName);
    }
  }

  function dispatchEvent(eventName, delay) {
    console.debug('Firing event: ' + eventName);
    if (!delay) {
      delay = 0;
    }
    currentTimeout = setTimeout(function() {
      node.dispatchEvent(new Event(eventName));
    }, delay);
  }

  function enableEventListeners() {
    node.addEventListener(readyToShowEventName, showMessages);
    node.addEventListener(readyToHideEventName, hideMessages);
    node.addEventListener(readyToShowNextEventName, showNextMessage);
    node.addEventListener(readyToMarqueeIfNeededEventName, marqueeIfNeeded);
  }

  function disableEventListeners() {
    node.removeEventListener(readyToShowEventName, showMessages);
    node.removeEventListener(readyToHideEventName, hideMessages);
    node.removeEventListener(readyToShowNextEventName, showNextMessage);
    node.removeEventListener(readyToMarqueeIfNeededEventName, marqueeIfNeeded);
    clearTimeout(currentTimeout);
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
     * @param {String[]} messageArray an array of strings.
     * @param {HTMLElement} div the div containing messages.
     */
    create: init,
    update: function update(messageArray) {
      disableEventListeners();
      // hide current message
      hideMessages();
      setTimeout(function() {
        messages = messageArray;
        populateMessageDiv();
        showMessages();
        enableEventListeners();
      }, defaults.timeBeforeNextMessage);
    }
  };
})();
