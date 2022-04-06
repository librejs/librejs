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

const BOM = [0xEF, 0xBB, 0xBF];
const DECODER_PARAMS = { stream: true };

class ResponseMetaData {
  constructor(request) {
    let { responseHeaders } = request;
    this.headers = {};
    for (let h of responseHeaders) {
      if (/^\s*Content-(Type|Disposition)\s*$/i.test(h.name)) {
        let propertyName = h.name.split('-')[1].trim();
        propertyName = `content${propertyName.charAt(0).toUpperCase()}${propertyName.substring(1).toLowerCase()}`;
        this[propertyName] = h.value;
        this.headers[propertyName] = h;
      }
    }
    this.computedCharset = '';
  }

  get charset() {
    let charset = '';
    if (this.contentType) {
      let m = this.contentType.match(/;\s*charset\s*=\s*(\S+)/);
      if (m) {
        charset = m[1];
      }
    }
    Object.defineProperty(this, 'charset', { value: charset, writable: false, configurable: true });
    return this.computedCharset = charset;
  }

  decode(data) {
    let charset = this.charset;
    let decoder = this.createDecoder();
    let text = decoder.decode(data, DECODER_PARAMS);
    if (!charset && /html/i.test(this.contentType)) {
      // missing HTTP charset, sniffing in content...

      if (data[0] === BOM[0] && data[1] === BOM[1] && data[2] === BOM[2]) {
        // forced UTF-8, nothing to do
        return text;
      }

      // let's try figuring out the charset from <meta> tags
      let parser = new DOMParser();
      let doc = parser.parseFromString(text, 'text/html');
      let meta = doc.querySelectorAll('meta[charset], meta[http-equiv="content-type"], meta[content*="charset"]');
      for (let m of meta) {
        charset = m.getAttribute('charset');
        if (!charset) {
          let match = m.getAttribute('content').match(/;\s*charset\s*=\s*([\w-]+)/i)
          if (match) charset = match[1];
        }
        if (charset) {
          decoder = this.createDecoder(charset, null);
          if (decoder) {
            this.computedCharset = charset;
            return decoder.decode(data, DECODER_PARAMS);
          }
        }
      }
    }
    return text;
  }

  createDecoder(charset = this.charset, def = 'latin1') {
    if (charset) {
      try {
        return new TextDecoder(charset);
      } catch (e) {
        console.error(e);
      }
    }
    return def ? new TextDecoder(def) : null;
  }
}
ResponseMetaData.UTF8BOM = new Uint8Array(BOM);

module.exports = { ResponseMetaData };
