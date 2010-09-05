'use strict'

(function(window, undefined) {
var whaTV = function() {
            // The whaTV object is actually just the init constructor 'enhanced'
            return new whaTV.fn();
          },
    // Map over jQuery in case of overwrite
    _whatTV = window.whaTV,
    // Use the correct document accordingly with window argument (sandbox)
    document = window.document;

whaTV.fn = whaTV.prototype = {
  init: function() {
    
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


//$.getJSON('/slides.json', function(data){
                              
//});

})(window);