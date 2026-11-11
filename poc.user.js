// ==UserScript==
// @name         locked mode
// @namespace    assessment-assistant
// @version      2.0
// @description  google forms lock 
// @author       undulary
// @match        https://docs.google.com/forms/*
// @match        https://docs.google.com/forms
// @run-at       document-start
// @grant        none
// ==/UserScript==
(function () {
  'use strict';

  var EXT = 'gndmhdcefbhlchkhipcnnbkcmicncehk';
  var KEY = '__lm_reloaded';

  if (window.__lm) return;

  var extprt = false;
  try { extprt = !!(window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage); } catch (e) {}
  var rel = false;
  try { rel = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  var locked = true;
  var rsend = window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage;

  function answer(message) {
    var cmd = message && message.command;
    if (cmd === 'isLocked') return { locked: locked };
    if (cmd === 'unlock') {
      locked = false;
      rel = false;
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      return { locked: false };
    }
    if (cmd === 'lock') {
      locked = true;
      if (!rel && document.readyState === 'loading') {
        rel = true;
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
        console.log('[locked mode] reloading into locked mode');
        setTimeout(function () { location.reload(); }, 350);
      }
      return { locked: true };
    }
    return { errorType: 'unknown command?' };
  }

  function fsend(id, message, options, callback) {
    if (typeof options === 'function') callback = options;
    if (id !== EXT) {
      if (rsend) return rsend.apply(window.chrome.runtime, arguments);
      if (callback) setTimeout(function () { callback(); }, 0);
      return undefined;
    }
    var reply = answer(message);
    if (callback) { setTimeout(function () { callback(reply); }, 0); return undefined; }
    return Promise.resolve(reply);
  }

  try {
    var chromeobj = window.chrome || (window.chrome = {});
    chromeobj.runtime = chromeobj.runtime || {};
    chromeobj.runtime.sendMessage = fsend;
  } catch (e) {
    console.warn('[locked mode] could not patch chrome.runtime? ' + e);
    return;
  }
  if (window.chrome.runtime.sendMessage !== fsend) {
    console.warn('[locked mode] chrome.runtime.sendMessage is read only for some reason');
    return;
  }

  window.__lm = { answer: answer, reload: function () { location.reload(); } };

  console.log('[locked mode] patch done, extpresent=' + extprt +
              '  phase=' + (rel ? 'post-reload' : 'first') +
              '  url=' + location.href);
  });
})();
