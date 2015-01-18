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

/**
 *  url_handler
 *  A module using the url tool from Node.js to perform operations on
 *  urls at various spots (tabs, caching, ...) in the add-on.
 *
 */

// node.js url module. Makes it easier to resolve
// urls in that datauri loaded dom
var nodeJsUrl = require("url_handler/node_url");

var urlUtils = {
    getFragment: function (url) {
	    var parse =  nodeJsUrl.parse(url);
	    if (parse.hash !== undefined) {
	        return(parse.hash);
	    }
    },

    removeFragment: function (url) {
	    var parse =  nodeJsUrl.parse(url);
	    if (parse.hash !== undefined) {
	        // Amazon track package bug fix.
	        // when url has query string and fragment
	        // the add-on wouldn't remove cache entry
	        // properly.
	        delete parse.hash;
	    }
	    return nodeJsUrl.format(parse);
    },

    addFragment: function (url, query) {
	    var parse = nodeJsUrl.parse(url);

	    // replace hash if it exists.
	    parse.hash = '#' + query;

	    return nodeJsUrl.format(parse);
    },

    addQuery: function (url, query) {
	    var parse = nodeJsUrl.parse(url);
	    console.debug('my parse search', parse.search);
	    if (parse.search === undefined) {
	        parse.search = '?' + query;
	    } else {
	        parse.search = parse.search + '&' + query;
	        console.debug('parse search is now' + parse.search);
	    }
	    return nodeJsUrl.format(parse);
    },

    getHostname: function (url) {
	    return nodeJsUrl.parse(url).hostname;
    },

    /**
     * remove www from hostname.
     */
    removeWWW: function (str) {
        if (str !== undefined) {
	        return str.replace("www.", "", 'i');
        }
        return "";
    },

    /**
     *
     * haveSameHostname
     * Compare that two urls have the same hostname.
     *
     */
    haveSameHostname: function (url1, url2) {
	    try {
	        var host1 = this.removeWWW(this.getHostname(url1)).toLowerCase();
	        var host2 = this.removeWWW(this.getHostname(url2)).toLowerCase();
	        return host1 === host2;
	    } catch (x) {
	        console.debug('error with url_handler', x, x.fileName, x.lineNumber);
	    }
    }
};

exports.parse = nodeJsUrl.parse;
exports.resolve = nodeJsUrl.resolve;
exports.resolveObject = nodeJsUrl.resolveObject;
exports.format = nodeJsUrl.format;
exports.removeFragment = urlUtils.removeFragment;
exports.addQuery = urlUtils.addQuery;
exports.getFragment = urlUtils.getFragment;
exports.addFragment = urlUtils.addFragment;
exports.getHostname = urlUtils.getHostname;
exports.haveSameHostname = urlUtils.haveSameHostname;
exports.removeWWW = urlUtils.removeWWW;
