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

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

var narcissusWorker = require("parser/narcissus_worker")
    .narcissusWorker;

const nonTrivialModule = require("js_checker/nontrivial_checker");
const freeChecker = require("js_checker/free_checker");
const relationChecker = require("js_checker/relation_checker");
const types = require("js_checker/constant_types");

const scriptsCached = require("script_entries/scripts_cache").scriptsCached;
var isDryRun = require("addon_management/prefchange").isDryRun;

var checkTypes = types.checkTypes;

const token = types.token;

// for setTimeout.
const timer = require("sdk/timers");

var callbackMap = {};

/**
 * 
 * Pairs a hash with a given callback 
 * method from an object.
 * 
 */
var setHashCallback = function(hash, callback, notification) {
    console.debug('setHashCallback', hash);
    if (hash in callbackMap && isDryRun()) {
        // workaround for issue with dryrun after checking box.
        // do nothing.
        callbackMap[hash] = callback;    
    } else if (hash in callbackMap) {
        console.debug("callback", callbackMap[hash]);
        if (notification && typeof notification.close === 'function') {
            notification.close();
        }
        throw Error("already being checked.");	
    } else {
        console.debug('setting callbackMap for', hash, 'to', callback);
        callbackMap[hash] = callback;
    }
    console.debug("callback is type: ", callback.constructor);
    //callbackMap[hash] = callback;
};

var removeHashCallback = function(hash) {
    if (hash in callbackMap) {
        delete callbackMap[hash];
    }
};

/**
 * find callback and return result (parse tree).
 * 
 */
exports.callbackHashResult = function(hash, result) {
    console.debug('typeof callbackMap function:', typeof callbackMap[hash]);
    console.debug('for hash', hash);
    try {
        callbackMap[hash](result, hash);
    } catch (x) {
        console.debug('error in jsChecker', x, 'hash:', hash);
        // return tree as false.
        console.debug("Error with", x);
        if (typeof callbackMap[hash] === 'function') {
            callbackMap[hash](false, hash);
        } else {
            console.debug('callbackHashResult Error', x);
        }
    }
    // remove callback after it's been called.
    console.debug('JsChecker.callbackHashResult: calling removeHashCallback');
    removeHashCallback(hash);
};

var JsChecker = function() {
    this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this.nonTrivialChecker = null;
    this.freeToken = false;
    this.nontrivialness = false;
    this.parseTree = null;
    this.relationChecker = null;
    this.jsCode = null;
    this.resultReady = null;
    this.notification = null;
    this.walkTreeCancelled = false;
    this.shortText = null;
    this.hash = null;
    this.queue = null; // will contain the nodes of the script.
};

/**
 * searchJs
 *
 * Takes in some javascript code (as string).
 * Uses Narcissus parser to build an abstract syntax tree.
 * Checks for trivialness.
 *
 */
JsChecker.prototype.searchJs = function(jsCode, resultReady, url) {
    var that = this;
    var bugfix = require('html_script_finder/bug_fix').narcissusBugFixLibreJS;
    console.debug('JsChecker.searchJs for script url:', url);
    this.url = url;
    this.resultReady = resultReady;
    this.jsCode = jsCode;
    this.shortText = jsCode.replace(bugfix, '').substring(0,100);
    this.notification = require("ui/notification")
        .createNotification(this.shortText).notification;

    var verbatimCode = this.jsCode.replace(bugfix, '');
    this.hash = scriptsCached.getHash(verbatimCode);    
    var isCached = scriptsCached.isCached(verbatimCode, this.hash);
    if (isCached) {
        console.debug("We have it cached indeed!");
        // there is an existing entry for this exact copy
        // of script text.
        console.debug('this script result is cached', this.hash,
                      isCached.result.type);
        console.debug("Return right away");
        // we are not generating a parse tree.
        this.parseTree = {};
        // fake the result is from parse tree.
        this.parseTree.freeTrivialCheck = isCached.result;

        this.relationChecker = isCached.relationChecker;
        // leave without doing parsing/analysis part.
        this.resultReady();
        this.removeNotification();
        return;
    }

    console.debug('url is not cached:', url);

    try {
        // no cache, continue.
        this.relationChecker = relationChecker.relationChecker();
        this.freeToken = types.emptyTypeObj();
        this.nontrivialness = types.emptyTypeObj();

        // use this.hash to keep track of comments made by the nontrivial
        // checker code about why/how the code is found to be nontrivial.
        this.nonTrivialChecker =
            nonTrivialModule.nonTrivialChecker(this.hash);

        // register callback and hash. So that result
        // can be passed.
        setHashCallback(
            this.hash, this.handleTree.bind(this), this.notification);

        // parse using ChromeWorker.
        console.debug(
            'JsChecker.searchJs(): starting narcissusWorker.parse()');
        narcissusWorker.parse(this.jsCode, this.hash);
    } catch (x) {
        console.debug('error', x);
        this.handleTree(false, x);
        this.removeNotification();
    }
};

JsChecker.prototype.handleTree = function(tree, errorMessage) {
    var that = this;

    if (tree == false || tree == undefined) {
        // error parsing tree. Just return nonfree nontrivial.
        this.parseTree = {};
        this.parseTree.freeTrivialCheck = types.nontrivialWithComment(
            'error parsing: ' + errorMessage);

        // cache result with hash of script for future checks.
        scriptsCached.addEntry(this.jsCode, this.parseTree.freeTrivialCheck,
                this.relationChecker, true, this.url);
        this.resultReady();
    } else {
        try {
            // no need to keep parseTree in property
            this.parseTree = {}; //tree;
            //console.debug(tree);
            this.walkTree(tree);
        } catch (x) {
            console.debug(x, x.lineNumber, x.fileName);
        }
    }
};

/**
 * getCheckerResult
 * 
 * Callback to Assign result from walkTree to property.
 * reset parse tree. create cache entry.
 * 
 */
JsChecker.prototype.getCheckerResult = function(result) {
    // done with parse tree. Get rid of it.
    this.parseTree = {}; 
    this.removeNotification();

    this.parseTree.nonTrivialChecker = this.nonTrivialChecker;

    // actual result stored here. hack since we used parseTree before.
    this.parseTree.freeTrivialCheck = result;

    // cache result with hash of script for future checks.
    scriptsCached.addEntry(this.jsCode, this.parseTree.freeTrivialCheck,
            this.relationChecker, true, this.url);

    this.resultReady();
};

/**
 * trivialCheck
 *
 * Runs nodes through a series of conditional statements 
 * to find out whether it is trivial or not.
 *
 * @param {object} n. The current node being studied.
 * @param {string} t. The type of node being studied 
 * (initializer, functionbody, try block, ...)
 * 
 */
JsChecker.prototype.trivialCheck = function(n) {
    return this.nonTrivialChecker.checkNontrivial(n);
};

/**
 * freeCheck
 *
 * Check if comments above current node could be a free licence. 
 * If it is, then the script will be flagged as free.
 *
 * @param {object} n. The current node being studied.
 * (initializer, functionbody, try block, ...)
 * 
 */
JsChecker.prototype.freeCheck = function(n, ntype) {
    var check = freeChecker.freeCheck.checkNodeFreeLicense(n, this.queue);
    return check;
};

/**
 * walkTree
 * 
 * An iterative functionwalking the parse tree generated by 
 * Narcissus.
 *
 * @param {object} node. The original node.
 *
 */
JsChecker.prototype.walkTree = function(node) {
    var queue = [node];
    var i, 
        len,
        n, counter = 0, 
        result, 
        processQueue,
        that = this;

    this.queue = queue;  // set as property.

    // set top node as visited.
    node.visited = true;

    /**
     *  functionwalking the tree for a given
     *  amount of time, before calling itself again.
     */
    processQueue = function() {
        var nodeResult, end;

        // record start time of functionexecution.
        var start = Date.now();

        if (that.walkTreeCancelled) {
            // tree walking already completed.
            return;
        }

        while (queue.length) {
            n = queue.shift();
            n.counter = counter++;
            console.debug("Under review", n.type);
            if (n.children != undefined) {
                // fetch all the children.
                len = n.children.length;
                for (i = 0; i < len; i++) {
                    if (n.children[i] != undefined && 
                        n.children[i].visited == undefined
                       ) {
                        // figure out siblings.
                        if (i > 0) {
                            n.children[i].previous = n.children[i-1];
                        }

                        if (i < len) {
                            n.children[i].next = n.children[i+1];
                        }
                        // set parent property.
                        n.children[i].parent = n;
                        n.children[i].visited = true;
                        queue.push(n.children[i]);
                    }
                }
            }

            if (n.type != undefined) {
                // fetch all properties that may have nodes.
                for (var item in n) {
                    if (item != 'tokenizer' && 
                            item != 'children' &&
                            item != 'length' && 
                            n[item] != null && 
                            typeof n[item] === 'object' && 
                            n[item].type != undefined &&
                            n[item].visited == undefined
                       ) {
                        n[item].visited = true;
                        // set parent property
                        n[item].parent = n;
                        queue.push(n[item]);
                    }
                }
            }

            that.checkNode(n);

            if (that.freeToken.type === checkTypes.FREE ||
                that.freeToken.type === checkTypes.FREE_SINGLE_ITEM
               ) {
                // nothing more to look for. We are done.
                that.walkTreeComplete(that.freeToken);
                return;
            } else if (that.nontrivialness.type === checkTypes.NONTRIVIAL) {
                // nontrivial
                // we are done.
                that.walkTreeComplete(that.nontrivialness);
                return;
            }
            // call processQueue again if needed.
            end = Date.now();

            if (queue.length) {
                // there are more nodes in the queue.

                if ((end - start) > 30) {

                    // been running more than 20ms, pause
                    // for 10 ms before calling processQueue 
                    // again.
                    timer.setTimeout(processQueue, 8);
                    return;
                }
            } else {
                // we are done.
                that.removeNotification();
                that.walkTreeComplete();
                return;
            }
        }
    };

    if (node.type === token.SCRIPT) {
        // this is the global scope.
        node.global = true;
        node.parent = null;

        this.relationChecker.storeGlobalDeclarations(node);

        queue.push(node);
        processQueue();
    }
};

/**
 * set walk tree cancelled bool as true.
 * the walk tree method won't run after the variable
 * is set to true.
 */
JsChecker.prototype.cancelWalkTree = function() {
    // prevent any further work on node codes.
    this.walkTreeCancelled = true;
};

/**
 * walkTreeComplete
 * 
 * Trigger when the walkTree has been completed or
 * when it has been cut short.
 * 
 */
JsChecker.prototype.walkTreeComplete = function(result) {
    var that = this;
    this.removeNotification();

    if (this.walkTreeCancelled) {
        // we already triggered complete.
        return;
    }

    // we set the token to cancel further processing.
    this.cancelWalkTree();

    if (result != undefined) {
        // walkTree was returned faster, use it instead.
        this.getCheckerResult(result);

        // we are done.
        return;
    }

    // if all code was fully analyzed.
    if (this.nontrivialness.type === checkTypes.NONTRIVIAL) {
        this.getCheckerResult(this.nontrivialness);
    } else if (this.freeToken.type === checkTypes.FREE) {
        // this is free and may or may not define functions, we don't care.
        this.getCheckerResult(this.freeToken);
    } else if (this.nontrivialness.type ===
            checkTypes.TRIVIAL_DEFINES_FUNCTION) {
        // trivial scripts should become nontrivial if an external script.
        // it may or may not be trivial if inline.
        this.getCheckerResult(this.nontrivialness);
    } else {
        // found no nontrivial constructs or free license, so it's
        // trivial.

        this.getCheckerResult(
                types.trivialFuncWithComment("This script is trivial"));
    }
};


/**
 * checkNode
 * 
 * checks a single node.
 * 
 */
JsChecker.prototype.checkNode = function(n) {
    var sub;
    var fc = this.freeCheck(n);
    var tc = this.trivialCheck(n);

    var nodeResult;

    // check if identifier may be window property (assumption).
    this.relationChecker.checkIdentifierIsWindowProperty(n);

    /*if (fc) {
    console.debug("FC is", fc, "type is", fc.type);
    }*/
    if (fc && fc.type == checkTypes.FREE) {
        // this is free!
        // freeToken is persistent across nodes analyzed and valid
        // for an entire script.
        this.freeToken = types.freeWithComment(
                "Script appears to be free under the following license: " +
                fc.licenseName);
        return;
    } else if (fc && fc.type == checkTypes.FREE_SINGLE_ITEM) {
        console.debug("free single item");
        this.freeToken = types.singleFreeWithComment(
                "Script appears to be free under the following license: " +
                fc.licenseName);
        return;
    }

    if (tc) {
        if (tc.type === checkTypes.NONTRIVIAL) {
            // nontrivial_global is deprecated
            this.nontrivialness = tc;
            return;
        } else if (tc.type === checkTypes.TRIVIAL_DEFINES_FUNCTION) {
            this.nontrivialness = tc;
            return;
        }
    }
};

JsChecker.prototype.removeNotification = function() {
    console.debug('JsChecker.removeNotification()');
    if (this.notification &&
        typeof this.notification.close === 'function'
       ) {
        console.debug('removing', this.shortText);
        // remove notification early on.
        this.notification.close();
        this.notification = null;
    }
};

exports.jsChecker = function() {
    return new JsChecker();
};

exports.removeHashCallback = removeHashCallback;
