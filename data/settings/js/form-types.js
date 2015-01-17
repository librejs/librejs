/**
 * Permafrost - Protect your privacy!
 * *
 * Copyright (C) 2012 2013 Loic J. Duros
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

var FORM_TYPES;

/* constructor for form types options */
function FormType(options) {
    "use strict";
    var item;
    for (item in options) {
        this[item] = options[item];
    }
}

FormType.prototype = {
    onblur: 'submit',
    showbuttons: true,
    pk: null,
    name: null,
    value: null,
    url: function (params) {
        "use strict";
        // see https://addons.mozilla.org/en-US/developers/docs/sdk/latest/dev-guide/guides/content-scripts/communicating-with-other-scripts.html#Using%20Custom%20DOM%20Events for information on this.
        FORM_TYPES.triggerEvent({'event': 'rules-form-update', 'value': params});

    }
};


FORM_TYPES = {

    patternPlaceholder: 'Enter wildcard patterns or regular expression ' +
        'patterns, one per line',

    ruleType: null,

    requestOrigin: null,

    visitingSite: null,

    contentType: null,

    blockUI: function () {
        "use strict";
        $.blockUI({
            message: null,
            overlayCSS: { backgroundColor: 'none' }});
    },

    unblockUI: function () {
        "use strict";
        window.setTimeout($.unblockUI, 500);
    },

    triggerEvent: function (msg) {
        "use strict";
        var event = document.createEvent("CustomEvent");
        var that = this;
        event.initCustomEvent("permafrost-settings-change", true, true, msg);
        document.documentElement.dispatchEvent(event);
        this.blockUI();

        var success = function (event) {
            that.unblockUI();
            document.documentElement.removeListener("rules-form-data-written", success, false);
        };

        document.documentElement.addEventListener("rules-form-data-written", success, false);

    },

    init: function () {
        "use strict";

        var formTypesHelper = this;

        // these four objects will be used to represent all the
        // form items in the table, and will hold different values
        // depending on the last active html form object.

        this.ruleType = new FormType({
            type: 'select',
            name: 'rule',
            source: [
                {value: 'block', text: 'Block'},
                {value: 'allow', text: 'Allow'}
            ]
        });

        this.requestOrigin = new FormType({
            type: 'textarea',
            name: 'content-location',
            title: 'Requests originating from',
            placeholder: formTypesHelper.patternPlaceholder
        });

        this.visitingSite = new FormType({
            type: 'textarea',
            name: 'request-origin',
            title: 'when visiting (referrer)',
            placeholder: formTypesHelper.patternPlaceholder
        });

        this.contentType = new FormType({
            type: 'checklist',
            name: 'content-type',
            title: 'and are of type',
            separator: ',',
            source: [
                { value: 'script', text: 'scripts' },
                { value: 'image', text: 'images' },
                { value: 'stylesheet', text: 'stylesheets' },
                { value: 'object', text: 'objects and plugin contents' },
                { value: 'object-request', text: 'requests made by plugins' },
                { value: 'subdocument', text: 'subdocuments (iframes, frames, and objects)' },
                { value: 'font', text: 'web font (@font-face)' },
                { value: 'media', text: 'video or audio content' },
                { value: 'xbl', text: 'XBL binding request' },
                { value: 'dtd', text: 'DTD loaded by an XML document' },
                { value: 'xrh', text: 'Ajax requests (XMLHttpRequests)' },
                { value: 'others', text: 'miscellaneous content' }
            ]
        });


    }

};
