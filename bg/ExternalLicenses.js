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

let licensesByURL = new Map();
{
  let {licenses} = require("../license_definitions");
  for (let l of Object.values(licenses).filter(l => l.canonicalUrl)) {
    for (let url of l.canonicalUrl) {
      licensesByURL.set(url, l);
    }
  }
}

var ExternalLicenses = {
  async check(script) {
    let {url, tabId, frameId} = script;
    let scriptInfo = await browser.tabs.sendMessage(tabId, {
      action: "checkLicensedScript",
      url
    }, {frameId});
    if (!(scriptInfo && scriptInfo.licenseURLs.length)) {
      return null;
    }
    scriptInfo.licenses = new Set();
    scriptInfo.allFree = true;
    scriptInfo.toString = function() {
      let licenseIds = [...this.licenses].map(l => l.identifier).sort().join(", ");
      return this.allFree ? `Free license${licenseIds.length > 1 ? "s" : ""} (${licenseIds})` : `Mixed free (${licenseIds}) and unknown licenses`;
    }
    
    for (let u of scriptInfo.licenseURLs) {
      if (licensesByURL.has(u)) {
        scriptInfo.licenses.add(licensesByURL.get(u));
      } else {
        scriptInfo.allFree = false;
        break;
      }
    }
    return scriptInfo;
  },
  
  /**
  * moves / creates external license references before any script in the page
  * if needed, to have them ready when the first script load is triggered
  * Returns true if the document has been actually modified, false otherwise.
  */
  optimizeDocument(document) {
    let link = document.querySelector(`link[rel="jslicense"], link[data-jslicense="1"], a[rel="jslicense"], a[data-jslicense="1"]`);
    if (link) {
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
          newLink.setAttribute("href", link.getAttribute("href"));
          link = newLink;
        }
        return move();
      }
    }
    return false;
  }
};


module.exports = { ExternalLicenses };
