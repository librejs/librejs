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

var removedScripts = require("../../script_entries/removed_scripts")
    .removedScripts;

var acceptedScripts = require("../../script_entries/accepted_scripts")
    .acceptedScripts;
var dryRunScripts = require("../../script_entries/dryrun_scripts")
    .dryRunScripts;

var Script = function(props) {
    // can be an attribute, an inline script,
    // or an external script.
    this.type = null;

    /*
     * Script.status - The script's current status.
     *
     * Possible values are:
     *
     *   0 - unchecked
     *   1 - checked
     *   2 - accepted
     *   3 - rejected
     *   4 - jsweblabel
     *
     * See script_properties.js for definitions.
     */
    this.status = null;

    // contains the dom element
    this.element = null;

    // the attribute name, if applicable.
    this.attribute = null;

    // the script text as a string.
    this.value = null;

    // the src url if external.
    this.url = null;

    // the script text if inline.
    this.text = null;

    this.init(props);
};

Script.prototype.init = function(props) {
    // check the required elements are present.
    if (typeof props === 'undefined') {
        throw "Error, missing script entry value in script_object.js";
    }

    // required properties
    if (typeof props.type !== 'undefined') {
        this.type = props.type;
    } else {
        throw "type is missing";
    }

    if (typeof props.status !== 'undefined') {
        this.status = props.status;
    } else {
        throw "status is missing";
    }

    if (typeof props.element !== 'undefined') {
        this.element = props.element;
    } else {
        throw "element is missing";
    }

    // conditional properties.
    this.url = (props.url) ? props.url : null;
    this.text = (props.text) ? props.text : null;
    this.jsAttributes = (props.jsAttributes) ? props.jsAttributes : null;

    if (typeof this.text !== 'string' &&
        this.tree !== null &&
        typeof this.tree === 'object' &&
        this.tree.hasOwnProperty('jsCode')
       ) {
        this.text = this.tree.jsCode;
    }
};

Script.prototype.tagAsDryRun = function(pageURL, reason, hash) {
    var content = this.findContentType();
    var inline = (this.url != undefined) ? false : true;
    var url = (inline == false ? this.url : null);
    console.debug("url is", url);
    this.element.setAttribute('data-librejs', 'dryrun');
    this.element.setAttribute('data-librejs-reason', reason);

    dryRunScripts.addAScript(
        pageURL,
        {'inline': inline,
         'contents': content,
         'reason': reason,
         'url': url,
         'hash': hash
        });
};

Script.prototype.tagAsAccepted = function(pageURL, reason, hash) {
    var content = this.findContentType();
    var inline = (this.url != undefined) ? false : true;
    var url = (inline == false ? this.url : null);
    console.debug("url is", url);
    this.element.setAttribute('data-librejs', 'accepted');
    this.element.setAttribute('data-librejs-reason', reason);

    acceptedScripts.addAScript(
        pageURL,
        {'inline': inline,
         'contents': content,
         'reason': reason,
         'url': url,
         'hash': hash
        });

};

Script.prototype.tagAsRemoved = function(pageURL, reason, hash) {
    var content = this.findContentType();
    var inline = (this.url != undefined) ? false : true;
    var url = (inline == false ? this.url : null);
    this.element.setAttribute('data-librejs', 'rejected');
    this.element.setAttribute('data-librejs-reason', reason);
    console.debug("tagAsRemoved hash is", hash);
    removedScripts.addAScript(pageURL, {
        'inline': inline,
        'contents': content,
        'reason': reason,
        'url': url,
        'hash': hash
    });

};

Script.prototype.tagAsDryRun = function(pageURL, reason, hash) {
    var content = this.findContentType();
    var inline = (this.url != undefined) ? false : true;
    var url = (inline == false ? this.url : null);
    this.element.setAttribute('data-librejs', 'dryrun');
    this.element.setAttribute('data-librejs-reason', reason);

    dryRunScripts.addAScript(
        pageURL,
        {'inline': inline,
         'contents': content,
         'reason': reason,
         'url': url,
         'hash': hash
        });
};

/**
 * removeNarcissusBugLine
 *
 * Removes the line that is appended to all
 * inline scripts and prevent the bug that prevent
 * script tags with comments only from being checked.
 *
 */
Script.prototype.removeNarcissusBugLine = function(str) {
    return str.replace('\n\nthis.narcissusBugFixLibreJS', '');
};

/**
 * findContentType
 *
 * Figure out whether it's an external script,
 * an inline script, or an attribute from the property
 * that has been set, rather than blindly trusting the given
 * constant.
 */
Script.prototype.findContentType = function() {
    if (this.url != undefined) {
        return "";
    } else if (this.text != undefined) {
        return this.element.text;
    } else if (this.jsAttributes != undefined) {
        // return the array.
        return JSON.stringify(this.jsAttributes);
    }
};

exports.Script = function(props) {
    return new Script(props);
};
