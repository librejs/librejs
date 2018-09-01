/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
*
* Copyright (C) 2018 Giorgio Maone <giorgio@maone.net>
*
* This file is part of GNU LibreJS.
*
* GNU LibreJS is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* GNU LibreJS is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with GNU LibreJS.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
  An abstraction layer over the StreamFilter API, allowing its clients to process
  only the "interesting" HTML and script requests and leaving the other alone
*/

let {ResponseMetaData} = require("./ResponseMetaData");

let listeners = new WeakMap();
let webRequestEvent = browser.webRequest.onHeadersReceived;

class ResponseProcessor {

  static install(handler, types = ["main_frame", "sub_frame", "script"]) {
    if (listeners.has(handler)) return false;
    let listener = 
      async request =>  await new ResponseTextFilter(request).process(handler);
    listeners.set(handler, listener);
    webRequestEvent.addListener(
  		listener,
  		{urls: ["<all_urls>"], types},
  		["blocking", "responseHeaders"]
  	);
    return true;
  }

  static uninstall(handler) {
    let listener = listeners.get(handler);
    if (listener) {
      webRequestEvent.removeListener(listener);
    }
  }
}

Object.assign(ResponseProcessor, {
  // control flow values to be returned by handler.pre() callbacks
	ACCEPT: {},
	REJECT: {cancel: true},
	CONTINUE: null
});

class ResponseTextFilter {
  constructor(request) {
    this.request = request;
    let {type, statusCode} = request;
    let md = this.metaData = new ResponseMetaData(request);
    this.canProcess = // we want to process html documents and scripts only
      (statusCode < 300 || statusCode >= 400) && // skip redirections
      !md.disposition && // skip forced downloads
      (type === "script" || /\bhtml\b/i.test(md.contentType));
  }

  async process(handler) {
    if (!this.canProcess) return ResponseProcessor.ACCEPT;
    let {metaData, request} = this;
    let response = {request, metaData}; // we keep it around allowing callbacks to store state
    if (typeof handler.pre === "function") {
      let res = await handler.pre(response);
      if (res) return res;
      if (handler.post) handler = handler.post;
      if (typeof handler !== "function") ResponseProcessor.ACCEPT;
    }
    
    let {requestId, responseHeaders} = request;
    let filter = browser.webRequest.filterResponseData(requestId);
    let buffer = [];

    filter.ondata = event => {
      buffer.push(event.data);
    };

    filter.onstop = async event => {
      let decoder = metaData.createDecoder();
      let params = {stream: true};
      response.text = buffer.map(
        chunk => decoder.decode(chunk, params))
        .join('');
      let editedText = null;
      try {
        editedText = await handler(response);
      } catch(e) {
        console.error(e);
      }
      if (metaData.forcedUTF8 && request.type !== "script" ||
        editedText !== null && response.text !== editedText) {
        // if we changed the charset, the text or both, let's re-encode
        filter.write(new TextEncoder().encode(editedText));
      } else {
        // ... otherwise pass all the raw bytes through
        for (let chunk of buffer) filter.write(chunk);
      }

      filter.disconnect();
    }

    return metaData.forceUTF8() ? {responseHeaders} : ResponseProcessor.ACCEPT;;
  }
}

module.exports = { ResponseProcessor };
