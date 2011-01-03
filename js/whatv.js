'use strict';

//(function() {
  // Awful hack in global scope if we do not have console object
  if (!window.console) {
    window.console = {
      log: function log() {},
      debug: function debug() {},
      error: function error() {},
      warn: function warn() {}
    };
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
      // Array of Boolean to know if next slide has finished loading
      nextSlideReady = [],
      // Array of Boolean to know if current slide has tiggered timeout
      slideTimeout = [],
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
    loadPointedSlideIntoDOM(pointer); // Should be 0
    onSlideTimeout(slides.length - 1);
  }

  /**
    * Load into the DOM the pointed slide and its elements. calls
    * notifyReadyOrGo when Everything is loaded.
    * Assigns the results to one of the "content" divs, after having cleared it.
    **/
  function loadPointedSlideIntoDOM(slideReference) {
    var currentSlide = slides[slideReference],
        content;
    console.log('loadPointedSlideIntoDOM called. preparing slide number ' +
                slideReference);
    // Calls loaders method depending on slide type. Assigns the resulting
    // node to "content"
    switch (currentSlide.type) {
      case 'html':
        console.info('HTML file detected');
        content = loadIframe(slideReference);
        break;
      case 'flash':
        console.info('Flash file detected');
        content = loadFlash(slideReference, slides[slideReference].resource);
        break;
      case 'image':
        console.info('Image file detected');
        content = loadImage(slideReference);
        break;
      case 'video':
        console.info('Video file detected');
        content = loadVideo(slideReference);
        break;
      default:
        console.error('Unable to detect content type. Aborting.');
        break;
    }
    // Assigns result to the currently hidden "content" div
    content.setAttribute('id', 'content' + slideReference);
    content.style.display = 'none';
    document.getElementById('metacontent').appendChild(content);
  }

  /**
    * Responsible of hiding the "old" slide, and showing the new one
    **/
  function makeTransition() {
    var divToHide = document.getElementById('content' + ((slides.length +
                    (pointer - 1)) % slides.length)),
        divToShow = document.getElementById('content' + pointer),
        // This one is used to store the pointer for callbacks : in the future,
        // pointer will change, but not localPointer
        localPointer = pointer;
    console.log('makeTransition called. Showing slide number ' + pointer + '.');
    if (divToHide) {
      divToHide.style.display = 'none';
      onHide(divToHide);
      divToHide.parentNode.removeChild(divToHide);
    }
    if (divToShow && divToShow.style) {
      divToShow.style.display = 'block';
      onShow(pointer, divToShow);
    }
    // Calls timeout when end of slide
    // If no timeout specified : do nothing. Only allow that for videos.
    if (slides[pointer].timeout) {
      setTimeout(function() {
                   onSlideTimeout(localPointer);
                 },
                 slides[localPointer].timeout * 1000);
    }
    incrementPointer();
    loadPointedSlideIntoDOM(pointer);
  }

  /**
    * Called when the current shown slide has finished.
    **/
  function onSlideTimeout(slideReference) {
    slideReference = (slideReference) % slides.length;
    if (slideTimeout[slideReference]) {
      console.error('onSlideTimeout has already been called for this slide');
    } else {
      slideTimeout[slideReference] = true;
      notifyManager((slideReference + 1) % slides.length);
    }
  }

  /**
    * Called when a slide (probably the next) has finished preloading.
    **/
  function onNextSlideReady(slideReference) {
    if (nextSlideReady[slideReference]) {
      console.error('onNextSlideReady has already been called for this slide');
    } else {
      nextSlideReady[slideReference] = true;
      notifyManager(slideReference);
    }
  }

  /**
    * We switch to the next slide if the current one has reached timeout
    * and the next one has finished loading
    **/
  function notifyManager(slideReference) {
    var endedSlide = (slideReference - 1 + slides.length) % slides.length;
    if (nextSlideReady[slideReference] && slideTimeout[endedSlide]) {
      nextSlideReady[slideReference] = false;
      slideTimeout[endedSlide] = false;
      makeTransition();
    }
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
  function loadIframe(slideReference) {
    var iframe = document.createElement('iframe');
    iframe.addEventListener('load',
                            function(e) {
                              onNextSlideReady(slideReference);
                            },
                            false);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('src', slides[slideReference].resource);
    iframe.setAttribute('class', 'next_content');
    iframe.setAttribute('id', slideReference);
    iframe.setAttribute('scrolling', 'no');
    return iframe;
  }

  function loadImage(slideReference) {
    var image = new Image(),
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper = document.createElement('div'),
        mode = slides[slideReference].mode;
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
            break;
          default:
            image.parentNode.style.width = image.width + 'px';
            break;
          }
          onNextSlideReady(slideReference);
        },
        false
    );
    image.setAttribute('src', slides[slideReference].resource);
    return globalWrapper;
  }

  function loadVideo(slideReference) {
    var video = document.createElement('video'),
        resources = slides[slideReference].resources,
        resourcesLength,
        mode = slides[slideReference].mode,
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
      break;
    }
    // Firing event when browser think we can play.
    video.addEventListener('canplaythrough',
                           function() {
                             onNextSlideReady(slideReference);
                           },
                           false);
    resourcesLength = resources.length;
    for (index = 0; index < resourcesLength; index += 1) {
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
      console.warn('Unable to read video at slideReference=' + slideReference + '. Recovering now...');
      // We can't play the video : we skip it.
      onSlideTimeout(slideReference);
      onNextSlideReady(slideReference);
    }
    return globalWrapper;
  }

  function loadFlash(slideReference, flashObjectUrl) {
    var flash = document.createElement('embed');
    // TODO this does not work. We arbitrarily set a timeout.
    setTimeout(function() {
                 onNextSlideReady(slideReference);
               },
               1000);
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
  function onShow(slideReference, div) {
    var videos = div.getElementsByClassName('video-slide'),
        video,
        ambimageWrapper,
        ambilight,
        images,
        image;
    if (videos.length === 1) {
      video = videos[0];
      video.addEventListener('stalled',
                             function() {
                               onSlideTimeout(slideReference + 1);
                             },
                             false);
      video.addEventListener('ended',
                             function() {
                               onSlideTimeout(slideReference + 1);
                             },
                             false);
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
            document.getElementById('content' + slideReference).
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
  // Candidate to be removed
  function clearNode(node) {
    // Actually deleting children
    if (node.hasChildNodes()) {
      while (node.childNodes.length >= 1) {
        node.removeChild(node.firstChild);
      }
    }
  }

  function hasClassName(node, className) {
    var index,
        classes = node.className.split(' '),
        length = classes.length;
    className = className.toUpperCase();
    if (node.className) {
      for (index = 0; index < length; index += 1) {
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
        finalHeight,
        margin;
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
        desiredHeight = desiredWidth / nodeRatio,
        margin;
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
    node.parentNode.style.width = desiredWidth + 'px';
  }

  function crop(nodeOrEvent) {
    var node = nodeOrEvent.target ? nodeOrEvent.target : nodeOrEvent,
        windowRatio = window.innerWidth / window.innerHeight,
        nodeHeight = node.videoHeight ? node.videoHeight : node.height,
        nodeWidth = node.videoWidth ? node.videoWidth : node.width,
        nodeRatio = nodeWidth / nodeHeight,
        finalHeight, finalWidth,
        margin;
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

window.p = window.pause = function() {
  notifyManager = function() {return null;};
};
window.pv = function() {
  p();
  document.getElementsByTagName('video')[0].pause();
};
//})();
