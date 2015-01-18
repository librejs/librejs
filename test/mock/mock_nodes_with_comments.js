/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012 Loic J. Duros
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

exports.mockNodesWithComments = {
gplv3Node: {
	"lineno": 1,
	"children": [
		{
			"type": 2,
			"value": "myObj",
			"lineno": 18,
			"start": 716,
			"end": 768,
			"children": [],
			"blockComments": [
				"*@licstart  The following is the entire license notice for the JavaScript code in this page.* A Fake JS Library\u000a * Copyright (C) 2011  Patrick Star\u000a * \u000a * This program is free software: you can redistribute it and/or modify\u000a * it under the terms of the GNU General Public License as published by\u000a * the Free Software Foundation, either version 3 of the License, or\u000a * (at your option) any later version.\u000a * \u000a * This program is distributed in the hope that it will be useful,\u000a * but WITHOUT ANY WARRANTY; without even the implied warranty of\u000a * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\u000a * GNU General Public License for more details.\u000a * \u000a * You should have received a copy of the GNU General Public License\u000a * along with this program.  If not, see .\u000a @licend  The above is the entire license notice for the JavaScript code in this page."
			],
			"expression": {
				"type": 46,
				"value": "(",
				"lineno": 18,
				"start": 716,
				"end": 768,
				"children": [
					{
						"type": 35,
						"value": ".",
						"lineno": 18,
						"start": 716,
						"end": 735,
						"children": [
							{
								"type": 35,
								"value": ".",
								"lineno": 18,
								"start": 716,
								"end": 730,
								"children": [
									{
										"type": 60,
										"value": "myObj",
										"lineno": 18,
										"start": 716,
										"end": 721,
										"children": []
									},
									{
										"type": 60,
										"value": "myMethod",
										"lineno": 18,
										"start": 722,
										"end": 730,
										"children": []
									}
								]
							},
							{
								"type": 60,
								"value": "init",
								"lineno": 18,
								"start": 731,
								"end": 735,
								"children": []
							}
						]
					},
					{
						"type": 55,
						"value": "(",
						"lineno": 18,
						"start": 735,
						"end": 768,
						"children": [
							{
								"type": 62,
								"value": "http://www.example.com/file.js",
								"lineno": 18,
								"start": 736,
								"end": 768,
								"children": []
							}
						]
					}
				]
			}
		},
		{
			"type": 94,
			"value": "var",
			"lineno": 21,
			"start": 798,
			"end": 803,
			"children": [
				{
					"type": 60,
					"value": "i",
					"lineno": 21,
					"start": 802,
					"end": 803,
					"children": [],
					"name": "i",
					"readOnly": false,
					"initializer": {
						"type": 61,
						"value": 0,
						"lineno": 21,
						"start": 806,
						"end": 807,
						"children": []
					},
					"blockComment": null
				}
			],
			"destructurings": [],
			"blockComments": [
			    " a single line comment.",
			    " another single line comment."
			]
		}
	],
	"type": 42,
	"funDecls": [],
	"varDecls": [
		{
			"type": 60,
			"value": "i",
			"lineno": 21,
			"start": 802,
			"end": 803,
			"children": [],
			"name": "i",
			"readOnly": false,
			"initializer": {
				"type": 61,
				"value": 0,
				"lineno": 21,
				"start": 806,
				"end": 807,
				"children": []
			},
			"blockComment": null
		}
	],
	"modDefns": {
		"table": {},
		"size": 0
	},
	"modAssns": {
		"table": {},
		"size": 0
	},
	"modDecls": {
		"table": {},
		"size": 0
	},
	"modLoads": {
		"table": {},
		"size": 0
	},
	"impDecls": [],
	"expDecls": [],
	"exports": {
		"table": {},
		"size": 0
	},
	"hasEmptyReturn": false,
	"hasReturnWithValue": false,
	"isGenerator": false
}
};
