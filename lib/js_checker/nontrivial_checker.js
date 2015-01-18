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
const types = require("js_checker/constant_types");

// constants from Narcissus for function types.
const DECLARED_FORM = 0, EXPRESSED_FORM = 1, STATEMENT_FORM = 2;

const token = types.token;

var checkTypes = types.checkTypes;

var utils = {
    /**
     * nodeContains
     * Checks that node contains both a type and a value.
     * Shortcut to check for null/undefined.
     *
     * @param {object} n. The current node being studied.
     * @return {boolean} . True if matching.
     */
    nodeContains: function (n, type, value) {
        if (n != undefined) {
            return n.type === type &&
                n.value === value;
        }
    },

    /**
     * isType
     * Checks that node is of a certain type.
     * Shortcut to check for null/undefined.
     *
     * @param {object} n. The current node being studied.
     * @return {boolean}. True if it's the right type.
     */
    isType: function (n, type) {
        return n != undefined && n.type === type;
    },

    isNotType: function (n, type) {
        return n != undefined && n.type !== type;
    },

    /**
     * hasChildren
     *
     * Checks the token on the left
     * and on the right.
     *
     * @param {object} n. The current node being studied.
     * @param {leftType} token constant. The type on the
     * left.
     * @param {rightType} token constant. The type of child
     * on the right
     *
     */
    hasChildren: function (n, leftType, rightType) {
        if (types == undefined) {
            return false;
        }
        return this.isType(n.children[0], leftType) &&
            this.isType(n.children[1], rightType);
    },

    /**
     * findScriptTag
     *
     * This method should probably be replaced with DOM testing
     * as regex is rather insufficiant, and this wouldn't cover
     * tricky constructs as shown in http://ha.ckers.org/xss.html.
     */
    findScriptTag: function (n) {
        return n.value != undefined &&
            /<script[^>]*?>/i.test(n.value);
    }
};

var NonTrivialChecker = function() {
    this.definesFunction = false;
    this.hash = null;
};

/**
 * definesFunctionFound
 *
 * Returns true if it finds a node of type FUNCTION
 * that isn't a callback or an IIFE.
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 */
NonTrivialChecker.prototype.definesFunctionFound = function (n) {
    var isFunction = false;
    if (n.type === token.FUNCTION &&
        n.body != undefined) {

        if (n.functionForm !== token.DECLARED_FORM &&
            ((n.parent.type === token.LIST &&
              n.parent.parent.type === token.CALL) ||
             n.parent.type === token.CALL) &&
            n.name == undefined) {
            // this is a callback or an immediately
            // invoked function expression "IIFE".
            isFunction = false;
        } else {
            // this is a regular function declaration or
            // function expression assigned to a variable.
            //console.log("THIS DEFINES FUNCTION");
            isFunction = true;
        }
    }

    // look for Function constructor.
    if (n.type === token.IDENTIFIER &&
        n.value === 'Function' &&
        (n.parent.type === token.NEW_WITH_ARGS ||
         n.parent.type === token.CALL)) {
        // this is a Function constructor.
        //console.log("THIS DEFINES FUNCTION");
        isFunction = true;
    }

    return isFunction;
};


/**
 * invokesEval
 *
 * Returns true (nontrivial) if it finds any use of
 * the eval function. For simplicity, we assume any
 * use of an identifier "eval" is the eval function.
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 */
NonTrivialChecker.prototype.invokesEval = function (n) {
    return (n.type === token.CALL &&
            utils.nodeContains(n.children[0], token.IDENTIFIER, 'eval') ||
            n.type === token.IDENTIFIER && n.value === 'eval');
};

/**
 * evalIdentifier
 *
 * Returns true (nontrivial) if it finds any use of
 * the eval function. For simplicity, we assume any
 * use of an identifier "eval" is the eval function.
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 */
NonTrivialChecker.prototype.evalIdentifier = function (n) {
    return n.type === token.IDENTIFIER && n.value === 'eval';
};


/**
 * invokesMethodBracketSuffix
 *
 * Finds a method being invoked using the bracket suffix notation
 * rather than the dot notation. It is difficult without keeping track of
 * variable values to check for what method is actually being called.
 * So we're just flagging any use of this construct as nontrivial.
 * e.g., should catch: xhr[a+b]('GET', 'http://www.example.com');
 * Should not catch other uses such as: myArray[num];
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 */
NonTrivialChecker.prototype.invokesMethodBracketSuffix = function (n) {
    return n.type === token.CALL && utils.isType(n.children[0], token.INDEX);
};

/**
 * createsXhrObject
 *
 * Creates an xhr object.
 * Since all "new XMLHttpRequest", "XMLHttpRequest()",
 * and "new window.XMLHttpRequest" instantiate the xhr object,
 * we assume (without further proof) that any use
 * of the identifier "XMLHttpRequest" and "ActiveXObject"
 * is an xhr object.
 * Constructs like window[a+b]() are already caught by the
 * bracket suffix check.
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 */
NonTrivialChecker.prototype.createsXhrObject = function (n) {
    return (n.type === token.IDENTIFIER) &&
        (n.value === 'XMLHttpRequest' ||
         n.value === 'ActiveXObject');
};

/**
 * invokesXhrOpen
 *
 * Here we assume the call of an open method must be an xhr request
 * (and not some other object) by checking the number of arguments.
 * In most cases this method won't be used since createsXhrObject
 * will already have caught the xhr.
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 *
 */
NonTrivialChecker.prototype.invokesXhrOpen = function (n) {
    return n.type === token.CALL &&
        utils.hasChildren(n, token.DOT, token.LIST) &&
        utils.isType(n.children[0].children[0], token.IDENTIFIER) &&
        utils.nodeContains(n.children[0].children[1], token.IDENTIFIER, 'open') &&
        n.children[1].children.length > 1;
};

/**
 * createsScriptElement
 *
 * Checks for document.createElement() that create a script. In the case
 * it creates an element from a variable, we assume it's a script. In the
 * future we might want to check for the value of that string variable
 * (e.g., if a variable is assigned 'script', raise a flag)
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 *
 *
 */
NonTrivialChecker.prototype.createsScriptElement = function (n) {
    return n.type === token.CALL &&
        utils.hasChildren(n, token.DOT, token.LIST) &&
        utils.isType(n.children[0].children[0], token.IDENTIFIER) &&
        utils.nodeContains(n.children[0].children[1], token.IDENTIFIER, 'createElement') &&
        (utils.nodeContains(n.children[1].children[0], token.STRING, 'script') ||
         utils.isType(n.children[1].children[0], token.IDENTIFIER));
};

/**
 * writesScriptAsHtmlString
 *
 * catches myObj.write('<script></script>');
 * or any myObj.write(myStringVariable);
 * or concatenation such as:
 * myObj.write('<scri' + stringVariable);
 * or 'something' + 'somethingelse'.
 *
 * To check for javascript here we might want to look at the list
 * from ha.ckers.org/xss.html for the future.
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 *
 */
NonTrivialChecker.prototype.writesScriptAsHtmlString = function (n) {
    var listArg;

    if (n.type === token.CALL &&
        utils.hasChildren(n, token.DOT, token.LIST) &&
        utils.isType(n.children[0].children[0], token.IDENTIFIER) &&
        utils.nodeContains(n.children[0].children[1], token.IDENTIFIER, 'write')
       ) {
        if (utils.isNotType(n.children[1].children[0], token.STRING)) {
            // return true if any operation or concatenation.
            // We are cautious (as it could
            // embed a script) and flag this as nontrivial.

            return true;
        }
        return utils.findScriptTag(n.children[1].children[0]);
    } else {
        return false;
    }
};

/**
 * nontrivial anytime we see an identifier as innerHTML
 */
NonTrivialChecker.prototype.innerHTMLIdentifier = function (n) {
    if ((n.type === token.IDENTIFIER ||
         n.type === token.STRING) &&
        n.value === 'innerHTML'
       ) {
        return true;
    }
};

/**
 * checkNontrivial
 *
 * Contains all the conditionals that try to identify,
 * step by step, all code that could be flagged as
 * nontrivial.
 *
 * @param {object} n. The current node being studied.
 * @return {boolean} . True if found.
 *
 */
NonTrivialChecker.prototype.checkNontrivial = function (n, t) {

    if (n.type === token.IDENTIFIER && this.evalIdentifier(n)) {
        //console.log("NONTRIVIAL: eval has been found in code");
        return types.nontrivialWithComment("NONTRIVIAL: eval has been found in code");
    }

    if (this.innerHTMLIdentifier(n)) {
        //console.log("NONTRIVIAL: innerHTML identifier");
        return types.nontrivialWithComment("NONTRIVIAL: innerHTML identifier");
    }

    // the node is an identifier
    if (n.type === token.IDENTIFIER && this.createsXhrObject(n)) {
        //console.log('NONTRIVIAL: Creates an xhr object');
        return types.nontrivialWithComment('NONTRIVIAL: Creates an xhr object');
    }

    // this is a method/function call
    if (n.type === token.CALL) {

        if (this.invokesEval(n)) {
            //console.log("NONTRIVIAL: eval has been found in code");
            return types.nontrivialWithComment("NONTRIVIAL: eval has been found in code");
        }

        if (this.invokesMethodBracketSuffix(n)) {
            //console.log('NONTRIVIAL: square bracket suffix method call detected');
            return types.nontrivialWithComment("NONTRIVIAL: eval has been found in code");
        }

        if (this.invokesXhrOpen(n)) {
            //console.log('NONTRIVIAL: an open method similar to xhr.open is used');
            return types.nontrivialWithComment('NONTRIVIAL: square bracket suffix method call detected');
        }

        if (this.createsScriptElement(n)) {
            //console.log('NONTRIVIAL: creates script element dynamically.');
            return types.nontrivialWithComment('NONTRIVIAL: an open method similar to xhr.open is used');
        }

        if (this.writesScriptAsHtmlString(n)) {
            //console.log('NONTRIVIAL: writes script as html dynamically.');
            return types.nontrivialWithComment('NONTRIVIAL: creates script element dynamically.');
        }
    }

    // The node is a function definition.
    // Most common occurence.
    if (this.definesFunctionFound(n)) {
        return types.trivialFuncWithComment("Script is trivial but defines one or more functions");
    }

    // found nothing else, so trivial.
    return types.trivialWithComment("Script is trivial");
};

exports.nonTrivialChecker = function () {
    return new NonTrivialChecker();
};
