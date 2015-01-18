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

var relationChecker = require('js_checker/relation_checker').relationChecker('b');
const mn = require("./mock/mock_nodes");

// the fake node.
var nVar = mn.mockNodes["var def = 'blah';var i = 0;\n\n def = 'something else';"];
nVar.global = true;

var nFunc = mn.mockNodes["function test (myArgument) { doSomething(); }"];
nFunc.global = true;

exports.testIsWindowProperty = function (test) {
    test.assertEqual(relationChecker.isWindowProperty('alert'), true);
    test.assertEqual(relationChecker.isWindowProperty('alerts'), false);
    test.assertEqual(relationChecker.isWindowProperty('RegExp'), true);
    test.assertEqual(relationChecker.isWindowProperty('console'), true);
};

exports.testCheckNodeForVars = function (test) {
    relationChecker.storeNodeVars(nVar);
    test.assertEqual('def' in relationChecker.variableDeclarations, 
		     true);
    test.assertEqual('i' in relationChecker.variableDeclarations,
		    true);
};


exports.testCheckNodeForFunctions = function (test) {
    relationChecker.storeNodeFunctions(nFunc);
    test.assertEqual('test' in relationChecker.functionDeclarations, 
		     true);
};

exports.testCheckMethodNotAdded = function (test) {
    relationChecker.storeNodeFunctions(nFunc);
    relationChecker.storeNodeFunctions(mn.mockNodes["var myObj = { 'myMethod': function (arg) { alert(arg); } }"]);
    test.assertEqual('myMethod' in relationChecker.functionDeclarations, false);
};




exports.testStoreNodeGlobalDeclarations = function (test) {
    var check = require('js_checker/relation_checker').relationChecker('b');
    check.storeNodeGlobalDeclarations(nVar);
    test.assertEqual('def' in check.variableDeclarations, true);
    check.storeNodeGlobalDeclarations(nFunc);
    test.assertEqual('test' in check.functionDeclarations, true);
};
