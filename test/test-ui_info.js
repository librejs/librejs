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

var uiInfo = require("../lib/ui/ui_info").testModule;

 
exports.testFoundInContactList = function (test) {
    
    uiInfo.contactList['www.lduros.net'] = 'http://lduros.net/contact';

    test.assertEqual(uiInfo.foundInContactList('http://www.lduros.net/somepage.html'), 
		     'http://lduros.net/contact');


};

exports.testNotFoundInContactList = function (test) {
    
    delete uiInfo.contactList['www.lduros.net'];

    test.assertEqual(uiInfo.foundInContactList('http://www.lduros.net/somepage.html'), 
		     false);


};
