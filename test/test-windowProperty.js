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

var relationChecker = require('../lib/js_checker/relation_checker');
const mn = require("./mock/mock_nodes");

exports.testCheckIdentifierIsWindowProperty = function (assert) {
    var tree = mn.mockNodes["alert('this is completely trivial');"];

    var n = tree.children[0].expression.children[0];
    n.parent = tree.children[0].expression;
    var rel = relationChecker.relationChecker(n);
    rel.checkIdentifierIsWindowProperty(n);
    assert.equal(rel.nonWindowProperties.alert, null);
};

require('sdk/test').run(exports);
