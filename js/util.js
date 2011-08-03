'use strict';

window.WhaTV = window.WhaTV || {};

WhaTV.util = {
  // Candidate to be removed
  clearNode: function clearNode(node) {
    // Actually deleting children
    if (node.hasChildNodes()) {
      while (node.childNodes.length >= 1) {
        node.removeChild(node.firstChild);
      }
    }
  },

  hasClassName: function hasClassName(node, className) {
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
  },

  addClassName: function addClassName(node, className) {
    if (WhaTV.util.hasClassName(node, className)) return;
    if (node.className) {
      node.className = node.className + ' ' + className;
    } else {
      node.className = className;
    }
    node.className.replace(/ +/g, ' ');
  },

  removeClassName: function removeClassName(node, className) {
    var reg;
    if (!WhaTV.util.hasClassName(node, className)) return;
    reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
    node.className = node.className.replace(reg, '');
  },

  /**
   * Fetch an url using "get" xhr, then parse it as JSON.
   */
  parseJSON: function parseJSON(url, callback) {
    var JSONCallback = function(data) {
      if (typeof(data) === 'object') {
        callback(data);
      } else if (typeof(data) === 'string') {
        callback(JSON.parse(data));
      } else {
          throw 'Cannot parse JSON.';
      }
    };
    if (window.jQuery) {
      $.getJSON(url, callback);
    } else if (window.dojo) {
      dojo.xhrGet({
        url: url,
        handleAs: 'json',
        load: callback
      });
    } else {
      throw 'Cannot do XHR. Maybe jQuery or chosen lib is not present';
    }
  },

  /**
   * Test if fullscreen if supported. If so, turn it on.
   * Please see :
   * https://bugs.webkit.org/show_bug.cgi?id=49481
   * https://wiki.mozilla.org/index.php?title=Gecko:FullScreenAPI
   */
  turnOnFullscreenIfSupported: function turnOnFullscreenIfSupported() {
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
};
