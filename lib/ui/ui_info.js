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

// page mod executing content script at every page load.

var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var urlHandler = require("url_handler/url_handler");
var pageWorker = require("sdk/page-worker");
var tabs = require("sdk/tabs");
var prefs = require("addon_management/prefchange");

// contain list of recently found contact links or email addresses.
var contactList = {};

// constants. Also available in lib/ui_info.js
const CERTAIN_EMAIL_ADDRESS_FOUND = 'certainEmailAddressFound';
const UNCERTAIN_EMAIL_ADDRESS_FOUND = 'uncertainEmailAddresFound';

// Looking for contact links
const CERTAIN_LINK_FOUND = 'certainLinkFound';
const PROBABLE_LINK_FOUND = 'probableLinkFound';
const UNCERTAIN_LINK_FOUND = 'uncertainLinkFound';
const LINK_NOT_FOUND = 'contactLinkNotFound';

// Looking for identi.ca and twitter accounts.
const TWITTER_LINK_FOUND = 'twitterLinkFound';
const IDENTICA_LINK_FOUND = 'identicaLinkFound';

// phone number and address
const PHONE_NUMBER_FOUND = 'phoneNumberFound';
const SNAIL_ADDRESS_FOUND = 'snailAddressFound';

/**
 * main pageMod.
 * Find blocked script in all pages being opened.
 * Launch the scripts that search for a complaint contact.
 *
 */

pageMod.PageMod({
    include: ['file://*', '*', 'data:*', 'about:*'],
    contentScriptWhen: 'end',

    contentScriptFile: [
        data.url('complain/contact_regex.js'),
        data.url('complain/link_types.js'),
        data.url('settings/third-party/jquery/jquery.min.js'),
        data.url('complain/contact_finder.js'),
        data.url('complain/pagemod_finder.js'),
        data.url('script_detector/script_detector.js')
    ],

    onAttach: function onAttach(worker) {
        if (worker.tab !== undefined && prefs.isComplaintTab()) {
            // this is a tab.
            if (!foundInContactList(worker.url)) {
                // the hostname doesn't appear in the object literal.
                // run script fetching/complaint feature if applicable.
                tabProcess(worker);
            } else {
                worker.postMessage(foundInContactList(worker.url));
            }
        }
    }
});

/**
 * foundInContactList
 *
 * Provides link if contact link is found for given url, or else
 * false.
 */
var foundInContactList = function (url) {
    var hostname = urlHandler.getHostname(url);
    if (contactList[hostname] !== undefined) {
        return contactList[hostname];
    } else {
        return false;
    }
};

/**
 * tabProcess
 * Find blocked/accepted scripts, prepare
 * display panel and complaint panel.
 */
var tabProcess = function (worker) {
    var visitedUrl = {};

    // webmaster email is better than a webpage.
    worker.emailFound = false;
    var modUrl = '',
        searchUrl = '';

    modUrl = worker.url;
    console.debug('pagemod triggered');

    worker.port.emit('prefs', {
        complaintEmailSubject: prefs.complaintEmailSubject(),
        complaintEmailBody: prefs.complaintEmailBody()
    });

    // send local path to complain button graphic.
    worker.port.emit('assetsUri',
                     {'event': 'assets-uri',
                      'value':  data.url('assets/')});
    worker.port.emit('pageUrl',
                     {'event': 'page-url',
                      'value': modUrl});

    worker.on('message', function (respData) {
        console.debug('worker is receiving a message', respData.event);
        var pw;

        worker.on('detach', function () {
            console.debug('detaching worker');
            if (pw) {
                pw.destroy();
            }
        });
        if (respData.contact !== undefined) {
            // pass the message to the complaint display panel.
            worker.port.emit('complaintLinkFound', respData);
        } else if (respData.event === 'complaintSearch') {
            if (worker.tab) {
                console.debug('worker tab url', worker.tab.url);
            }
            if (!(respData.urlSearch.linkValue in visitedUrl)) {
                visitedUrl[respData.urlSearch.linkValue] = 1;
                respData.urlSearch.linkValue = urlHandler.addFragment(
                    respData.urlSearch.linkValue, 'librejs=true');
                pw = searchSecondLevelPage(
                    this, respData.urlSearch.linkValue, this.url);
            }
            // currently not needed.
            /*else {
              console.debug(respData.urlSearch.linkValue, 'already visited');
              }*/
        }
    });
};

var searchSecondLevelPage = function(
    worker, urlToSearch, originalUrl) {
    return;
    var originalWorker = worker;

    console.debug('searchSecondLevelPage');
    console.debug(urlToSearch, 'and', originalUrl);

    if (urlHandler.haveSameHostname(urlToSearch, originalUrl)) {
        return pageWorker.Page({
            contentURL: urlToSearch,
            contentScriptFile: [
                data.url('complain/contact_regex.js'),
                data.url('complain/link_types.js'),
                data.url('settings/third-party/jquery/jquery.min.js'),
                data.url('complain/contact_finder.js'),
                data.url('complain/worker_finder.js')
            ],
            contentScriptWhen: "end",
            onMessage: function (respData) {
                console.debug(JSON.stringify(respData));
                console.debug(originalWorker.url);
                originalWorker.postMessage(respData);

                if (respData.event === 'destroy') {
                    try {
                        console.debug('destroying worker', this.contentURL);
                        this.destroy();
                    } catch (e) {
                        console.debug('in worker', e);
                    }
                }
            }
        });
    }
};

exports.testModule = {
    'contactList': contactList,
    'foundInContactList': foundInContactList,
    'tabProcess': tabProcess
};
