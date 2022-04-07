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
  Singleton to handle external licenses, e.g. WebLabels
*/

"use strict";

let licensesByLabel = new Map();
let licensesByUrl = new Map();
{
  let { licenses } = require("../license_definitions");
  let mapByLabel = (label, license) => licensesByLabel.set(label.toUpperCase(), license);
  for (let [id, l] of Object.entries(licenses)) {
    let { identifier, canonicalUrl, licenseName } = l;
    if (identifier) {
      mapByLabel(identifier, l);
    } else {
      l.identifier = id;
    }
    if (id !== identifier) {
      mapByLabel(id, l);
    }
    if (licenseName) {
      mapByLabel(licenseName, l);
    }
    if (Array.isArray(canonicalUrl)) {
      for (let url of canonicalUrl) {
        licensesByUrl.set(url, l);
      }
    }
  }
}

let cachedHrefs = new Map();

var ExternalLicenses = {
  purgeCache(tabId) {
    cachedHrefs.delete(tabId);
  },

  async check(script) {
    let { url, tabId, frameId, documentUrl } = script;
    let tabCache = cachedHrefs.get(tabId);
    let frameCache = tabCache && tabCache.get(frameId);
    let cache = frameCache && frameCache.get(documentUrl);
    let scriptInfo = await browser.tabs.sendMessage(tabId, {
      action: "checkLicensedScript",
      url,
      cache,
    }, { frameId });

    if (!(scriptInfo && scriptInfo.licenseLinks.length)) {
      return null;
    }
    scriptInfo.licenses = new Set();
    scriptInfo.toString = function() {
      let licenseIds = [...this.licenses].map(l => l.identifier).sort().join(", ");
      return licenseIds
        ? `Free license${this.licenses.size > 1 ? "s" : ""} (${licenseIds})`
        : "Unknown license(s)";
    }
    let match = (map, key) => {
      if (map.has(key)) {
        scriptInfo.licenses.add(map.get(key));
        return true;
      }
      return false;
    };

    for (let { label, url } of scriptInfo.licenseLinks) {
      match(licensesByLabel, label = label.trim().toUpperCase()) ||
        match(licensesByUrl, url) ||
        match(licensesByLabel, label.replace(/^GNU-|-(?:OR-LATER|ONLY)$/, ''));
    }
    scriptInfo.free = scriptInfo.licenses.size > 0;
    return scriptInfo;
  },

  /**
  * moves / creates external license references before any script in the page
  * if needed, to have them ready when the first script load is triggered.
  * It also caches the external licens href by page URL, to help not actually
  * modify the rendered HTML but rather feed the content script on demand.
  * Returns true if the document has been actually modified, false otherwise.
  */
  optimizeDocument(doc, cachePointer) {
    let cache = {};
    let { tabId, frameId, documentUrl } = cachePointer;
    let frameCache = cachedHrefs.get(tabId);
    if (!frameCache) {
      cachedHrefs.set(tabId, frameCache = new Map());
    }
    frameCache.set(frameId, new Map([[documentUrl, cache]]));

    let link = doc.querySelector(`link[rel="jslicense"], link[data-jslicense="1"], a[rel="jslicense"], a[data-jslicense="1"]`);
    if (link) {
      let href = link.getAttribute("href");
      cache.webLabels = { href };
      let move = () => !!doc.head.insertBefore(link, doc.head.firstChild);
      if (link.parentNode === doc.head) {
        for (let node = link; node = node.previousElementSibling;) {
          if (node.tagName.toUpperCase() === "SCRIPT") {
            return move();
          }
        }
      } else { // the reference is only in the body
        if (link.tagName.toUpperCase() === "A") {
          let newLink = doc.createElement("link");
          newLink.rel = "jslicense";
          newLink.setAttribute("href", href);
          link = newLink;
        }
        return move();
      }
    }

    return false;
  }
};


module.exports = { ExternalLicenses };
