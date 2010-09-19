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
    $.get('slides.json', whaTV.showFirstSlide);
  },

  showFirstSlide: function(data) {
    whaTV.slides = JSON.parse(data).slides;
    // TODO : loading screen
    document.getElementById('content1').style.display = 'none';
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
        content = whaTV.loadFlash(whaTV.slides[whaTV.pointer].resource);
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
    hiddenContentDiv = document.getElementById('content' +
        whaTV.getPointerModuloTwoPlusOne());
    console.debug('Clearing content' + whaTV.getPointerModuloTwoPlusOne());
    whaTV.clearNode(hiddenContentDiv);
    console.debug('Load content' + whaTV.getPointerModuloTwoPlusOne());
    hiddenContentDiv.appendChild(content);
    // XXX : This is hightly experimental
    //if(content.play) ambiLight.create(content);
    // Simulating fire event when complete
    setTimeout(whaTV.onNextSlideReady, Math.random() * 4000);
  },

  makeTransition: function() {
    var divToHide = document.getElementById('content' +
                                            whaTV.getPointerModuloTwo()
                                           ),
        divToShow = document.getElementById('content' +
                                            whaTV.getPointerModuloTwoPlusOne()
                                           );
    console.log('makeTransition called. Showing slide number ' + whaTV.pointer +
                ' from #content' + whaTV.getPointerModuloTwoPlusOne() + '.');
    console.debug('Hidding content' + whaTV.getPointerModuloTwo());
    divToHide.style.display = 'none';
    whaTV.onHide(divToHide);
    console.debug('Showing content' + whaTV.getPointerModuloTwoPlusOne());
    divToShow.style.display = 'block';
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
    iframe.setAttribute('scrolling', 'no');
    // XXX : May be used to fire the onNextSlideReady event?
    //iframe.onload = function(){alert('lol')};
    return iframe;
  },

  loadImage: function() {
    var image = new Image(),
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper = document.createElement('div'),
        moduleIndex,
        modules = whaTV.slides[whaTV.pointer].modules;
    localWrapper.appendChild(image);
    localWrapper.setAttribute('class', 'localImageContainer');
    globalWrapper.appendChild(localWrapper);
    globalWrapper.setAttribute('class', 'imageContainer');
    for (moduleIndex in modules) {
      if (modules[moduleIndex] === 'ambimage') {
        globalWrapper.setAttribute('class',
                                   globalWrapper.className + ' ambimage');
      }
    }
    image.addEventListener(
        'load',
        function(e) {
          image.parentNode.setAttribute('style',
                                        'width: ' + image.width + 'px;');
        },
        false
    );
    image.setAttribute('src', whaTV.slides[whaTV.pointer].resource);
    image.setAttribute('class', 'imageSlide');
    return globalWrapper;
  },

  loadVideo: function() {
    var video = document.createElement('video'),
        resources = whaTV.slides[whaTV.pointer].resources,
        mode = whaTV.slides[whaTV.pointer].mode,
        index,
        resource,
        source,
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper,
        moduleIndex;
    video.preload = true;
    if (mode === 'original') {
      video.setAttribute('class', 'originalModeVideo');
      globalWrapper.appendChild(video);
    } else if (mode === 'ambilight') {
      video.setAttribute('class', 'ambilightModeVideo');
      localWrapper = document.createElement('div');
      localWrapper.appendChild(video);
      localWrapper.setAttribute('class', 'ambilightModeVideoLocalContainer');
      globalWrapper.appendChild(localWrapper);
      globalWrapper.setAttribute('class', 'ambilightModeVideoGlobalContainer');
      video.addEventListener(
        'loadedmetadata',
        function(e) {
          video.parentNode.setAttribute('style',
                                        'width: ' + video.videoWidth + 'px;');
          video.height = video.videoHeight;
          video.width = video.videoWidth;
        },
        false
      );
    }
    //video.addEventListener('canplaythrough', onpeutlire.)
    for (index in resources) {
      resource = resources[index].resource;
      if (false) {//resource in someregexp) {
        //video.appendChild(whaTV.loadFlash(someflash));
      }
      source = document.createElement('source');
      source.setAttribute('src', resources[index].resource);
      source.setAttribute('type', resources[index].codec);
      video.appendChild(source);
    }
    return globalWrapper;
  },

  loadFlash: function(flashObjectUrl) {
    var flash = document.createElement('embed');
    flash.setAttribute('src', flashObjectUrl);
    flash.setAttribute('pluginspage', 'http://www.adobe.com/go/getflashplayer');
    flash.setAttribute('type', 'application/x-shockwave-flash');
    return flash;
  },


  // Pseudo-events
  onShow: function(div) {
    var videos = div.getElementsByTagName('video'),
        video,
        ambimageWrapper,
        ambilight,
        image;
    if (videos.length) {
      video = videos[0];
      video.play();
      if (window.ambiLight) {
        ambilight = div.getElementsByClassName('ambilightModeVideo');
        if (ambilight.length === 1) {
          window.ambiLight.create(video);
          // Ugly hack, we have a CSS problem somewhere, we need to make
          // The browser 'reload' the style, otherwise canvas.offset is 0.
          setTimeout(function() {
               document.getElementById('content' + whaTV.getPointerModuloTwo()).
                   style.position = 'relative';
           }, 1);
        }
      }
    }
    if (window.ambimage) {
      ambimageWrapper = div.getElementsByClassName('ambimage');
      if (ambimageWrapper.length === 1) {
        ambimageWrapper = ambimageWrapper[0];
        image = ambimageWrapper.getElementsByTagName('img')[0];
        window.ambimage.drawAmbimage(image);
      }
    }
  },

  onHide: function(div) {
    var videos = div.getElementsByTagName('video');
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
};
})(window);
