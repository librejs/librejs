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

var Storage = {
  ARRAY: {
    async load(key) {
      let array = (await browser.storage.local.get(key))[key];
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
  }
  
  async save() {
    return await this.storage.save(this.key, this.items);
  }
  
  async load() {
    return await this.storage.load(this.key);
  }

  async store(item) {
    let size = this.items.size;
    return (size !== this.items.add(item).size) && await this.save();
  }
  
  async remove(item) {
    return this.items.delete(item) && await this.save();
  }
}

module.exports = { ListStore, Storage };
