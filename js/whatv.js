'use strict';

(function(window, undefined) {
// Inside of our object, we will always refer to "whaTV" to fetch attributes.
var whaTV = {
  // Pointer to current slide
  pointer: 0,

  // The informations about slides to show
  slides: [],

  // Current loaded slide as a DOM node
  loadedSlide: null,

  // Boolean to know if next slide is ready to show
  ready: false,

  // The current version of whaTV being used
  version: '0.0.1',

  init: function() {
    // Getting slides
    $.getJSON('/slides.json', whaTV.showFirstSlide);
  },

  showFirstSlide: function(data) {
    whaTV.slides = data.slides;
    // TODO : loading screen
    whaTV.loadPointedSlideIntoDOM()
  },

  loadPointedSlideIntoDOM: function() {
    console.debug("loadPointedSlideIntoDOM called.");
    whaTV.ready = false;
    //Charge en DOM les éléments necessaires au slide pointé.
    currentSlide = whaTV.slides[whaTV.pointer];
    switch (currentSlide.type) {
      case "html":
        break;
      case "flash":
        break;
      case "image":
        break;
      case "video":
        break;
    }
    //Une fois que tout est chargé :
    whaTV.loadedSlide = document.createElement('div');
    // Simulating fire event when complete
    setTimeout(whaTV.onNextSlideReady, Math.random()*5000);
  },

  onNextSlideReady: function() {
    whaTV.ready = true;
    whaTV.onDomNodeComplete();
  },

  makeTransition: function() {
    console.debug("makeTransition called.");
    //whaTV.onDomNodeComplete = function() {return null;};
    //Efface le slide actuel, affiche le domNode.
    whaTV.onDomNodeComplete = function() {whaTV.ready = true;};
    setTimeout(whaTV.onSlideTimeout, whaTV.slides[whaTV.pointer].timeout * 1000);
    whaTV.loadPointedSlideIntoDOM();
    whaTV.incrementPointer();
  },

  onSlideTimeout: function() {
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
    whaTV.ready = true;
    whaTV.makeTransition();
  },

  // Increments the pointer. If last slide has been reached, we start again.
  incrementPointer: function() {
    whaTV.pointer = whaTV.pointer + 1;
    console.log(whaTV.pointer);
    if (whaTV.pointer === whaTV.slides.length) whaTV.pointer = 0;
  },

  pause: function() {
    whaTV.ready = false;
    whaTV.onDomNodeComplete = function() {return null;};
  }
};

whaTV.init();

// Expose whaTV to the global object for debugging purposes
window.w = whaTV;

})(window);
