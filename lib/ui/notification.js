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

// this module is used to display a notification when LibreJS 
// is running to inform the user it is indeed busy working.
const timer = require("sdk/timers");
const self = require("sdk/self");
const isDisplayNotifications = require("addon_management/prefchange")
      .isDisplayNotifications;

exports.createCriticalNotification = function (text) {
    if (text === undefined) {
        text = "";
    }
    var self = require('sdk/self');
    var notif = require("notification-box").NotificationBox({
        'value': 'librejs-critical-notification-js-web-labels',
        'label': text,
        'priority': 'CRITICAL_LOW',
        'image': self.data.url("assets/images/torchy2.png"),
    });
    return notif;
};

var fakeNotification = {
    'close': function () {
        return;
    }
};

exports.createNotification = function (jsValue) {
    if (!isDisplayNotifications()) {
        return fakeNotification;
    }
    if (jsValue === undefined) {
        jsValue = "";
    }
    var self = require('sdk/self');
    var notif = require("notification-box").NotificationBox({
        'value': 'librejs-message',
        'label': 'LibreJS is analyzing: ' + jsValue + " ...",
        'priority': 'INFO_LOW',
        'image': self.data.url("assets/images/torchy2.png"),
        /*'buttons': [{'label': "Fine",
          'onClick': function () { }}]*/
    });
    timer.setTimeout(function () { 
        // ensure notifications are ALWAYS removed at some point.
        console.debug("removing after 2 seconds"); 
        try {
            var n = notif.notificationbox
                .getNotificationWithValue('librejs-message');
            n.close();
        } catch(x) {
            // do nothing
        }
    }, 2000);
    return notif;
};
