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
const tabs = require("sdk/tabs");
const data = require("sdk/self").data;
const storage = require("./storage").librejsStorage;
const scriptsCached = require("../script_entries/scripts_cache")
      .scriptsCached;

let settingsManager = {
    settingsTab: {
        url: data.url("settings/index.html"),
        onReady: function (tab) {
            console.debug("populating form");
            var that = this;
            let cache_data = scriptsCached.getCacheForWriting();
            let worker = tab.attach({
                contentScriptFile: [
                    data.url('settings/js/pagescript-listener.js'),
                    data.url('settings/js/pagescript-emitter.js')
                ]
            });
            worker.port.emit("populate-form", cache_data);
            worker.port.on("rules-form-delete", function (hash) {
                try {
                    scriptsCached.removeEntryByHash(hash);
                } catch (e) {
                    console.log('caught!', e, e.lineNumber, e.filename);
                }
                //worker.port.emit("populate-form", scriptsCached.getCacheForWriting());
            });
            worker.port.on("rules-form-delete-all", function () {
                scriptsCached.resetCache();
            });
        },
        onActivate: function (tab) {
            // just reload the form.
            console.debug("Tab is activated again");
            var that = this;
            let cache_data = scriptsCached.getCacheForWriting();      
            let worker = tab.attach({
                contentScriptFile: [
                    data.url('settings/js/pagescript-listener.js'), 
                    data.url('settings/js/pagescript-emitter.js')
                ]
            });
            worker.port.emit("populate-form", cache_data);
        }
    },
    
    init: function () {
        settings.onLoad(function (data) {});
    },

    open: function () {
        console.debug("settings tab data url is", this.settingsTab.url);
        tabs.open(this.settingsTab);
    }
};

exports.settingsManager = settingsManager;
