/*
 # ***** BEGIN LICENSE BLOCK *****
 # Version: MPL 1.1/GPL 2.0/LGPL 2.1
 #
 # The contents of this file are subject to the Mozilla Public License Version
 # 1.1 (the "License"); you may not use this file except in compliance with
 # the License. You may obtain a copy of the License at
 # http://www.mozilla.org/MPL/
 #
 # Software distributed under the License is distributed on an "AS IS" basis,
 # WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 # for the specific language governing rights and limitations under the
 # License.
 #
 # The Original Code is Microsummarizer.
 #
 # The Initial Developer of the Original Code is Mozilla.
 # Portions created by the Initial Developer are Copyright (C) 2006
 # the Initial Developer. All Rights Reserved.
 #
 # Contributor(s):
 #  Myk Melez <myk@mozilla.org> (Original Author)
 #  Simon Bünzli <zeniko@gmail.com>
 #  Asaf Romano <mano@mozilla.com>
 #  Dan Mills <thunder@mozilla.com>
 #  Ryan Flint <rflint@dslr.net>
 #
 # Alternatively, the contents of this file may be used under the terms of
 # either the GNU General Public License Version 2 or later (the "GPL"), or
 # the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 # in which case the provisions of the GPL or the LGPL are applicable instead
 # of those above. If you wish to allow use of your version of this file only
 # under the terms of either the GPL or the LGPL, and not to allow others to
 # use your version of this file under the terms of the MPL, indicate your
 # decision by deleting the provisions above and replace them with the notice
 # and other provisions required by the GPL or the LGPL. If you do not delete
 # the provisions above, a recipient may use your version of this file under
 # the terms of any one of the MPL, the GPL or the LGPL.
 #
 # ***** END LICENSE BLOCK *****
 */

/*
 * The original file is located here:
 * http://mxr.mozilla.org/mozilla/source/browser/components/microsummaries/src/nsMicrosummaryService.js?raw=1
 *
 */

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
 * html_parser
 *
 * Takes in an http response (string), loads it into a secured iframe
 * so that it can be manipulated as a DOM object. It then returns a
 * modified string to be passed along as a replacement of the original
 * response.
 *
 */

var {Cc, Ci, Cu} = require("chrome");

var domHandlerModule = require("html_script_finder/dom_handler");

const PR_UINT32_MAX = 2147483647;


exports.htmlParser = function () {

  return {
	  charset: null,
	  htmlText: null,
	  pageURL: null,
	  fragment: null,
    contentType: null,
	  responseStatus: null,
    
    parse: function (htmlText, charset, contentType, url, fragment, 
                     responseStatus, parseResult) {

      // DOMParser still has too many issues.
	    this.htmlText = htmlText;
	    this.charset = charset;

      if (this.charset === "" || this.charset === undefined) {
        this.charset = "utf-8";
      }
      this.contentType = contentType;
	    this.pageURL = url;
	    this.fragment = fragment;
	    this.responseStatus = responseStatus;
      var that = this;

      var domParser = Cc["@mozilla.org/xmlextras/domparser;1"].
        createInstance(Ci.nsIDOMParser);
      
      var dom = domParser.parseFromString(this.htmlText, this.contentType);
      //            console.debug(dom.getElementsByTagName('body')[0].innerHTML);
      domHandlerModule.domHandler(dom, this.pageURL, this.fragment, this.responseStatus, function (newDom) {
        parseResult(that.serializeToStream(newDom, that));
      });
      
    },

	  /**
	   * serializeToStream
	   * Serializes an HTML DOM into a binary stream. Uses
	   * nsIDOMSerializer only as a backup to when the
	   * reconstituteHtmlString method fails (not sure if/when it
	   * happens).
	   * @param dom obj Reference to the dom object
	   * @param that obj Reference to the object returned by htmlParser.
	   * This allows to give access to the iframe.
	   * @return a binary stream.
	   */
	  serializeToStream: function (dom, that) {

	    var newData, len;

	    try {
		    var storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
		    var binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
		    var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
        var encoder = Cc["@mozilla.org/layout/documentEncoder;1?type=" + this.contentType]
              .createInstance(Ci.nsIDocumentEncoder);

        encoder.setCharset(this.charset);
        encoder.init(dom, this.contentType, 0);
		    storageStream.init(8192, PR_UINT32_MAX, null);

		    binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
        encoder.encodeToStream(binaryOutputStream);
        return storageStream;
	    } catch (e) {
		    console.debug('issue with serializer', e, e.lineNumber);
	    }	    
	  }

  };
};
