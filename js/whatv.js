'use strict';

(function(window, undefined) {
var whaTV = {
  // Reference to self
  whatTV = this,

  // The representation of the slides
  slides: [],

  // The current version of whaTV being used
  version: '0.0.1',

  init: function() {
    // Getting slides
    $.getJSON('/slides.json', function(data) {
                                whaTV.slides = data.slides;
                              }
    );
  },

  loadSlideIntoDOM: function() {

  },

  makeTransition: function() {

  },

  onSlidetimeout: function() {

  }
};

whaTV.init();

// Expose whaTV to the global object for debugging purposes
window.whaTV = whaTV;
console.log(whaTV);


})(window);
