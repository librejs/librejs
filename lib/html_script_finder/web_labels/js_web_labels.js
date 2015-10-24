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

// node.js url module. Makes it easier to resolve
// urls in that datauri loaded dom
var urlHandler = require("../../url_handler/url_handler");
var {Cc, Ci, Cu, Cm, Cr} = require("chrome");
var data = require("sdk/self").data;

// license definitions, we are using canonical urls and license
// identifiers.
var licenses = require('../../js_checker/license_definitions').licenses;

var getLicenseList = require('./find_js_labels').getLicenseList;
const types = require("../../js_checker/constant_types");

const addToCache = require("./script_hash_worker")
      .addToCache;

// keep web labels in memory so that they can be checked even when they
// are embedded dynamically.
var jsWebLabelEntries = {};

// store the url to js web labels already visited during this session
var jsLabelsPagesVisited = {};

var WebLabelFinder = function () {
    this.dom = null;
    this.pageURL = null;
    this.jslicenseURL = null;
    this.pageContent = null;
    this.licenseList = null;
    this.callback = null;
};

WebLabelFinder.prototype.init = function(dom, pageURL, callback) {
    var that = this;
    this.pageURL = pageURL;
    this.dom = dom;
    this.callback = function (a) {
        if (typeof a === 'undefined') {
            a = null;
        }

        // rewrite callback as soon as it is triggered once.
        that.callback = function () {
            console.debug("Callback already called");
        };

        callback(a);
    };
    this.findJavaScriptLicenses();
    this.pageContent = '';
    this.jslicenseURL = '';
};

WebLabelFinder.prototype.findJavaScriptLicenses = function () {
    this.searchForJsLink();

    if (this.jslicenseURL && !(jsLabelsPagesVisited[this.jslicenseURL])) {
        // get content from license page.
        console.debug('called fetch license page for', this.jslicenseURL);
        this.pageContent = this.fetchLicensePage();
    } else {
        console.debug(this.jslicenseURL, "already visited");
        this.callback();
    }
};

WebLabelFinder.prototype.searchForJsLink = function() {
    console.debug('triggered searchForJsLink');
    if (this.dom) {
        var linkTags = this.dom.getElementsByTagName('a'),
            i = 0,
            len = linkTags.length,
            path;

        // loop through all a tags.
        for (; i < len; i++) {
            if (
                (linkTags[i].hasAttribute('rel') &&
                 linkTags[i].getAttribute('rel') === 'jslicense') ||
                    (linkTags[i].hasAttribute('data-jslicense') &&
                     linkTags[i].getAttribute('data-jslicense') === '1')
            ) {
                // This page has a web labels link
                return this.formatURL(linkTags[i]);
            }
        }
    }

    // no js web labels were found. call back.
    this.callback();
    return false;
};

WebLabelFinder.prototype.formatURL = function(link) {
    this.jslicenseURL = urlHandler.resolve(this.pageURL, link.href);
    this.jslicenseURL = urlHandler.addFragment(this.jslicenseURL, 'librejs=true');
    console.debug('license URL found', this.jslicenseURL);
    return this.jslicenseURL;
};

WebLabelFinder.prototype.fetchLicensePage = function() {
    var that = this;
    try {
        var req =  Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
            .createInstance();

        req.onload = function() {
            console.debug("Fetching License!");
            console.debug("URL is ", this._url);

            that.licenseList = getLicenseList(this.responseXML);
            console.debug("the license list", that.licenseList);
            that.matchListWithDefs(this._url);

            // add these entries to the global
            // object for dynamically embedded scripts.
            jsWebLabelEntries[that.pageURL] = that.licenseList;
            jsLabelsPagesVisited[req._url] = 1;
        };
        console.debug(this.jslicenseURL);
        req.open('GET', this.jslicenseURL, true);
        req._url = this.jslicenseURL;
        req.responseType = "document";
        req.send();
    } catch (e) {
        console.debug(e, e.lineNumber, e.fileName, this.jslicenseURL);
        this.callback({});
    }
};

/**
 * @method isLicenseFree
 * Returns true if the given web labels row refers to a script that
 * can be executed by LibreJS.
 *
 * This method has some side effects :-/
 *
 * @param {Object} lic - A license node from a JS web labels page. It's
 *                       expected to contain one or more licenses.
 * @return {Boolean}
 */
WebLabelFinder.prototype.isLicenseFree = function(
    lic, jslicenseURL, callback
) {
    // For each license that this license row contains.
    var isFree = false;
    // licenseStatuses is later used to determine isFree.
    var licenseStatuses = [];

    for (var i = 0; i < lic.licenses.length; i++) {
        var license;
        var found = false;

        // Check if we can look up this license by its identifier.
        var identifier = lic.licenses[i].licenseName;
        if (typeof identifier !== 'undefined' &&
            typeof licenses[identifier] !== 'undefined'
           ) {
            console.debug('recognized by index', identifier);
            // This license was recognized, and it was free. Add it
            // to the array of license status, which we'll look at
            // when we're done with this web label row.
            licenseStatuses.push(true);

            console.debug("about TO ADD TO XHR: ", lic.fileUrl);
            this.listCheck[lic.fileUrl] = 0;
            addToCache(lic, 0, jslicenseURL, callback);

            // Break out of the loop cause we found a matching license.
            found = true;
            continue;
        }

        // For each license from the internal license definitions
        for (license in licenses) {
            if (found === true) {
                break;
            }
            var licDef = licenses[license];
            var licArray = [];
            if (!licDef.canonicalUrl) {
                continue;
            }
            if (typeof licDef.canonicalUrl === 'string') {
                licArray = [licDef.canonicalUrl];
            } else {
                licArray = licDef.canonicalUrl;
            }

            // For each of the canonical URLs recognized by this license
            // definition
            for (var j = 0; j < licArray.length; j++) {
                if (urlHandler.removeFragment(licArray[j]) ===
                    urlHandler.removeFragment(lic.licenses[i].licenseUrl)
                   ) {
                    if (!require("sdk/url").isValidURI(lic.fileUrl)) {
                        console.debug(lic.fileUrl, " is not a valid URL");
                        callback();
                    }

                    // This license was recognized, and it was free. Add it
                    // to the array of license status, which we'll look at
                    // when we're done with this web label row.
                    licenseStatuses.push(true);

                    console.debug("about TO ADD TO XHR: ", lic.fileUrl);
                    this.listCheck[lic.fileUrl] = 0;
                    addToCache(lic, 0, jslicenseURL, callback);

                    // Break out of the nearest two loops cause we found
                    // a matching license
                    found = true;
                    break;
                }
            }
        }
    }

    // Tally up the licenses we were able to match.
    if (licenseStatuses.length > 0 &&
        // If the number of licenses we matched is at least one, and
        // it's the same number as the number of licenses in this Web
        // Label column, only then can we recognize this script as free.
        // licenseStatus.length should never be larger than
        // lic.licenses.length.
        licenseStatuses.length >= lic.licenses.length
       ) {
        isFree = true;
    }

    return isFree;
};

WebLabelFinder.prototype.matchListWithDefs = function(jslicenseURL) {
    var that = this;
    var licDef,
        license, script;
    var cacheCalls = 0;
    this.listCheck = {};

    // nested loop.
    cacheCalls = 0;
    var callback = function (url) {
        cacheCalls++;
        that.listCheck[url] = 1;
        if (cacheCalls === Object.keys(that.listCheck).length) {
            console.debug("triggering callback duh");
            // return array to requester object
            callback = false;
            that.callback(that.licenseList);
        }
    };
    require("sdk/timers").setTimeout(function () {
        // callback after 60 seconds if it's still not returned.
        // using this as a safeguard.
        // return array to requester object
        if (callback !== false) {
            that.callback(that.licenseList);
            console.debug(that.listCheck);
        }
    }, 15000);

    for (var i = 0; i < this.licenseList.length; i++) {
        // this.licenseList[i] is the web labels license column
        var lic = this.licenseList[i];
        if (this.isLicenseFree(lic, jslicenseURL, callback)) {
            lic.free = true;
        }
    }
};

exports.WebLabelFinder = WebLabelFinder;

// Store the web labels harvested across webpages (only in this session).
exports.jsWebLabelEntries = jsWebLabelEntries;

exports.jsLabelsPagesVisited = jsLabelsPagesVisited;
