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

const nonTrivialCheckModule = require("js_checker/nontrivial_checker");
const check = nonTrivialCheckModule.nonTrivialChecker(false, false);
const mn = require("./mock/mock_nodes");
var testRunner;

const constants = require("js_checker/constant_types");
var checkTypes = constants.checkTypes;

var testCheckNontrivial = function (assert, n) {
    assert.equal(checkTypes.NONTRIVIAL, check.checkNontrivial(n).type);
};


exports.testInvokesEvalIdentifier = function (assert) {
    // a node that could be found during 
    // jsChecker walkTree execution.
    // n corresponds to "eval".
    var n = mn.mockNodes.eval;
    // making sure we have a correct (as expected) tree
    assert.equal(true, check.invokesEval(n));
    //testCheckNontrivial(test, n1);
};

exports.testInvokesEvalIdentifier_2 = function(assert) {
    // a node that could be found during 
    // jsChecker walkTree execution.
    // n corresponds to "evaluate"
    var n = mn.mockNodes.evaluate;
    // making sure we have a correct (as expected) tree
    assert.notEqual(true, check.invokesEval(n));
};

exports.testInvokesMethodBracketSuffix = function(assert) {
    // n corresponds to window['eval']('var i;');
    var n = mn.mockNodes["window['eval']('var i;');"];
    assert.equal(true, check.invokesMethodBracketSuffix(n));
    testCheckNontrivial(assert, n);
};

exports.testInvokesMethodBracketSuffixArray = function(assert) {
    // n1 corresponds to array[num] = 'some text';
    var n = mn.mockNodes["array[num] = 'some text';"];
    assert.notEqual(true, check.invokesMethodBracketSuffix(n));
};

exports.testCreatesXhrObject = function(assert) {
    // n1 corresponds to identifier "XMLHttpRequest"
    var n = mn.mockNodes.XMLHttpRequest;
    assert.equal(true, check.createsXhrObject(n));
    testCheckNontrivial(assert, n);
};

exports.testCreatesXhrObject_MS = function (assert) {
    // n1 corresponds to identifier "ActiveXObject"
    var n = mn.mockNodes.ActiveXObject;
    assert.equal(true, check.createsXhrObject(n));
};

exports.testInvokesXhrOpen = function (assert) {
    // n1 corresponds to: 
    // "oReq.open("GET", "http://localhost/test.xml", true);"
    var n = mn.mockNodes["oReq.open('GET', 'http://localhost/test.xml', true;)"];
    assert.equal(true, check.invokesXhrOpen(n));
    testCheckNontrivial(assert, n);
};

exports.testInvokesMethodOpenNotXhr = function (assert) {
    // n1 corresponds to: 
    // "oReq.open("a random string");"
    var n = mn.mockNodes["oReq.open('a random string');"];
    assert.notEqual('global', check.invokesXhrOpen(n));
};

exports.testCreatesScriptElement = function (assert) {
    // n1 corresponds to:
    // "document.createElement('script');"
    var n = mn.mockNodes["document.createElement('script');"];
    assert.equal(true, check.createsScriptElement(n));
    testCheckNontrivial(assert, n);
};

exports.testScriptWrittenAsHtmlString = function(assert) {
    // string written corresponds to: 
    //<script src=\"evil-js.js\"type=\"text/javascript\></script>
    // and written with document.write();
    var n = mn.mockNodes[
        'document.write("script src=\"evil-js.js\"type=\"text/javascript></script>")'];
    assert.equal(true, check.writesScriptAsHtmlString(n));
    testCheckNontrivial(assert, n);
};

exports.testScriptWrittenAsStringConcat = function(assert) {
    // string written corresponds to: 
    // document.write('a ' + ' text');
    // since we are not currently analyzing such construct
    // we are flagging it as nontrivial.
    var n = mn.mockNodes["document.write('a ' + ' text');"];
    assert.equal(true, check.writesScriptAsHtmlString(n));
    testCheckNontrivial(assert, n);
};

exports.testWriteNonscriptHtmlString = function(assert) {
// corresponds to: document.write('<h1>some text</h1>');
    var n = mn.mockNodes["document.write('<h1>some text</h1>')"];
    assert.equal(false, check.writesScriptAsHtmlString(n));
};

/*exports.testSetsInnerHTMLProperty = function (test) {
    var n = mn.mockNodes['element.innerHTML = "<script src=\'externalscript.js\'></script>";'];
    test.assertEqual(true, check.setsInnerHTMLProperty(n));
    testCheckNontrivial(test, n);
    test.done();  
};*/

/*exports.testSetsInnerHTMLPropertyNonscript = function (test) {
    var n = mn.mockNodes['element.innerHTML = "<h1>A headline!</h1>";'];
    test.assertNotEqual(true, check.setsInnerHTMLProperty(n));
    test.done();
};*/

/*
exports.testSetsInnerHTMLPropertyConcat = function (test) {
    var n = mn.mockNodes['element.innerHTML = "script src" + "=\'eviljs.js\'";'];
    test.assertEqual(true, check.setsInnerHTMLProperty(n));
    testCheckNontrivial(test, n);
    test.done();
};
*/
/*exports.testCheckNonTrivialWithFuncDefAndIsLoadedExternally = function (test) {
    var subcheck = nonTrivialCheckModule.nonTrivialChecker(true, false);
    // a node that could be found during 
    // jsChecker walkTree execution.
    // n corresponds to "function example(param1) {}"
    var n = mn.mockNodes['function example(param1) {}'];
    // making sure we have a correct (as expected) tree
    test.assertEqual('local', subcheck.checkNontrivial(n));
    test.done();
};

exports.testCheckNonTrivialWithFuncDefAndHtmlLoadsExternalScripts = function (test) {
    var subcheck = nonTrivialCheckModule.nonTrivialChecker(false, true);
    // a node that could be found during 
    // jsChecker walkTree execution.
    // n corresponds to "function example(param1) {}"
    var n = mn.mockNodes['function example(param1) {}'];
    // making sure we have a correct (as expected) tree
    test.assertEqual('local', subcheck.checkNontrivial(n));
    test.done();
};

exports.testCheckNonTrivialWithFuncDefAndHtmlLoadsExternalScriptsAndIsLoadedExternally = function (test) {
    // that's not really possible, but avoiding silent bugs.
    var subcheck = nonTrivialCheckModule.nonTrivialChecker(true, true);
    var n = mn.mockNodes['function example(param1) {}'];
    // making sure we have a correct (as expected) tree
    test.assertEqual('local', subcheck.checkNontrivial(n));
    test.done();
};*/

require('sdk/test').run(exports);
