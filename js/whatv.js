'use strict';

(function() {
  // Awful hack in global scope if we do not have console object
  if (!window.console) {
    window.console = {
      log: function log(){},
      debug: function debug(){},
      error: function error(){}
    }
  }
  var defaults = {
    // The div ID of quickMessages
    quickMessagesDivId: 'quick-messages',
    // The div ID of date
    dateDivId: 'date'
  },
      // Pointer to current slide
      pointer = 0,
      // Ugly hack to know where to show the slide if not even.
      even = true,
      // The informations about slides to show
      slides = [],
      // Current loaded slide as a DOM node
      // TODO replace it by array, to store past slides in memory?
      //loadedSlide: null,
      // Boolean to know if next slide is ready to show
      ready = false,
      
      // The current version of whaTV being used
      version = '0.1.0';

  // Getting slides
  if (window.JSON) {
    if (window.jQuery) {
      $.get('slides.json', ignition);
    } else if (window.dojo) {
      dojo.xhrGet({
        url: 'slides.json',
        handleAs: 'text',
        load: ignition
      });
    }
  } else {
    if (window.jQuery) {
      $.getJSON('slides.json', ignition);
    } else if (window.dojo) {
      dojo.xhrGet({
        url: 'slides.json',
        handleAs: 'json',
        load: ignition
      });
    }
  }
  
  /**
    * Ignition of The Great Loop. Starts The Everything.
    * @param {Element} data the data containing whaT to show.
    */
  function ignition(data) {
    var informations = window.JSON ? JSON.parse(data) : data;
    slides = informations.slides;
    if (window.timer) {
      timer.create(defaults.dateDivId);
    }
    if (window.quickMessages) {
      quickMessages.create(
          informations.messages,
          defaults.quickMessagesDivId
      );
    }
    // TODO : loading screen
    document.getElementById('content1').style.display = 'none';
    loadPointedSlideIntoDOM();
  }

  /**
    * Load into the DOM the pointed slide and its elements. calls
    * notifyReadyOrGo when Everything is loaded.
    * Assigns the results to one of the "content" divs, after having cleared it.
    **/
  function loadPointedSlideIntoDOM() {
    console.log('loadPointedSlideIntoDOM called. preparing slide number ' +
                pointer);
    ready = false;
    var currentSlide = slides[pointer],
        content,
        hiddenContentDiv = document.getElementById('content' +
            getPointerModuloTwoPlusOne());
    // Clears the currently hidden div
    console.debug('Clearing content' + getPointerModuloTwoPlusOne());
    clearNode(hiddenContentDiv);
    // Calls loaders method depending on slide type. Assigns the resulting
    // node to "content"
    switch (currentSlide.type) {
      case 'html':
        console.debug('HTML file detected');
        content = loadIframe();
        break;
      case 'flash':
        console.debug('Flash file detected');
        content = loadFlash(slides[pointer].resource);
        break;
      case 'image':
        console.debug('Image file detected');
        content = loadImage();
        break;
      case 'video':
        console.debug('Video file detected');
        content = loadVideo();
        break;
    }
    // Assigns result to the currently hidden "content" div
    console.debug('Load content' + getPointerModuloTwoPlusOne());
    hiddenContentDiv.appendChild(content);
  }

  /**
    * Responsible of hiding the "old" slide, and showing the new one
    **/
  function makeTransition() {
    var divToHide = document.getElementById('content' +
                                            getPointerModuloTwo()
                                           ),
        divToShow = document.getElementById('content' +
                                            getPointerModuloTwoPlusOne()
                                           );
    console.log('makeTransition called. Showing slide number ' + pointer +
                ' from #content' + getPointerModuloTwoPlusOne() + '.');
    console.debug('Hidding content' + getPointerModuloTwo());
    divToHide.style.display = 'none';
    onHide(divToHide);
    console.debug('Showing content' + getPointerModuloTwoPlusOne());
    divToShow.style.display = 'block';
    onShow(divToShow);
    notifyReadyOrGo = function() {ready = true;};
    // Calls timeout when end of slide
    // If no timeout specified : do nothing. Only allow that for videos.
    if (slides[pointer].timeout) {
      setTimeout(onSlideTimeout,
                 slides[pointer].timeout * 1000);
    }
    incrementPointer();
    loadPointedSlideIntoDOM();
  }

  /**
    * Called when the current showed slide has finished.
    **/
  function onSlideTimeout() {
    if (ready) {
      makeTransition();
    }
    else {
      notifyReadyOrGo = function() {makeTransition();};
    }
  }

  /**
    * Called when the next slide has finished preloading. Wrapper function,
    * for comprehension.
    **/
  function onNextSlideReady() {
    notifyReadyOrGo();
  }

  /**
    * Called when a slide is ready or when a slide has finished.
    * This method will be monkeypatched depending on the context : 
    * If both event have fired, will trigger the next slide, 
    * Else, will trigger a 'next slide is ready' ready boolean.
    **/
  function notifyReadyOrGo() {
    // This function will be overwritten by makeTransition and onSlideTimeout
    // This code is used as is ONLY for first iteration
    makeTransition();
  }

  /**
    * Increments the pointer. If last slide has been reached, we start again.
    **/
  function incrementPointer() {
    pointer = pointer + 1;
    if (pointer === slides.length) {
      pointer = 0;
      if (slides.length % 2) {
        even = !even;
      }
    }
  }


  // Loaders. they return a fully populated node, ready to be appended
  // To our page. Also responsible of calling onNextSlideReady when finished
  // Loading.
  function loadIframe() {
    var iframe = document.createElement('iframe');
    iframe.addEventListener('load', onNextSlideReady, false);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('src', slides[pointer].resource);
    iframe.setAttribute('class', 'next_content');
    iframe.setAttribute('id', pointer);
    iframe.setAttribute('scrolling', 'no');
    return iframe;
  }

  function loadImage() {
    var image = new Image(),
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper = document.createElement('div'),
        mode = slides[pointer].mode;
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
            image.parentNode.style.height = '100%';
            fullscreen(image);
            break;
          case 'crop':
            crop(image);
            break;
          case 'ambimage':
            fullscreenAmbilight(image);
          default:
            image.parentNode.style.width = image.width + 'px';
          }
          onNextSlideReady();
        },
        false
    );
    image.setAttribute('src', slides[pointer].resource);
    return globalWrapper;
  }

  function loadVideo() {
    var video = document.createElement('video'),
        resources = slides[pointer].resources,
        mode = slides[pointer].mode,
        index,
        resource,
        source,
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper,
        moduleIndex,
        canPlay = false;
    video.preload = true;
    addClassName(video, 'video-slide');
    switch (mode) {
    case 'ambilight':
      addClassName(video, 'ambilight-video');
      localWrapper = document.createElement('div');
      localWrapper.appendChild(video);
      addClassName(localWrapper, 'ambilight-video-wrap');
      globalWrapper.appendChild(localWrapper);
      globalWrapper.setAttribute('class', 'ambilightModeVideoGlobalContainer');
      video.addEventListener(
        'loadedmetadata',
        function(e) {
          fullscreenAmbilight(video);
          video.parentNode.style.width = video.width + 'px';
        },
        false
      );
      break;
    case 'crop':
      video.addEventListener('loadedmetadata', crop, false);
      addClassName(video, 'cropModeVideo');
      globalWrapper.appendChild(video);
      break;
    case 'fullscreen':
    default:
      addClassName(video, 'fullscreenModeVideo');
      globalWrapper.appendChild(video);
    }
    // Firing event when browser think we can play.
    video.addEventListener('canplaythrough', onNextSlideReady, false);
    for (index in resources) {
      resource = resources[index].resource;
      //TODO if codec === "flash"
      //video.appendChild(loadFlash(someflash));
      if (video.canPlayType(resources[index].codec)) {
        canPlay = true;
        source = document.createElement('source');
        source.setAttribute('src', resources[index].resource);
        source.setAttribute('type', resources[index].codec);
        video.appendChild(source);
      }
    }
    source = document.createElement('h1');
    source.innerHTML = 'Unable to read video. Please wait while recovering...';
    video.appendChild(source);
    if (!canPlay) {
      // We can't play the video : we skip it.
      onNextSlideReady();
      onSlideTimeout();
    }
    return globalWrapper;
  }

  function loadFlash(flashObjectUrl) {
    var flash = document.createElement('embed');
    // TODO this does not work. We arbitrarily set a timeout.
    setTimeout(onNextSlideReady, 1000);
    //flash.addEventListener('load', onNextSlideReady, false);
    flash.setAttribute('src', flashObjectUrl);
    flash.setAttribute('pluginspage', 'http://www.adobe.com/go/getflashplayer');
    flash.setAttribute('type', 'application/x-shockwave-flash');
    return flash;
  }


  /**
    * Responsible for doing everything when a slide is shown : start a video,
    * start ambilight, adding event listeners for end of videos, etc.
    **/
  function onShow(div) {
    var videos = div.getElementsByClassName('video-slide'),
        video,
        ambimageWrapper,
        ambilight,
        images,
        image;
    if (videos.length === 1) {
      video = videos[0];
      video.addEventListener('stalled', onSlideTimeout, false);
      video.addEventListener('ended', onSlideTimeout, false);
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
            document.getElementById('content' + getPointerModuloTwo()).
                style.position = 'relative';
           }, 1);
        }
      }
    } else {
      images = div.getElementsByClassName('image-slide');
      if (images.length === 1) {
        image = images[0];
        if (window.ambimage && hasClassName(image, 'ambimage')) {
          ambimage.drawAmbimage(image);
        } else if (window.simpleAmbimage &&
            hasClassName(image, 'fullscreen')) {
          simpleAmbimage.create(image);
        }
      }
    }
  }

  function onHide(div) {
    var videos = div.getElementsByTagName('video');
    if (videos.length) {
      videos[0].pause();
    }
  }


  // Utilities
  function clearNode(node) {
    // Deleting DOM<->JS cycling references for IE to avoid mem leaks
    purge(node);
    // Actually deleting children
    if (node.hasChildNodes()) {
      while (node.childNodes.length >= 1) {
        node.removeChild(node.firstChild);
      }
    }
  }

  /**
    * Candidate to be removed : IE is not a target for 
    **/
  function purge(d) {
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
  }

  function getPointerModuloTwo() {
    var whereToDraw = 2 - pointer % 2;
    if (!even) {
      whereToDraw = pointer % 2 + 1;
    }
    return whereToDraw;
  }

  function getPointerModuloTwoPlusOne() {
    // This looks complicated. And it is. So, instead of trying to understand
    // what it does, let the Safety Pig do its work & do not try to understand.
    var whereToDraw = pointer % 2 + 1;
    // Safety Pig has landed!
    if (!even) {
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
      whereToDraw = 2 - pointer % 2;
    }
    return whereToDraw;
  }

  function hasClassName(node, className) {
    var index,
        classes = node.className.split(' ');
    className = className.toUpperCase();
    if (node.className) {
      for (index in classes) {
        if (className == classes[index].toUpperCase()) return node;
      }
    }
    return false;
  }

  function addClassName(node, className) {
    if (hasClassName(node, className)) return;
    if (node.className) {
      node.className = node.className + ' ' + className;
    } else {
      node.className = className;
    }
  }

  function fullscreen(image, size) {
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
  }

  function fullscreenAmbilight(node) {
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
  }

  function crop(node) {
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

// Expose whaTV to the global context for debugging purposes
window.w = this;
window.p = window.pause = function() {
  ready = false;
  notifyReadyOrGo = function() {return null;};
};
window.pv = function() {
  p();
  document.getElementsByTagName('video')[0].pause();
};
})();
