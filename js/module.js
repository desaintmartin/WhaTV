'use strict';

window.WhaTV = window.WhaTV || {};

// Loaders. they return a fully populated node, ready to be appended
// To our page. Also responsible of calling onNextSlideReady when finished
// Loading.

// Common functions used in built-in modules. Example : fullscreen, crop.
WhaTV.common = {
  fullscreen: function fullscreen(image, size) {
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
  },

  fullscreenAmbilight: function fullscreenAmbilight(node) {
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
  },

  crop: function crop(nodeOrEvent) {
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
};

WhaTV.module = WhaTV.module || {};
WhaTV.module.html = {
  load: function loadIframe(slideReference, slide, onNextSlideReady, skipLoadingSlide) {
    var iframe = document.createElement('iframe');
    iframe.addEventListener('load',
                            function(e) {
                              onNextSlideReady(slideReference);
                            },
                            false);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('src', slide.resource);
    iframe.setAttribute('id', slideReference);
    iframe.setAttribute('scrolling', 'no');

    return iframe;
  },
  show: function showIframe(slideReference, div) {

  },
  hide: function hideIframe(slideReference, div) {

  }
};

WhaTV.module.image = {
  load: function loadImage(slideReference, slide, onNextSlideReady, skipLoadingSlide) {
    var image = new Image(),
        // One global image wrapper which respect whaTV style, put in #contentx.
        globalWrapper = document.createElement('div'),
        // One wrapper to do what you want inside, put in the global wrapper.
        localWrapper = document.createElement('div'),
        mode = slide.mode;
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
            WhaTV.common.fullscreen(image);
            break;
          case 'crop':
            WhaTV.common.crop(image);
            break;
          case 'ambimage':
            WhaTV.common.fullscreenAmbilight(image);
            break;
          default:
            image.parentNode.style.width = image.width + 'px';
            break;
          }
          onNextSlideReady(slideReference);
        },
        false
    );
    image.setAttribute('src', slide.resource);

    return globalWrapper;
  },
  show: function showImage(slideReference, div) {
    var ambimageWrapper,
        images = div.getElementsByClassName('image-slide'),
        image;
    if (images.length === 1) {
      image = images[0];
      if (window.ambimage && WhaTV.util.hasClassName(image, 'ambimage')) {
        ambimage.drawAmbimage(image);
      } else if (window.simpleAmbimage &&
          WhaTV.util.hasClassName(image, 'fullscreen')) {
        simpleAmbimage.create(image);
      }
    }
  },
  hide: function hideImage(slideReference, div) {

  }
};

WhaTV.module.video = {
  load: function loadVideo(slideReference, slide, onNextSlideReady, skipLoadingSlide) {
    var video = document.createElement('video'),
        resources = slide.resources,
        mode = slide.mode,
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
        // Fires event when browser thinks we can play.
        // Note : on iPhone, <video> won't load automatically. So if we are
        // on iPhone, we arbitrary call onNextSlideReady so that the user can
        // click in the video to manually start it.
        if (!(navigator.userAgent.match(/iPhone/i)) ||
            (navigator.userAgent.match(/iPod/i))) {
          video.addEventListener('canplaythrough',
            function() {
              onNextSlideReady(slideReference);
            },
          false);
        } else {
          setTimeout(function() {
            onNextSlideReady(slideReference);
          }, 1000);
        }
        break;
      }
    }
    // Nothing can be played. We skip this slide.
    if (!source) {
      console.warn('Unable to read video at slide number ' + slideReference +
                   '. Skipping and recovering now...');
      skipLoadingSlide(slideReference);
      video = document.createElement('div');
      WhaTV.util.addClassName(video, 'broken');
      return video;
    }
    // Here we can define modules
    switch (mode) {
      case 'ambilight':
        WhaTV.util.addClassName(video, 'ambilight-video');
        localWrapper = document.createElement('div');
        localWrapper.appendChild(video);
        WhaTV.util.addClassName(localWrapper, 'ambilight-video-wrap');
        globalWrapper.appendChild(localWrapper);
        globalWrapper.setAttribute('class',
                                   'ambilightModeVideoGlobalContainer');
        video.addEventListener(
          'loadedmetadata',
          function(e) {
            WhaTV.common.fullscreenAmbilight(video);
            video.parentNode.style.width = video.width + 'px';
          },
          false
        );
        break;
      case 'crop':
        video.addEventListener('loadedmetadata', WhaTV.common.crop, false);
        WhaTV.util.addClassName(video, 'cropModeVideo');
        globalWrapper.appendChild(video);
        break;
      case 'fullscreen':
      default:
        WhaTV.util.addClassName(video, 'fullscreenModeVideo');
        globalWrapper.appendChild(video);
        break;
    }
    // Finishing : params and src
    WhaTV.util.addClassName(video, 'video-slide');
    video.preload = 'auto';
    video.setAttribute('src', source);
    video.setAttribute('type', type);

    return globalWrapper;
  },
  show: function showVideo(slideReference, div, onSlideTimeout) {
    var videos = div.getElementsByClassName('video-slide'),
        video,
        ambilight;
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
    }
  },
  hide: function hideVideo(slideReference, div) {
    var videos = div.getElementsByTagName('video');
    if (videos.length) {
      videos[0].pause();
    }
  }
};

WhaTV.module.flash = {
  load: function loadFlash(slideReference, slide,
                           onNextSlideReady, skipLoadingSlide) {
    var flash;
    
    // If Flash is not supported
    if (!navigator.plugins["Shockwave Flash"]) {
      console.warn('Unable to load Flash at slide number ' + slideReference +
                   '. Skipping and recovering now...');
      skipLoadingSlide(slideReference);
      flash = document.createElement('div');
      WhaTV.util.addClassName(flash, 'broken');
      return flash;
    }

    flash = document.createElement('embed');
    // TODO this does not work. We arbitrarily set a timeout.
    setTimeout(function() {
                 onNextSlideReady(slideReference);
               },
               1000);
    //flash.addEventListener('load', onNextSlideReady, false);
    flash.setAttribute('src', slide.resource);
    flash.setAttribute('pluginspage', 'http://www.adobe.com/go/getflashplayer');
    flash.setAttribute('type', 'application/x-shockwave-flash');
    flash.setAttribute('wmode', 'transparent');

    return flash;
  },
  show: function showFlash(slideReference, div) {

  },
  hide: function hideFlash(slideReference, div) {

  }
};


/*
 * Youtube
 */
// Youtube API requires a onYouTubePlayerReady global function. Crap.
// So we implement this function, which will call every function we attach to.
function onYouTubePlayerReady(e) {
  console.warn(e)
  var fn;
  for (fn in onYouTubePlayerReady.fns) {
    if (onYouTubePlayerReady.fns.hasOwnProperty(fn)) {
      onYouTubePlayerReady.fns[fn](e);
    }
  }
}
// Document this …
onYouTubePlayerReady.attach = function attach(name, fn) {
  onYouTubePlayerReady.fns = onYouTubePlayerReady.fns || {};
  onYouTubePlayerReady.fns[name] = fn;
};
// … and that
onYouTubePlayerReady.detach = function detach(name) {
  var index;
  onYouTubePlayerReady.fns = onYouTubePlayerReady.fns || {};
      delete onYouTubePlayerReady.fns[name];
};

WhaTV.module.youtube = {
  load: function loadYoutube(slideReference, slide, onNextSlideReady, skipLoadingSlide) {
    // Defines the function used when our flash has loaded
    function callbackFunction(mplayerid) {
      if (mplayerid === playerid) {
        flash = document.getElementById(flashId);
        onNextSlideReady(slideReference);
      }
    }
    var content = document.createElement('div'),
        flash = document.createElement('object'),
        flashId = 'youtube-video' + slideReference,
        videoId = slide.resource,
        playerid = 'youtubeplayer' + slideReference,
        youtubeUrl = 'http://www.youtube.com/apiplayer?' +
        'enablejsapi=1&playerapiid=' + playerid;
    // Attaching callback function in use when youtube is ready
    onYouTubePlayerReady.attach(playerid, callbackFunction);
    //TODO setplaybackquality
    // Defines the youtube flash object
    flash.setAttribute('id', flashId);
    flash.setAttribute('data', youtubeUrl);
    flash.setAttribute('pluginspage', 'http://www.adobe.com/go/getflashplayer');
    flash.setAttribute('type', 'application/x-shockwave-flash');
    flash.setAttribute('videoid', videoId);
    WhaTV.util.addClassName(flash, 'youtube-slide');
    flash.innerHTML =
        '<param name="allowScriptAccess" value="always" />' +
        '<param name="WMODE" value="Transparent" />';
    // Defines the parent div
    WhaTV.util.addClassName(content, 'flash');
    content.appendChild(flash);
    return content;
  },
  show: function showYoutube(slideReference, div) {
    var objects = div.getElementsByClassName('youtube-slide'),
        object;
    if (objects.length === 1) {
      object = objects[0];
      // Grr, the Youtube API only support string as callbacks. no function.
      object.addEventListener('onStateChange',
                              'function(e) {if (e == 0) {' +
                                'WhaTV.core.onSlideTimeout(' +
                                  slideReference +
                                ');' +
                              '}}', false);
      object.loadVideoById(object.getAttribute('videoid'));
    }

  },
  hide: function hideYoutube(slideReference, div) {
    var youtube = div.getElementsByClassName('flash-slide');
    if (youtube.length) {
      swfobject.removeSWF(youtube[0].getAttribute('id'));
    }
    onYouTubePlayerReady.detach('youtubeplayer' + slideReference);
  }
};

