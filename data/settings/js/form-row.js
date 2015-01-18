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

var GenerateForm = {
    $trContainer: null, // will jQuery element for rules table tboby
    le: 0,
    init: function () {
        var that = this;
        $(document).ready(function (e) {
            that.$trContainer = $("#whitelist").children('tbody');

            // listen for when data is ready to populate form.
            document.documentElement.addEventListener(
                "populate-form",
                function (event) {
                    that.populateForm(event.detail.data);
                }, false);
            that.$trContainer.on("click", ".delete", function (event) {
                that.deleteRow($(this));
            });
            $('.librejs-whitelist-reset').click(function (e) {
                that.deleteAll();
            });
        });
    },

    deleteAll: function () {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(
            "librejs-settings-change", true, true, {
                event: 'rules-form-delete-all'
            });
        document.documentElement.dispatchEvent(event);
        location.reload();
    },

    deleteRow: function ($button) {
        var hash = $button.parents('tr').children('.hash').text();
        this.le--;
        this.changeTitle();
        $button.parents('tr').remove();
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(
            "librejs-settings-change", true, true, {
                event: 'rules-form-delete', value: hash
            });
        document.documentElement.dispatchEvent(event);
    },

    createRow: function (key, url, reason) {

        var $tr = $("<tr/>");
        var $td = $('<td/>').addClass('hash').text(key);
        var $delete, $button;
        $tr.append($td);
        $td = $('<td/>').append($('<a/>').attr({
            "href": url,
            "target": "_blank"
        }).text(url));
        $tr.append($td);
        $td = $('<td/>').text(reason);
        $tr.append($td);

        $delete = $("<td/>");
        $button = $('<button/>');
        $button.addClass("delete btn btn-danger")
            .attr({'value': 'delete'}).text("Delete");
        $delete.append($button);
        $tr.append($delete);
        return $tr;
    },

    appendNewRow: function (key, rowData) {
        if (key && rowData !== undefined) {
            this.$trContainer.append(
                this.createRow(
                    key,
                    (rowData.filename || rowData.url),
                    (rowData.result.reason || "no reason recorded")));
        }
    },
    clearForm: function () {
        $('#whitelist').children('tbody').empty();
    },
    changeTitle: function () {
        var tt = this.le  + " scripts whitelisted";
        $('div.page-header h1').text(tt);
        $('title').text(tt + ' | LibreJS');
    },
    populateForm: function (data) {
        var key;
        this.le = Object.keys(data).length;
        this.changeTitle();
        this.clearForm();
        for (key in data) {
            this.appendNewRow(key, data[key]);
        }
    }
};

GenerateForm.init();
