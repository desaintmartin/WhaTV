About : 
=========
WhaTV is a simple information diffusion system, aimed to be used either in web
browsers or embedded in entreprise diffusion systems.


Install :
=========
To simply try WhaTV, clone it and activate submodules :
    `$ git clone git://github.com/WaterCooled/WhaTV`
    `$ cd WhaTV`
    `$ git submodule update --init --recursive`

You then need a simple webserver (apache, ngninx, lighttpd...) to run it.

If you want to modify it, fork it with github or another git utility.

You can also view an online demo :
http://desaintmartin.github.com/WhaTV or http://whatv.eistiens.net

Mailing list is currently private, but will soon be available to subscriptions. If you are interested, drop me a note.


Changelog :
=========

0.5.3 (2011-08-09)
------------------
* In case of failure of a module, the main loop won't be stopped.
[Cedric de Saint Martin]

0.5.2.1 (2011-08-09)
------------------
* Correct slide pointer incrementation [Cedric de Saint Martin]

0.5.2 (2011-08-05)
------------------
* Add basic transition system [Cedric de Saint Martin]
* Minor CSS compactation and improvements [fcharton]
* Minor code cleanup and review [Cedric de Saint Martin, fcharton]

0.5.1 (2011-03-31)
----------------
* Add correct implementation of WhaTV.core.pause() and WhaTV.core.resume()
* Fix bug where messages and date were disappearing when showing Flash slide
* Solved several bugs on various platforms
* [Cedric de Saint Martin]

0.5.0 (2011-01-19)
---------------
* Major refactoring, separating 'core' code to 'modules' and utilities.
* Adding a simple API to add and customize 'modules' (fullscreen, ambilight, etc)
* Adding reference implementations of base modules, and examples of modules
* [Cedric de Saint Martin]

0.2.5 (2011-01-19)
---------------
* Adding public methods to our object, allowing to go to next slide,
* pause a video, and adding a callback which will be called to send
* information about each slide.
* [Cedric de Saint Martin]

0.2.4 (2011-01-17)
---------------
* Adding Youtube videos Support [Cedric de Saint Martin]

0.2.3 (2011-01-17)
---------------
* Better handling of bad video slide [Cedric de Saint Martin]

0.2.2 (2011-01-17)
---------------
* Adding fullscreen support [Cedric de Saint Martin]

0.2.1 (2011-01-05)
---------------
* Fixing video bugs, cleaning code, works with Firefox [Cedric de Saint Martin]

0.2.0 (2010-10-27)
---------------
* Adding a new, more robust system for managing slides, each slide is 
* monitored, if something goes wrong, we can know it instantaneously.
* Adding a new container system : each slide has its own container div (was:
* two global div, alterning)
* [Cedric de Saint Martin]

0.1.0 (2010-10-25)
----------------
* First stable release with proper "finished loading" event firing, no timeout for videos
[Cedric de Saint Martin]

0.0.7 (2010-10-25)
----------------
* Introducing a footer with a clock and a Quick Messages system.
[Cedric de Saint Martin]

0.0.6 (2010-10-23)
----------------
* Option system with (fullscreen, ambimage/ambilight, crop) options, every size calculated relatively for images and video,
* Everything is vertically centered.

0.0.5 (2010-10-19)
----------------
* Get rid of majority of jquery calls,
* Ambilight support,
* Adding an options system to specify image and video options (not fully implemented)
* [Cedric de Saint Martin]

0.0.4 (2010-10-18)
----------------
* Adding modular Ambimage support. [Cedric de Saint Martin]

0.0.3 (2010-09-11)
----------------
* Adding Flash support.
* [Cedric de Saint Martin]

0.0.2 (2010-09-11)
----------------
* Iframe and video full support with proper css. [Cedric de Saint Martin]

0.0.1 (2010-09-11)
----------------
* Initial release. [Cedric de Saint Martin]



Roadmap :
=========
* 0.5.x : Widgets support
* 0.5.x : Proof of concept : meteo widget
* 0.6.0 : Modular transition system with some examples
* 0.7.0 : Powerpoint support
* 0.9.9 : documentation, API and examples
* 1.0.x : Posting server, dynamic fetching of resources from server, maybe use of http://www.w3.org/TR/FileAPI/
* 1.1.x : Optional authentication system
* 2.0.x : Video overlay


Ideas :
=========
* separate css from logic in QuickMessages
* Header + animated header
* Photo album module
* CSS3 image animation support (examples : http://developer.apple.com/safaridemos/showcase/transitions/) 
* Module system, where we specify urls of extensions files + http://requirejs.org/
* quick message system : titles
* flv videos
* Fetch from time to time the new list of slides to show
* http://net.tutsplus.com/tutorials/tools-and-tips/learn-how-to-develop-for-the-iphone/
* It seems that webkit (chrome, safari) has a memleak with <video* (please see https://bugs.webkit.org/show_bug.cgi?id=46560). Add a reload() function to avoid it.

Known Bugs : 
==========
* "Remaining timeout" after some slides. Inspect this bug.
* Youtube API is outdated, thus does not work. (Louis)
* Youtube plugin does not work (due to Flash security restrictions) unless server is at localhost (see http://code.google.com/apis/youtube/iframe_api_reference.html#Loading_a_Video_Player and http://code.google.com/apis/youtube/player_parameters.html?playerVersion=HTML5#Overview)
* Quick Messages animations are uglily slow when showing resource-intensive video
* Date CSS is ugly and vary from browsers
* Chrome : timeout is not respected in videos
* Under webkit : videos cause HUGE leaks
* Broken div are not garbage collected.

Module API Documentation
===============
WhaTV can load third-party modules. Thoses modules have to be added as objects in WhaTV.module (example : WhaTV.module.myModule).
Those module have to follow this interface : 

    interface WhaTVModule : Object {
      /**
       * This function will be called when a slide of "MyModule" type is going
       *  To be loaded. This function is responsible for creating an Element,
       *  Populating it and returning it. Because it is asynchronous, the node
       *  Can (will) be returned before the slide is actually ready. That is why
       *  load function is also responsible for calling (or attaching to events)
       *  onNextSlideReady(slideReference) when slide is ready to be played
       *  (example : a huge video that will take time to load).
       * @param {Number} slideReference Number of the slide.
       * @param {} slide The object containing the slides information (source,
       *  options, etc).
       * @param {function} onNextSlideReady Function to be called when slide
       *  is ready to be played.
       * @param {function} skipLoadingSlide Function to be called if slide
       *  can't be played (in case of error, of compatibility, ...).
       * @return {HTMLElement} slide The generated slide as HTMLElement
       */
      HTMLElement load(slideReference, slide, onNextSlideReady, skipLoadingSlide);
      /**
       * This method is called when concerning slide is already loaded, and
       *  about to be showed. Maybe you want to start something (play a video),
       *  set something (a countdown) or register to events.
       * @param {HTMLElement} div The slide as an element, can be modified live.
       * @param {HTMLElement} slideReference The slide reference in the WhaTV.
       */
      void show(slideReference, div);
      /**
       * This method is called when concerning slide is already showed, and
       *  about to be hidden. Maybe you want to stop something (stop a video)
       *  or clean something.
       * @param {HTMLElement} div The slide as an element, can be modified live.
       * @param {HTMLElement} slideReference The slide reference in the WhaTV.
       */
      void hide(slideReference, div)
    };

Please see implementations in js/module.js for examples.
Each module can define arbitrary element in slides.json, and fetch it manually.

slides.json syntax : 
===============
FIXME

List of built-in modules
===============
FIXME

Public API Documentation
===============
WhaTV provides an interface to interact with slides. Here is the documentation of the methods contained in this interface.

 - WhaTV.core.version() : returns the current version of the WhaTV system.
 - WhaTV.core.next() : skip the currently shown slide, and shows the next one.
 - WhaTV.core.pause() : Pause the current slide, preventing the system from going to the next slide. Also pauses the playing video, if any.
 - WhaTV.core.resume() : Either resume a paused video or go to the next slide if pause() was previously called.
 - WhaTV.core.registerInformationsListener(f) : Adds the function "f" to a list of listeners. Each time the system goes to the next slide, it calls each function in the list with an object as parameter describing the new slide (type, location, length, description, etc). This object is just the parsed slides.json corresponding slide.
