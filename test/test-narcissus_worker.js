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


/*exports.testAstType = function (test) {
    // ensuring an object is returned when calling searchJs
    var res = init('var myValue = 0;');
    test.assertEqual('object', typeof res.parseTree);
    test.done();
};*/
//
/*
exports.testAstValueNode = function (test) {
    // making sure we have a correct (as expected) tree
    var res = init('var myValue = 34423;');
    test.assertEqual('myValue', res.parseTree.children[0].children[0].value);
    test.done();
};

exports.testAstFunctionNode = function (test) {
    var res = init('function example (param1) { };');
    test.assertEqual(78, res.parseTree.children[0].type);
    test.done();
};

exports.testAstInvokesEval = function (test) {
    // ensuring "eval" is caught.
    var res = init('var string = "var i = 0;"; eval(string);');
    test.assertEqual('eval', res.parseTree.children[1].value);
    test.done();
};

exports.testBlockcomment = function (test) {
    var jsString = "/* A comment\n* for this new\n* file\n*\/\nvar myJS = 'a string';";
    var res = init(jsString);
    test.assertEqual(" A comment\n* for this new\n* file\n", res.parseTree.children[0].blockComments);
};

exports.testSingleLineComment = function (test) {
    var jsString = "// this is not free software\nvar myJS = 'a string';";
    var res = init(jsString);
    test.assertEqual(" this is not free software", res.parseTree.children[0].blockComments);
};


exports.testMultipleLineComment = function (test) {
    var i = 0, jsString, expectedResult, ast;

    jsString = "// Below I'm assigning 'a string' to variable myJS\n// this is rather complicated\nvar myJS = 'a string';";
    expectedResult = [" Below I'm assigning 'a string' to variable myJS", " this is rather complicated"];
    var res = init(jsString);
    for (; i < expectedResult.length; i++) { 
	test.assertEqual(expectedResult[i], res.parseTree.children[0].blockComments[i]);
    }
};
*/
