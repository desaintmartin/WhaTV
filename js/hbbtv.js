$(document).ready(function() {
  var appMan = document.getElementById("appMan"),
      video = document.getElementById("video");

  if (!appMan.getOwnerApplication) {
    document.body.innerHTML = "HbbTV application manager not supported.";
    return;
  }

  var app = appMan.getOwnerApplication(document);
  app.show();
  try {
    app.activate();
  } catch(e) {
    console.error('Could not app.activate()');
  }

  try {
    video.bindToCurrentChannel();
  } catch(e) {
    console.error('Could not video.bindToCurrentChannel()');
  }

});

// We need to wait for page to be fully loaded, not only dom to be ready, otherwise it is impossible to get height/width of document.
// BUT we can't wait for page to be fully loaded when doing app.activate().
$(window).load(function() {
  WhaTV.quickMessages.create('quick-messages');

  if (video.playState == 2) {
    registerStreamEventListener();
  } else {
    video.onPlayStateChange = function(state, error) {
      if (video.playState == 2) {registerStreamEventListener();}
    };
  }

  WhaTV.quickMessages.update(['Un message de service avant notification']);

  function streamEventCallback(e) {
    console.log('Stream event fired: ' + e);
    $.get('flashInfo.json', function(data) {
      WhaTV.quickMessages.update(data);
    });
    // Listen again for other message push in 15 seconds
    setTimeout(registerStreamEventListener, 15000);
  }

  function registerStreamEventListener() {
    video.addStreamEventListener('/flashInfo.streamEvents', 'flashInfo', streamEventCallback);
  }

});
