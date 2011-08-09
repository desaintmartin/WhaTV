window.WhaTV = window.WhaTV || {};

// We use global as argument to not depend on an environment. Usually, it is
// "window" in web browsers.
WhaTV.core = (function WhaTVCoreClosure(global, WhaTV) {
  // ECMAScript 5 strict mode, function scope.
  'use strict';

  // Awful hack in global scope if we do not have console object
  if (!global.console) {
    global.console = {
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
    dateDivId: 'date',
    fullscreen: true,
    transitionDuration: 1000
  },
      // Pointer to current slide
      pointer = 0,
      // The informations about slides to show
      slides = [],
      // Array of Boolean to know if next slide has finished loading
      nextSlideReady = [],
      // Array of Boolean to know if current slide has tiggered timeout
      slideTimeout = [],
      // A pointer to the current setTimeout, so that we can clear it
      currentTimeout = null,
      // A reference to a potential listener to call in order to send
      // informations about each slide
      informationListener = null,
      // The current version of whaTV being used
      version = '0.5.3';

  /**
   * Ignition of The Great Loop. Starts The Everything, and put it in
   * fullscreen if supported.
   * @param {Element} data the data containing whaT to show.
   */
  function ignition(data) {
    if (defaults.fullscreen) {
      WhaTV.util.turnOnFullscreenIfSupported();
    }
    slides = data.slides;
    if (WhaTV.timer) {
      WhaTV.timer.create(defaults.dateDivId);
    }
    if (WhaTV.quickMessages) {
      WhaTV.quickMessages.create(
          data.messages,
          defaults.quickMessagesDivId
      );
    }
    loadPointedSlideIntoDOM(pointer); // pointer is 0 at this point
    onSlideTimeout(slides.length - 1);
  }

  /**
   * Load into the DOM the pointed slide and its elements. calls
   * notifyReadyOrGo when Everything is loaded.
   */
  function loadPointedSlideIntoDOM(slideReference) {
    var currentSlide = slides[slideReference],
        moduleName = currentSlide.type,
        content;
    global.console.log('loadPointedSlideIntoDOM called. preparing slide ' + 
                       'number ' + slideReference);
    // Calls loaders method depending on slide type. Assigns the resulting
    // node to 'content'
    if (WhaTV.module &&
        WhaTV.module[moduleName] &&
        WhaTV.module[moduleName].load) {
      try {
        content = WhaTV.module[currentSlide.type].load(slideReference,
                                                       currentSlide,
                                                       onNextSlideReady,
                                                       skipLoadingSlide);
        content.setAttribute('whatvslidetype', currentSlide.type);
        insertIntoMetacontent(content, slideReference);
      } catch (e) {
        console.error("Module " + moduleName + " crashed when loading for " +
                      "slide number " + pointer + " : " + e);
        skipLoadingSlide(slideReference);
      }
    } else {
      global.console.error('FATAL : Unable to detect content type. Aborting.');
    }
  }

  /**
   * Function used to insert the content calculated by loadIage/loadVideo/etc
   * Into the div called 'metacontent'. If swfobject, Does not hide the div,
   * because swfobject does not like it.
   */
  function insertIntoMetacontent(content, slideReference) {
    content.setAttribute('id', 'content' + slideReference);
    // FIXME Hardcoded. No module should interfere with core. Either improve
    // The module, or improve the core.
    if (WhaTV.util.hasClassName(content, 'flash')) {
      WhaTV.util.addClassName(content, 'nextSlideFlash');
      global.document.getElementById('metacontent').appendChild(content);
    } else {
      WhaTV.util.addClassName(content, 'nextSlide');
      global.document.getElementById('metacontent').appendChild(content);
    }
  }


  /**
   * Responsible of hiding the 'old' slide, showing the new one, setting a
   * timeout and call an external callback to send informations about the
   * new slide.
   */
  function makeTransition() {
    var finishedSlideIndex = (slides.length + (pointer - 1)) % slides.length,
        divToHide = global.document.getElementById('content' +
                                                   finishedSlideIndex),
        divToShow = global.document.getElementById('content' + pointer),
        // This one is used to store the pointer for callbacks : in the future,
        // pointer will change, but not localPointer
        localPointer = pointer;
    global.console.log('makeTransition called. Showing slide number ' +
                       pointer + '.');
    // If previous slide was broken, and current one is broken too (!)
    if (!divToShow) {
      //TODO debug and clean this code, this has nothing to do here.
      // This code put a zombie hidden empty div in metacontent.
      divToHide.setAttribute('id', 'content' + pointer);
      incrementPointer();
      loadPointedSlideIntoDOM(pointer);
      return;
    }
    // If slide is broken, we skip everything
    if (WhaTV.util.hasClassName(divToShow, 'broken')) {
      divToShow.parentNode.removeChild(divToShow);
      divToHide.setAttribute('id', 'content' + pointer);
      incrementPointer();
      loadPointedSlideIntoDOM(pointer);
      return;
    }
    // Destroys the old slide
    if (divToHide) {
      WhaTV.util.removeClassName(divToHide, 'currentSlide');
      WhaTV.util.addClassName(divToHide, 'pastSlide');
      onHide(finishedSlideIndex, divToHide);
      divToHide.parentNode.removeChild(divToHide);
    }
    // We do a setTimeout here because we want a "transition" - i.e a halt -
    // Between the two slides. Like advertising on TV.
    setTimeout(function() {
      // Shows the new slide
      if (divToShow) {
        WhaTV.util.removeClassName(divToShow, 'nextSlide');
        WhaTV.util.removeClassName(divToShow, 'nextSlideFlash');
        WhaTV.util.addClassName(divToShow, 'currentSlide');
        onShow(pointer, divToShow);
      }
      // Calls a callback, if specified.
      if (informationListener) {
        informationListener(slides[localPointer]);
      }
      // Launch a timeout which will notify that the slide must stop when
      // time is up.
      // If no timeout specified : do nothing. Only allow that for videos.
      if (slides[pointer].timeout) {
        currentTimeout = global.setTimeout(function() {
                     onSlideTimeout(localPointer);
                   },
                   slides[localPointer].timeout * 1000);
      }
      incrementPointer();
      loadPointedSlideIntoDOM(pointer);
    }, defaults.transitionDuration);
  }

  /**
   * Called when the current shown slide has finished.
   */
  function onSlideTimeout(slideReference) {
    slideReference = (slideReference) % slides.length;
    if (slideTimeout[slideReference]) {
      global.console.error('onSlideTimeout has already been called for this' +
                           ' slide');
    } else {
      slideTimeout[slideReference] = true;
      notifyManager((slideReference + 1) % slides.length);
    }
  }

  /**
   * Called when a slide (probably the next, but not always) has finished
   * preloading.
   */
  function onNextSlideReady(slideReference) {
    if (nextSlideReady[slideReference]) {
      global.console.error('onNextSlideReady has already been called for' +
                           ' this slide');
    } else {
      nextSlideReady[slideReference] = true;
      notifyManager(slideReference);
    }
  }

  /**
   * This function acts as a filter when something calls to show next slide.
   * We switch to the next slide only if the current one has reached timeout
   * AND if the next one has finished loading.
   */
  function notifyManager(slideReference) {
    var endedSlide = (slideReference - 1 + slides.length) % slides.length;
    if (nextSlideReady[slideReference] && slideTimeout[endedSlide]) {
      nextSlideReady[slideReference] = false;
      slideTimeout[endedSlide] = false;
      // Clears the timeout, if present. Can happen if slide decided by itself
      // to finish, or if the slide is/has broke(n).
      if (currentTimeout) {
        global.console.debug("Remaining timeout");
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
      makeTransition();
    }
  }

  /**
   * Used when the loading slide can't be played. Deletes this slide and load
   * the next one.
   */
  function skipLoadingSlide(slideReference) {
    console.warn("Skipping slide number " + slideReference);
    onSlideTimeout(slideReference);
    onNextSlideReady(slideReference);
  }

  /**
   * Increments the pointer. If last slide has been reached, we start again.
   */
  function incrementPointer() {
    pointer = (pointer + 1) % (slides.length);
  }


  /**
   * Responsible for doing everything when a slide is shown : start a video,
   * start ambilight, adding event listeners for end of videos, etc.
   */
  function onShow(slideReference, div) {
    var moduleName = getModuleName(div);
    // If our div is broken (example : bad video) we return immediatly
    if (WhaTV.util.hasClassName(div, 'broken')) {
      return;
    }
    try {
      // Calls 'show' method of module
      WhaTV.module[moduleName].show(slideReference, div, onSlideTimeout);
    } catch (e) {
      // Module has crashed. Fortunately we don't trust it, and we skip it.
      console.error("Module " + moduleName + " crashed when showing slide " +
                    "number " + pointer + " : \n" + e.stack);
      onSlideTimeout(slideReference);
    }
  }

  /**
   * Called to stop and clean the finished slide
   */
  function onHide(slideReference, div) {
    var moduleName = getModuleName(div);
    // If our div is broken (example : bad video) we return immediatly
    if (WhaTV.util.hasClassName(div, 'broken')) {
      return;
    }
    try {
      // Calls 'hide' method of module
      WhaTV.module[moduleName].hide(slideReference, div);
    } catch (e) {
      // Module has crashed. Fortunately we don't trust it, and we skip it.
      console.error("Module " + moduleName + " crashed when hiding slide " +
                    "number " + pointer + " : \n" + e.stack);
    }
    WhaTV.util.clearNode(div);
  }

  function getModuleName(div) {
    var moduleName;
    if (!div) {
      global.console.warn('Warning : content to show is empty. Skipping');
      return null;
    }
    moduleName = div.getAttribute('whatvslidetype');
    if (!moduleName) {
      global.console.error('No suitable div found to show.');
      return null;
    }
    return moduleName;
  }

  // Now are the public methods, encapsulated in an object in order to not
  // pollute WhaTV.core scope.
  var publicMethods = {
    next: function next() {
      onSlideTimeout(pointer - 1);
    },

    stop: function stop() {
      // Currently breaks the loop.
      // Non reversible, only present for debug purposes.
      notifyManager = function() {return null;};
    },

    pause: function pause() {
      if (!this.paused) {
        var video = global.document.getElementsByClassName('currentSlide')[0].
                        getElementsByTagName('video')[0];
        if (video) {
          video.pause();
        }
        clearTimeout(currentTimeout);
        this.paused = true;
      }
    },

    resume: function resume() {
      if (this.paused) {
        var video = global.document.getElementsByClassName('currentSlide')[0].
                        getElementsByTagName('video')[0];
        if (video) {
          video.play();
        } else {
          this.next();
        }
        this.paused = false;
      }
    },

    registerInformationsListener:
        function registerInformationsListener(callback) {
      informationListener = callback;
    }
  };

  // Launch WhaTV : parses slides informations, launching ignition
  WhaTV.util.parseJSON('slides.json', ignition);
  
  // For javascript dummies : the whole function WhaTVCoreInitClosure returns
  // an object, which has access to the whole content of the function. You
  // (i.e window) don't have access to anything in this function outside of
  // this returned object.
  return {
    // Version string
    version: version,
    next: publicMethods.next,
    pause: publicMethods.pause,
    resume: publicMethods.resume,
    registerInformationsListener: publicMethods.registerInformationsListener,
    //debug
    stop: publicMethods.stop,
    onSlideTimeout: onSlideTimeout,
    onNextSlideReady: onNextSlideReady
  };
})(window, WhaTV);
