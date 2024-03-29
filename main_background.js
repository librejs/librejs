/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2017, 2018 Nathan Nichols
* Copyright (C) 2018 Ruben Rodriguez <ruben@gnu.org>
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

const checkLib = require('./common/checks.js');
const { ResponseProcessor, BLOCKING_RESPONSES } = require('./bg/ResponseProcessor');
const { Storage, ListStore, hash } = require('./common/Storage');
const { ListManager } = require('./bg/ListManager');
const { ExternalLicenses } = require('./bg/ExternalLicenses');
const { makeDebugLogger } = require('./common/debug.js');

const PRINT_DEBUG = false;
const dbgPrint = makeDebugLogger('main_background.js', PRINT_DEBUG, Date.now());

/*
*
*	Called when something changes the persistent data of the add-on.
*
*	The only things that should need to change this data are:
*	a) The "Whitelist this page" button
*	b) The options screen
*
*	When the actual blocking is implemented, this will need to comminicate
*	with its code to update accordingly
*
*/
function optionsListener(changes, area) {
  dbgPrint('Items updated in area' + area + ': ');
  dbgPrint(Object.keys(changes).join(','));
}

const activeMessagePorts = {};
const activityReports = {};

async function createReport(initializer) {
  if (!(initializer && (initializer.url || initializer.tabId))) {
    throw new Error('createReport() needs an URL or a tabId at least');
  }
  let template = {
    'accepted': [],
    'blocked': [],
    'blacklisted': [],
    'whitelisted': [],
    'unknown': [],
  };
  template = Object.assign(template, initializer);
  let [url] = (template.url || (await browser.tabs.get(initializer.tabId)).url).split('#');
  template.url = url;
  template.site = ListStore.siteItem(url);
  template.siteStatus = listManager.getStatus(template.site);
  const list = { 'whitelisted': whitelist, 'blacklisted': blacklist }[template.siteStatus];
  if (list) {
    template.listedSite = ListManager.siteMatch(template.site, list);
  }
  return template;
}

/**
*	Executes the "Display this report in new tab" function
*	by opening a new tab with whatever HTML is in the popup
*	at the moment.
*/
async function openReportInTab(data) {
  const popupURL = await browser.browserAction.getPopup({});
  const tab = await browser.tabs.create({ url: `${popupURL}#fromTab=${data.tabId}` });
  activityReports[tab.id] = await createReport(data);
}

/**
*	Clears local storage (the persistent data)
*/
function debugDeleteLocal() {
  browser.storage.local.clear();
  dbgPrint('Local storage cleared');
}

/**
*
*	Prints local storage (the persistent data) as well as the temporary popup object
*
*/
function debugPrintLocal() {
  function storageGot(items) {
    console.log('%c Local storage: ', 'color: red;');
    for (const i in items) {
      console.log('%c ' + i + ' = ' + items[i], 'color: blue;');
    }
  }
  console.log('%c Variable \'activityReports\': ', 'color: red;');
  console.log(activityReports);
  browser.storage.local.get(storageGot);
}

/**
*
*
*	Sends a message to the content script that sets the popup entries for a tab.
*
*	var example_blocked_info = {
*		"accepted": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"blocked": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"url": "example.com"
*	}
*
*	NOTE: This WILL break if you provide inconsistent URLs to it.
*	Make sure it will use the right URL when refering to a certain script.
*
*/
async function updateReport(tabId, oldReport, updateUI = false) {
  const { url } = oldReport;
  const newReport = await createReport({ url, tabId });
  for (const property of Object.keys(oldReport)) {
    const entries = oldReport[property];
    if (!Array.isArray(entries)) continue;
    const defValue = property === 'accepted' || property === 'blocked' ? property : 'unknown';
    for (const script of entries) {
      const status = listManager.getStatus(script[0], defValue);
      if (Array.isArray(newReport[status])) newReport[status].push(script);
    }
  }
  activityReports[tabId] = newReport;
  if (browser.sessions) browser.sessions.setTabValue(tabId, url, newReport);
  dbgPrint(newReport);
  if (updateUI && activeMessagePorts[tabId]) {
    dbgPrint(`[TABID: ${tabId}] Sending script blocking report directly to browser action.`);
    activeMessagePorts[tabId].postMessage({ show_info: newReport });
  }
}

/** Updates the report for tab with tabId with action.
 *
 *	This is what you call when a page gets changed to update the info
 *	box.
 * 
 *	Sends a message to the content script that adds a popup entry for
 *	a tab.
 *
 *	The action argument is an object with two properties: one named of
 * "accepted","blocked", "whitelisted", "blacklisted", whose value is
 * the array [scriptName, reason], and another named "url". Example:
 * action =
 *   {
 *     "accepted": ["jquery.js (someHash)", "Whitelisted by user"],
 *     "url": "https://example.com/js/jquery.js"
 *   }
 *
 *  Overrides the action type with the white/blacklist status for
 *  scriptName, if any.  Then add the entry if scriptName is not
 *  already in the entries associated with the action type.
 *
 *	Returns one of "whitelisted", "blacklisted", "blocked", "accepted"
 *	or "unknown"
 *
 *	NOTE: This WILL break if you provide inconsistent URLs to it.
 *	Make sure it will use the right URL when refering to a certain
 *	script.
 *
 */
async function addReportEntry(tabId, action) {

  const actionPair = Object.entries(action).find(
    ([k, _]) => ['accepted', 'blocked', 'whitelisted', 'blacklisted'].indexOf(k) != -1);
  if (!actionPair) {
    console.debug('Wrong action', action);
    return 'unknown';
  }
  const [actionType, actionValue] = actionPair;
  const scriptName = actionValue[0];

  const report = activityReports[tabId] || (activityReports[tabId] = await createReport({ tabId }));
  let entryType;
  // Update the report if the scriptName is new for the entryType.
  try {
    entryType = listManager.getStatus(scriptName, actionType);
    const entries = report[entryType];
    if (!entries.find(e => e[0] === scriptName)) {
      dbgPrint(activityReports);
      dbgPrint(activityReports[tabId]);
      dbgPrint(entryType);
      entries.push(actionValue);
    }
  } catch (e) {
    console.error('action %o, type %s, entryType %s', action, actionType, entryType, e);
    entryType = 'unknown';
  }

  // Refresh the main panel script list.
  if (activeMessagePorts[tabId]) {
    activeMessagePorts[tabId].postMessage({ show_info: report });
  }

  if (browser.sessions) browser.sessions.setTabValue(tabId, report.url, report);
  updateBadge(tabId, report);
  return entryType;
}


function getDomain(url) {
  let domain = url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
  if (url.indexOf('http://') == 0) {
    domain = 'http://' + domain;
  }
  else if (url.indexOf('https://') == 0) {
    domain = 'https://' + domain;
  }
  domain = domain + '/';
  domain = domain.replace(/ /g, '');
  return domain;
}

/**
 *
 *	This is the callback where the content scripts of the browser action
 *	will contact the background script.
 *
 */
async function connected(p) {
  if (p.name === 'contact_finder') {
    // style the contact finder panel
    await browser.tabs.insertCSS(p.sender.tab.id, {
      file: '/content/dialog.css',
      cssOrigin: 'user',
      matchAboutBlank: true,
      allFrames: true
    });

    // Send a message back with the relevant settings
    p.postMessage(await browser.storage.local.get(['pref_subject', 'pref_body']));
    return;
  }
  p.onMessage.addListener(async function(m) {
    let update = false;
    let contactFinder = false;

    for (const action of ['whitelist', 'blacklist', 'forget']) {
      if (m[action]) {
        let [key] = m[action];
        if (m.site) {
          key = ListStore.siteItem(m.site);
        } else {
          key = ListStore.inlineItem(key) || key;
        }
        await listManager[action](key);
        update = true;
      }
    }

    if (m.report_tab) {
      openReportInTab(m.report_tab);
    }
    // a debug feature
    if (m['printlocalstorage'] !== undefined) {
      console.log('Print local storage');
      debugPrintLocal();
    }
    // invoke_contact_finder
    if (m['invoke_contact_finder'] !== undefined) {
      contactFinder = true;
      await injectContactFinder();
    }
    // a debug feature (maybe give the user an option to do this?)
    if (m['deletelocalstorage'] !== undefined) {
      console.log('Delete local storage');
      debugDeleteLocal();
    }

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    if (contactFinder) {
      const tab = tabs.pop();
      dbgPrint(`[TABID:${tab.id}] Injecting contact finder`);
    }
    if (update || m.update && activityReports[m.tabId]) {
      const tabId = 'tabId' in m ? m.tabId : tabs.pop().id;
      dbgPrint(`%c updating tab ${tabId}`, 'color: red;');
      activeMessagePorts[tabId] = p;
      await updateReport(tabId, activityReports[tabId], true);
    } else {
      for (const tab of tabs) {
        if (activityReports[tab.id]) {
          // If we have some data stored here for this tabID, send it
          dbgPrint(`[TABID: ${tab.id}] Sending stored data associated with browser action'`);
          p.postMessage({ 'show_info': activityReports[tab.id] });
        } else {
          // create a new entry
          const report = activityReports[tab.id] = await createReport({ 'url': tab.url, tabId: tab.id });
          p.postMessage({ show_info: report });
          dbgPrint(`[TABID: ${tab.id}] No data found, creating a new entry for this window.`);
        }
      }
    }
  });
}

/**
*	Loads the contact finder on the given tab ID.
*/
async function injectContactFinder(tabId) {
  await Promise.all([
    browser.tabs.insertCSS(tabId, { file: '/content/overlay.css', cssOrigin: 'user' }),
    browser.tabs.executeScript(tabId, { file: '/content/contactFinder.js' }),
  ]);
}

/**
*	The callback for tab closings.
*
*	Delete the info we are storing about this tab if there is any.
*
*/
function deleteRemovedTabInfo(tab_id, _) {
  dbgPrint('[TABID:' + tab_id + ']' + 'Deleting stored info about closed tab');
  if (activityReports[tab_id] !== undefined) {
    delete activityReports[tab_id];
  }
  if (activeMessagePorts[tab_id] !== undefined) {
    delete activeMessagePorts[tab_id];
  }
  ExternalLicenses.purgeCache(tab_id);
}

/**
*	Called when the tab gets updated / activated
*
*	Here we check if  new tab's url matches activityReports[tabId].url, and if
* it doesn't we use the session cached value (if any).
*
*/

async function onTabUpdated(tabId, _, tab) {
  const [url] = tab.url.split('#');
  const report = activityReports[tabId];
  if (!(report && report.url === url)) {
    const cache = browser.sessions &&
      await browser.sessions.getTabValue(tabId, url) || null;
    // on session restore tabIds may change
    if (cache && cache.tabId !== tabId) cache.tabId = tabId;
    updateBadge(tabId, activityReports[tabId] = cache);
  }
}

async function onTabActivated({ tabId }) {
  await onTabUpdated(tabId, {}, await browser.tabs.get(tabId));
}

/* *********************************************************************************************** */
// TODO: Test if this script is being loaded from another domain compared to activityReports[tabid]["url"]

/**
 * Checks script and updates the report entry accordingly.
 *
 * Asynchronous function, returns the final edited script as a string,
 * or unedited script if passAccWlist is true and the script is
 * accepted or whitelisted.
 */
async function checkScriptAndUpdateReport(scriptSrc, url, tabId, whitelisted, isExternal = false, passAccWlist = false) {
  const scriptName = url.split('/').pop();
  if (whitelisted) {
    if (tabId !== -1) {
      const site = ListManager.siteMatch(url, whitelist);
      // Accept without reading script, it was explicitly whitelisted
      const reason = site
        ? `All ${site} whitelisted by user`
        : 'Address whitelisted by user';
      addReportEntry(tabId, { 'whitelisted': [site || url, reason], url });
    }
    if (scriptSrc.startsWith('javascript:') || passAccWlist)
      return scriptSrc;
    else
      return `/* LibreJS: script whitelisted by user preference. */\n${scriptSrc}`;
  }

  const [accepted, editedSource, reason] = listManager.builtInHashes.has(hash(scriptSrc)) ? [true, scriptSrc, 'Common script known to be free software.'] : checkLib.checkScriptSource(scriptSrc, scriptName, isExternal);

  if (tabId < 0) {
    return editedSource;
  }

  const domain = getDomain(url);
  const report = activityReports[tabId] || (activityReports[tabId] = await createReport({ tabId }));
  updateBadge(tabId, report, !accepted);
  const actionType = await addReportEntry(tabId, { 'url': domain, [accepted ? 'accepted' : 'blocked']: [url, reason] });
  switch (actionType) {
    case 'blacklisted': {
      const edited = `/* LibreJS: script ${actionType} by user. */`;
      return scriptSrc.startsWith('javascript:')
        ? `javascript:void(${encodeURIComponent(edited)})` : edited;
    }
    case 'whitelisted':
    case 'accepted':
      {
        return (scriptSrc.startsWith('javascript:') || passAccWlist)
          ? scriptSrc : `/* LibreJS: script ${actionType} by user. */\n${scriptSrc}`;
      }
    // blocked
    default: {
      return scriptSrc.startsWith('javascript:')
        ? `javascript:void(/* ${editedSource} */)`
        : `/* LibreJS: script ${actionType}. */\n${editedSource}`;
    }
  }
}

// Updates the extension icon in the toolbar.
function updateBadge(tabId, report = null, forceRed = false) {
  const blockedCount = report ? report.blocked.length + report.blacklisted.length : 0;
  const [text, color] = blockedCount > 0 || forceRed
    ? [blockedCount && blockedCount.toString() || '!', 'red'] : ['✓', 'green']
  const { browserAction } = browser;
  if ('setBadgeText' in browserAction) {
    browserAction.setBadgeText({ text, tabId });
    browserAction.setBadgeBackgroundColor({ color, tabId });
  } else {
    // Mobile
    browserAction.setTitle({ title: `LibreJS (${text})`, tabId });
  }
}

// TODO: is this the only way google analytics can show up?
function blockGoogleAnalytics(request) {
  const { url } = request;
  const res = {};
  if (url === 'https://www.google-analytics.com/analytics.js' ||
    /^https:\/\/www\.google\.com\/analytics\/[^#]/.test(url)
  ) {
    res.cancel = true;
  }
  return res;
}

async function blockBlacklistedScripts(request) {
  const { tabId, documentUrl } = request;
  const url = ListStore.urlItem(request.url);
  const status = listManager.getStatus(url);
  if (status !== 'blacklisted') return {};
  const blacklistedSite = ListManager.siteMatch(url, blacklist);
  await addReportEntry(tabId, {
    url: documentUrl,
    'blacklisted': [url, /\*/.test(blacklistedSite) ? `User blacklisted ${blacklistedSite}` : 'Blacklisted by user']
  });
  return BLOCKING_RESPONSES.REJECT;
}

/**
 * An onHeadersReceived handler.  See bg/ResponseProcessor.js for how
 * it is used.
 * 
 *	This listener gets called as soon as we've got all the HTTP
 * headers, can guess content type and encoding, and therefore
 * correctly parse HTML documents and external script inclusions in
 * search of non-free JavaScript
 */
const ResponseHandler = {
  /**
   * Checks black/whitelists and web labels.  Returns a
   * BlockingResponse (if we can determine) or null (if further work
   * is needed).
   * 
   * Enforce white/black lists for url/site early (hashes will be
   * handled later)
   */
  async pre(response) {
    const { request } = response;
    const { type, tabId, frameId, documentUrl } = request;
    const fullUrl = request.url;
    const url = ListStore.urlItem(fullUrl);
    const site = ListStore.siteItem(url);
    const blacklistedSite = ListManager.siteMatch(site, blacklist);
    const blacklisted = blacklistedSite || blacklist.contains(url);
    const topUrl = type === 'sub_frame' && request.frameAncestors && request.frameAncestors.pop() || documentUrl;

    if (blacklisted) {
      if (type === 'script') {
        // this shouldn't happen, because we intercept earlier in blockBlacklistedScripts()
        return BLOCKING_RESPONSES.REJECT;
      }
      // we handle the page change here too, since we won't call editHtml()
      if (type === 'main_frame') {
        activityReports[tabId] = await createReport({ url: fullUrl, tabId });
        // Go on without parsing the page: it was explicitly blacklisted
        const reason = blacklistedSite
          ? `All ${blacklistedSite} blacklisted by user`
          : 'Address blacklisted by user';
        await addReportEntry(tabId, { 'blacklisted': [blacklistedSite || url, reason], url: fullUrl });
      }
      // use CSP to restrict JavaScript execution in the page
      request.responseHeaders.unshift({
        name: 'Content-security-policy',
        value: 'script-src \'none\';'
      });
      // let's skip the inline script parsing, since we block by CSP
      return { responseHeaders: request.responseHeaders };
    } else {
      const whitelistedSite = ListManager.siteMatch(site, whitelist);
      const whitelisted = response.whitelisted = whitelistedSite || whitelist.contains(url);
      if (type === 'script') {
        if (whitelisted) {
          // accept the script and stop processing
          addReportEntry(tabId, {
            url: topUrl,
            'whitelisted': [url, whitelistedSite ? `User whitelisted ${whitelistedSite}` : 'Whitelisted by user']
          });
          return BLOCKING_RESPONSES.ACCEPT;
        } else {
          // Check the web labels
          const scriptInfo = await ExternalLicenses.check({ url: fullUrl, tabId, frameId, documentUrl });
          if (scriptInfo) {
            const [verdict, ret] = scriptInfo.free ? ['accepted', BLOCKING_RESPONSES.ACCEPT] : ['blocked', BLOCKING_RESPONSES.REJECT];
            const licenseIds = [...scriptInfo.licenses].map(l => l.identifier).sort().join(', ');
            const msg = licenseIds
              ? `Free license${scriptInfo.licenses.size > 1 ? 's' : ''} (${licenseIds})`
              : 'Unknown license(s)';
            addReportEntry(tabId, { url, [verdict]: [url, msg] });
            return ret;
          }
        }
      }
    }
    // it's a page (it's too early to report) or an unknown script:
    //  let's keep processing
    return null;
  },

  /**
  *	Here we do the heavylifting, analyzing unknown scripts
  */
  async post(response) {
    const { type } = response.request;
    const handler = type === 'script' ? handleScript : handleHtml;
    return await handler(response, response.whitelisted);
  }
}

/**
* Here we handle external script requests
*/
async function handleScript(response, whitelisted) {
  const { text, request } = response;
  const { url, tabId } = request;
  return await checkScriptAndUpdateReport(text, ListStore.urlItem(url), tabId, whitelisted, isExternal = true, passAccWlist = true);
}

/**
* Serializes HTMLDocument objects including the root element and
*	the DOCTYPE declaration
*/
function doc2HTML(doc) {
  let s = doc.documentElement.outerHTML;
  if (doc.doctype) {
    const dt = doc.doctype;
    let sDoctype = `<!DOCTYPE ${dt.name || 'html'}`;
    if (dt.publicId) sDoctype += ` PUBLIC "${dt.publicId}"`;
    if (dt.systemId) sDoctype += ` "${dt.systemId}"`;
    s = `${sDoctype}>\n${s}`;
  }
  return s;
}

/**
* Shortcut to create a correctly namespaced DOM HTML elements
*/
function createHTMLElement(doc, name) {
  return doc.createElementNS('http://www.w3.org/1999/xhtml', name);
}

/**
* Replace any element with a span having the same content (useful to force
* NOSCRIPT elements to visible the same way as NoScript and uBlock do)
*/
function forceElement(doc, element) {
  const replacement = createHTMLElement(doc, 'span');
  replacement.innerHTML = element.innerHTML;
  element.replaceWith(replacement);
  return replacement;
}

/**
 *	Forces displaying any noscript element not having the "data-librejs-nodisplay" attribute on pages.
 * returns number of elements forced, mutates doc.
*/
function forceNoscriptElements(doc) {
  let shown = 0;
  // inspired by NoScript's onScriptDisabled.js
  for (const noscript of doc.querySelectorAll('noscript:not([data-librejs-nodisplay])')) {
    const replacement = forceElement(doc, noscript);
    // emulate meta-refresh
    const meta = replacement.querySelector('meta[http-equiv="refresh"]');
    if (meta) {
      doc.head.appendChild(meta);
    }
    shown++;
  }
  return shown;
}

/**
*	Forces displaying any element having the "data-librejs-display" attribute.
*/
function showConditionalElements(doc) {
  let shown = 0;
  for (const element of document.querySelectorAll('[data-librejs-display]')) {
    forceElement(doc, element);
    shown++;
  }
  return shown;
}

/**
*	Tests to see if the intrinsic events on the page are free or not.
*	returns true if they are, false if they're not
*/
function readMetadata(metaElement) {

  if (metaElement === undefined || metaElement === null) {
    return false;
  }

  console.log('metadata found');

  let metadata = {};

  try {
    metadata = JSON.parse(metaElement.innerHTML);
  } catch (error) {
    console.log('Could not parse metadata on page.')
    return false;
  }

  const licenseStr = metadata['intrinsic-events'];
  if (licenseStr === undefined) {
    console.log('No intrinsic events license');
    return false;
  }
  console.log(licenseStr);

  const parts = licenseStr.split(' ');
  if (parts.length != 2) {
    console.log('invalid (>2 tokens)');
    return false;
  }

  if (checkLib.checkMagnet(parts[0])) {
    return true;
  } else {
    console.log('invalid (doesn\'t match licenses or key didn\'t exist)');
    return false;
  }
}
/**
 * 	Reads/changes the HTML of a page and the scripts within it.
 * Returns string or null.
 */
async function editHtml(html, documentUrl, tabId, frameId, whitelisted) {
  const htmlDoc = new DOMParser().parseFromString(html, 'text/html');
  // moves external licenses reference, if any, before any <SCRIPT> element
  ExternalLicenses.optimizeDocument(htmlDoc, { tabId, frameId, documentUrl });
  const url = ListStore.urlItem(documentUrl);

  if (whitelisted) { // don't bother rewriting
    await checkScriptAndUpdateReport(html, url, tabId, whitelisted); // generates whitelisted report
    return null;
  }
  if (checkFullHtml(html, documentUrl, url, tabId, htmlDoc)) return null;
  const dejaVu = new Map(); // deduplication map & edited script cache
  let modified = await checkIntrinsicEvents(html, documentUrl, tabId, htmlDoc, dejaVu);
  let modifiedInline = await checkInlineScripts(html, documentUrl, tabId, htmlDoc, dejaVu);

  modified = showConditionalElements(htmlDoc) > 0 || modified || modifiedInline;
  if (modified) {
    if (modifiedInline) {
      forceNoscriptElements(htmlDoc);
    }
    return doc2HTML(htmlDoc);
  }
  return null;
}

/**
 * Checks LibreJS-info element (undocumented) or licensing js in
 * entire html using @licstart/@licend ("JavaScript embedded on your
 * page..." in
 * https://www.gnu.org/software/librejs/free-your-javascript.html)
 * Returns true if handled, false otherwise.
 */
function checkFullHtml(html, documentUrl, url, tabId, htmlDoc) {
  const firstInlineScript = Array.from(htmlDoc.scripts).find(script => script && !script.src);
  const firstScriptSrc = firstInlineScript ? firstInlineScript.textContent : '';
  const licenseName = checkLib.checkLicenseText(firstScriptSrc);
  const metaElement = htmlDoc.getElementById('LibreJS-info');
  if (readMetadata(metaElement) || licenseName) {
    console.log('Valid license for the whole page found (LibreJS-info or @licstart/@licend)');
    const [line, extras] = metaElement ?
      [findLine(/id\s*=\s*['"]?LibreJS-info\b/gi, html), '(0)'] :
      [html.substring(0, html.indexOf(firstScriptSrc)).split(/\n/).length,
      '\n' + firstScriptSrc];
    let viewUrl = line ? `view-source:${documentUrl}#line${line}(<${metaElement ? metaElement.tagName : 'SCRIPT'}>)${extras}` : url;
    addReportEntry(tabId, { url, 'accepted': [viewUrl, `Global license for the page: ${licenseName}`] });
    return true;
  }
  return false;
}

/**
 * Checks intrinsic events, i.e. in event handlers or the href
 * attribute.
 * Returns true if htmlDoc is modified, false otherwise.
 * Mutates htmlDoc and dejaVu.
 */
async function checkIntrinsicEvents(html, documentUrl, tabId, htmlDoc, dejaVu) {
  let modified = false;
  const intrinsicFinder = /<[a-z][^>]*\b(on\w+|href\s*=\s*['"]?javascript:)/gi;
  for (const element of htmlDoc.querySelectorAll('*')) {
    let line = -1;
    for (const attr of element.attributes) {
      let { name, value } = attr;
      value = value.trim();
      if (name.startsWith('on') || (name === 'href' && value.toLowerCase().startsWith('javascript:'))) {
        if (line === -1) {
          line = findLine(intrinsicFinder, html);
        }
        try {
          const key = `<${element.tagName} ${name}="${value}">`;
          let edited;
          if (dejaVu.has(key)) {
            edited = dejaVu.get(key);
          } else {
            const url = `view-source:${documentUrl}#line${line}(<${element.tagName} ${name}>)\n${value.trim()}`;
            if (name === 'href') value = decodeURIComponent(value);
            edited = await checkScriptAndUpdateReport(value, url, tabId, whitelist.contains(url));
            dejaVu.set(key, edited);
          }
          if (edited && edited !== value) {
            modified = true;
            attr.value = edited;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
  return modified;
}

/**
 * Checks inline scripts.
 * Mutates dejaVu and htmlDoc.
 */
async function checkInlineScripts(html, documentUrl, tabId, htmlDoc, dejaVu) {
  let modifiedInline = false;
  const scriptFinder = /<script\b/ig;
  for (const script of htmlDoc.scripts) {
    const line = findLine(scriptFinder, html);
    if (!script.src && !(script.type && script.type !== 'text/javascript')) {
      const source = script.textContent.trim();
      let editedSource;
      if (dejaVu.has(source)) {
        editedSource = dejaVu.get(source);
      } else {
        const url = `view-source:${documentUrl}#line${line}(<SCRIPT>)\n${source}`;
        const edited = await checkScriptAndUpdateReport(source, url, tabId, false);
        editedSource = edited.trim();
        dejaVu.set(url, editedSource);
      }
      if (editedSource) {
        if (source !== editedSource) {
          script.textContent = editedSource;
          modifiedInline = true;
        }
      }
    }
  }
  return modifiedInline;
}

/**
 * Returns the line of next match for finder.
 * May mutate finder if it is stateful.
 */
const findLine = (finder, html) => finder.test(html) && html.substring(0, finder.lastIndex).split(/\n/).length || 0;


/**
* Here we handle html document responses
*/
async function handleHtml(response, whitelisted) {
  const { text, request } = response;
  const { url, tabId, frameId, type } = request;
  if (type === 'main_frame') {
    activityReports[tabId] = await createReport({ url, tabId });
    updateBadge(tabId);
  }
  return await editHtml(text, url, tabId, frameId, whitelisted);
}

const whitelist = new ListStore('pref_whitelist', Storage.CSV);
const blacklist = new ListStore('pref_blacklist', Storage.CSV);
const listManager = new ListManager(whitelist, blacklist,
  // built-in whitelist of script hashes, e.g. jQuery
  Object.values(require('./utilities/hash_script/whitelist').whitelist)
    .reduce((a, b) => a.concat(b)) // as a flat array
    .map(script => script.hash)
);


async function initDefaults() {
  const defaults = {
    pref_subject: 'Issues with Javascript on your website',
    pref_body: `Please consider using a free license for the Javascript on your website.

[Message generated by LibreJS. See https://www.gnu.org/software/librejs/ for more information]
`
  };
  const keys = Object.keys(defaults);
  const prefs = await browser.storage.local.get(keys);
  let changed = false;
  for (let k of keys) {
    if (!(k in prefs)) {
      prefs[k] = defaults[k];
      changed = true;
    }
  }
  if (changed) {
    await browser.storage.local.set(prefs);
  }
}

/**
*	Initializes various add-on functions
*	only meant to be called once when the script starts
*/
async function initAddon() {
  await initDefaults();
  await whitelist.load();
  browser.runtime.onConnect.addListener(connected);
  browser.storage.onChanged.addListener(optionsListener);
  browser.tabs.onRemoved.addListener(deleteRemovedTabInfo);
  browser.tabs.onUpdated.addListener(onTabUpdated);
  browser.tabs.onActivated.addListener(onTabActivated);
  // Prevents Google Analytics from being loaded from Google servers
  const all_types = [
    'beacon', 'csp_report', 'font', 'image', 'imageset', 'main_frame', 'media',
    'object', 'object_subrequest', 'ping', 'script', 'stylesheet', 'sub_frame',
    'web_manifest', 'websocket', 'xbl', 'xml_dtd', 'xmlhttprequest', 'xslt',
    'other'
  ];
  browser.webRequest.onBeforeRequest.addListener(blockGoogleAnalytics,
    { urls: ['<all_urls>'], types: all_types },
    ['blocking']
  );
  browser.webRequest.onBeforeRequest.addListener(blockBlacklistedScripts,
    { urls: ['<all_urls>'], types: ['script'] },
    ['blocking']
  );
  browser.webRequest.onResponseStarted.addListener(request => {
    const { tabId } = request;
    const report = activityReports[tabId];
    if (report) {
      updateBadge(tabId, activityReports[tabId]);
    }
  }, { urls: ['<all_urls>'], types: ['main_frame'] });

  // Analyzes all the html documents and external scripts as they're loaded
  ResponseProcessor.install(ResponseHandler);

  checkLib.init();

  const Test = require('./common/Test');
  if (Test.getURL()) {
    // export testable functions to the global scope
    this.LibreJS = {
      editHtml,
      handleScript,
      ExternalLicenses,
      ListManager, ListStore, Storage,
    };
    // create or focus the autotest tab if it's a debugging session
    if ((await browser.management.getSelf()).installType === 'development') {
      Test.getTab(true);
    }
  }
}

initAddon();
