/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
 * Copyright (C) 2014, 2015 Nik Nyby
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

var urlHandler = require("../url_handler/url_handler");

/**
 * addScriptsToPanelList
 *
 * Looks for scripts that are either valid or flagged with libreJS
 * 
 */ 
exports.addScriptsToPanelList = function (url, respData) {

  var panelRemovedScripts = [];
  var panelAcceptedScripts = [];
  var panelDryRunScripts = [];
  
  // use url. remove fragment.
  url = urlHandler.removeFragment(url);
  var contents, i, reason;

  for (i = 0; i < respData.value.blocked.length; i++) {
	  // if external script only.
	  pathToUrl(respData.value.blocked[i], url);
	  panelRemovedScripts.push(respData.value.blocked[i]);
  }
  
  for (i = 0; i < respData.value.accepted.length; i++) {

	  // if external script only.
	  pathToUrl(respData.value.accepted[i], url);
	  panelAcceptedScripts.push(respData.value.accepted[i]);
  }
  for (i = 0; i < respData.value.dryRun.length; i++) {
	  // if external script only.
	  pathToUrl(respData.value.dryRun[i], url);
	  panelDryRunScripts.push(respData.value.dryRun[i]);
  }

  return {'removed': panelRemovedScripts,
          'accepted': panelAcceptedScripts,
          'dryRun': panelDryRunScripts};
};


/**
 * pathToUrl
 * 
 * convert a relative path to a url.
 * 
 */
var pathToUrl = function (scriptEntry, url) {
  if (scriptEntry.inline === false) {
	  scriptEntry.url = urlHandler.resolve(url, scriptEntry.url);
  }
};
