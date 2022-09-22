/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
*
* Copyright (C) 2018 Giorgio Maone <giorgio@maone.net>
* Copyright (C) 2022 Yuchen Pei <id@ypei.org>
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

'use strict';

const { licenses } = require('../common/license_definitions')
const licensesByLabel = new Map(Object.entries(licenses).map(([id, license]) =>
  [
    [license.identifier.toUpperCase(), license],
    [id.toUpperCase(), license],
    [license.licenseName.toUpperCase(), license]
  ]).flat());
const licensesByUrl = new Map(Object.values(licenses).map(license =>
  license.canonicalUrl.map(url => [url, license])).flat());
for (const [id, license] of Object.entries(licenses)) {
  if (!license.identifier) {
    license.identifier = id;
  }
}

const cachedHrefs = new Map();

const ExternalLicenses = {
  purgeCache(tabId) {
    cachedHrefs.delete(tabId);
  },

  // Checks external script using web labels
  async check(script) {
    const { url, tabId, frameId, documentUrl } = script;
    const tabCache = cachedHrefs.get(tabId);
    const frameCache = tabCache && tabCache.get(frameId);
    const cache = frameCache && frameCache.get(documentUrl);
    const scriptInfo = await browser.tabs.sendMessage(tabId, {
      action: 'checkLicensedScript',
      url,
      cache,
    }, { frameId });

    if (!(scriptInfo && scriptInfo.licenseLinks.length)) {
      return null;
    }
    scriptInfo.licenses = new Set(scriptInfo.licenseLinks.map(
      ({ label, url }) => {
        const uLabel = label.trim().toUpperCase();
        const license = licensesByLabel.get(uLabel) || licensesByUrl.get(url) ||
          licensesByLabel.get(uLabel.replace(/^GNU-|-(?:OR-LATER|ONLY)$/, ''));
        return license ? [license] : [];
      }).flat());
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
    const cache = {};
    const { tabId, frameId, documentUrl } = cachePointer;
    const frameCache = cachedHrefs.get(tabId) || new Map();
    cachedHrefs.set(tabId, frameCache);
    frameCache.set(frameId, new Map([[documentUrl, cache]]));

    const link = doc.querySelector('link[rel="jslicense"], link[data-jslicense="1"], a[rel="jslicense"], a[data-jslicense="1"]');
    if (link) {
      const href = link.getAttribute('href');
      cache.webLabels = { href };
      const move = (link) => !!doc.head.insertBefore(link, doc.head.firstChild);
      if (link.parentNode === doc.head) {
        // TODO: eliminate let
        let node = link.previousElementSibling;
        for (; node; node = node.previousElementSibling) {
          if (node.tagName.toUpperCase() === 'SCRIPT') {
            return move(link);
          }
        }
      } else { // the reference is only in the body
        if (link.tagName.toUpperCase() === 'A') {
          const newLink = doc.createElement('link');
          newLink.rel = 'jslicense';
          newLink.setAttribute('href', href);
          return move(newLink);
        }
        return move(link);
      }
    }

    return false;
  }
};


module.exports = { ExternalLicenses };
