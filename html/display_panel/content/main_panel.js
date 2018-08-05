/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2017, 2018 NateN1222 <nathannichols454@gmail.com>
* Copyright (C) 2018 Ruben Rodriguez <ruben@gnu.org>
* Copyright (C) 2018 Giorgio Maone <giorgio@maone.net>
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see  <http://www.gnu.org/licenses/>.
*
*/

var fromTab = window.location.hash.match(/^#fromTab=(\d+)/) && RegExp.$1;
if (fromTab) {
  let browserStyle = document.createElement("link");
  browserStyle.rel = "stylesheet";
  browserStyle.href = "chrome://browser/content/extension.css";
  document.head.appendChild(browserStyle);
  document.documentElement.classList.add("tab");
}

var myPort = browser.runtime.connect({name: "port-from-cs"});
var currentReport;

// Sends a message that tells the background script the window is open
myPort.postMessage({"update": true, tabId: parseInt(currentReport && currentReport.tabId || fromTab) || ""});

// Display the actual extension version Number
document.querySelector("#version").textContent = browser.runtime.getManifest().version;

var liTemplate = document.querySelector("#li-template");
liTemplate.remove();

document.querySelector("#info").addEventListener("click", e => {
	let button = e.target;
	if (!button.matches(".buttons > button")) return;
	let li = button.closest("li");
	let entry = li && li._scriptEntry || [currentReport.url, "Page's site"];
	let action = button.className;
  let site = button.name === "*";
  if (site) {
    ([action] = action.split("-"));
  }
	myPort.postMessage({[action]: entry, site});
});

document.querySelector("#report-tab").onclick = e => {
  myPort.postMessage({report_tab: currentReport});
  close();
}

document.querySelector("#complain").onclick = e => {
  myPort.postMessage({invoke_contact_finder: currentReport});
  close();
}

document.querySelector("#reload").onclick = async e => {
  let {tabId} = currentReport;
  if (tabId) {
    await browser.tabs.reload(tabId);
  }
};

/* 
*	Takes in the [[file_id, reason],...] array and the group name for one group
* of scripts found in this tab, rendering it as a list with management buttons. 
*	Groups are "unknown", "blacklisted", "whitelisted", "accepted", and "blocked".
*/
function createList(data, group){
 var {url} = data;
 let entries = data[group];
 let container = document.getElementById(group);
 let heading = container.querySelector("h2");
 var list = container.querySelector("ul");
 list.classList.toggle(group, true);
 if (Array.isArray(entries) && entries.length) {
	 heading.innerHTML = `<span class="type-name">${group}</span> scripts in ${url}:`;
   container.classList.remove("empty");
 } else {
	 // default message
	 list.innerHTML = `<li>No <span class="type-name">${group}</span> scripts on this page.</li>`
	 entries = data[group] = [];
   container.classList.add("empty");
 }
 // generate list
 for (let entry of entries) {
   let [scriptId, reason] = entry;
	 let li = liTemplate.cloneNode(true);
	 let a = li.querySelector("a");
	 a.href = scriptId.split("(")[0];  
   a.textContent = scriptId;
	 li.querySelector(".reason").textContent = reason;
   let bySite = !!reason.match(/https?:\/\/[^/]+\/\*/);
   li.classList.toggle("by-site", bySite);
   if (bySite) {
     let domain = li.querySelector(".forget .domain");
     if (domain) domain.textContent = RegExp.lastMatch;
   }
	 li._scriptEntry = entry;
	 list.appendChild(li);
 }

}

/**
* Updates scripts lists and buttons to act on them.
* If return_HTML is true, it returns the HTML of the popup window without updating it.
*	example report argument: 
* {
*		"accepted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"blocked": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"whitelisted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"blacklisted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*   "unknown": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"url":"example.com"
*	};
*
*/
function refreshUI(report){
  console.debug("refreshUI", report);
  currentReport = report;

  document.querySelector("#site").className = report.siteStatus || "";
  document.querySelector("#site h2").textContent = 
    `This site ${report.site}`;
  
  for (let toBeErased of document.querySelectorAll("#info h2:not(.site) > *, #info ul > *")) {
  	toBeErased.remove();
  }
  
  let scriptsCount = 0;
  for (let group of ["unknown", "accepted", "whitelisted", "blocked", "blacklisted"]) {
  	if (group in report) createList(report, group);
    scriptsCount += report[group].length;
  }
  
  for (let b of document.querySelectorAll(`.forget, .whitelist, .blacklist`)) {
    b.disabled = false;
  }
  for (let b of document.querySelectorAll(
    `.unknown .forget, .accepted .forget, .blocked .forget, 
     .whitelisted .whitelist, .blacklisted .blacklist`
   )) {
    b.disabled = true;
  } 
  
  let noscript = scriptsCount === 0;
  document.body.classList.toggle("empty", noscript);
}

myPort.onMessage.addListener(m => {
  if (m.show_info) {
    refreshUI(m.show_info);
  }
});

function print_local_storage(){
 myPort.postMessage({"printlocalstorage": true});
}
function delete_local_storage(){
 myPort.postMessage({"deletelocalstorage":true});
}
