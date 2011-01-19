'use strict';

window.WhaTV = window.WhaTV || {};

// A simple timer used to update the content of the clock
WhaTV.timer = (function() {
  var node;
  function updateDate() {
    if (node) {
      var dt = new Date();
      if (dt.getHours() < 10) {
        node.innerHTML = '0';
      } else {
        node.innerHTML = '';
      }
      if (dt.getMinutes() < 10) {
        node.innerHTML += dt.getHours() + ':0' + dt.getMinutes();
      } else {
        node.innerHTML += dt.getHours() + ':' + dt.getMinutes();
      }
    }
  }
  return {
    create: function(nodeId) {
      node = document.getElementById(nodeId);
      // FIXME clean this : Hack to set fontsize relatively to footer height
      node.parentNode.style.fontSize =
          getComputedStyle(node.parentNode, '').height;
      setInterval(updateDate, 1000);
    }
  };
})();
