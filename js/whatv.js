'use strict';

(function(window, undefined) {
var whaTV = function() {
            // The whaTV object is actually just the init constructor 'enhanced'
            return new whaTV.fn.init();
          },

    // Use the correct document accordingly with window argument (sandbox)
    document = window.document,

    // The representation of the slides
    slides;

whaTV.fn = whaTV.prototype = {
  init: function() {
    $.getJSON('/slides.json', function(data) {
                                this.slides = data;
                              }
    );
    return this;
  },
  // The current version of whaTV being used
  whaTV: "0.0.1"

  // Here come all the functions and vars needed in whaTV
};

// Give the init function the whaTV prototype for later instantiation
whaTV.fn.init.prototype = whaTV.fn;

whaTV.extend = whaTV.fn.extend = function() {

};

whaTV(window);

// Expose jQuery to the global object
window.whaTV = whaTV;

})(window);