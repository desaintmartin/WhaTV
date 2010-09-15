'use strict';

(function(window, undefined) {
// Inside of our object, we will always refer to 'whaTV' to fetch attributes.
var whaTV = {
  defaults: {
    // The html fetching method.
    // Can be one of the following : 'ajax' | 'iframe'
    htmlMethod: 'iframe'
  },
  // Pointer to current slide
  pointer: 0,

  // Ugly hack to know where to show the slide if not even.
  even: true,

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
    $.getJSON('slides.json', whaTV.showFirstSlide);
  },

  showFirstSlide: function(data) {
    whaTV.slides = data.slides;
    // TODO : loading screen
    $('#content1').hide();
    whaTV.loadPointedSlideIntoDOM();
  },

  // Load into the DOM the pointed slide and its elements. Fire an event
  // notifyReadyOrGo when Everything is loaded.
  loadPointedSlideIntoDOM: function() {
    console.log('loadPointedSlideIntoDOM called. preparing slide number ' +
                whaTV.pointer);
    whaTV.ready = false;
    var currentSlide = whaTV.slides[whaTV.pointer],
        content,
        hiddenContentDiv;
    switch (currentSlide.type) {
      case 'html':
        console.debug('HTML file detected');
        content = whaTV.defaults.htmlMethod ? whaTV.loadIframe() :
                                              whaTV.loadIframe();
        break;
      case 'flash':
        console.debug('Flash file detected');
        content = whaTV.loadFlash();
        break;
      case 'image':
        console.debug('Image file detected');
        content = whaTV.loadImage();
        break;
      case 'video':
        console.debug('Video file detected');
        content = whaTV.loadVideo();
        //content.addEventListener('ended', whaTV.onSlideTimeout, false);
        break;
    }
    hiddenContentDiv = $('#content' +
                             whaTV.getPointerModuloTwoPlusOne()
                            )[0];
    console.debug('Clearing content' + whaTV.getPointerModuloTwoPlusOne());
    whaTV.clearNode(hiddenContentDiv);
    console.debug('Load content' + whaTV.getPointerModuloTwoPlusOne());
    hiddenContentDiv.appendChild(content);
    // XXX : This is hightly experimental
    //if(content.play) ambiLight.create(content);
    // Simulating fire event when complete
    setTimeout(whaTV.onNextSlideReady, Math.random() * 2000);
  },

  makeTransition: function() {
    var divToHide = $('#content' + whaTV.getPointerModuloTwo()),
        divToShow = $('#content' + whaTV.getPointerModuloTwoPlusOne());
    console.log('makeTransition called. Showing slide number ' + whaTV.pointer
                + ' from #content' + whaTV.getPointerModuloTwoPlusOne() + '.');
    console.debug('Hidding content' + whaTV.getPointerModuloTwo());
    divToHide.hide();
    whaTV.onHide(divToHide);
    console.debug('Showing content' + whaTV.getPointerModuloTwoPlusOne());
    divToShow.show();
    whaTV.onShow(divToShow);
    whaTV.notifyReadyOrGo = function() {whaTV.ready = true;};
    setTimeout(whaTV.onSlideTimeout,
               whaTV.slides[whaTV.pointer].timeout * 1000);
    whaTV.incrementPointer();
    whaTV.loadPointedSlideIntoDOM();
  },

  onSlideTimeout: function() {
    if (whaTV.ready) {
      whaTV.makeTransition();
    }
    else {
      whaTV.notifyReadyOrGo = function() {whaTV.makeTransition();};
    }
  },

  onNextSlideReady: function() {
    whaTV.notifyReadyOrGo();
  },
  notifyReadyOrGo: function() {
    // This function will be overwritten by makeTransition and onSlideTimeout
    // This code is used as is ONLY for first iteration
    whaTV.makeTransition();
  },

  // Increments the pointer. If last slide has been reached, we start again.
  incrementPointer: function() {
    whaTV.pointer = whaTV.pointer + 1;
    if (whaTV.pointer === whaTV.slides.length) {
      whaTV.pointer = 0;
      if (whaTV.slides.length % 2) {
        whaTV.even = !whaTV.even;
      }
    }
  },


  // Loaders
  loadIframe: function() {
    var iframe = document.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('src', whaTV.slides[whaTV.pointer].resource);
    iframe.setAttribute('class', 'next_content');
    iframe.setAttribute('id', whaTV.pointer);
    iframe.setAttribute('scrolling', "no");
    // XXX : May be used to fire the onNextSlideReady event?
    //iframe.onload = function(){alert("lol")};
    return iframe;
  },

  loadImage: function() {
    var image = new Image(),
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper = document.createElement('div');
    localWrapper.appendChild(image);
    localWrapper.setAttribute('class', 'localImageContainer');
    globalWrapper.appendChild(localWrapper);
    globalWrapper.setAttribute('class', 'imageContainer');
    image.addEventListener(
        'load',
        function(e) {
          image.parentNode.setAttribute('style', 'width: ' + image.width + "px");
        },
        false);
    image.setAttribute('src', whaTV.slides[whaTV.pointer].resource);
    image.setAttribute('class', 'imageSlide');
    return globalWrapper;
  },

  loadVideo: function() {
    var videoContainerDiv = document.createElement('div'),
        video = document.createElement('video'),
        resources = whaTV.slides[whaTV.pointer].resources,
        source,
        index;
    videoContainerDiv.setAttribute('class', 'video_container');
    for (index in resources) {
      source = document.createElement('source');
      source.setAttribute('src', resources[index].resource);
      source.setAttribute('type', resources[index].codec);
      video.appendChild(source);
    }
    video.preload = true;
    videoContainerDiv.appendChild(video);
    return videoContainerDiv;
  },

  loadFlash: function(){
    var flash = document.createElement('embed');
    flash.setAttribute('src', whaTV.slides[whaTV.pointer].resource);
    flash.setAttribute('pluginspage', 'http://www.adobe.com/go/getflashplayer');
    flash.setAttribute('type', 'application/x-shockwave-flash');
    return flash;
  },


  // Pseudo-events
  onShow: function(div) {
    div = div[0]; // jQuery hack
    var videos = div.getElementsByTagName('video');
    if (videos.length) {
      videos[0].play();
    }
    if (window.ambimage) {
      // TODO add a boolean in json to know if we want original size or full size,
      // With ambimage or not.
      var ambiWrappers = div.getElementsByClassName('imageContainer');
      if (ambiWrappers.length === 1) {
        var ambimageWrapper = ambiWrappers[0];
        image = ambimageWrapper.getElementsByTagName('img')[0];
        ambimage.drawAmbimage(image);
      }
    }
  },

  onHide: function(div) {
    var videos = div[0].getElementsByTagName('video');
    if (videos.length) {
      videos[0].pause();
    }
  },


  // Utilities
  clearNode: function(node) {
    if (node.hasChildNodes()) {
      while (node.childNodes.length >= 1) {
        node.removeChild(node.firstChild);
      }
    }
  },

  getPointerModuloTwo: function() {
    var whereToDraw = 2 - whaTV.pointer % 2;
    if (!whaTV.even) {
      whereToDraw = whaTV.pointer % 2 + 1;
    }
    return whereToDraw;
  },

  getPointerModuloTwoPlusOne: function() {
    var whereToDraw = whaTV.pointer % 2 + 1;
    if (!whaTV.even) {
      whereToDraw = 2 - whaTV.pointer % 2;
    }
    return whereToDraw;
  }


  /*// Some ideas to some simpler event system
  onSlideTimeout2: function() {
    if (whaTV.ready) {
      whaTV.makeTransition();
    }
    else {
      whaTV.madeTransition = true;
    }
  },

  onNextSlideReady2: function() {
    if (whaTV.madeTransition) {
      whaTV.makeTransition();
    }
    else {
      whaTV.ready = true;
    }
  },*/
};

whaTV.init();

// Expose whaTV to the global object for debugging purposes
window.w = whaTV;
window.pause = function() {
  whaTV.ready = false;
  whaTV.notifyReadyOrGo = function() {return null;};
}
})(window);
