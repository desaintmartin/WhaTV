'use strict';

var TimerJob = Class.create();
TimerJob.prototype = {

 /*int*/ sec: 600,                   //numbers of seconds to wait
 /*PeriodicalExecuter*/ pe: null,
 /*bool*/ finished: false,           //flag set after countdown finishes

 initialize: function() {
  this.pe = new PeriodicalExecuter(this.execute.bind(this), 1);
  window.onblur = this.abort.bindAsEventListener(this);
 },

 abort: function(evt) {
  $('informer').innerHTML = 'abort';
  window.onblur = '';
  window.onfocus = this.resume.bindAsEventListener(this);
  this.pe.stop();
 },

 resume: function(evt) {
  if (this.finished) {
   window.onfocus = '';
   window.onblur = '';
  }else {
   this.pe = new PeriodicalExecuter(this.execute.bind(this), 1);
   window.onfocus = '';
   window.onblur = this.abort.bindAsEventListener(this);
  }

 },

 restart: function() {
  this.pe.stop();
  this.pe = new PeriodicalExecuter(this.execute.bind(this), 1);
  window.onblur = this.abort.bindAsEventListener(this);
 },

 execute: function(_pe) {

  $('informer').innerHTML = this.sec;
  this.sec--;
  if (this.sec <= 0) {
       this.pe.stop();

       alert('It is time!!!');

       this.finished = true;
       window.onblur = '';
       window.onhelp = '';
  }
 }
};
