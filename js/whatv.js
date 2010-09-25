'use strict';

(function(window, undefined) {
// Inside of our object, we will always refer to 'whaTV' to fetch attributes.
var whaTV = {
  defaults: {
    // The html fetching method.
    // Can be one of the following : 'ajax' | 'iframe'
    htmlMethod: 'iframe',
    // The div ID of quickMessages
    quickMessagesDivId: 'quick-messages',
    // The div ID of date
    dateDivId: 'date'
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
  version: '0.0.6',

  /**
    * the constructor of whaTV
    */
  init: function() {
    // Reference to self
    var whaTV = this;
    // Getting slides
    if (window.JSON) {
      if (window.jQuery) {
        $.get('slides.json', whaTV.ignition);
      } else if (window.dojo) {
        dojo.xhrGet({
          url: 'slides.json',
          handleAs: 'text',
          load: whaTV.ignition
        });
      }
    } else {
      if (window.jQuery) {
        $.getJSON('slides.json', whaTV.ignition);
      } else if (window.dojo) {
        dojo.xhrGet({
          url: 'slides.json',
          handleAs: 'json',
          load: whaTV.ignition
        });
      }
    }
  },

  /**
    * Ignition of The Great Loop. Starts everything
    * @param {Element} data the data containing whaT to show.
    */
  ignition: function(data) {
    var informations = window.JSON ? JSON.parse(data) : data;
    whaTV.slides = informations.slides;
    if (window.timer) {
      timer.create(whaTV.defaults.dateDivId);
    }
    if (window.quickMessages) {
      quickMessages.create(
          informations.messages,
          whaTV.defaults.quickMessagesDivId
      );
    }
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
    setTimeout(whaTV.onNextSlideReady, 500);
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
    // Calls timeout when end of slide
    // If no timeout specified : do nothing. Only allow that for videos.
    if (whaTV.slides[whaTV.pointer].timeout) {
      setTimeout(whaTV.onSlideTimeout,
                 whaTV.slides[whaTV.pointer].timeout * 1000);
    }
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
        mode = whaTV.slides[whaTV.pointer].mode;
    image.setAttribute('class', 'image-slide ' + mode);
    localWrapper.appendChild(image);
    localWrapper.setAttribute('class', 'localImageContainer ' + mode);
    globalWrapper.appendChild(localWrapper);
    globalWrapper.setAttribute('class', 'imageContainer ' + mode);
    image.addEventListener(
        'load',
        function(e) {
          switch (mode) {
          case 'fullscreen':
            whaTV.fullscreen(image);
            break;
          case 'crop':
            whaTV.crop(image);
            break;
          case 'ambimage':
            whaTV.fullscreenAmbilight(image);
          default:
            image.parentNode.style.width = image.width + 'px';
          }
        },
        false
    );
    image.setAttribute('src', whaTV.slides[whaTV.pointer].resource);
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
    whaTV.addClassName(video, 'video-slide');
    switch (mode) {
    case 'ambilight':
      whaTV.addClassName(video, 'ambilight-video');
      localWrapper = document.createElement('div');
      localWrapper.appendChild(video);
      whaTV.addClassName(localWrapper, 'ambilight-video-wrap');
      globalWrapper.appendChild(localWrapper);
      globalWrapper.setAttribute('class', 'ambilightModeVideoGlobalContainer');
      video.addEventListener(
        'loadedmetadata',
        function(e) {
          whaTV.fullscreenAmbilight(video);
          video.parentNode.style.width = video.width + 'px';
        },
        false
      );
      break;
    case 'crop':
      video.addEventListener('loadedmetadata', whaTV.crop, false);
      whaTV.addClassName(video, 'cropModeVideo');
      globalWrapper.appendChild(video);
      break;
    case 'fullscreen':
    default:
      whaTV.addClassName(video, 'fullscreenModeVideo');
      globalWrapper.appendChild(video);
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


  /**
    * Responsible for doing everything when a slide is shown : start a video,
    * start ambilight, adding event listeners for end of videos, etc.
    **/
  onShow: function(div) {
    var videos = div.getElementsByClassName('video-slide'),
        video,
        ambimageWrapper,
        ambilight,
        images,
        image;
    if (videos.length === 1) {
      video = videos[0];
      video.addEventListener('stalled', whaTV.onSlideTimeout, false);
      video.addEventListener('ended', whaTV.onSlideTimeout, false);
      video.play();
      if (window.ambiLight) {
        ambilight = div.getElementsByClassName('ambilight-video');
        if (ambilight.length === 1) {
          window.ambiLight.create(video);
          // Ugly hack, we have a CSS problem somewhere, we need to make
          // The browser 'reload' the style, otherwise canvas.offset is 0.
          // Anyway nobody will ever read this, so I can do what I want, you
          // bastard.
          setTimeout(function() {
            //
            //        .==.        .==.
            //       //`^\\      //^`\\
            //      // ^ ^\(\__/)/^ ^^\\
            //     //^ ^^ ^/6  6\ ^^ ^ \\
            //    //^ ^^ ^/( .. )\^ ^ ^ \\
            //   // ^^ ^/\| v""v |/\^ ^ ^\\
            //  // ^^/\/ /  `~~`  \ \/\^ ^\\
            //  -----------------------------
            /// HERE BE DRAGONS
            document.getElementById('content' + whaTV.getPointerModuloTwo()).
                style.position = 'relative';
           }, 1);
        }
      }
    } else {
      images = div.getElementsByClassName('image-slide');
      if (images.length === 1) {
        image = images[0];
        if (window.ambimage && whaTV.hasClassName(image, 'ambimage')) {
          ambimage.drawAmbimage(image);
        } else if (window.simpleAmbimage &&
            whaTV.hasClassName(image, 'fullscreen')) {
          simpleAmbimage.create(image);
        }
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
    // Deleting DOM<->JS cycling references for IE to avoid mem leaks
    whaTV.purge(node);
    // Actually deleting children
    if (node.hasChildNodes()) {
      while (node.childNodes.length >= 1) {
        node.removeChild(node.firstChild);
      }
    }
  },

  purge: function purge(d) {
    var a = d.attributes, i, l, n;
    if (a) {
      l = a.length;
      for (i = 0; i < l; i += 1) {
        n = a[i].name;
        if (typeof d[n] === 'function') {
          d[n] = null;
        }
      }
    }
    a = d.childNodes;
    if (a) {
      l = a.length;
      for (i = 0; i < l; i += 1) {
        purge(d.childNodes[i]);
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
    // This looks complicated. And it is. So, instead of trying to understand
    // what it does, let the Safety Pig do its work & do not try to understand.
    var whereToDraw = whaTV.pointer % 2 + 1;
    // Safety Pig has landed!
    if (!whaTV.even) {
      //                               _
      //  _._ _..._ .-',     _.._(`))
      // '-. `     '  /-._.-'    ',/
      //    )         \            '.
      //   / _    _    |             \
      //  |  a    a    /              |
      //  \   .-.                     ;
      //   '-('' ).-'       ,'       ;
      //      '-;           |      .'
      //         \           \    /
      //         | 7  .__  _.-\   \
      //         | |  |  ``/  /`  /
      //        /,_|  |   /,_/   /
      //           /,_/      '`-'
      whereToDraw = 2 - whaTV.pointer % 2;
    }
    return whereToDraw;
  },

  hasClassName: function(node, className) {
    var index,
        classes = node.className.split(' ');
    className = className.toUpperCase();
    if (node.className) {
      for (index in classes) {
        if (className == classes[index].toUpperCase()) return node;
      }
    }
    return false;
  },

  addClassName: function(node, className) {
    if (whaTV.hasClassName(node, className)) return;
    if (node.className) {
      node.className = node.className + ' ' + className;
    } else {
      node.className = className;
    }
  },

  fullscreen: function(image, size) {
    var windowRatio = window.innerWidth / window.innerHeight,
        imgRatio = image.width / image.height,
        finalHeight;
    if (size === null) {
      size = '100%';
    }
    if (windowRatio > imgRatio) {
      image.style.height = '100%';
    } else {
      finalHeight = (window.innerWidth / image.width) * image.height;
      margin = Math.abs(finalHeight - window.innerHeight) / 2;
      image.parentNode.style.paddingTop = margin + 'px';
      image.style.width = '100%';
    }
  },

  fullscreenAmbilight: function(node) {
    var desiredWidth = window.innerWidth * 80 / 100,
        nodeRatio = node.videoWidth ? node.videoWidth / node.videoHeight :
                                      node.width / node.height,
        desiredHeight = desiredWidth / nodeRatio;
    // desiredHeight may be bigger than the window height minus margin (beurk)
    if (desiredHeight > (window.innerHeight - 40)) {
      desiredHeight = window.innerHeight - 40;
      desiredWidth = desiredHeight * nodeRatio;
    }
    // FIXME The "minus 10" is ugly, but it refers to the
    // CSS div.imageContainer.ambimage padding-top / 2
    margin = Math.abs(desiredHeight - window.innerHeight) / 2 - 10;
    node.parentNode.parentNode.style.paddingTop = margin + 'px';
    node.height = desiredHeight;
    node.width = desiredWidth;
  },

  crop: function(node) {
    if (node.target) {
      node = node.target;
    }
    var windowRatio = window.innerWidth / window.innerHeight,
        nodeHeight = node.videoHeight ? node.videoHeight : node.height,
        nodeWidth = node.videoWidth ? node.videoWidth : node.width,
        nodeRatio = nodeWidth / nodeHeight,
        finalHeight, finalWidth;
    if (windowRatio < nodeRatio) {
      finalWidth = window.innerHeight * nodeRatio;
      margin = - Math.abs(finalWidth - window.innerWidth) / 2;
      node.style.marginLeft = margin + 'px';
      node.style.height = '100%';
    } else {
      finalHeight = window.innerWidth / nodeRatio;
      margin = - Math.abs(finalHeight - window.innerHeight) / 2;
      node.style.marginTop = margin + 'px';
      node.style.width = '100%';
    }
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

// Expose whaTV to the global context for debugging purposes
window.w = whaTV;
window.p = window.pause = function() {
  whaTV.ready = false;
  whaTV.notifyReadyOrGo = function() {return null;};
};
window.pv = function() {
  p();
  document.getElementsByTagName('video')[0].pause();
};
})(window);
