/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2014 Loic J. Duros
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

// array reflects valid types as listed in
// http://mxr.mozilla.org/mozilla-central/source/content/base/src/nsScriptLoader.cpp#437
// anything appended to end of strings is considered valid:
var jsValidTypes = [
        /^text\/javascript/i,
        /^text\/ecmascript/i,
        /^application\/javascript/i,
        /^application\/ecmascript/i,
        /^application\/x-javascript/i
];

// the list of all available event attributes
var intrinsicEvents = [
    "onload",
    "onunload",
    "onclick",
    "ondblclick",
    "onmousedown",
    "onmouseup",
    "onmouseover",
    "onmousemove",
    "onmouseout",
    "onfocus",
    "onblur",
    "onkeypress",
    "onkeydown",
    "onkeyup",
    "onsubmit",
    "onreset",
    "onselect",
    "onchange"];


/**
 * scriptHasInvalidType
 *
 * Checks that a script does not have a js "template" type.
 * Normally any script that has a type attribute other than the
 * few allowed ones is not interpreted. But by security, we only
 * discard a few of them.
 *
 * @param script obj The script element.
 * @return returns true if it matches a template type.
 *
 */
var scriptHasInvalidType = function (type) {

    var i = 0,
        le = jsValidTypes.length;

    if (type === 'librejs/blocked') {
        // js has already been blocked.
        return true;
    }

    if (!type) {
        // type isn't set, don't look further.
        return false;
    }

    for (; i < le; i++) {
        if (jsValidTypes[i].test(type)) {
            return false;
        }
    }

    // type is invalid and
    // hence cannot be executed.
    return true;

};


/**
 * scriptDetector
 * Detects all scripts (inline, onpage, and external)
 * and checks whether they have been blocked or if they
 * are being executed.
 */

var scriptDetector = {
    contactLink: null,
    blockedScripts: null,
    acceptedScripts: null,
    dryRunScripts: null,
    acceptedAttributes: null,
    acceptedCode: [],
    blockedCode: [],
    dryRunCode: [],

    init: function() {
        if (typeof $ !== 'function') {
            return;
        }
        this.blockedScripts = $('script[type="librejs/blocked"]');
        this.acceptedScripts = $('script[type!="librejs/blocked"]')
            .not('script[data-librejs-dryrun]');
        this.dryRunScripts = $('script[data-librejs-dryrun]');
        console.debug(this.dryRunScripts);
        this.fetchAllNonScriptTags();

        if (this.blockedScripts.length) {
            // display noscript tags if applicable.
            this.displayNoScriptTags();
            try {
                // initialize the page mod code.
                pageModFinder.init();
            } catch (e) {
                // fail silently.
            }
            this.fetchBlockedScripts();
        }

        if (this.acceptedScripts.length) {
            this.fetchAcceptedScripts();
        }
        if (this.dryRunScripts.length) {
            this.fetchDryRunScripts();
        }

        self.postMessage({
            'event': 'scriptsFetched',
            'value': {
                'blocked': this.blockedCode,
                'accepted': this.acceptedCode,
                'dryRun': this.dryRunCode
            }
        });
    },

    /**
     * fetchBlockedScripts
     *
     * Gather blocked scripts.
     *
     */
    fetchBlockedScripts: function () {
        var that = this,
            singleton = '', reason;

        this.blockedScripts.each(function() {
            singleton = '';
            reason = "";


            if ($(this).data('librejs-reason') && $(this).data('librejs-reason').length > 9) {
                reason = $(this).data('librejs-reason') + ': ';
            }

            if ($(this).text()) {

                if ($(this).data('singleton') === true) {
                    singleton = 'This script was removed before LibreJS analysis: ';
                }

                that.blockedCode.push({'contents': singleton + reason + that.truncateText($(this).text()),
                                       'inline': true});
            }

            if ($(this).data('librejs-blocked-src')) {

                that.blockedCode.push({'url': $(this).data('librejs-blocked-src'), 'contents': reason, 'inline': false});
            }

        });
    },

    /**
     * fetchAcceptedScripts
     *
     * Gather accepted scripts.
     *
     */
    fetchAcceptedScripts: function () {

        var that = this, typeMessage = '', reason = "";

        this.acceptedScripts.each(function() {
            reason = "";

            if ($(this).data('librejs-reason') && $(this).data('librejs-reason').length > 9) {
                reason = $(this).data('librejs-reason') + ':';
            }

            if ($(this).attr('type') &&
                scriptHasInvalidType($(this).attr('type'))) {
                typeMessage = 'script type is not valid (js is not executed): '+ $(this).attr('type') + ' ';
            }

            if ($(this).text()) {
                that.acceptedCode.push({'contents': reason + typeMessage + that.truncateText($(this).text()),
                                        'inline': true});
            }

            if ($(this).attr('src')) {
                that.acceptedCode.push({'url': $(this).attr('src'), 'contents': reason + typeMessage,
                                        'inline': false});
            }

        });

    },

    /**
     * fetchDryRunScripts
     *
     * Gather accepted scripts.
     *
     */
    fetchDryRunScripts: function () {
        var that = this, typeMessage = '', reason = "";
        this.dryRunScripts.each(function() {
            reason = "";
            if ($(this).data('librejs-reason') && $(this).data('librejs-reason').length > 9) {
                reason = $(this).data('librejs-reason') + ':';
            }

            if ($(this).attr('type') &&
                scriptHasInvalidType($(this).attr('type'))) {
                typeMessage = 'script type is not valid (js is not executed): '+ $(this).attr('type') + ' ';
            }

            if ($(this).text()) {
                that.dryRunCode.push({'contents': reason + typeMessage + that.truncateText($(this).text()),
                                      'inline': true});
            }

            if ($(this).attr('src')) {
                that.dryRunCode.push({'url': $(this).attr('src'), 'contents': reason + typeMessage,
                                      'inline': false});
            }

        });

    },

    fetchAllNonScriptTags: function () {
        var that = this;
        var blockedAnchors = $('*[data-librejs="rejected"]').not('script');
        var acceptedAnchors = $('*[data-librejs="accepted"]').not('script');
        var i = 0, le, attributes;

        acceptedAnchors.each(function () {

            var content = "";

            if ($(this).attr('href')) {

                content = $(this).attr('href');

            }

            else {
                content = that.findOnAttributeContent($(this));
            }

            that.acceptedCode.push(
                {contents: 'in attribute: ' + content,
                 inline: true}
            );

        });

        blockedAnchors.each(function () {

            var content = "";

            if ($(this).attr('href')) {
                content = $(this).attr('href');
            } else if ($(this).data('librejs-blocked-event')) {
                attributes = $(this).data('librejs-blocked-event');
                le = attributes.length;
                for (i = 0; i < le; i++) {
                    content += attributes[i].attribute + ":" + attributes[i].value + ";\n";
                }
            }

            that.blockedCode.push(
                {contents: 'in attribute: ' + content,
                 inline: true}
            );
        });
    },

    findOnAttributeContent: function (elem) {
        var i = 0,
            le = intrinsicEvents.length,
            content = "";

        for (; i < le; i++) {

            if (elem.attr(intrinsicEvents[i])) {

                content += elem.attr(intrinsicEvents[i]) + " -- ";

            }

        }
        return content;
    },

    /**
     * displayNoScriptTags
     * Whenever blocked scripts are found, deep clone noscript tags
     * and place them in a new div.
     */
    displayNoScriptTags: function () {

        var noscripts = $('body noscript'),
            div, content;

        noscripts.each(function (index) {
            div = $('<div/>');


            content = $(this).contents();
            content = $("<div>").html(content).text();

            div.append(content);
            div.children('style, script, meta').remove();


            // insert noscript content right after the
            // original noscript tag.
            div.insertAfter($(this));
        });

    },
    truncateText: function (str) {

        if (str.length > 1000) {
            str = str.slice(0, 1000) + '…';
        }
        return str;
    }

};

scriptDetector.init();
