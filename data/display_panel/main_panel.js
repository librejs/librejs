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
var displayPanel = {
    complainButton: null,
    button1: null,
    button2: null,
    pageURL: null,
    urlData: null,
    isComplainButtonSet: false,

    init: function () {
        // add the buttons to the panel dynamically.
        $('body').prepend(
            '<a id="complain-contact" class="button white" href="#">' +
                '<span>Complain to site owner</span>' +
                '</a>' +
                '<a id="allow-button" class="button white" href="#">' +
                '<span>Allow all scripts in this page</span>' +
                '</a>' +
                '<a id="disallow-button" class="button white" href="#">' +
                '<span>' +
                'Block all nonfree/nontrivial scripts from this page</span>' +
                '</a>' +
                '<a id="open-in-tab" class="button white" href="#">' +
                '<span>Open this report in a new tab</span>' +
                '</a>'
        );

        // assign properties to these new elements.
        this.complainButton = $('#complain-contact');
        this.button1 = $('#allow-button');
        this.button2 = $('#disallow-button');

        // start listening for messages sent from modules.
        this.messageListen();
        this.startEventHandlers();
    },

    startEventHandlers: function () {
        $('#open-in-tab').click(function (e) {
            try {
                var html = $("#info").html();
                var text = window.btoa(unescape(encodeURIComponent(html)));
                self.port.emit('openInTab', text);
            } catch (x) {
                console.debug("error", x.lineNumber, x.message);
            }
            return false;
        });
        $("#ljs-settings").click(function (e) {
            e.preventDefault();
            self.port.emit('openSesame');
        });
        $(document).on('click', 'a', function(e) {
            self.port.emit('hideMainPanel');
        });
    },

    messageListen: function () {
        var that = this;
        self.on('message', function (message) {
            that.handleMessage(message);
        });
    },

    getHostname: function (str) {
        var re = new RegExp('^(http(?:s)?://[^/]+)', 'im');
        return str.match(re)[1].toString();
    },

    /**
     * formatListScript
     * Depending on the type of script in the item,
     * will return a preformatted code element with
     * on-page JavaScript or a link to an external
     * JavaScript file.
     */
    formatListScript: function (item, canWhitelist) {
        var li, pre, code, a, reason = '';
        li = $("<li/>");
        if (item.reason !== undefined) {
            reason = item.reason;
        }
        if (item.inline === true) {
            pre = $('<pre/>');
            pre.css('white-space', 'pre-wrap');
            code = $('<code/>');
            reason_obj = $('<span class="reason"/>').text(reason);
            code.text(item.contents);
            code.prepend($('<br/>'));
            code.prepend(reason_obj);
            pre.append(code);
            li.append(pre);
        } else {
            console.debug("item url is %s", item.url);
            reason_obj = $('<span class="reason"/>').text(reason);
            li.text(item.contents);
            li.prepend($('<br/>'));
            li.prepend(reason_obj);
            a = $('<a/>');
            a.attr('href', item.url);
            a.attr('target', '_blank');
            a.text(item.url);
            li.append(a);
        }
        var $el;
        if (canWhitelist) {
            $el = $(
                '<a class="small button white whitelist">Whitelist</a>');
            $el.data('librejs-hash', item.hash);
            $el.data('librejs-url', item.url);
            li.prepend($el);
        } else if (item.reason.indexOf('whitelisted by user') > -1) {
            // a hack until LibreJS version 6.1. Need to have a value attached
            // to item.whitelisted for this.
            $el = $(
                '<a class="small button white rm-whitelist">' +
                    'Remove from Whitelist</a>');
            $el.data('librejs-hash', item.hash);
            $el.data('librejs-url', item.url);
            li.prepend($el);
        }
        return li;
    },

    resetButtons: function (message) {
        if (!this.isComplainButtonSet) {
            this.complainButton.hide();
        }

        if (message.contact === undefined) {
            this.button1.hide();
            this.button2.hide();
        }
    },

    siteContactFound: function (url) {
        this.complainButton.show();

        this.isComplainButtonSet = true;
        this.complainButton.off('click');
        this.complainButton.click(function(e) {
            e.preventDefault();
            self.port.emit('hideMainPanel');
            window.open(url, '_blank');
        });
    },

    handleMessage: function (message) {
        var removedLen, acceptedLen;

        if (message.event === 'complaintSearch') {
            return;
        }

        this.resetButtons(message);

        // Add complain button with most certain link found
        if (message.event === 'certainLinkFound' ||
            message.event === 'contactLinkFound' ||
            (!this.isComplainButtonSet &&
             (message.event === 'probableLinkFound' ||
              message.event === 'uncertainLinkFound'))
           ) {
            var url = false;

            if (message.contact && message.contact.link) {
                url = message.contact.link;
            } else if (message.absolute) {
                url = message.absolute;
            }

            if (url) {
                this.siteContactFound(url);
            }
            return;
        } else if (message.event === 'contactLinkNotFound') {
            // no contact link was found.
            this.complainButton.hide();
        }

        if (message.isAllowed !== undefined) {
            this.button2.show();
        } else if (message.contact === undefined) {
            this.button1.show();
        }

        var li, code, pre, len, i;

        if (message.pageURL !== undefined) {
            // Unset complain button on a new site
            this.complainButton.off('click').hide();
            this.isComplainButtonSet = false;

            this.button1.attr('href', message.pageURL);
            this.button2.attr('href', message.pageURL);
            if (message.pageURL ===
                'resource://jid1-ktlzuoiikvffew-at-jetpack/librejs/data/settings/index.html'
               ) {
                message.pageURL = "LibreJS Whitelist";
            }
            $('#info').css({'opacity': 0});
            $('h2.blocked-js').html(
                "List of <span class='blocked'>blocked</span> JavaScript in " +
                    $('<div/>').text(message.pageURL).html());
            $('#dryrun').hide();
            $('ul.blocked-js').empty();
            $('ul.accepted-js').empty();
            $('ul.dryrun-js').empty();

            jsLabelsPagesVisited = message.urlData.jsLabelsPagesVisited;
            removedLen = message.urlData.removed.length;
            acceptedLen = message.urlData.accepted.length;
            dryRunLen = message.urlData.dryRun.length;

            // Add Web Labels info to main display panel
            var $myList = $('#librejs-web-labels-pages>ul');
            var idx = 0;
            for (var key in jsLabelsPagesVisited) {
                // Initialize and reset the element on first iteration
                if (idx === 0) {
                    $('#librejs-web-labels-pages>h2')
                        .html('Web Labels pages being used for this session');
                    $myList.html('');
                }

                if (typeof key !== 'string') {
                    continue;
                }

                var myUrl = key.replace(/#librejs=true$/, '');
                var $el = $(
                    '<li>' +
                        '<a target="_blank" href="' + myUrl + '">' +
                        myUrl +
                        '</a>' +
                        '</li>');
                $myList.append($el);
                idx++;
            }

            if (dryRunLen > 0) {
                $dryRun = $("#dryrun");
                $dryRun.show();
                $('h2.dryrun-js')
                    .html("List of loaded <span class='blocked'>scripts that should be blocked</span>  (but were allowed by you) in " +
                          $('<div/>').text(message.pageURL).html());
                for (i = 0; i < dryRunLen; i++) {
                    li = this.formatListScript(message.urlData.dryRun[i],
                                               true);
                    $('ul.dryrun-js').append(li);
                }
            }
            if (removedLen > 0) {
                $("#blocked").insertBefore($('#accepted'));
                for (i = 0; i < removedLen; i++) {
                    this.button1.fadeIn();
                    li = this.formatListScript(message.urlData.removed[i],
                                               true);
                    $('ul.blocked-js').append(li);
                }
            } else {
                this.button1.hide();
                $('ul.blocked-js').append('<li>LibreJS did not block any scripts on this page: \n\n<ul><li>There may be no scripts on this page (check source, C-u).</li><li>All the scripts on this page may be trivial and/or free.</li><li>You may have whitelisted this domain name or url from the preferences (Type about:addons in your location bar to check)</li><li>You may have clicked the "allow all scripts" button, which causes LibreJS to load all JavaScript on a page regardless of whether it is free, trivial, nontrivial or nonfree. This policy is effective for the entire duration of a Firefox session.</li><li>If for any reason you think LibreJS should have blocked JavaScript code on this page, please report this issue to: <a id="report" href="mailto:bug-librejs@gnu.org" target="_blank">bug-librejs@gnu.org</a></li></ul></li>');

                $('#report').attr(
                    'href',
                    'mailto:bug-librejs@gnu.org' +
                        '?subject=LibreJS bug report' +
                        '&body=LibreJS issue with page: ' +
                        message.pageURL);
            }

            // get accepted scripts.
            $('h2.accepted-js')
                .html("List of <span class='accepted'>accepted</span> " +
                      "JavaScript in " +
                      $('<div/>').text(message.pageURL).html());

            if (acceptedLen > 0) {
                $('#accepted').insertBefore($('#blocked'));
                for (i = 0; i < acceptedLen; i++) {

                    li = this.formatListScript(message.urlData.accepted[i],
                                               false);
                    $('ul.accepted-js').append(li);

                }

            } else {
                $('ul.accepted-js').append(
                    '<li>LibreJS did not allow the execution of any scripts on this page: \n\n\'' +
                        '<ul>' +
                        '<li>There may be no scripts on this page (check source, C-u)</li>' +
                        '<li>The inline and on-page JavaScript code may not be free and/or may not have proper license information and external scripts (if present) may have been removed by default.</li>' +
                        '<li>External scripts may not be free and/or may not have proper licensing and are not part of the whitelist of free JavaScript libraries.</li></ul></li>');
            }

            $('#info').animate({opacity: 1});

            // emit allowAllClicked when button is clicked.
            this.button1.click(function(e) {
                console.debug('clicked allow button');
                e.preventDefault();
                var url = $(this).attr('href');

                var urlForDisplay = (url.length > 100) ?
                    url.substr(0,100) + '…' : url;
                var areYouSure = window.confirm(
                    "Allow all nonfree/nontrivial scripts on this page?\n\n" +
                        urlForDisplay);
                if (areYouSure) {
                    self.port.emit('allowAllClicked', url);
                }

            });

            this.button2.click(function(e) {
                e.preventDefault();
                var url = $(this).attr('href');
                self.port.emit('disallowAllClicked', url);
            });

            var that = this;
            // whitelist a script
            $('.whitelist').click(function (e) {
                e.preventDefault();
                var $this = $(this);

                // get the url of the page from main button.
                var url = that.button1.attr('href');
                var hash = $this.data('librejs-hash');

                var reason = $this.parent('li').children('.reason').text();

                if (!reason) {
                    reason = $this.parent('li').children('pre')
                        .find('.reason').text();
                }

                // URL of the JS file
                var jsUrl = $this.data('librejs-url');
                var filename = '';
                if (jsUrl) {
                    filename = jsUrl.split('/').pop();
                }

                self.port.emit('whitelistByHash',
                               hash, url, filename, reason);
                $this.parent().append(
                    $('<span style="font-weight:bold"/>')
                        .text("Reload page to take effect"));
                $this.remove();

                // Don't propagate event and call hideMainPanel.
                return false;
            });

            $('.rm-whitelist').click(function (e) {
                e.preventDefault();
                var $this = $(this);
                var hash = $this.data('librejs-hash');
                self.port.emit('removeFromWhitelistByHash', hash);
                $this.parent().append(
                    $('<span style="font-weight:bold"/>')
                        .text("Reload page to take effect"));
                $this.remove();

                // Don't propagate event and call hideMainPanel.
                return false;
            });
        }
    }
};

displayPanel.init();
