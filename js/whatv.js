'use strict';

(function(window, undefined) {
// Inside of our object, we will always refer to "whaTV" to fetch attributes.
var whaTV = {
  defaults: {
    // The html fetching method.
    // Can be one of the following : 'ajax' | 'iframe'
    htmlMethod: 'iframe'
  },
  // Pointer to current slide
  pointer: 0,

  // The informations about slides to show
  slides: [],

  // Current loaded slide as a DOM node
  // TODO replace it by array, to store past slides in memory?
  //loadedSlide: null,

  // Boolean to know if next slide is ready to show
  ready: false,

  // The current version of whaTV being used
  version: '0.0.1',

  init: function() {
    // Reference to self
    var whaTV = this;
    // Getting slides
    $.getJSON('/slides.json', whaTV.showFirstSlide);
    $('#content1').hide();
  },

  showFirstSlide: function(data) {
    whaTV.slides = data.slides;
    // TODO : loading screen
    console.debug("Showing slide number 0");
    whaTV.loadPointedSlideIntoDOM()
  },

  // Load into the DOM the pointed slide and its elements. Fire an event 
  // onNextSlideReady when Everything is loaded.
  loadPointedSlideIntoDOM: function() {
    console.debug("loadPointedSlideIntoDOM called.");
    whaTV.ready = false;
    currentSlide = whaTV.slides[whaTV.pointer];
    var content;
    switch (currentSlide.type) {
      case 'html':
        console.log("HTML file detected");
        content = whaTV.defaults.htmlMethod ? whaTV.loadIframe()
                                            : whaTV.loadIframe();
        break;
      case 'flash':
        console.log("Flash file detected");
        content = document.createElement("object");
        break;
      case 'image':
        console.log("Image file detected");
        content = document.createElement("img");
        content.setAttribute("src", whaTV.slides[whaTV.pointer].resource);
        break;
      case 'video':
        console.log("Video file detected");
        content = document.createElement("video");
        content.setAttribute("src", whaTV.slides[whaTV.pointer].resource);
        break;
    }
    var hiddenContentDiv = $("#content" + (w.pointer%2 + 1))[0];
    console.debug("I clear the content div " + (w.pointer%2 + 1));
    whaTV.clearNode(hiddenContentDiv);
    console.debug("I load the content div " + (w.pointer%2 + 1));
    hiddenContentDiv.appendChild(content);
    // Simulating fire event when complete
    setTimeout(whaTV.onNextSlideReady, Math.random()*500);
  },

  makeTransition: function() {
    console.debug("makeTransition called.");
    console.debug("I hide the content div " + (2 - w.pointer % 2));
    $("#content" + (2 - w.pointer % 2)).hide();
    console.debug("I show the content div " + (w.pointer%2 + 1));
    $("#content" + (w.pointer%2 + 1)).show();
    whaTV.onDomNodeComplete = function() {whaTV.ready = true;};
    setTimeout(whaTV.onSlideTimeout, whaTV.slides[whaTV.pointer].timeout * 1000);
    whaTV.incrementPointer();
    whaTV.loadPointedSlideIntoDOM();
  },

  onNextSlideReady: function() {
    whaTV.ready = true;
    whaTV.onDomNodeComplete();
  },

  onSlideTimeout: function() {
    console.warn(whaTV.ready);
    if (whaTV.ready) {
      whaTV.makeTransition();
    }
    else {
      whaTV.onDomNodeComplete = function() {
                                  whaTV.ready = false;
                                  whaTV.makeTransition()
                                };
    }
  },

  onDomNodeComplete: function() {
    // This function will be overwritten by makeTransition and onSlideTimeout
    // This code is used as is ONLY for first iteration
    whaTV.makeTransition();
  },

  // Increments the pointer. If last slide has been reached, we start again.
  incrementPointer: function() {
    whaTV.pointer = whaTV.pointer + 1;
    if (whaTV.pointer === whaTV.slides.length) whaTV.pointer = 0;
    console.debug("Showing slide number " + whaTV.pointer);
  },


  // Utility methods
  loadIframe: function() {
    iframe = document.createElement('iframe');
    iframe.setAttribute('src', whaTV.slides[whaTV.pointer].resource);
    iframe.setAttribute('class', 'next_content');
    iframe.setAttribute('id', whaTV.pointer);
    return iframe;
  },

  clearNode: function(node) {
    if (node.hasChildNodes()) {
      while (node.childNodes.length >= 1) {
        node.removeChild(node.firstChild);       
      } 
    }
  }
};

whaTV.init();

// Expose whaTV to the global object for debugging purposes
window.w = whaTV;
window.pause = function() {
  whaTV.ready = false;
  whaTV.onDomNodeComplete = function() {return null;};
}
})(window);
