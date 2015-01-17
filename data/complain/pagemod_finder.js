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

/**
 * PageModFinder controls the complaint panel appearance.
 * @class
 */
var PageModFinder = function() {
    this.stylesheet = null;
    this.displayPanel = false;
    this.links = null;
    this.$box = null;

    this.$button = null;
    this.buttonTop = 40;

    this.$infoBox = null;

    this.isMinimized = true;
    this.isDragging = false;
};

PageModFinder.prototype.init = function() {
    var that = this, le;

    this.links = [];

    var complaintEmailSubject;
    var complaintEmailBody;

    self.port.on('prefs', function(payload) {
        if (payload.complaintEmailSubject) {
            complaintEmailSubject = payload.complaintEmailSubject;
        }
        if (payload.complaintEmailBody) {
            complaintEmailBody = payload.complaintEmailBody;
        }
    });

    self.port.on('complaintLinkFound', function(payload) {
        if (payload.contact !== undefined) {
            that.displayLinkByPriority(payload);
        }
    });

    self.port.on('assetsUri', function(payload) {
        that.setComplaintPanel(payload.value);
    });

    self.port.on('pageUrl', function(payload) {
        // search for contact list. Top level.
        contactFinder = new ContactFinder({
            complaintEmailSubject: complaintEmailSubject,
            complaintEmailBody: complaintEmailBody
        });
        contactFinder.init();
        contactFinder.searchForContactLink(payload.value);
    });
};

/**
 * setComplaintPanel
 *
 * Create complaint panel and assign properties to the
 * dom elements.
 *
 */
PageModFinder.prototype.setComplaintPanel = function (uri) {
    // provide uri of stylesheet
    this.stylesheet = uri + 'css/style.css';

    // add stylesheet.
    $('head').append($('<link/>').attr({
        'rel': 'stylesheet',
        'href': this.stylesheet,
        'type': 'text/css'
    }));

    $('body').prepend(
        '<div id="librejs-complaint-box" style="display:none;">' +

        '<div id="librejs-tab-button">' +
            '<div class="librejs-complain-button" ' +
            'title="LibreJS -- Complain to this site"></div>' +
            '<div class="librejs-complain-separator"></div>' +
            '</div>' +

        '<div id="librejs-complaint-info">' +
            '<div class="librejs-hide-button" title="Hide">' +
            '&times;</div>' +
            '<h1 title="Nonfree JavaScript -- Complain">\n' +
            'Nonfree JavaScript Complain</h1>' +
            '<p id="librejs-time-mention">' +
            'Searching for contact links in this website&hellip;</p>' +

        '<div id="librejs-complaint-info-text">' +

        '<h2>Emails you should use</h2>' +
            '<ul id="librejs-certain-emails"></ul>' +

        '<h2>Non-webmaster Emails you might want to use</h2>' +
            '<ul id="librejs-uncertain-emails"></ul>' +

        '<h2>Contact form or useful Contact Information</h2>' +
            '<ul id="librejs-certain-links"></ul>' +

        '<h2>Twitter Links</h2>' +
            '<ul id="librejs-twitter-links"></ul>' +

        '<h2>Identi.ca Links</h2>' +
            '<ul id="librejs-identica-links"></ul>' +

        '<h2>May be of interest</h2>' +
            '<ul id="librejs-uncertain-links"></ul>' +

        '<h2>May be of interest</h2>' +
            '<ul id="librejs-probable-links"></ul>' +

        '<h2>Phone Numbers</h2>' +
            '<ul id="librejs-phone-numbers"></ul>' +

        '<h2>Snail Mail Addresses</h2>' +
            '<ul id="librejs-snail-addresses"></ul>' +

        '</div>' + // end #librejs-complaint-info-text
        '</div>' + // end #librejs-complaint-info
        '</div>' // end #librejs-complaint-box
    );

    // main elements of the complaint panel.
    this.$infoBox = $('#librejs-complaint-info');
    this.$infoBoxText = $('#librejs-complaint-info-text');

    // all lists.
    this.$certainEmails = $("#librejs-certain-emails");
    this.$uncertainEmails = $("#librejs-uncertain-emails");
    this.$certainLinks = $("#librejs-certain-links");
    this.$uncertainLinks = $("#librejs-uncertain-links");
    this.$probablLinks = $("#librejs-probable-links");
    this.$twitterLinks = $("#librejs-twitter-links");
    this.$identicaLinks = $("#librejs-identica-links");
    this.$phoneNumbers = $("#librejs-phone-numbers");
    this.$snailAddresses = $("#librejs-snail-addresses");

    this.$button = $('#librejs-tab-button');
    this.$box = $('#librejs-complaint-box');

    this.$infoBox.height($(window).height() - this.buttonTop);
    this.$infoBoxText.height(this.$infoBox.height() - 154);
};

/**
 *  displayLinkByPriority
 *
 *  Place the link in the correct list depending
 *  on the correct
 */
PageModFinder.prototype.displayLinkByPriority = function(respData) {
    // we have a link to show. Add it to the button.
    // first time finalLinkFound is triggered.
    if (this.displayPanel === false) {

        this.addComplaintOverlay();
        this.displayPanel = true;
        this.hideBox(true);
    }

    // check link isn't already added.
    if (respData.contact !== undefined &&
        !this.isInLinks(respData.contact.link)) {

        // push link to list.
        le = this.links.push(respData);

        // making sure this is the latest link added.
        this.addALinkToPanel(this.links[le -1]);
    }
};

PageModFinder.prototype.isInLinks = function(searchValue) {
    var i = 0,
        le = this.links.length;

    for (; i < le; i++) {
        if (this.links[i].contact.link.replace(/\/$/, '') ===
            searchValue.replace(/\/$/, '')
           ) {
            return true;
        }
    }

    // no match has been found.
    return false;
};

/**
 *  addALinkToPanel
 *
 *  Check the type of link and place it in the
 *  appropriate list in the complaint panel.
 */
PageModFinder.prototype.addALinkToPanel = function(link) {
    var listElem;

    switch (link.event) {
    case linkTypes.CERTAIN_EMAIL_ADDRESS_FOUND:
        listElem = this.$certainEmails;
        break;

    case linkTypes.UNCERTAIN_EMAIL_ADDRESS_FOUND:
        listElem = this.$uncertainEmails;
        break;

    case linkTypes.CERTAIN_LINK_FOUND:
        listElem = this.$certainLinks;
        break;

    case linkTypes.PROBABLE_LINK_FOUND:
        listElem = this.$probablLinks;
        break;

    case linkTypes.UNCERTAIN_LINK_FOUND:
        listElem = this.$uncertainLinks;
        break;

    case linkTypes.TWITTER_LINK_FOUND:
        listElem = this.$twitterLinks;
        break;

    case linkTypes.IDENTICA_LINK_FOUND:
        listElem = this.$identicaLinks;
        break;

    case linkTypes.PHONE_NUMBER_FOUND:
        listElem = this.$phoneNumbers;
        break;

    case linkTypes.SNAIL_ADDRESS_FOUND:
        listElem = this.$snailAddresses;
        break;
    }

    listElem.prev('h2').css({'display': 'block'});
    listElem.append($('<li/>').append($('<a/>').attr({
        'href': link.contact.link,
        'target': '_blank'
    }).text(link.contact.label)));
};

PageModFinder.prototype.addComplaintOverlay = function() {
    var that = this;

    this.$button.click(function() {
        if (!that.isDragging) {
            that.showBox();
        }
        return false;
    });

    this.$button.on('mousedown', function(e) {
        var startPageY = e.pageY;
        var baseY = that.$button.offset().top - startPageY;
        var windowHeight = $(window).height();
        var buttonHeight = that.$button.height();

        $(document).on('mousemove.librejs', function(e2) {
            if (that.isDragging || e2.pageY !== startPageY) {
                var top = baseY + e2.clientY;
                if (top < 0) {
                    top = 0;
                } else if (
                    top + buttonHeight + that.buttonTop - 6 > windowHeight
                ) {
                    top = windowHeight - buttonHeight - that.buttonTop + 6;
                }
                that.$button.css({top: top});
                that.isDragging = true;
            }
        });
        return false;
    });

    $(document).on('mouseup', function() {
        $(document).off('mousemove.librejs');
        if (that.isDragging) {
            setTimeout(function() {
                that.isDragging = false;
            }, 10);
            return false;
        }
    });

    $(document).keyup(function(e) {
        if (that.isMinimized === false) {
            e.preventDefault();
            if (e.which === 27) {
                // Escape was pressed
                that.hideBox();
            }
        }
    });

    this.$box.find('.librejs-hide-button').on('click', function() {
        that.hideBox();
    });

    this.$button.on('focus', function() { that.showBox(); });
    this.$box.on('blur', function() { that.hideBox(); });

    this.$box.css({'display': 'block'});
};

PageModFinder.prototype.showBox = function() {
    this.$box.css({right: '-2px'});
    this.isMinimized = false;
    this.$button.hide();

    var that = this;
    $('#librejs-complaint-info').mouseleave(function() {
        that.hideBox();
    });
};

PageModFinder.prototype.hideBox = function() {
    this.$box.css({right: '-465px'});
    this.isMinimized = true;
    this.$button.show();
    $('#librejs-complaint-info').off('mouseleave');
};

var pageModFinder = new PageModFinder();
