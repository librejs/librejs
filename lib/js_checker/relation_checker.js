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
/**
 * relation_checker.js
 * 
 * Finds out if two scripts are related to each other.
 *
 */
const types = require("js_checker/constant_types");

const token = types.token;

// all predefined window properties (methods and variables).
const windowPropertiesHash = {
  "addEventListener": 1, "alert": 1, "applicationCache": 1, 
  "Array": 1, "ArrayBuffer": 1, "atob": 1, "back": 1, "blur": 1,
  "Boolean": 1, "btoa": 1, "captureEvents": 1, "CharacterData": 1,
  "clearInterval": 1, "clearTimeout": 1, "close": 1, "closed": 1,
  "Components": 1, "confirm": 1, "console": 1, "constructor": 1,
  "content": 1, "controllers": 1, "crypto": 1,
  "CSSStyleDeclaration": 1, "Date": 1, "decodeURI": 1,
  "decodeURIComponent": 1, "defaultStatus": 1,
  "disableExternalCapture": 1, "dispatchEvent": 1, "Document": 1,
  "document": 1, "DocumentType": 1, "dump": 1, "Element": 1,
  "enableExternalCapture": 1, "encodeURI": 1, "encodeURIComponent": 1, 
  "Error": 1, "escape": 1, "eval": 1, "EvalError": 1, "Event": 1,
  "find": 1, "Float32Array": 1, "Float64Array": 1, "focus": 1,
  "forward": 1, "frameElement": 1, "frames": 1, "fullScreen": 1,
  "Function": 1, "Generator": 1, "getComputedStyle": 1,
  "getInterface": 1, "getSelection": 1, "globalStorage": 1,
  "history": 1, "home": 1, "HTMLBodyElement": 1, "HTMLCollection": 1, 
  "HTMLDivElement": 1, "HTMLDocument": 1, "HTMLElement": 1,
  "HTMLHeadElement": 1, "HTMLHeadingElement": 1, "HTMLHtmlElement": 1,
  "HTMLStyleElement": 1, "HTMLUnknownElement": 1, "Infinity": 1,
  "innerHeight": 1, "innerWidth": 1, "InstallTrigger": 1,
  "Int16Array": 1, "Int32Array": 1, "Int8Array": 1, "InternalError": 1, 
  "isFinite": 1, "isNaN": 1, "isXMLName": 1, "Iterator": 1,
  "JSON": 1, "length": 1, "localStorage": 1, "Location": 1,
  "location": 1, "locationbar": 1, "matchMedia": 1, "Math": 1,
  "menubar": 1, "moveBy": 1, "moveTo": 1, "mozAnimationStartTime": 1, 
  "mozIndexedDB": 1, "mozInnerScreenX": 1, "mozInnerScreenY": 1,
  "mozPaintCount": 1, "mozRequestAnimationFrame": 1, "name": 1,
  "Namespace": 1, "NaN": 1, "navigator": 1, "netscape": 1, 
  "Node": 1, "NodeList": 1, "Number": 1, "Object": 1, "open": 1,
  "openDialog": 1, "opener": 1, "outerHeight": 1, "outerWidth": 1,
  "pageXOffset": 1, "pageYOffset": 1, "parent": 1, "parseFloat": 1,
  "parseInt": 1, "performance": 1, "personalbar": 1, "pkcs11": 1,
  "postMessage": 1, "print": 1, "prompt": 1, "QName": 1,
  "RangeError": 1, "ReferenceError": 1, "RegExp": 1,
  "releaseEvents": 1, "removeEventListener": 1, "resizeBy": 1,
  "resizeTo": 1, "routeEvent": 1, "screen": 1, "screenX": 1,
  "screenY": 1, "scroll": 1, "scrollbars": 1, "scrollBy": 1,
  "scrollByLines": 1, "scrollByPages": 1, "scrollMaxX": 1,
  "scrollMaxY": 1, "scrollTo": 1, "scrollX": 1, "scrollY": 1,
  "self": 1, "sessionStorage": 1, "setInterval": 1, "setResizable": 1, 
  "setTimeout": 1, "showModalDialog": 1, "sizeToContent": 1,
  "status": 1, "statusbar": 1, "stop": 1, "StopIteration": 1,
  "StorageList": 1, "String": 1, "SyntaxError": 1, "Text": 1,
  "toolbar": 1, "top": 1, "TypeError": 1, "Uint16Array": 1,
  "Uint32Array": 1, "Uint8Array": 1, "Uint8ClampedArray": 1,
  "undefined": 1, "unescape": 1, "uneval": 1, "updateCommands": 1,
  "URIError": 1, "URL": 1, "WeakMap": 1, "Window": 1, "window": 1,
  "XML": 1, "XMLList": 1, "XPCNativeWrapper": 1};

// all predefined document properties.
const documentPropertiesHash = {'activeElement': 1, 'addBinding': 1,
                                'addEventListener': 1, 'adoptNode': 1, 'alinkColor': 1, 'anchors': 1,
                                'appendChild': 1, 'applets': 1, 'ATTRIBUTE_NODE': 1, 'attributes': 1,
                                'baseURI': 1, 'bgColor': 1, 'body': 1, 'captureEvents': 1,
                                'CDATA_SECTION_NODE': 1, 'characterSet': 1, 'childNodes': 1, 'clear':
                                1, 'cloneNode': 1, 'close': 1, 'COMMENT_NODE': 1,
                                'compareDocumentPosition': 1, 'compatMode': 1, 'contentType': 1,
                                'cookie': 1, 'createAttribute': 1, 'createAttributeNS': 1,
                                'createCDATASection': 1, 'createComment': 1, 'createDocumentFragment':
                                1, 'createElement': 1, 'createElementNS': 1, 'createEvent': 1,
                                'createExpression': 1, 'createNodeIterator': 1, 'createNSResolver': 1,
                                'createProcessingInstruction': 1, 'createRange': 1, 'createTextNode':
                                1, 'createTreeWalker': 1, 'currentScript': 1, 'defaultView': 1,
                                'designMode': 1, 'dir': 1, 'dispatchEvent': 1, 'doctype': 1,
                                'DOCUMENT_FRAGMENT_NODE': 1, 'DOCUMENT_NODE': 1,
                                'DOCUMENT_POSITION_CONTAINED_BY': 1, 'DOCUMENT_POSITION_CONTAINS': 1,
                                'DOCUMENT_POSITION_DISCONNECTED': 1, 'DOCUMENT_POSITION_FOLLOWING': 1,
                                'DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC': 1,
                                'DOCUMENT_POSITION_PRECEDING': 1, 'DOCUMENT_TYPE_NODE': 1,
                                'documentElement': 1, 'documentURI': 1, 'domain': 1, 'ELEMENT_NODE':
                                1, 'elementFromPoint': 1, 'embeds': 1, 'enableStyleSheetsForSet': 1,
                                'ENTITY_NODE': 1, 'ENTITY_REFERENCE_NODE': 1, 'evaluate': 1,
                                'execCommand': 1, 'execCommandShowHelp': 1, 'fgColor': 1,
                                'firstChild': 1, 'forms': 1, 'getAnonymousElementByAttribute': 1,
                                'getAnonymousNodes': 1, 'getBindingParent': 1, 'getElementById': 1,
                                'getElementsByClassName': 1, 'getElementsByName': 1,
                                'getElementsByTagName': 1, 'getElementsByTagNameNS': 1,
                                'getSelection': 1, 'getUserData': 1, 'hasAttributes': 1,
                                'hasChildNodes': 1, 'hasFocus': 1, 'head': 1, 'images': 1,
                                'implementation': 1, 'importNode': 1, 'inputEncoding': 1,
                                'insertBefore': 1, 'isDefaultNamespace': 1, 'isEqualNode': 1,
                                'isSameNode': 1, 'isSupported': 1, 'lastChild': 1, 'lastModified': 1,
                                'lastStyleSheetSet': 1, 'linkColor': 1, 'links': 1,
                                'loadBindingDocument': 1, 'localName': 1, 'location': 1,
                                'lookupNamespaceURI': 1, 'lookupPrefix': 1, 'mozSetImageElement': 1,
                                'mozSyntheticDocument': 1, 'namespaceURI': 1, 'nextSibling': 1,
                                'nodeName': 1, 'nodeType': 1, 'nodeValue': 1, 'normalize': 1,
                                'NOTATION_NODE': 1, 'open': 1, 'ownerDocument': 1, 'parentNode': 1,
                                'plugins': 1, 'preferredStyleSheetSet': 1, 'prefix': 1,
                                'previousSibling': 1, 'PROCESSING_INSTRUCTION_NODE': 1,
                                'queryCommandEnabled': 1, 'queryCommandIndeterm': 1,
                                'queryCommandState': 1, 'queryCommandSupported': 1,
                                'queryCommandText': 1, 'queryCommandValue': 1, 'querySelector': 1,
                                'querySelectorAll': 1, 'readyState': 1, 'referrer': 1,
                                'releaseCapture': 1, 'releaseEvents': 1, 'removeBinding': 1,
                                'removeChild': 1, 'removeEventListener': 1, 'replaceChild': 1,
                                'routeEvent': 1, 'selectedStyleSheetSet': 1, 'setUserData': 1,
                                'styleSheets': 1, 'styleSheetSets': 1, 'TEXT_NODE': 1, 'textContent':
                                1, 'title': 1, 'URL': 1, 'vlinkColor': 1, 'write': 1, 'writeln': 1,
                                'xmlEncoding': 1, 'xmlStandalone': 1, 'xmlVersion': 1};

var relationChecker = {

  // identifies scripts across modules.
  scriptId: null,

  // stores all left-side identifier in 'assign' types.
  assignments: null,

  // stores var declarations in global scope.
  variableDeclarations: null,

  // stores top declarations in global scope.
  functionDeclarations: null,

  nonWindowProperties: null,
  
  init: function (scriptId) {
	  this.scriptId = scriptId;
	  this.assignments = [];
	  this.variableDeclarations = {};
	  this.functionDeclarations = {};
	  this.nonWindowProperties = {};
  },

  isWindowProperty: function (identifier) {
	  return (identifier in windowPropertiesHash) ? true : false;
  },

  isDocumentProperty: function (identifier) {
	  return (identifier in documentPropertiesHash) ? true : false;
  },

  storeNodeVars: function (n) {
	  if (n.varDecls != undefined) {
	    var i = 0, le = n.varDecls.length;
	    for (; i < le; i++) {
		    this.variableDeclarations[n.varDecls[i].value] = 1;
	    }
	  }
  },

  storeNodeFunctions: function (n) {
	  if (n.funDecls != undefined) {
	    var i = 0, le = n.funDecls.length;
	    for (; i < le; i++) {
		    this.functionDeclarations[n.funDecls[i].name] = 1;
	    }
	  }
  },
  storeGlobalDeclarations: function (topNode) {
	  this.storeNodeVars(topNode);
	  this.storeNodeFunctions(topNode);
  },
  storeNodeGlobalDeclarations: function (n) {
	  if (n.global === true) {
	    this.storeNodeVars(n);
	    this.storeNodeFunctions(n);
	  }
  },

  storeNodeAssignments: function (n) {
	  if (n.type === token.ASSIGN &&
	      n.children != undefined &&
	      n.children[0].type === token.IDENTIFIER) {
	    this.assignments.push(n.children[0].value);
	  }
  },

  // checks the parent script is in global scope.
  isInGlobalScope: function (n) {
	  var currentNode = n;

	  while (currentNode != undefined) {
	    if (currentNode.type === token.SCRIPT &&
	        currentNode.global === true) {
		    return true;
	    } else if (currentNode.type === token.SCRIPT) {
		    return false;
	    }
	    currentNode = currentNode.parent;
	  }
  },

  // looks for an identifier being declared as either a
  // variable or a function within the scope. Currently,
  // we don't care about assignments.
  lookForIdentifierInAllScopes: function (n, val) {

	  var currentNode = n, i, le, vars, funcs;
	  while (currentNode != undefined) {
	    if (currentNode.varDecls != undefined) {
		    vars = currentNode.varDecls;
		    le = vars.length;
		    for (i = 0; i < le; i++) {
		      if (vars[i].value === val) {
			      console.debug('FOUND declaration for', val);
			      return true;
		      }
		    }
	    }
	    if (currentNode.funDecls != undefined) {
		    funcs = currentNode.funDecls;
		    le = funcs.length;
		    for (i = 0; i < le; i++) {
		      if (funcs[i].name === val) {
			      console.debug('FOUND function declaration for', val);
			      return true;
		      }
		    }
	    }
	    currentNode = currentNode.parent;
	  }
	  console.debug('did not find declaration or assignment for', val);
  },

  // Heuristic method for window properties.
  // this doesn't prove they are window properties, but
  // it allows to make a good guess. These variables could have
  // been assigned to something else...
  checkIdentifierIsWindowProperty: function (n) {

	  if (n.type === token.IDENTIFIER &&
	      (n.parent.type === token.CALL || 
	       (n.parent.type === token.DOT && 
	        n.previous != undefined &&
	        (n.previous.type === token.THIS || 
	         (n.previous.type === token.IDENTIFIER && 
		        n.previous.value === 'window')))) &&
	      n.value in windowPropertiesHash) {

	    this.lookForIdentifierInAllScopes(n, n.value);

	  }

	  else if (n.type === token.IDENTIFIER &&
		         n.parent != undefined &&
		         n.parent.type === token.DOT &&
		         n.previous != undefined &&
		         n.previous.type === token.THIS &&
		         this.isInGlobalScope(n)) {
	    console.debug(n.type, 'use of this in the global scope, seems ok.', n.value);
	  }
	  else if (n.type === token.IDENTIFIER) {
	    // not found.
	    console.debug(n.type, 'probably not a window prop', n.value);
	    this.nonWindowProperties[n.value] = 1;
	  }
  }

};

exports.relationChecker = function (scriptId) {
  var obj = Object.create(relationChecker);
  obj.init(scriptId);
  return obj;
};
