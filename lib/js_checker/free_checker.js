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

var licenses = require('./license_definitions');
var simpleStorage = require("sdk/simple-storage");
const LAZY = licenses.types.LAZY;
var licenseRegex = [];
const END_OF_SCRIPT = require('../html_script_finder/bug_fix').END_OF_SCRIPT;
const types = require("./constant_types");

const token = types.token;

var patternUtils = require('./pattern_utils').patternUtils;

var licStartLicEndRe = /@licstartThefollowingistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)(.*)?@licendTheaboveistheentirelicensenoticefortheJavaScriptcodeinthis(?:page|file)/mi;
var licenseMagnet = /.*@license ?(magnet\:\?xt=urn\:btih\:[0-9A-Za-z]+).*/;
var licenseEndMagnet = /.*@license-end.*/i;
exports.freeCheck = {
    initLicenses: function (licenses) {
        for (var item in licenses) {
            this.stripLicenseToRegexp(licenses[item]);
        }
    },

    /**
     * stripLicenseToRegexp
     *
     * Removes all non-alphanumeric characters except for the 
     * special tokens, and replace the text values that are 
     * hardcoded in license_definitions.js
     *
     */
    stripLicenseToRegexp: function (license) {
        var i = 0, 
        max = license.licenseFragments.length, 
        item;

        for (; i < max; i++) {
            item = license.licenseFragments[i];
            item.regex = patternUtils.removeNonalpha(item.text);

            if (license.licenseFragments[i].type === LAZY) {

                // do not permit words before. Since "Not" could be added
                // and make it nonfree. e.g.: Not licensed under the GPLv3.
                item.regex = '^(?!.*not).*' + item.regex;

            }

            item.regex = new RegExp(
                    patternUtils.replaceTokens(item.regex), 'i'); 
        }

        return license;
    },

    /**
     * checkNodeFreeLicense
     *
     * Check if the node mentions a free license
     * in one of its comments.
     * 
     */
    checkNodeFreeLicense: function (n, queue) {
        var strippedComment,
            magnetLink,
            comment = this.getComment(n),
            list = licenses.licenses,
            i, j,
            max,
            regex,
            frag, 
            matchLicStart, 
            matchMagnet,
            license,
            isMagnetValid = false;

        if (n.counter === 2 &&
                n.parent != undefined &&
                n.parent.type === token.SCRIPT &&
                comment != undefined && 
                comment != " "
        ) {
            strippedComment = patternUtils.removeNonalpha(comment);
            matchLicStart = strippedComment.match(licStartLicEndRe);
            console.debug("matchMagnet is", matchMagnet);
            if (matchLicStart) {
                strippedComment = matchLicStart[1];
                for (license in list) {	    
                    frag = list[license].licenseFragments;
                    max = list[license].licenseFragments.length;
                    for (i = 0; i < max; i++) {
                        if (frag[i].regex.test(strippedComment)) {
                            return {
                                licenseName: list[license].licenseName,
                                type: types.checkTypes.FREE
                            };

                        }
                    }
                }
            }
            // check for @license -- @license-end notation.
            return this.matchMagnet(comment, queue); 
        }
    },

    /**
     *  matchMagnet
     *  Attempts to find valid @license [magnet] 
     *  and @license-end notation.
     */
    matchMagnet: function (comment, queue) {
        let matchMagnet = comment.match(licenseMagnet);
        if (matchMagnet) {
            let magnetLinkRe = new RegExp(
                matchMagnet[1].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
            );
            let list = licenses.licenses;
            let queue_end = queue.length;

            for (var license in list) {
                frag = list[license].canonicalUrl;
                console.debug("frag is ", frag);
                if (frag != undefined) {
                    max = list[license].canonicalUrl.length;
                    console.debug("max is", max);
                    for (i = 0;i < max; i++) {
                        console.debug("current frag is", frag[i]);
                        if (frag[i].match(magnetLinkRe)) {
                            for (let i = 0; i < queue_end; i++) {
                                console.debug(queue[i]);
                                let n = queue[i];
                                comment = this.getComment(n);
                                if (comment != undefined &&
                                        comment.match(licenseEndMagnet) &&
                                        this.checkIsLastNode(n)
                                ) {
                                    // found a closing match. Just accept this script.
                                    return {
                                        licenseName: list[license].licenseName,
                                        type: types.checkTypes.FREE_SINGLE_ITEM
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }
        return;
    },

    /**
     *  checkIsLastJsNode.
     *  returns true if n is the last node.
     *  Or if nodes before it are only comments etc (not valid code.)
     *  A special LibreJS node is appended at the end of a script tree to
     *  check if this is the last (and also for narcissus to keep the last comment
     *  in the tree.)
     * TODO: Refactor LibreJS so that END nodes can have a comment.
     */
    checkIsLastNode: function (n) {
        // first check if the comment is part of the very last statement.
        if (n.value == "this" && n.next == undefined) {
            // just make sure the last node is indeed our harmless bit of
            // js.
            if (n.tokenizer) {
                let source = n.tokenizer.source;
                let substring = source.substr(n.start, n.end+23);
                if (substring == END_OF_SCRIPT) {
                    return true;
                }
                else {
                    console.debug("substring is ", substring);
                    return false;
                }
            }
            console.debug("Hurra! This is the end of our script");
            return true;
        }

        // isn't our last node. 
        return false;
    },

    /**
     * getComment
     *
     * Grab the comment(s) from the node. Concatenates
     * multiple comments.
     * 
     */
    getComment: function (n) {
        var i = 0, length, comment = "";

        if (n.blockComments == undefined || n.blockComments == " ") {
            return;
        }

        length = n.blockComments.length;
        if (length > 0) {
            for (; i < length; i++) {
                comment += n.blockComments[i];
            }
        }
        if (comment == "") {
            return;
        }
        return comment;
    }
};

exports.freeCheck.initLicenses(licenses.licenses);
