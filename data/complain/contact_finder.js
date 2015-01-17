/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2014 Loic J. Duros
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

var ContactFinder = function(options) {
    if (typeof options === 'undefined') {
        options = {};
    }
    this.complaintEmailSubject = options.complaintEmailSubject;
    this.complaintEmailBody = options.complaintEmailBody;

    // initial full list of links
    // on a page.
    this.pageLinks = null;

    // arrays of links.
    this.certainLinks = null;
    this.probableLinks = null;
    this.uncertainLinks = null;

    // if not page worker,
    // then allow to trigger a page worker.
    this.isPageWorker = false;

    // keep track of links already visited.
    this.visitedLinks = {};

    // keep track of the hostname of the original page.
    this.originalHostname = null;
};

ContactFinder.prototype.init = function(isPageWorker) {
    if (isPageWorker) {
        this.isPageWorker = true;
        console.debug('visiting', document.location.href);
    }

    this.convertStringToRegexp();
};

/**
 * searchForContactLink Main interface method to call from outside
 * the object.
 */
ContactFinder.prototype.searchForContactLink = function (originalUrl) {
    // find hostname of original page.
    this.originalHostname = this.getHostname(originalUrl);

    // initialize arrays of links to keep.
    this.certainLinks = [];
    this.probableLinks = [];
    this.uncertainLinks = [];

    // select all a tags.
    this.pageLinks = $('a').get();

    this.searchForUSPhoneNumber($('body').text());

    // run through list of links.
    this.processLinks();
};

/**
 * loopThroughLanguages
 * Select strings for all languages.
 */
ContactFinder.prototype.loopThroughLanguages = function (callback) {
    var le;

    for (var language in contactStr) {
        for (var degree in contactStr[language]) {
            le = contactStr[language][degree].length;
            callback(degree, contactStr[language][degree], le);
        }
    }
};

/**
 * convertStringToRegexp
 *
 */
ContactFinder.prototype.convertStringToRegexp = function () {
    var regexpList, i, le;
    this.loopThroughLanguages(function (degreeName, arr, le) {
        for (i = 0; i < le; i++) {
            try {
                arr[i] = new RegExp(arr[i], 'i');
            } catch (e) {}
        }
    });
};

/**
 * processLinks
 *
 * Run through the list of links in a page
 * and call the method that checks the regexs
 * for each of them.
 *
 */
ContactFinder.prototype.processLinks = function () {
    var start = Date.now();
    var currentLink;

    while (this.pageLinks.length) {
        currentLink = this.pageLinks.pop();

        if (currentLink !== undefined) {
            this.matchContact(currentLink);
        }

        var end = Date.now();

        if (this.pageLinks.length) {
            if ((end - start) > 8) {
                setTimeout(this.processLinks.bind(this), 100);
                return;
            }
        } else if (this.isPageWorker) {
            self.postMessage({event: 'destroy'});
            return;
        }
    }
};

/**
 * searchForUSPhoneNumber
 *
 */
ContactFinder.prototype.searchForUSPhoneNumber = function (str) {
    var phoneMatch, phone;
    var regClutter = /[\(\)\-\. ]+/gm;

    while ((phoneMatch = usaPhoneNumber.exec(str)) !== null) {
        phone = $.trim(phoneMatch)
            .replace(regClutter, '-').replace(/^\-/, '');
        phone = phone.replace(/[^0-9]$/, '');

        self.postMessage({
            event: linkTypes.PHONE_NUMBER_FOUND,
            contact: {
                'label': phone,
                'link': 'javascript:void("' + phone + '")'
            }
        });
    }
};

/**
 * searchForSocialMedia
 *
 * Match a Twitter or identi.ca url.
 *
 */
ContactFinder.prototype.searchForSocialMedia = function (link) {
    var elem = $(link),
        eventType;

    var text = this.notEmptyOrUri(link);

    if (reTwitter.test(elem.attr('href'))) {
        eventType = linkTypes.TWITTER_LINK_FOUND;
    }

    else if (reIdentiCa.test(elem.attr('href'))) {
        eventType = linkTypes.IDENTICA_LINK_FOUND;
    }

    if (eventType) {
        self.postMessage({
            event: eventType,
            contact: {
                'label': text,
                'link': elem.attr('href')
            }
        });
        return true;
    }

    return false;
};

/**
 * notEmptyOrUri
 *
 * If link has text, use it, if not,
 * then return uri.
 *
 */
ContactFinder.prototype.notEmptyOrUri = function (link) {

    var elem = $(link);

    if (/([^\s]*)]/.test(elem.text())) {
        // contains something else than just space.
        // It is valid.
        return elem.text();
    } else {
        return link.href;
    }
};

/**
 * searchForContactEmail
 *
 * Sends a particular message if a matching email
 * is found.
 *
 */
ContactFinder.prototype.searchForContactEmail = function (link) {
    var elem = $(link),
        eventType;

    if (reEmail.test(elem.attr('href'))) {
        console.debug('found an email address', elem.attr('href'));
        if (this.isSameHostname(elem.attr('href'))) {
            // this is a good email with same hostname, priceless!
            eventType = linkTypes.CERTAIN_EMAIL_ADDRESS_FOUND;
        } else {
            // not the same hostname... we'll keep it just in case.
            eventType = linkTypes.UNCERTAIN_EMAIL_ADDRESS_FOUND;
        }
    } else if (reAnyEmail.test(elem.attr('href'))) {
        if (this.isSameHostname(elem.attr('href'))) {
            eventType = linkTypes.UNCERTAIN_EMAIL_ADDRESS_FOUND;
        }
    }

    if (eventType) {
        var label = elem.attr('href').replace('mailto:', '');
        var myLink = elem.attr('href');

        // Add customizable complaintEmailSubject and complaintEmailBody to
        // mailto link
        if (this.complaintEmailSubject && this.complaintEmailBody) {
            myLink = myLink + '?subject=' + this.complaintEmailSubject +
                '&body=' + this.complaintEmailBody;
        }

        // we found an email address.
        // send message with whatever event type was found.
        self.postMessage({
            event: eventType,
            contact: {
                'label': label,
                'link': myLink
            }
        });
        return true;
    } else {
        // not an email address.
        return false;
    }
};

/**
 * matchContact
 *
 * Loop through the regexp and try to find a match.
 *
 */
ContactFinder.prototype.matchContact = function (currentLink) {
    // search for an email address.
    if (this.searchForContactEmail(currentLink)) {
        return true;
    }
    if (this.searchForSocialMedia(currentLink)) {
        return true;
    }

    // check all contact link strings.
    this.matchContactLink(currentLink);

    // this link is worth nothing.
    //return false;

};

/**
 * matchContactLink
 *
 * loop through regexp for a contact link.
 * And send a message to trigger a page worker
 * if not currently a page worker.
 *
 */
ContactFinder.prototype.matchContactLink = function (currentLink) {

    var that = this;

    this.loopThroughLanguages(
        function (degreeName, arr, le) {
            var text, j, href;

            for (j = 0; j < le; j++) {
                text = $(currentLink).text();
                href = currentLink.href;

                if (arr[j].test(text)) {

                    if (degreeName === 'certain') {

                        self.postMessage({
                            event: linkTypes.CERTAIN_LINK_FOUND,
                            contact: {
                                'label': text,
                                'link': href
                            }
                        });

                        if (!that.isPageWorker) {
                            that.complaintSearch(linkTypes.CERTAIN_LINK_FOUND, href);
                        }

                    } else if (degreeName === 'probable'){

                        self.postMessage({
                            event: linkTypes.PROBABLE_LINK_FOUND,
                            contact: {
                                'label': text,
                                'link': href
                            }
                        });

                        if (!that.isPageWorker) {
                            that.complaintSearch(linkTypes.PROBABLE_LINK_FOUND, href);
                        }
                    } else if (degreeName === 'uncertain') {
                        self.postMessage({
                            event: linkTypes.UNCERTAIN_LINK_FOUND,
                            contact: {
                                'label': text,
                                'link': href
                            }
                        });

                        if (!that.isPageWorker) {
                            that.complaintSearch(
                                linkTypes.UNCERTAIN_LINK_FOUND, href);
                        }
                    }
                }
            }
        });
};

/**
 * complaintSearch
 * returns to ui_info a link to open.
 */
ContactFinder.prototype.complaintSearch = function (linkType, link) {
    if (!this.isEmailLink(link)) {
        // we don't want to "visit" mailto links.
        self.postMessage({
            event: 'complaintSearch',
            urlSearch: {
                'type': linkType,
                'linkValue': link
            }
        });
    }
};

/**
 * getHostname
 * small regex taken from
 * http://beardscratchers.com/journal/using-javascript-to-get-the-hostname-of-a-url
 * to extract hostname from url.
 * do not consider www as subdomain.
 *
 */
ContactFinder.prototype.getHostname = function (str) {
    // remove www, but not other kind of subdomains (which most likely
    // may not be the same site than the domain itself.)
    str = this.removeWWW(str);
    var urlHostname = /^(?:f|ht)tp(?:s)?\:\/\/([^\/]+)/im;
    var emailHostname = /^mailto:[A-Z0-9\.\_\+\-]+\@([A-Z0-9\.\-]+\.[A-Z]{2,6})$/im;
    var match1 = urlHostname.exec(str);
    var match2 = emailHostname.exec(str);

    if (match1) {
        return match1[1];
    } else if (match2) {
        return match2[1];
    }

    // no match.
    return false;
};

/**
 * isSameHostname
 *
 * Checks a link has the same hostname than the original url.
 *
 */
ContactFinder.prototype.isSameHostname = function (url) {
    return this.getHostname(url) === this.originalHostname;
};

/**
 * remove www from hostname.
 */
ContactFinder.prototype.removeWWW = function (str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str.replace("www.", "", 'i');
};

ContactFinder.prototype.isEmailLink = function (str) {
    if (typeof str !== 'string') {
        return '';
    }
    return /^mailto:/i.test(str);
};

var contactFinder = new ContactFinder();
