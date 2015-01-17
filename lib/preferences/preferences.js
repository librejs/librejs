/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
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
var data = require("sdk/self").data;
var panel = require("sdk/panel");
var simpleStorage = require("sdk/simple-storage");

/*
 *Create pref panel
 */
exports.prefpanel = panel.Panel({
  contentURL: data.url("preferences_panel/preferences_panel.html"),
  contentScriptFile: data.url("preferences_panel/contentscript.js"),
  contentScriptWhen: "ready",
  widht:400,
  height:400,
  onMessage: function(message) {
    handlePrefPanelMessage(message);
  },
  onShow: function() {
    getAllPrefPanelPrefs();
  }
});

var prefpanel = exports.prefpanel;

function handlePrefPanelMessage(message) {
  var prefSplit = message.split(":");
  if(prefSplit[0] == "SETPREF") {
    simpleStorage.storage[prefSplit[1]] = prefSplit[2];
  } else {
    console.debug(message);
  }
}

function getAllPrefPanelPrefs() {
  var allprefnames = ['INCOMING PREFS', 'nolazy'];

  var allprefvalues = [];
  
  allprefvalues[0] = "INCOMINGPREFS";
  
  for(var i = 1; i < allprefnames.length+1; i++) {
    var pref = simpleStorage.storage[allprefnames[i]];
    
    if(typeof(pref) == 'undefined') {
      // If it doesn't exist yet, default to false and set it for the future
      simpleStorage.storage[allprefnames[i]] = "false";
      pref = "false";
    }
    
    allprefvalues[i] = allprefnames[i] + ":" + pref;
  }
  
  prefpanel.postMessage(allprefvalues);
}
