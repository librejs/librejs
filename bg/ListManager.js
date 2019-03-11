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

/*
  A class to manage whitelist/blacklist operations
*/

let {ListStore} = require("../common/Storage");

class ListManager {
  constructor(whitelist, blacklist, builtInHashes) {
    this.lists = {whitelist, blacklist};
    this.builtInHashes = new Set(builtInHashes);
  }

  static async move(fromList, toList, ...keys) {
    await Promise.all([fromList.remove(...keys), toList.store(...keys)]);
  }

  async whitelist(...keys) {
    ListManager.move(this.lists.blacklist, this.lists.whitelist, ...keys);
  }
  async blacklist(...keys) {
    ListManager.move(this.lists.whitelist, this.lists.blacklist, ...keys);
  }
  async forget(...keys) {
    await Promise.all(Object.values(this.lists).map(l => l.remove(...keys)));
  }
  /* key is a string representing either a URL or an optional path
    with a trailing (hash).
    Returns "blacklisted", "whitelisted" or defValue
  */
  getStatus(key, defValue = "unknown") {
    let {blacklist, whitelist} = this.lists;
    let inline = ListStore.inlineItem(key);
    if (inline) {
      return blacklist.contains(inline)
        ? "blacklisted"
        : whitelist.contains(inline) ? "whitelisted"
        : defValue;
    }

    let match = key.match(/\(([^)]+)\)(?=[^()]*$)/);
    if (!match) {
      let url = ListStore.urlItem(key);
      let site = ListStore.siteItem(key);
      return (blacklist.contains(url) || blacklist.contains(site))
        ? "blacklisted"
        : whitelist.contains(url) || whitelist.contains(site)
        ? "whitelisted" : defValue;
    }

  	let [hashItem, srcHash] = match; // (hash), hash
  	return blacklist.contains(hashItem) ? "blacklisted"
  			: this.builtInHashes.has(srcHash) || whitelist.contains(hashItem)
        ? "whitelisted"
  			: defValue;
  	}
}

module.exports = { ListManager };
