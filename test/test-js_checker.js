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

const jsChecker = require("../lib/js_checker/js_checker");
const constants = require("../lib/js_checker/constant_types");
var checkTypes = constants.checkTypes;

var init = function() {
    var checker = jsChecker.jsChecker();
    return checker;
};

exports.testTrivial = function(assert, done) {
    var checker = init();
    var jsString = "alert('internal script');";

    checker.searchJs(jsString, 
        function() {
            // FIXME, should actually be TRIVIAL
            assert.equal(checkTypes.TRIVIAL_DEFINES_FUNCTION,
                checker.parseTree.freeTrivialCheck.type);
            done();
        });
};

exports.testTrivialWithFuncDef = function(assert, done) {
    var jsString = "function blah (arg) { return arg; };";

    var checker = init();

    checker.searchJs(jsString, 
        function() {
            assert.equal(checkTypes.TRIVIAL_DEFINES_FUNCTION,
                checker.parseTree.freeTrivialCheck.type);
            done();
        });
};

exports.testTrivialWithFunc = function(assert, done) {
    var checker = init();

    var jsString = "var blah = function(arg) { return arg; };";

    checker.searchJs(jsString, 
        function() {
            assert.equal(checkTypes.TRIVIAL_DEFINES_FUNCTION,
                checker.parseTree.freeTrivialCheck.type);
            done();
        });
};

exports.testANontrivial = function(assert, done) {
    var checker = init();

    var jsString = "document.createElement('script');";
    checker.searchJs(jsString, 
        function() {
            assert.equal(checkTypes.NONTRIVIAL,
                checker.parseTree.freeTrivialCheck.type);
            done();
        });
};

exports.testLambdaError1 = function(assert, done) {
    var checker = init();

    var jsString = "document.write('<scr' + 'ipt type=\"text/javascript\" src=\"' + regs_url + 'fdsfds.dew/' + regs_sitepage + '/1' + regs_rns + '@' + regs_listpos + regs_query + '\"></scr' + 'ipt>');";

    checker.searchJs(jsString, 
        function() {
            assert.equal(checkTypes.NONTRIVIAL,
                checker.parseTree.freeTrivialCheck.type);
            done();
        });
};

exports.testLambdaError = function(assert, done) {
    var jsString = "_version = 11;\nif (navigator.userAgent.indexOf('Mozilla/3') != -1)\nregs_version = 10;\n\n if (regs_version >= 11) {\ndocument.write('<scr' + 'ipt type=\"text/javascript\" src=\"' + regs_url + 'fdsfds.dew/' + regs_sitepage + '/1' + regs_rns + '@' + regs_listpos + regs_query + '\"></scr' + 'ipt>');\n}";

    var checker = init();
    checker.searchJs(jsString, 
        function() {
            assert.equal(checkTypes.NONTRIVIAL,
                checker.parseTree.freeTrivialCheck.type);
            done();
        });
};

exports.testContinueKeyword = function(assert, done) {
    var jsString = 'for (var i = 0; i < len; i++) {' +
        'if (test) { continue; } }';
    var checker = init();

    checker.searchJs(jsString, 
        function() {
            // FIXME, should actually be TRIVIAL
            assert.equal(checkTypes.TRIVIAL_DEFINES_FUNCTION,
                checker.parseTree.freeTrivialCheck.type);
            done();
        });
};

exports.testIsNotFreeLicensed = function(assert, done) {
    var jsString = 'for (var i = 0; i < len; i++) {' +
        'if (test) { continue; } }';
    var checker = init();

    assert.ok(checker.isFreeLicensed(jsString) === false)
    done();
};

require('sdk/test').run(exports);
