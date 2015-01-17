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

var httpRe = /^(http:)/i;
var httpsRe = /^(https:)/i;

exports.urlSeenTester = {
    whitelist: {},

    httpToHttps: function (url) {
        try {

            if (httpRe.test(url)) {

                return url.replace(httpRe, 'https:');

            } else if (httpsRe.test(url)) {

                return url.replace(httpsRe, 'http:');

            } else {

                return url;

            }
        } catch (x) {
            console.debug('error', x);
        }
    },

    clearUrls: function () {
        this.whitelist = {};
    },

    clearUrl: function (url) {
        if (this.whitelist[url]) {

            // console.debug('disallowing', url);
            delete this.whitelist[url];
        }
    },

    addUrl: function (url) {
        console.debug('adding', url);

        if (!this.isWhitelisted(url)) {

            console.debug('allowing', url);
            this.whitelist[url] = true;
        }
    },

    isWhitelisted: function (url) {
        if (this.whitelist[url] || this.whitelist[this.httpToHttps(url)]) {
            console.debug('found to be whitelisted', url);
            return true;
        }
        return false;
    }

};
