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
"use strict";
{
  let licensedScripts = null;
    
  let fetchWebLabels = async (map = new Map()) => {
    // see https://www.gnu.org/software/librejs/free-your-javascript.html#step3
    
    let link = document.querySelector(`link[rel="jslicense"], link[data-jslicense="1"], a[rel="jslicense"], a[data-jslicense="1"]`);
    if (link) try {
      let baseURL = link.href;
      let response = await fetch(baseURL);
      if (!response.ok) throw `${response.status} ${response.statusText}`;
      let doc = new DOMParser().parseFromString(
          await response.text(),
          "text/html"
      );
      let base = doc.querySelector("base");
      if (base) {
        base.href = base.href;
      } else {
        doc.head.appendChild(doc.createElement("base")).href = baseURL;
      }
      let firstURL = parent => parent.querySelector("a").href;
      let allURLs = parent => Array.map(parent.querySelectorAll("a"), a => a.href);
      for (let row of doc.querySelectorAll("table#jslicense-labels1 tr")) {
        let cols = row.querySelectorAll("td");
        let scriptURL = firstURL(cols[0]);
        let licenseURLs = allURLs(cols[1]);
        let sourceURLs = cols[2] ? allURLs(cols[2]) : [];
        map.set(scriptURL, {scriptURL, licenseURLs, sourceURLs});
      }
    } catch (e) {
      console.error("Error fetching Web Labels at %o", link, e);
    }
    return map;
  }
  
  let fetchLicenseInfo = async () => {
    let map = new Map();
    
    // in the fetchXxx methods we add to a map whatever license(s)
    // URLs and source code references we can find in various formats 
    // (WebLabels is currently the only implementation), keyed by script URLs.
    await Promise.all([
    fetchWebLabels(map),
    // fetchXmlSpdx(),
    // fetchTxtSpdx(),
    // ...
    ]);
    return map;
  }
  
  let handlers = {
    async checkLicensedScript(m) {
      let {url} = m;
      if (!licensedScripts) licensedScripts = await fetchLicenseInfo();
      return licensedScripts.get(url);
    }
  }

  browser.runtime.onMessage.addListener(async m => {
    if (m.action in handlers) try {
      debug("Received message", m);
      let result =  await handlers[m.action](m);
      console.debug("Returning", result);
      return result;
    } catch (e) {
      console.error(e);
    }
  });
}
