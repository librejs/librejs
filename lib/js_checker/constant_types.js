/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
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
//var debug = require("debug/debug");

// token list from exports.init();
exports.token = {
    END: 0,
    NEWLINE: 1,
    SEMICOLON: 2,
    COMMA: 3,
    ASSIGN: 4,
    HOOK: 5,
    COLON: 6,
    CONDITIONAL: 7,
    OR: 8,
    AND: 9,
    BITWISE_OR: 10,
    BITWISE_XOR: 11,
    BITWISE_AND: 12,
    EQ: 13,
    NE: 14,
    STRICT_EQ: 15,
    STRICT_NE: 16,
    LT: 17,
    LE: 18,
    GE: 19,
    GT: 20,
    LSH: 21,
    RSH: 22,
    URSH: 23,
    PLUS: 24,
    MINUS: 25,
    MUL: 26,
    DIV: 27,
    MOD: 28,
    NOT: 29,
    BITWISE_NOT: 30,
    UNARY_PLUS: 31,
    UNARY_MINUS: 32,
    INCREMENT: 33,
    DECREMENT: 34,
    DOT: 35,
    LEFT_BRACKET: 36,
    RIGHT_BRACKET: 37,
    LEFT_CURLY: 38,
    RIGHT_CURLY: 39,
    LEFT_PAREN: 40,
    RIGHT_PAREN: 41,
    SCRIPT: 42,
    BLOCK: 43,
    LABEL: 44,
    FOR_IN: 45,
    CALL: 46,
    NEW_WITH_ARGS: 47,
    INDEX: 48,
    ARRAY_INIT: 49,
    OBJECT_INIT: 50,
    PROPERTY_INIT: 51,
    GETTER: 52,
    SETTER: 53,
    GROUP: 54,
    LIST: 55,
    LET_BLOCK: 56,
    ARRAY_COMP: 57,
    GENERATOR: 58,
    COMP_TAIL: 59,
    IDENTIFIER: 60,
    NUMBER: 61,
    STRING: 62,
    REGEXP: 63,
    BREAK: 64,
    CASE: 65,
    CATCH: 66,
    CONST: 67,
    CONTINUE: 68,
    DEBUGGER: 69,
    DEFAULT: 70,
    DELETE: 71,
    DO: 72,
    ELSE: 73,
    EXPORT: 74,
    FALSE: 75,
    FINALLY: 76,
    FOR: 77,
    FUNCTION: 78,
    IF: 79,
    IMPORT: 80,
    IN: 81,
    INSTANCEOF: 82,
    LET: 83,
    MODULE: 84,
    NEW: 85,
    NULL: 86,
    RETURN: 87,
    SWITCH: 88,
    THIS: 89,
    THROW: 90,
    TRUE: 91,
    TRY: 92,
    TYPEOF: 93,
    VAR: 94,
    VOID: 95,
    YIELD: 96,
    WHILE: 97,
    WITH: 98
};

var checkTypes = {
    // trivial.
    TRIVIAL: 1,

    // defines functions, and so might or might not
    // be trivial in the end.
    TRIVIAL_DEFINES_FUNCTION: 2,

    NONTRIVIAL: 3,

    // Free
    FREE: 4,
    FREE_SINGLE_ITEM: 5,
    WHITELISTED: 6
};

exports.checkTypes = checkTypes;

exports.emptyTypeObj = function() {
    return {
        'type': null,
        'reason': null
    };
};

exports.nontrivialWithComment = function(comment) {
    return {
        'type': checkTypes.NONTRIVIAL,
        'reason': comment
    };
};

exports.trivialWithComment = function(comment) {
    return {
        'type': checkTypes.TRIVIAL,
        'reason': comment
    };
};

exports.trivialFuncWithComment = function(comment) {
    return {
        'type': checkTypes.TRIVIAL_DEFINES_FUNCTION,
        'reason': comment
    };
};

exports.freeWithComment = function(comment) {
    return {
        'type': checkTypes.FREE,
        'reason': comment
    };
};

exports.singleFreeWithComment = function(comment) {
    return {
        'type': checkTypes.FREE_SINGLE_ITEM,
        'reason': comment
    };
};

exports.whitelisted = function(comment) {
    return {
        'type': checkTypes.WHITELISTED,
        'reason': comment + ' -- whitelisted by user'
    };
};
