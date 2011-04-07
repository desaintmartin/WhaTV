'use strict';

window.WhaTV = window.WhaTV || {};

WhaTV.core = (function(window) {
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
    dateDivId: 'date',
    fullscreen: true,
    transitionDuration: 1000
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
      // A reference to a potential listener to call in order to send
      // informations about each slide
      informationListener = null,
      // The current version of whaTV being used
      version = '0.5.1';

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
    // TODO : loading screen
    loadPointedSlideIntoDOM(pointer); // Should be 0
    onSlideTimeout(slides.length - 1);
  }

  /**
    * Load into the DOM the pointed slide and its elements. calls
    * notifyReadyOrGo when Everything is loaded.
    **/
  function loadPointedSlideIntoDOM(slideReference) {
    var currentSlide = slides[slideReference],
        content;
    console.log('loadPointedSlideIntoDOM called. preparing slide number ' +
                slideReference);
    // Calls loaders method depending on slide type. Assigns the resulting
    // node to 'content'
    if (WhaTV.module &&
        WhaTV.module[currentSlide.type] &&
        WhaTV.module[currentSlide.type].load) {
      content = WhaTV.module[currentSlide.type].load(slideReference,
                                                     currentSlide,
                                                     onNextSlideReady,
                                                     skipLoadingSlide);
      content.setAttribute('whatvslidetype', currentSlide.type);
      insertIntoMetacontent(content, slideReference);
    } else {
      console.error('FATAL : Unable to detect content type. Aborting.');
    }
  }

  /**
    * Function used to insert the content calculated by loadIage/loadVideo/etc
    * Into the div called 'metacontent'. If swfobject, Does not hide the div,
    * because swfobject does not like it.
    */
  function insertIntoMetacontent(content, slideReference) {
    content.setAttribute('id', 'content' + slideReference);
    // FIXME Hardcoded
    if (WhaTV.util.hasClassName(content, 'flash')) {
      WhaTV.util.addClassName(content, 'nextSlideFlash');
      document.getElementById('metacontent').appendChild(content);
    } else {
      WhaTV.util.addClassName(content, 'nextSlide');
      document.getElementById('metacontent').appendChild(content);
    }
  }


  /**
    * Responsible of hiding the 'old' slide, showing the new one, setting a
    * timeout and call an external callback to send informations about the
    * new slide.
    **/
  function makeTransition() {
    var finishedSlideIndex = (slides.length + (pointer - 1)) % slides.length,
        divToHide = document.getElementById('content' + finishedSlideIndex),
        divToShow = document.getElementById('content' + pointer),
        // This one is used to store the pointer for callbacks : in the future,
        // pointer will change, but not localPointer
        localPointer = pointer;
    console.log('makeTransition called. Showing slide number ' + pointer + '.');
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
    // Between the two slides.
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
        currentTimeout = setTimeout(function() {
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
      // Clears the timeout, if present.
      if (currentTimeout) {
        // FIXME Why ??? Usecases ?
        console.debug("Remaining timeout");
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
    onSlideTimeout(slideReference);
    onNextSlideReady(slideReference);
  }

  /**
    * Increments the pointer. If last slide has been reached, we start again.
    **/
  function incrementPointer() {
    pointer = (pointer + 1) % (slides.length - 1);
    even = (slides.length % 2 === 0);
  }


  /**
    * Responsible for doing everything when a slide is shown : start a video,
    * start ambilight, adding event listeners for end of videos, etc.
    **/
  function onShow(slideReference, div) {
    var moduleName = getModuleName(slideReference, div);
    // If our div is broken (example : bad video) we return immediatly
    if (WhaTV.util.hasClassName(div, 'broken')) {
      return;
    }
    // Calls 'show' method of module
    WhaTV.module[moduleName].show(slideReference, div, onSlideTimeout);
  }

  /**
    * Called to stop and clean the finished slide
    */
  function onHide(slideReference, div) {
    var moduleName = getModuleName(slideReference, div);
    // If our div is broken (example : bad video) we return immediatly
    if (WhaTV.util.hasClassName(div, 'broken')) {
      return;
    }
    // Calls 'hide' method of module
    WhaTV.module[moduleName].hide(slideReference, div);
    WhaTV.util.clearNode(div);
  }

  function getModuleName(slideReference, div) {
    var moduleName = div.getAttribute('whatvslidetype');
    if (!div) {
      console.warn('Warning : content to show is empty. Skipping');
      return;
    }
    if (!moduleName) {
      console.error('No suitable div found to show.');
      return null;
    }
    return moduleName;
  }

  function init() {
    // Launch WhaTV : parses slides informations, launching ignition
    WhaTV.util.parseJSON('slides.json', ignition);
  }

  // Now are the public methods
  var publicMethods = {
    next: function next() {
      onSlideTimeout(pointer - 1);
    },

    stop: function stop() {
      // Currently breaks the loop.
      notifyManager = function() {return null;};
    },

    pause: function pause() {
      if (!this.paused) {
        var video = document.getElementsByClassName('currentSlide')[0].
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
        var video = document.getElementsByClassName('currentSlide')[0].
                        getElementsByTagName('video')[0];
        if (video) {
          video.play();
        } else {
          this.next();
        }
        this.paused = false();
      }
    },

    registerInformationsListener:
        function registerInformationsListener(callback) {
      informationListener = callback;
    }
  };

  return {
    // TODO Consistency : all should be methods and in public namespace
    // and we can return later the object just above.
    //
    // Initialization method
    init: init,
    // Version string
    version: version,
    next: publicMethods.next,
    stop: publicMethods.stop,
    pause: publicMethods.pause,
    resume: publicMethods.resume,
    registerInformationsListener: publicMethods.registerInformationsListener,
    //debug
    onSlideTimeout: onSlideTimeout,
    onNextSlideReady: onNextSlideReady
  };
})(window);

WhaTV.core.init();
