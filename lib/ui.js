/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2015 Nik Nyby
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

let data = require("sdk/self").data;
let panel = require('sdk/panel');
let tabs = require("sdk/tabs");
let {getMostRecentBrowserWindow} = require('sdk/window/utils');
let {ToggleButton} = require('sdk/ui/button/toggle');

let settings_tab = require('./settings/settings_tab');
let allowedRef = require("./http_observer/allowed_referrers")
    .allowedReferrers;
let urlHandler = require("./url_handler/url_handler");
let removedScripts = require("./script_entries/removed_scripts")
    .removedScripts;
let acceptedScripts = require("./script_entries/accepted_scripts")
    .acceptedScripts;
let jsLabelsPagesVisited = require('./html_script_finder/web_labels/js_web_labels')
    .jsLabelsPagesVisited;
let dryRunScripts = require("./script_entries/dryrun_scripts").dryRunScripts;
let types = require("./js_checker/constant_types");
const removeHashCallback = require("./js_checker/js_checker").removeHashCallback;

// move to sub-module later
const scriptsCached = require("./script_entries/scripts_cache").scriptsCached;

function generateDataURI (encodedText) {
    return "data:text/html;charset=UTF-8;base64," + encodedText;
}

/**
 * UI
 *
 * A singleton that starts the user interface content scripts.
 */
let UI = exports.UI = {
    init: function() {
        var mainPanel = panel.Panel({
            contentURL: data.url('display_panel/content/display-panel.html'),
            width:  800,
            height: 500,
            contentScriptFile: [
                data.url('settings/third-party/jquery/jquery.min.js'),
                data.url('display_panel/main_panel.js')
            ],
            onShow: this.showPanelContent,
            onHide: function() {
                toggleButton.state('window', { checked: false });
            }
        });

        mainPanel.port.on('hideMainPanel', function () {
            mainPanel.hide();
        });

        mainPanel.port.on('allowAllClicked', function (url) {
            url = urlHandler.removeFragment(url);
            allowedRef.addPage(url);
            tabs.activeTab.reload();
        });

        mainPanel.port.on('disallowAllClicked', function (url) {
            console.debug('url is', url);
            url = urlHandler.removeFragment(url);
            console.debug('before clear, url is in allowedRef',
                          allowedRef.urlInAllowedReferrers(url));
            allowedRef.clearSinglePageEntry(url);
            console.debug('after clear, url is in allowedRef',
                          allowedRef.urlInAllowedReferrers(url));
            mainPanel.hide();
            tabs.activeTab.reload();
        });

        mainPanel.port.on('openInTab', function (text) {
            var str = generateDataURI(text);
            tabs.open(str);
            mainPanel.hide();
        });

        mainPanel.port.on('whitelistByHash', function(
            hash, url, name, reason
        ) {
            console.debug("hash is", hash);
            url = urlHandler.removeFragment(url);
            /*  var cached_result = scriptsCached.isCached(hash);
                if (cached_results) {
                reason = cached_result['reason'];
                }*/
            scriptsCached.addEntryByHash(
                hash, types.whitelisted(reason), {}, true, url);
        });

        mainPanel.port.on('removeFromWhitelistByHash', function (hash) {
            scriptsCached.removeEntryByHash(hash);
            removeHashCallback(hash);
        });

        mainPanel.port.on('openSesame', function () {
            // open the settings tab.
            settings_tab.settingsManager.open();
            mainPanel.hide();
        });

        var toggleButton = ToggleButton({
            id: 'librejs-toggle-switch',
            label: 'LibreJS',
            icon: {
                '16': './widget/images/librejs.png',
                '32': './widget/images/librejs-32.png',
                '64': './widget/images/librejs-64.png'
            },
            panel: mainPanel,
            onChange:  function(state) {
                if (state.checked) {
                    mainPanel.show({
                        position: toggleButton
                    });
                }
            }
        });

        var menuitem = require("menuitems").Menuitem({
            id: 'librejs_settings',
            menuid: 'menu_ToolsPopup',
            label: 'LibreJS Whitelist',
            onCommand: function() {
                settings_tab.settingsManager.open();
            },
            insertBefore: "menu_pageInfo"
        });
    },

    showPanelContent: function() {
        let that = this;
        var message, externalEntries,
            externalScripts, urlTabIndex, tabData;

        var worker = tabs.activeTab.attach({
            contentScriptFile: [
                data.url('complain/contact_regex.js'),
                data.url('complain/link_types.js'),
                data.url('settings/third-party/jquery/jquery.min.js'),
                data.url('complain/contact_finder.js'),
                data.url('complain/pagemod_finder.js'),
                data.url('script_detector/script_detector.js')
            ],
            contentScriptWhen: 'ready',
            onMessage: function(respData) {
                var url = urlHandler.removeFragment(tabs.activeTab.url);

                if (respData.event === 'scriptsFetched') {
                    var scriptsData = {
                        'jsLabelsPagesVisited': jsLabelsPagesVisited,
                        'removed': removedScripts.getScripts(url),
                        'accepted': acceptedScripts.getScripts(url),
                        'dryRun': dryRunScripts.getScripts(url)
                    };
                    that.postMessage({
                        'pageURL': url,
                        'urlData': scriptsData,
                        'isAllowed': allowedRef.urlInAllowedReferrers(url)
                    });
                    worker.port.emit('pageUrl', url);
                } else {
                    that.postMessage(respData);
                }
            }
        });
    }
};

UI.init();
