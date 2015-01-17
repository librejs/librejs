/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012 Loic J. Duros
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

const types = require("js_checker/constant_types").token;


exports.mockNodes = { 
    "alert('this is completely trivial');": {type:types.SCRIPT, lineno:1, children:[{type:types.SEMICOLON, value:"alert", lineno:1, start:0, end:34, children:[], blockComments:[], expression:{type:types.CALL, value:"(", lineno:1, start:0, end:34, children:[{type:types.IDENTIFIER, value:"alert", lineno:1, start:0, end:5, children:[], generatingSource:true}, {type:types.LIST, value:"(", lineno:1, start:5, end:34, children:[{type:types.STRING, value:"this is completely trivial", lineno:1, start:6, end:34, children:[], generatingSource:true}], generatingSource:true}], generatingSource:true}, generatingSource:true}], funDecls:[], varDecls:[], modDefns:{table:null, size:0}, modAssns:{table:null, size:0}, modDecls:{table:null, size:0}, modLoads:{table:null, size:0}, impDecls:[], expDecls:[], exports:{table:null, size:0}, hasEmptyReturn:false, hasReturnWithValue:false, hasYield:false, generatingSource:true},  
  "var myObj = { 'myMethod': function (arg) { alert(arg); } }":
    {type:types.SCRIPT, lineno:1, children:[{type:types.VAR, value:"var", lineno:1, start:0, end:9, children:[{type:types.IDENTIFIER, value:"myObj", lineno:1, start:4, end:9, children:[], name:"myObj", readOnly:false, initializer:{type:types.OBJECT_INIT, value:"{", lineno:1, start:12, end:56, children:[{type:types.PROPERTY_INIT, value:":", lineno:1, start:14, end:56, children:[{type:types.IDENTIFIER, value:"myMethod", lineno:1, start:14, end:24, children:[], generatingSource:true}, {type:types.FUNCTION, value:"function", lineno:1, start:26, end:56, children:[], params:["arg"], paramComments:[null], blockComments:null, body:{type:types.SCRIPT, value:"{", lineno:1, start:41, end:52, children:[{type:types.SEMICOLON, value:"alert", lineno:1, start:43, end:52, children:[], blockComments:[], expression:{type:types.CALL, value:"(", lineno:1, start:43, end:52, children:[{type:types.IDENTIFIER, value:"alert", lineno:1, start:43, end:48, children:[], generatingSource:true}, {type:types.LIST, value:"(", lineno:1, start:48, end:52, children:[{type:types.IDENTIFIER, value:"arg", lineno:1, start:49, end:52, children:[], generatingSource:true}], generatingSource:true}], generatingSource:true}, generatingSource:true}], funDecls:[], varDecls:[], modDefns:{table:null, size:0}, modAssns:{table:null, size:0}, modDecls:{table:null, size:0}, modLoads:{table:null, size:0}, impDecls:[], expDecls:[], exports:{table:null, size:0}, hasEmptyReturn:false, hasReturnWithValue:false, hasYield:false, generatingSource:true}, functionForm:1, generatingSource:true}], blockComments:[], generatingSource:true}], generatingSource:true}, blockComment:null, generatingSource:true}], destructurings:[], blockComments:[], generatingSource:true}], funDecls:[], varDecls:[{type:types.IDENTIFIER, value:"myObj", lineno:1, start:4, end:9, children:[], name:"myObj", readOnly:false, initializer:{type:types.OBJECT_INIT, value:"{", lineno:1, start:12, end:56, children:[{type:types.PROPERTY_INIT, value:":", lineno:1, start:14, end:56, children:[{type:types.IDENTIFIER, value:"myMethod", lineno:1, start:14, end:24, children:[], generatingSource:true}, {type:types.FUNCTION, value:"function", lineno:1, start:26, end:56, children:[], params:["arg"], paramComments:[null], blockComments:null, body:{type:types.SCRIPT, value:"{", lineno:1, start:41, end:52, children:[{type:types.SEMICOLON, value:"alert", lineno:1, start:43, end:52, children:[], blockComments:[], expression:{type:types.CALL, value:"(", lineno:1, start:43, end:52, children:[{type:types.IDENTIFIER, value:"alert", lineno:1, start:43, end:48, children:[], generatingSource:true}, {type:types.LIST, value:"(", lineno:1, start:48, end:52, children:[{type:types.IDENTIFIER, value:"arg", lineno:1, start:49, end:52, children:[], generatingSource:true}], generatingSource:true}], generatingSource:true}, generatingSource:true}], funDecls:[], varDecls:[], modDefns:{table:null, size:0}, modAssns:{table:null, size:0}, modDecls:{table:null, size:0}, modLoads:{table:null, size:0}, impDecls:[], expDecls:[], exports:{table:null, size:0}, hasEmptyReturn:false, hasReturnWithValue:false, hasYield:false, generatingSource:true}, functionForm:1, generatingSource:true}], blockComments:[], generatingSource:true}], generatingSource:true}, blockComment:null, generatingSource:true}], modDefns:{table:null, size:0}, modAssns:{table:null, size:0}, modDecls:{table:null, size:0}, modLoads:{table:null, size:0}, impDecls:[], expDecls:[], exports:{table:null, size:0}, hasEmptyReturn:false, hasReturnWithValue:false, hasYield:false, generatingSource:true},
    "function test (myArgument) { doSomething(); }":
    {type:types.SCRIPT, lineno:1, children:[{type:types.FUNCTION,
    value:"function", lineno:1, start:0, end:45, children:[],
    params:["myArgument"], paramComments:[null], blockComments:[],
    name:"test", body:{type:types.SCRIPT, value:"{", lineno:1, start:27,
    end:41, children:[{type:types.SEMICOLON, value:"doSomething", lineno:1,
    start:29, end:41, children:[], blockComments:[],
    expression:{type:types.CALL, value:"(", lineno:1, start:29, end:41,
    children:[{type:types.IDENTIFIER, value:"doSomething", lineno:1,
    start:29, end:40, children:[], generatingSource:true}, {type:types.LIST,
    value:"(", lineno:1, start:40, end:41, children:[],
    generatingSource:true}], generatingSource:true},
    generatingSource:true}], funDecls:[], varDecls:[],
    modDefns:{table:null, size:0}, modAssns:{table:null, size:0},
    modDecls:{table:null, size:0}, modLoads:{table:null, size:0},
    impDecls:[], expDecls:[], exports:{table:null, size:0},
    hasEmptyReturn:false, hasReturnWithValue:false, hasYield:false,
    generatingSource:true}, functionForm:0, generatingSource:true}],
    funDecls:[{type:types.FUNCTION, value:"function", lineno:1, start:0,
    end:45, children:[], params:["myArgument"], paramComments:[null],
    blockComments:[], name:"test", body:{type:types.SCRIPT, value:"{",
    lineno:1, start:27, end:41, children:[{type:types.SEMICOLON,
    value:"doSomething", lineno:1, start:29, end:41, children:[],
    blockComments:[], expression:{type:types.CALL, value:"(", lineno:1,
    start:29, end:41, children:[{type:types.IDENTIFIER, value:"doSomething",
    lineno:1, start:29, end:40, children:[], generatingSource:true},
    {type:types.LIST, value:"(", lineno:1, start:40, end:41, children:[],
    generatingSource:true}], generatingSource:true},
    generatingSource:true}], funDecls:[], varDecls:[],
    modDefns:{table:null, size:0}, modAssns:{table:null, size:0},
    modDecls:{table:null, size:0}, modLoads:{table:null, size:0},
    impDecls:[], expDecls:[], exports:{table:null, size:0},
    hasEmptyReturn:false, hasReturnWithValue:false, hasYield:false,
    generatingSource:true}, functionForm:0, generatingSource:true}],
    varDecls:[], modDefns:{table:null, size:0}, modAssns:{table:null,
    size:0}, modDecls:{table:null, size:0}, modLoads:{table:null,
    size:0}, impDecls:[], expDecls:[], exports:{table:null, size:0},
    hasEmptyReturn:false, hasReturnWithValue:false, hasYield:false,
    generatingSource:true},

    "var def = 'blah';var i = 0;\n\n def = 'something else';": {type:types.SCRIPT,
    lineno:1, children:[{type:types.VAR, value:"var", lineno:1, start:0,
    end:7, children:[{type:types.IDENTIFIER, value:"def", lineno:1, start:4,
    end:7, children:[], name:"def", readOnly:false,
    initializer:{type:types.STRING, value:"blah", lineno:1, start:10,
    end:16, children:[], generatingSource:true}, blockComment:null,
    generatingSource:true}], destructurings:[], blockComments:[],
    generatingSource:true}, {type:types.VAR, value:"var", lineno:1,
    start:17, end:22, children:[{type:types.IDENTIFIER, value:"i", lineno:1,
    start:21, end:22, children:[], name:"i", readOnly:false,
    initializer:{type:types.NUMBER, value:0, lineno:1, start:25, end:26,
    children:[], generatingSource:true}, blockComment:null,
    generatingSource:true}], destructurings:[], blockComments:[],
    generatingSource:true}, {type:types.SEMICOLON, value:"def", lineno:3,
    start:30, end:52, children:[], blockComments:[],
    expression:{type:types.ASSIGN, value:";", lineno:1, start:26, end:52,
    children:[{type:types.IDENTIFIER, value:"def", lineno:3, start:30,
    end:33, children:[], generatingSource:true}, {type:types.STRING,
    value:"something else", lineno:3, start:36, end:52, children:[],
    generatingSource:true}], blockComment:null,
    generatingSource:true}, generatingSource:true}], funDecls:[],
    varDecls:[{type:types.IDENTIFIER, value:"def", lineno:1, start:4, end:7,
    children:[], name:"def", readOnly:false, initializer:{type:types.STRING,
    value:"blah", lineno:1, start:10, end:16, children:[],
    generatingSource:true}, blockComment:null, generatingSource:true},
    {type:types.IDENTIFIER, value:"i", lineno:1, start:21, end:22,
    children:[], name:"i", readOnly:false, initializer:{type:types.NUMBER,
    value:0, lineno:1, start:25, end:26, children:[],
    generatingSource:true}, blockComment:null,
    generatingSource:true}], modDefns:{table:null, size:0},
    modAssns:{table:null, size:0}, modDecls:{table:null, size:0},
    modLoads:{table:null, size:0}, impDecls:[], expDecls:[],
    exports:{table:null, size:0}, hasEmptyReturn:false,
    hasReturnWithValue:false, hasYield:false, generatingSource:true},

'function example(param1) {}': {
    type: 78,
    body: {
        type: 0,
        end: 27,
        hasEmptyReturn: false,
        hasReturnWithValue: false,
        isGenerator: false,
        lineno: 1,
        start: 26,
        value: "{",
    },
    end: 29,
    functionForm: 0,
    lineno: 1,
    name: "example",
    params: "param1",
    start: 0,
    value: "function"
},
'eval': {
    type: 60,
    end: 31,
    lineno: 1,
    start: 27,
    value: 'eval'
},
'evaluate': {
    type: 60,
    end: 31,
    lineno: 1,
    start: 27,
    value: 'evaluate'
},
"window['eval']('var i;');": {
    "type": 46,
    "value": "(",
    "lineno": 1,
    "start": 8,
    "end": 31,
    "tokenizer": "",
    "children": [
        {
            "type": 48,
            "value": "[",
            "lineno": 1,
            "start": 8,
            "end": 21,
            "tokenizer": "",
            "children": [
                {
                    "type": 60,
                    "value": "window",
                    "lineno": 1,
                    "start": 8,
                    "end": 14,
                    "tokenizer": "",
                    "children": []
                },
                {
                    "type": 62,
                    "value": "eval",
                    "lineno": 1,
                    "start": 15,
                    "end": 21,
                    "tokenizer": "",
                    "children": []
                }
            ]
        },
        {
            "type": 55,
            "value": "(",
            "lineno": 1,
            "start": 22,
            "end": 31,
            "tokenizer": "",
            "children": [
                {
                    "type": 62,
                    "value": "var i;",
                    "lineno": 1,
                    "start": 23,
                    "end": 31,
                    "tokenizer": "",
                    "children": []
                }
            ]
        }
    ]
},
"array[num] = 'some text';": {
    "type": 4,
    "value": ";",
    "lineno": 1,
    "start": 11,
    "end": 37,
    "tokenizer": "",
    "children": [
        {
            "type": 48,
            "value": "[",
            "lineno": 2,
            "start": 13,
            "end": 22,
            "tokenizer": "",
            "children": [
                {
                    "type": 60,
                    "value": "array",
                    "lineno": 2,
                    "start": 13,
                    "end": 18,
                    "tokenizer": "",
                    "children": []
                },
                {
                    "type": 60,
                    "value": "num",
                    "lineno": 2,
                    "start": 19,
                    "end": 22,
                    "tokenizer": "",
                    "children": []
                }
            ],
            "assignOp": null
        },
        {
            "type": 62,
            "value": "some text",
            "lineno": 2,
            "start": 26,
            "end": 37,
            "tokenizer": "",
            "children": []
        }
    ],
    "blockComment": null,
    "assignOp": null
},
'XMLHttpRequest': {
    "type": 60,
    "value": "XMLHttpRequest",
    "lineno": 3,
    "start": 16,
    "end": 30,
    "tokenizer": "",
    "children": []
},
'ActiveXObject': {
    "type": 60,
    "value": "ActiveXObject",
    "lineno": 3,
    "start": 16,
    "end": 30,
    "tokenizer": "",
    "children": []
},
"oReq.open('GET', 'http://localhost/test.xml', true;)": {
    "type": 46,
    "value": "(",
    "lineno": 3,
    "start": 2,
    "end": 52,
    "tokenizer": "",
    "children": [
        {
            "type": 35,
            "value": ".",
            "lineno": 3,
            "start": 2,
            "end": 11,
            "tokenizer": "",
            "children": [
                {
                    "type": 60,
                    "value": "oReq",
                    "lineno": 3,
                    "start": 2,
                    "end": 6,
                    "tokenizer": "",
                    "children": []
                },
                {
                    "type": 60,
                    "value": "open",
                    "lineno": 3,
                    "start": 7,
                    "end": 11,
                    "tokenizer": "",
                    "children": []
                }
            ]
        },
        {
            "type": 55,
            "value": "(",
            "lineno": 3,
            "start": 11,
            "end": 52,
            "tokenizer": "",
            "children": [
                {
                    "type": 62,
                    "value": "GET",
                    "lineno": 3,
                    "start": 12,
                    "end": 17,
                    "tokenizer": "",
                    "children": []
                },
                {
                    "type": 62,
                    "value": "http://localhost/test.xml",
                    "lineno": 3,
                    "start": 19,
                    "end": 46,
                    "tokenizer": "",
                    "children": []
                },
                {
                    "type": 91,
                    "value": "true",
                    "lineno": 3,
                    "start": 48,
                    "end": 52,
                    "tokenizer": "",
                    "children": []
                }
            ]
        }
    ]
},
"oReq.open('a random string');": {
    "type": 46,
    "value": "(",
    "lineno": 3,
    "start": 2,
    "end": 52,
    "tokenizer": "",
    "children": [
        {
            "type": 35,
            "value": ".",
            "lineno": 3,
            "start": 2,
            "end": 11,
            "tokenizer": "",
            "children": [
                {
                    "type": 60,
                    "value": "oReq",
                    "lineno": 3,
                    "start": 2,
                    "end": 6,
                    "tokenizer": "",
                    "children": []
                },
                {
                    "type": 60,
                    "value": "open",
                    "lineno": 3,
                    "start": 7,
                    "end": 11,
                    "tokenizer": "",
                    "children": []
                }
            ]
        },
        {
            "type": 55,
            "value": "(",
            "lineno": 3,
            "start": 11,
            "end": 52,
            "tokenizer": "",
            "children": [
                {
                    "type": 62,
                    "value": "a random string",
                    "lineno": 3,
                    "start": 12,
                    "end": 17,
                    "tokenizer": "",
                    "children": []
                }
            ]
        }
    ]
},
"document.createElement('script');": {
    "type": 46,
    "value": "(",
    "lineno": 1,
    "start": 0,
    "end": 31,
    "tokenizer": "",
    "children": [
        {
            "type": 35,
            "value": ".",
            "lineno": 1,
            "start": 0,
            "end": 22,
            "tokenizer": "",
            "children": [
                {
                    "type": 60,
                    "value": "document",
                    "lineno": 1,
                    "start": 0,
                    "end": 8,
                    "tokenizer": "",
                    "children": []
                },
                {
                    "type": 60,
                    "value": "createElement",
                    "lineno": 1,
                    "start": 9,
                    "end": 22,
                    "tokenizer": "",
                    "children": []
                }
            ]
        },
        {
            "type": 55,
            "value": "(",
            "lineno": 1,
            "start": 22,
            "end": 31,
            "tokenizer": "",
            "children": [
                {
                    "type": 62,
                    "value": "script",
                    "lineno": 1,
                    "start": 23,
                    "end": 31,
                    "tokenizer": "",
                    "children": []
                }
            ]
        }
    ]
},
'document.write("script src="evil-js.js"type="text/javascript></script>")':  {
    "type": 46,
    "value": "(",
    "lineno": 2,
    "start": 1,
    "end": 36,
    "tokenizer": "",
    "children": [
	{
	    "type": 35,
	    "value": ".",
	    "lineno": 2,
	    "start": 1,
	    "end": 15,
	    "tokenizer": "",
	    "children": [
		{
		    "type": 60,
		    "value": "document",
		    "lineno": 2,
		    "start": 1,
		    "end": 9,
		    "tokenizer": "",
		    "children": []
		},
		{
		    "type": 60,
		    "value": "write",
		    "lineno": 2,
		    "start": 10,
		    "end": 15,
		    "tokenizer": "",
		    "children": []
		}
	    ]
	},
	{
	    "type": 55,
	    "value": "(",
	    "lineno": 2,
	    "start": 15,
	    "end": 36,
	    "tokenizer": "",
	    "children": [
		{
		    "type": 62,
		    "value": "\n\n<script src=\"evil-js.js\"type=\"text/javascript></script>\n\n",
		    "lineno": 2,
		    "start": 16,
		    "end": 36,
		    "tokenizer": "",
		    "children": []
		}
	    ]
	}
    ]
},
"document.write('a ' + ' text');": {
    "type": 46,
    "value": "(",
    "lineno": 2,
    "start": 1,
    "end": 36,
    "tokenizer": "",
    "children": [
	{
	    "type": 35,
	    "value": ".",
	    "lineno": 2,
	    "start": 1,
	    "end": 15,
	    "tokenizer": "",
	    "children": [
		{
		    "type": 60,
		    "value": "document",
		    "lineno": 2,
		    "start": 1,
		    "end": 9,
		    "tokenizer": "",
		    "children": []
		},
		{
		    "type": 60,
		    "value": "write",
		    "lineno": 2,
		    "start": 10,
		    "end": 15,
		    "tokenizer": "",
		    "children": []
		}
	    ]
	},
	{
	    "type": 55,
	    "value": "(",
	    "lineno": 2,
	    "start": 15,
	    "end": 36,
	    "tokenizer": "",
	    "children": [
		{
                    "type": 24,
                    "value": "+",
                    "lineno": 2,
                    "start": 16,
                    "end": 29,
                    "tokenizer": "",
                    "children": [
                        {
                            "type": 62,
                            "value": "scri",
                            "lineno": 2,
                            "start": 16,
                            "end": 22,
                            "tokenizer": "",
                            "children": []
                        },
                        {
                            "type": 62,
                            "value": "pt",
                            "lineno": 2,
                            "start": 25,
                            "end": 29,
                            "tokenizer": "",
                            "children": []
                        }
                    ]
                }   
	    ]
	}
    ]
},
"document.write('<h1>some text</h1>')": {
    "lineno": 1,
    "tokenizer": "",
    "children": [
	{
	    "type": 2,
	    "value": "document",
	    "lineno": 2,
	    "start": 1,
	    "end": 36,
	    "tokenizer": "",
	    "children": [],
	    "blockComments": [],
	    "expression": {
		"type": 46,
		"value": "(",
		"lineno": 2,
		"start": 1,
		"end": 36,
		"tokenizer": "",
		"children": [
		    {
			"type": 35,
			"value": ".",
			"lineno": 2,
			"start": 1,
			"end": 15,
			"tokenizer": "",
			"children": [
			    {
				"type": 60,
				"value": "document",
				"lineno": 2,
				"start": 1,
				"end": 9,
				"tokenizer": "",
				"children": []
			    },
			    {
				"type": 60,
				"value": "write",
				"lineno": 2,
				"start": 10,
				"end": 15,
				"tokenizer": "",
				"children": []
			    }
			]
		    },
		    {
			"type": 55,
			"value": "(",
			"lineno": 2,
			"start": 15,
			"end": 36,
			"tokenizer": "",
			"children": [
			    {
				"type": 62,
				"value": "\n\n<h1>some text</h1>\n\n",
				"lineno": 2,
				"start": 16,
				"end": 36,
				"tokenizer": "",
				"children": []
			    }
			]
		    }
		]
	    }
	}
    ],
},
'element.innerHTML = "<script src=\'externalscript.js\'></script>";': {
    "lineno": 1,
    "tokenizer": "",
    "children": [
	{
	    "type": 35,
	    "value": ".",
	    "lineno": 1,
	    "start": 0,
	    "end": 17,
	    "tokenizer": "",
	    "children": [
		{
		    "type": 60,
		    "value": "element",
		    "lineno": 1,
		    "start": 0,
		    "end": 7,
		    "tokenizer": "",
		    "children": []
		},
		{
		    "type": 60,
		    "value": "innerHTML",
		    "lineno": 1,
		    "start": 8,
		    "end": 17,
		    "tokenizer": "",
		    "children": []
		}
	    ],
	    "assignOp": null
	},
	{
	    "type": 62,
	    "value": '<script src=\'externalscript.js\'></script>',
	    "lineno": 1,
	    "start": 20,
	    "end": 63,
	    "tokenizer": "",
	    "children": []
	}
    ],
    "type": 4,
    "assignOp": null
},
'element.innerHTML = "<h1>A headline!</h1>";': {
    "lineno": 1,
    "tokenizer": "",
    "children": [
	{
	    "type": 35,
	    "value": ".",
	    "lineno": 1,
	    "start": 0,
	    "end": 17,
	    "tokenizer": "",
	    "children": [
		{
		    "type": 60,
		    "value": "element",
		    "lineno": 1,
		    "start": 0,
		    "end": 7,
		    "tokenizer": "",
		    "children": []
		},
		{
		    "type": 60,
		    "value": "innerHTML",
		    "lineno": 1,
		    "start": 8,
		    "end": 17,
		    "tokenizer": "",
		    "children": []
		}
	    ],
	    "assignOp": null
	},
	{
	    "type": 62,
	    "value": '<h1>A Headline!</h1>',
	    "lineno": 1,
	    "start": 20,
	    "end": 63,
	    "tokenizer": "",
	    "children": []
	}
    ],
    "type": 4,
    "assignOp": null
},
'element.innerHTML = "script src" + "=\'eviljs.js\'";': {
    "lineno": 1,
    "tokenizer": "",
    "children": [
	{
	    "type": 35,
	    "value": ".",
	    "lineno": 1,
	    "start": 0,
	    "end": 17,
	    "tokenizer": "",
	    "children": [
		{
		    "type": 60,
		    "value": "element",
		    "lineno": 1,
		    "start": 0,
		    "end": 7,
		    "tokenizer": "",
		    "children": []
		},
		{
		    "type": 60,
		    "value": "innerHTML",
		    "lineno": 1,
		    "start": 8,
		    "end": 17,
		    "tokenizer": "",
		    "children": []
		}
	    ],
	    "assignOp": null
	},
	{
	    "type": 24,
	    "value": "+",
	    "lineno": 1,
	    "start": 20,
	    "end": 49,
	    "tokenizer": "",
	    "children": [
		{
		    "type": 62,
		    "value": "script src",
		    "lineno": 1,
		    "start": 20,
		    "end": 32,
		    "tokenizer": "",
		    "children": []
		},
		{
		    "type": 62,
		    "value": "='eviljs.js'",
		    "lineno": 1,
		    "start": 35,
		    "end": 49,
		    "tokenizer": "",
		    "children": []
		}
	    ]
	}
    ],
    "type": 4,
    "assignOp": null
}
};
