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
"use strict";
{
  // Find and fetch the url to the web labels table, and returns the
  // license info in the table as a map from the script url to
  // { script: {url, label},
  //   licenseLinks: [{url, label}],
  //   sources: [{url, label}] }
  //   
  // see https://www.gnu.org/software/librejs/free-your-javascript.html#step3
  const fetchWebLabels = async args => {
    const { map, cache } = args;
    const link = document.querySelector(`link[rel="jslicense"], link[data-jslicense="1"], a[rel="jslicense"], a[data-jslicense="1"]`);
    const webLabelsUrl = link ? link.href : cache.webLabels && new URL(cache.webLabels.href, document.baseURI);
    if (webLabelsUrl) try {
      const response = await fetch(webLabelsUrl);
      if (!response.ok) throw `${response.status} ${response.statusText}`;
      const doc = new DOMParser().parseFromString(
        await response.text(),
        'text/html'
      );
      // Sets the base url to be the url of the weblabel page if it
      // does not exist.  Otherwise relative links on the weblabels
      // page will use the base of the current page.
      if (!doc.querySelector("base")) {
        doc.head.appendChild(doc.createElement("base")).href = webLabelsUrl;
      }
      const link = a => ({ url: a.href, label: a.textContent });
      const firstLink = parent => link(parent.querySelector("a"));
      const allLinks = parent => Array.prototype.map.call(parent.querySelectorAll("a"), link);
      for (const row of doc.querySelectorAll("table#jslicense-labels1 > tbody > tr")) {
        try {
          const cols = row.querySelectorAll("td");
          const script = firstLink(cols[0]);
          const licenseLinks = allLinks(cols[1]);
          const sources = cols[2] ? allLinks(cols[2]) : [];
          map.set(script.url, { script, licenseLinks, sources });
        } catch (e) {
          console.error("LibreJS: error parsing Web Labels at %s, row %s", webLabelsUrl, row.innerHTML, e);
        }
      }
    } catch (e) {
      console.error("Error fetching Web Labels at %o", link, e);
    }
    return map;
  }

  const fetchLicenseInfo = async cache => {
    const map = new Map();
    const args = { map, cache };
    // in the fetchXxx methods we add to a map whatever license(s)
    // URLs and source code references we can find in various formats
    // (WebLabels is currently the only implementation), keyed by script URLs.
    await Promise.all([
      fetchWebLabels(args),
      // fetchXmlSpdx(args),
      // fetchTxtSpdx(args),
      // ...
    ]);
    return map;
  }

  const handlers = {
    // Look up the script url in the web labels and return it if found,
    //  otherwise return undefined.  The found value is of the format
    // { script: {url, label},
    //   licenseLinks: [{url, label}],
    //   sources: [{url, label}] }
    async checkLicensedScript(m) {
      const { url, cache } = m;
      const licensedScripts = await fetchLicenseInfo(cache);
      return licensedScripts.get(url) || licensedScripts.get(url.replace(/\?.*/, ''));
    }
  }

  browser.runtime.onMessage.addListener(async m => {
    if (m.action in handlers) try {
      debug("Received message", m);
      const result = await handlers[m.action](m);
      return result;
    } catch (e) {
      console.error(e);
    }
  });
}
