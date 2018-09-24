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
{
  let {licenses} = require("../license_definitions");
  for (let l of Object.values(licenses).filter(l => l.identifier)) {
    licensesByLabel.set(l.identifier, l);
  }
}

let cachedHrefs = new Map();

var ExternalLicenses = {
  purgeCache(tabId) {
    cachedHrefs.delete(tabId);
  },

  async check(script) {
    let {url, tabId, frameId, documentUrl} = script;
    let tabCache = cachedHrefs.get(tabId);
    let frameCache = tabCache && tabCache.get(frameId);
    let cache = frameCache && frameCache.get(documentUrl);
    let scriptInfo = await browser.tabs.sendMessage(tabId, {
      action: "checkLicensedScript",
      url,
      cache,
    }, {frameId});

    if (!(scriptInfo && scriptInfo.licenseLinks.length)) {
      return null;
    }
    scriptInfo.licenses = new Set();
    scriptInfo.allFree = true;
    scriptInfo.toString = function() {
      let licenseIds = [...this.licenses].map(l => l.identifier).sort().join(", ");
      return licenseIds
         ? (this.allFree ? `Free license${this.licenses.length > 1 ? "s" : ""} (${licenseIds})`
                         : `Mixed free (${licenseIds}) and unknown licenses`)
         : "Unknown license(s)";
    }

    for (let {label} of scriptInfo.licenseLinks) {
      if (licensesByLabel.has(label)) {
        scriptInfo.licenses.add(licensesByLabel.get(label));
      } else {
        scriptInfo.allFree = false;
        break;
      }
    }
    return scriptInfo;
  },

  /**
  * moves / creates external license references before any script in the page
  * if needed, to have them ready when the first script load is triggered.
  * It also caches the external licens href by page URL, to help not actually
  * modify the rendered HTML but rather feed the content script on demand.
  * Returns true if the document has been actually modified, false otherwise.
  */
  optimizeDocument(document, cachePointer) {
    let cache = {};
    let {tabId, frameId, documentUrl} = cachePointer;
    let frameCache = cachedHrefs.get(tabId);
    if (!frameCache) {
      cachedHrefs.set(tabId, frameCache = new Map());
    }
    frameCache.set(frameId, new Map([[documentUrl, cache]]));

    let link = document.querySelector(`link[rel="jslicense"], link[data-jslicense="1"], a[rel="jslicense"], a[data-jslicense="1"]`);
    if (link) {
      let href = link.getAttribute("href");
      cache.webLabels = {href};
      let move = () => !!document.head.insertBefore(link, document.head.firstChild);
      if (link.parentNode === document.head) {
        for (let node; node = link.previousElementSibling;) {
          if (node.tagName.toUpperCase() === "SCRIPT") {
            return move();
          }
        }
      } else { // the reference is only in the body
        if (link.tagName.toUpperCase() === "A") {
          let newLink = document.createElement("link");
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
