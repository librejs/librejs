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
 A tiny wrapper around extensions storage API, supporting CSV serialization for
 retro-compatibility
*/
"use strict";

var Storage = {
  ARRAY: {
    async load(key, array = undefined) {
      if (array === undefined) {
        array = (await browser.storage.local.get(key))[key];
      }
      return array ? new Set(array) : new Set();
    },
    async save(key, list) {
      return await browser.storage.local.set({[key]: [...list]});
    },
  },

  CSV: {
    async load(key) {
      let csv = (await browser.storage.local.get(key))[key];
      return csv ? new Set(csv.split(/\s*,\s*/)) : new Set();
    },

    async save(key, list) {
      return await browser.storage.local.set({[key]: [...list].join(",")});
    }
  }
};

/**
  A class to hold and persist blacklists and whitelists
*/

class ListStore {
  constructor(key, storage = Storage.ARRAY) {
    this.key = key;
    this.storage = storage;
    this.items = new Set();
    browser.storage.onChanged.addListener(changes => {
      if (!this.saving && this.key in changes) {
        this.load(changes[this.key].newValue);
      }
    });
  }

  static inlineItem(url) {
    // here we simplify and hash inline script references
    return url.startsWith("inline:") ? url
      : url.startsWith("view-source:")
        && url.replace(/^view-source:[\w-+]+:\/+([^/]+).*#line\d+/,"inline://$1#")
              .replace(/\n[^]*/, s => s.replace(/\s+/g, ' ').substring(0, 16) + "…" + hash(s.trim()));
  }
  static hashItem(hash) {
    return hash.startsWith("(") ? hash : `(${hash})`;
  }
  static urlItem(url) {
    let queryPos = url.indexOf("?");
    return queryPos === -1 ? url : url.substring(0, queryPos);
  }
  static siteItem(url) {
    if (url.endsWith("/*")) return url;
    try {
      return `${new URL(url).origin}/*`;
    } catch (e) {
      return `${url}/*`;
    }
  }

  async save() {
    this._saving = true;
    try {
      return await this.storage.save(this.key, this.items);
    } finally {
      this._saving = false;
    }
  }

  async load(values = undefined) {
    try {
      this.items = await this.storage.load(this.key, values);
    } catch (e) {
      console.error(e);
    }
    return this.items;
  }

  async store(...items) {
    let size = this.items.size;
    let changed = false;
    for (let item of items) {
      if (size !== this.items.add(item).size) {
        changed = true;
      }
    }
    return changed && await this.save();
  }

  async remove(...items) {
    let changed = false;
    for (let item of items) {
      if (this.items.delete(item)) {
        changed = true;
      }
    }
    return changed && await this.save();
  }

  contains(item) {
    return this.items.has(item);
  }
}

function hash(source){
	var shaObj = new jssha("SHA-256","TEXT")
	shaObj.update(source);
	return shaObj.getHash("HEX");
}

if (typeof module === "object") {
  module.exports = { ListStore, Storage, hash };
  var jssha = require('jssha');
}
