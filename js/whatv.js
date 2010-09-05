'use strict';

(function(window, undefined) {
var whaTV = {
  // Pointer to current slide
  pointer: 1,

  // The informations about slides to show
  slides: [],

  // Current loaded slide as a DOM node
  loadedSlide: null,

  // Boolean to know if next slide is ready to show
  ready: false,

  // The current version of whaTV being used
  version: '0.0.1',

  init: function() {
    // Reference to self
    whaTV = this;
    // Getting slides
    $.getJSON('/slides.json', whaTV.showFirstSlide);
  },

  showFirstSlide: function(data) {
    whaTV.slides = data.slides;
    // TODO : loading
    //addEventListener('domnodecomplete', ok = false; transition())
    whaTV.loadPointedSlideIntoDOM()
  },

  loadPointedSlideIntoDOM: function() {
    //Charge en DOM les éléments necessaires au slide pointé.
    //Une fois que tout est chargé :
    //  var newEvt = document.createEventObject()
    //  this.dispatchEvent("domenodecomplete", evt)
    //  return domeNode;
  },

  makeTransition: function() {
    //removeEventListener('domnodecomplete', ok = false; transition())
    //Efface le slide actuel, affiche le domNode. Incrémente le pointeur.
    //chargement()
    //addEventListener('domnodecomplete', function(){ok = true})
    //thetimeout = timeout(this.onslidetimeout(), Roadmap.pointeur.timeout)
  },

  onSlidetimeout: function() {
    //removeEventListener('domnodecomplete', function(){ok = true})
    //si ok : ok = false; transition()
    //sinon : addEventListener('domnodecomplete', ok = false; transition())
  }
};

whaTV.init();

// Expose whaTV to the global object for debugging purposes
window.whaTV = whaTV;
console.log(whaTV);


})(window);
