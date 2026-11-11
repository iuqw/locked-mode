# Google Forms locked mode bypass

google closed it as Won't Fix (Intended Behavior). so this repo will have the public poc and small writeup

The short version: a quiz configured to require locked mode will start on a
device that has no lock and no Assessment Assistant extension, because the page
believes whatever its own javascript tells it

## Background

On managed ChromeOS devices, a Google Form quiz can require locked mode. When it
does, the Assessment Assistant extension:

- moves the quiz tab into a "`locked-fullscreen`" window
- unloads other tabs
- disables all other extensions
- reloads the tab

The page decides whether it is already locked by asking the extension:

```js
chrome.runtime.sendMessage('gndmhdcefbhlchkhipcnnbkcmicncehk',
                           {command: 'isLocked'}, callback);
```

The extension answers from local state. In `background.js`, function `Ra` (deobfuscated func)
returns true when `chrome.storage.local.savedTab` exists and its `id` matches
`sender.tab.id`. the value isnt signed or checked by any server

## The issue

The caller is page JS, so page JS can answer the question. The
poc replaces `chrome.runtime.sendMessage` for that one extension ID (Assessment Assistant) and returns
`{locked:true}`. every other message goes to the real function if one exists.

The real extension reloads the tab after locking (`lockTab` ends with
`reloadTab`), and the form waits for that reload. 
on the new
document it runs again at `document-start`, it sees the marker in
`sessionStorage`, and answers `isLocked` before the form asks.

## what it would look like

```
[poc] patched=true  extensionPresentBeforePatch=false  phase=first  url=...
[poc] reloading into locked mode
[poc] patched=true  extensionPresentBeforePatch=false  phase=post-reload  url=...
[poc] value the form will see: {"locked":true}
```

the quiz starts in a normal, resizable window that does not touch a `locked-fullscreen`
window

## How to use

requirements: tampermonkey or any userscript executor extension

NOTE: => **you do not need any other extension** <=
1. Install `poc.user.js`

3. Open the quiz form. The console shows the `phase=first` line.
4. press start. The page reloads once and the quiz opens.
5. To confirm which value the form reads, run:

```js
chrome.runtime.sendMessage('gndmhdcefbhlchkhipcnnbkcmicncehk',
                           {command:'isLocked'}, console.log);   // should return {locked:true}
```
