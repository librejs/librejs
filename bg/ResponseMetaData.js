/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
*
* Copyright (C) 2018 Giorgio Maone <giorgio@maone.net>
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

/**
  This class parses HTTP response headers to extract both the
  MIME Content-type and the character set to be used, if specified,
  to parse textual data through a decoder.
*/

class ResponseMetaData {
  constructor(request) {
    let {responseHeaders} = request;
    this.headers = {};
    for (let h of responseHeaders) {
      if (/^\s*Content-(Type|Disposition)\s*$/i.test(h.name)) {
        let propertyName =  h.name.split("-")[1].trim();
        propertyName = `content${propertyName.charAt(0).toUpperCase()}${propertyName.substring(1).toLowerCase()}`;
        this[propertyName] = h.value;
        this.headers[propertyName] = h;
      }
    }
    this.forcedUTF8 = false;
  }

  get charset() {
    let charset = "";
    if (this.contentType) {
      let m = this.contentType.match(/;\s*charset\s*=\s*(\S+)/);
      if (m) {
        charset = m[1];
      }
    }
    Object.defineProperty(this, "charset", { value: charset, writable: false, configurable: true });
    return charset;
  }

  get isUTF8() {
    return /^utf-8$/i.test(this.charset);
  }

  forceUTF8() {
    if (!(this.forcedUTF8 || this.isUTF8)) {
      let h = this.headers.contentType;
      if (h) {
        h.value = h.value.replace(/;\s*charset\s*=.*|$/, "; charset=utf8");
        this.forcedUTF8 = true;
      } // if the header doesn't exist the browser should default to UTF-8 anyway
    }
    return this.forcedUTF8;
  }

  createDecoder() {
    if (this.charset) {
      try {
        return new TextDecoder(this.charset);
      } catch (e) {
        console.error(e);
      }
    }
    return new TextDecoder("utf-8");
  }
};

module.exports = { ResponseMetaData };
