'use strict';

var WhaTV = (function(window) {
  // Awful hack in global scope if we do not have console object
  if (!window.console) {
    window.console = {
      log: function log() {},
      info: function info() {},
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
      // A pointer to the current setTimeout, so that we can clear it
      currentTimeout = null,
      // The current version of whaTV being used
      version = '0.2.4';

  // Getting slides
  parseJSON('slides.json', ignition);

  /**
    * Ignition of The Great Loop. Starts The Everything, and put it in
    * fullscreen if supported.
    * @param {Element} data the data containing whaT to show.
    */
  function ignition(data) {
    var informations = window.JSON ? JSON.parse(data) : data;
    turnOnFullscreenIfSupported();
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
    **/
  function loadPointedSlideIntoDOM(slideReference) {
    var currentSlide = slides[slideReference];
    console.log('loadPointedSlideIntoDOM called. preparing slide number ' +
                slideReference);
    // Calls loaders method depending on slide type. Assigns the resulting
    // node to 'content'
    switch (currentSlide.type) {
      case 'html':
        console.info('HTML file detected');
        loadIframe(slideReference);
        break;
      case 'flash':
        console.info('Flash file detected');
        loadFlash(slideReference);
        break;
      case 'image':
        console.info('Image file detected');
        loadImage(slideReference);
        break;
      case 'video':
        console.info('Video file detected');
        loadVideo(slideReference);
        break;
      case 'youtube':
        console.info('Youtube video detected');
        loadYoutube(slideReference);
        break;
      default:
        console.error('FATAL : Unable to detect content type. Aborting.');
        break;
    }
  }

  /**
    * Function used to insert the content calculated by loadIage/loadVideo/etc
    * Into the div called 'metacontent'
    */
  function insertIntoMetacontent(content, slideReference) {
    content.setAttribute('id', 'content' + slideReference);
    addClassName(content, 'nextSlide');
    document.getElementById('metacontent').appendChild(content);
  }
  
  /**
    * Function used to insert the content calculated by loadIage/loadVideo/etc
    * Into the div called 'metacontent'. Does not hide the div,
    * because youtube does not like it.
    */
  function insertIntoMetacontentForFlash(content, slideReference) {
    content.setAttribute('id', 'content' + slideReference);
    addClassName(content, 'nextSlideFlash');
    document.getElementById('metacontent').appendChild(content);
  }

  /**
    * Responsible of hiding the 'old' slide, and showing the new one
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
      removeClassName(divToHide, 'currentSlide');
      addClassName(divToHide, 'pastSlide');
      onHide(divToHide);
      divToHide.parentNode.removeChild(divToHide);
    }
    if (divToShow && divToShow.style) {
      removeClassName(divToShow, 'nextSlide');
      removeClassName(divToShow, 'nextSlideFlash');
      addClassName(divToShow, 'currentSlide');
      onShow(pointer, divToShow);
    }
    // Calls timeout when end of slide
    // If no timeout specified : do nothing. Only allow that for videos.
    if (slides[pointer].timeout) {
      currentTimeout = setTimeout(function() {
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
    console.log(slideReference, pointer)
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
      // Clears the timeout, if present.
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
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

    insertIntoMetacontent(iframe, slideReference);
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

    insertIntoMetacontent(globalWrapper, slideReference);
  }

  function loadVideo(slideReference) {
    var video = document.createElement('video'),
        resources = slides[slideReference].resources,
        mode = slides[slideReference].mode,
        index,
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper,
        moduleIndex,
        source,
        type;
    // Looks for a video we can play
    for (index = 0; index < resources.length; index += 1) {
      if (video.canPlayType(resources[index].codec)) {
        source = resources[index].resource;
        type = resources[index].codec;
        // Fires event when browser think we can play.
        video.addEventListener('canplaythrough',
          function() {
            onNextSlideReady(slideReference);
          },
        false);
        break;
      }
    }
    // Nothing can be played. We skip this slide.
    if (!source) {
      console.warn('Unable to read video at slide number ' + slideReference +
                   '. Skipping and recovering now...');
      onSlideTimeout(slideReference);
      onNextSlideReady(slideReference);
      video = document.createElement('div');
      addClassName(video, 'broken');
      return document.createElement('div');
    }
    // Here we can define modules
    switch (mode) {
      case 'ambilight':
        addClassName(video, 'ambilight-video');
        localWrapper = document.createElement('div');
        localWrapper.appendChild(video);
        addClassName(localWrapper, 'ambilight-video-wrap');
        globalWrapper.appendChild(localWrapper);
        globalWrapper.setAttribute('class',
                                   'ambilightModeVideoGlobalContainer');
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
    // Finishing : params and src
    addClassName(video, 'video-slide');
    video.preload = 'auto';
    video.setAttribute('src', source);
    video.setAttribute('type', type);

    insertIntoMetacontent(globalWrapper, slideReference);
  }

  function loadFlash(slideReference) {
    var flash = document.createElement('embed');
    // TODO this does not work. We arbitrarily set a timeout.
    setTimeout(function() {
                 onNextSlideReady(slideReference);
               },
               1000);
    //flash.addEventListener('load', onNextSlideReady, false);
    flash.setAttribute('src', slides[slideReference].resource);
    flash.setAttribute('pluginspage', 'http://www.adobe.com/go/getflashplayer');
    flash.setAttribute('type', 'application/x-shockwave-flash');

    insertIntoMetacontent(flash, slideReference);
  }

  function loadYoutube(slideReference) {
    var swfobject = window.swfobject,
        content = document.createElement('div'),
        flash = document.createElement('div'),
        flashId = 'youtube-video' + slideReference,
        videoId = slides[slideReference].resource,
        callbackFunction;
    // Tests for swfobject presence
    if (!swfobject) {
      console.error('FATAL : SWFObject not found.');
      //TODO onSlideTimeout(slideReference)
      return flash;
    }
    // Adds a sub-div (will be transformed by swfobject) into our content div
    flash.setAttribute('id', flashId);
    content.appendChild(flash);
    insertIntoMetacontentForFlash(content, slideReference);
    // Defines the function used when our flash has loaded
    callbackFunction = function(e) {
      if (e.success) {
        flash = document.getElementById(flashId);
        onNextSlideReady(slideReference);
      } else {
        console.error('Failed to load youtube flash object.');
        //TODO nextslide
      }
    }
    //TODO setplaybackquality
    // Loads the youtube flash object
    swfobject.embedSWF(
      'http://www.youtube.com/apiplayer?version=3&enablejsapi=1' +
        '&playerapiid=mycontent' + slideReference,
      flashId,
      '100%',
      '100%',
      '9',
      false,
      false,
      { allowScriptAccess: 'always', WMODE: 'Transparent' },
      { videoid: videoId, class: 'youtube-slide flash-slide' },
      callbackFunction
    );
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
        images = div.getElementsByClassName('image-slide'),
        image,
        objects = div.getElementsByClassName('youtube-slide'),
        object;
    // If our div is broken (example : bad video) we return immediatly
    if (hasClassName(div, 'broken')) {
      return;
    }
    if (videos.length === 1) {
      video = videos[0];
      video.addEventListener('stalled',
                             function() {
                               onSlideTimeout(slideReference);
                             },
                             false);
      video.addEventListener('ended',
                             function() {
                               onSlideTimeout(slideReference);
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
            //   // ^^ ^/\| v''v |/\^ ^ ^\\
            //  // ^^/\/ /  `~~`  \ \/\^ ^\\
            //  -----------------------------
            /// HERE BE DRAGONS
            document.getElementById('content' + slideReference).
                style.position = 'relative';
           }, 1);
        }
      }
    } else if (images.length === 1) {
      image = images[0];
      if (window.ambimage && hasClassName(image, 'ambimage')) {
        ambimage.drawAmbimage(image);
      } else if (window.simpleAmbimage &&
          hasClassName(image, 'fullscreen')) {
        simpleAmbimage.create(image);
      }

    } else if (objects.length === 1) {
      object = objects[0];
      object.addEventListener('onStateChange',
                              'function(e) {if (e == 0) {' +
                                'WhaTV.onSlideTimeout(' + slideReference + ');'+
                              '}}', false);
      object.loadVideoById(object.getAttribute('videoid'));
    }
  }

  /**
    * Called to stop and clean the finished slide
    */
  function onHide(div) {
    var videos = div.getElementsByTagName('video'),
        youtube = div.getElementsByClassName('flash-slide');
    if (videos.length) {
      videos[0].pause();
    } else if (youtube.length) {
      swfobject.removeSWF(youtube[0].getAttribute('id'));
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
    node.className.replace(/ +/g,' ');
  }
  
  function removeClassName(node, className) {
    var reg;
    if (!hasClassName(node, className)) return;
    reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
    node.className = node.className.replace(reg, '');
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
    // FIXME The 'minus 10' is ugly, but it refers to the
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

  function parseJSON(url, callback) {
    if (window.JSON) {
      if (window.jQuery) {
        $.get(url, ignition);
      } else if (window.dojo) {
        dojo.xhrGet({
          url: url,
          handleAs: 'text',
          load: callback
        });
      }
    } else {
      if (window.jQuery) {
        $.getJSON(url, ignition);
      } else if (window.dojo) {
        dojo.xhrGet({
          url: url,
          handleAs: 'json',
          load: callback
        });
      }
    }
  }

  /*
    * Test if fullscreen if supported. If so, turn it on.
    * Please see :
    * https://bugs.webkit.org/show_bug.cgi?id=49481
    * https://wiki.mozilla.org/index.php?title=Gecko:FullScreenAPI
    */
  function turnOnFullscreenIfSupported() {
    var body = document.getElementsByTagName('body')[0],
        fullscreenMethodList = ['webkitRequestFullScreen', 'requestFullScreen'],
        fullscreenMethodListLength = fullscreenMethodList.length,
        requestFullscreenMethod = null,
        index;
    for (index = 0; index < fullscreenMethodListLength; index = index + 1) {
      if (body[fullscreenMethodList[index]]) {
        requestFullscreenMethod = fullscreenMethodList[index];
      }
    }
    if (requestFullscreenMethod) {
      body[requestFullscreenMethod]();
    }
  }

  // Debug
  window.p = window.pause = function() {
    notifyManager = function() {return null;};
  };
  window.pv = function() {
    p();
    document.getElementsByTagName('video')[0].pause();
  };

  return {
    parseJSON: parseJSON,
    version: version,
    onSlideTimeout: onSlideTimeout,
    next: function() {onSlideTimeout(pointer);}
  };
})(window);
