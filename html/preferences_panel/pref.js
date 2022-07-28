/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
*
* Copyright (C) 2017 Nathan Nichols
* Copyright (C) 2018 Giorgio maone
* Copyright (C) 2022 Yuchen Pei
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

(() => {
  "use strict";

  const LIST_NAMES = ["white", "black"];

  const Model = {
    lists: {},
    prefs: null,

    malformedUrl(url) {
      try {
        const objUrl = new URL(url);
        const newUrl = objUrl.href;
        if (!objUrl.protocol.startsWith("http")) {
          return "Please enter http:// or https:// URLs only";
        } else if (!/^[^*]+\*?$/.test(newUrl)) {
          return "Only one single trailing path wildcard (/*) allowed";
        }
      } catch (e) {
        if (/^https?:\/\/\*\./.test(url)) {
          return this.malformedUrl(url.replace("*.", ""));
        }
        const prefix = "Invalid URL";
        if (url && !url.includes("://"))
          return prefix + ": missing protocol, either http:// or https://";
        else if (url.endsWith("://"))
          return prefix + ": missing domain name";
        else
          return prefix;
      }
      return null;
    },

    async save(prefs = this.prefs) {
      if (prefs !== this.prefs) {
        this.prefs = Object.assign(this.prefs, prefs);
      }
      this.saving = true;
      try {
        return await browser.storage.local.set(prefs);
      } finally {
        this.saving = false;
      }
    },

    async addToList(list, ...items) {
      const other = list === Model.lists.black ? Model.lists.white : Model.lists.black;
      this.saving = true;
      try {
        await Promise.all([
          other.remove(...items),
          list.store(...items)
        ]);
      } finally {
        this.saving = false;
      }
    }
  };

  Model.loading = (async () => {
    const prefsNames = [
      "whitelist",
      "blacklist",
      "subject",
      "body"
    ];
    Model.prefs = await browser.storage.local.get(prefsNames.map(name => `pref_${name}`));

    for (const listName of LIST_NAMES) {
      const prefName = `pref_${listName}list`;
      await (Model.lists[listName] = new ListStore(prefName, Storage.CSV))
        .load(Model.prefs[prefName]);
    }
  })();

  const Controller = {
    init() {
      const widgetsRoot = this.root = document.getElementById("widgets");
      for (const widget of widgetsRoot.querySelectorAll('[id^="pref_"]')) {
        if (widget.id in Model.lists) {
          populateListUI(widget);
        } else if (widget.id in Model.prefs) {
          widget.value = Model.prefs[widget.id];
        }
      }

      this.populateListUI();
      this.syncAll();

      for (const ev in Listeners) {
        widgetsRoot.addEventListener(ev, Listeners[ev]);
      }
      document.getElementById("site").onfocus = e => {
        if (!e.target.value.trim()) {
          e.target.value = "https://";
        }
      };

      browser.storage.onChanged.addListener(changes => {
        if (!Model.saving &&
          ("pref_whitelist" in changes || "pref_blacklist" in changes)) {
          setTimeout(() => {
            this.populateListUI();
            this.syncAll();
          }, 10);
        }
      });
    },

    async addSite(list) {
      const url = document.getElementById("site").value.trim();

      if (url && !Model.malformedUrl(url)) {
        await this.addToList(list, url);
      }
    },
    async addToList(list, ...items) {
      await Model.addToList(list, ...items);
      this.populateListUI();
      this.syncAll();
    },
    async swapSelection(list) {
      const origin = list === Model.lists.black ? "white" : "black";
      await this.addToList(list, ...Array.prototype.map.call(
        document.querySelectorAll(`select#${origin} option:checked`),
        option => option.value)
      );
    },

    syncAll() {
      this.syncListsUI();
      this.syncSiteUI();
    },

    syncSiteUI() {
      const widget = document.getElementById("site");
      const list2button = listName => document.getElementById(`cmd-${listName}list-site`);

      for (const bi of LIST_NAMES.map(list2button)) {
        bi.disabled = true;
      }

      const url = widget.value.trim();
      const malformedUrl = url && Model.malformedUrl(url);
      widget.classList.toggle("error", !!malformedUrl);
      document.getElementById("site-error").textContent = malformedUrl || "";
      if (!url) return;
      if (url !== widget.value) {
        widget.value = url;
      }

      for (const listName of LIST_NAMES) {
        const list = Model.lists[listName];
        if (!list.contains(url)) {
          list2button(listName).disabled = false;
        }
      }
    },

    syncListsUI() {
      const total = ["black", "white"].reduce((cum, id) => {
        const selected = document.querySelectorAll(`select#${id} option:checked`).length;
        const other = id === "black" ? "white" : "black";
        document.getElementById(`cmd-${other}list`).disabled = selected === 0;
        return cum + selected;
      }, 0);
      document.getElementById("cmd-delete").disabled = total === 0;
    },

    async deleteSelection() {
      for (const id of ["black", "white"]) {
        const selection = document.querySelectorAll(`select#${id} option:checked`);
        await Model.lists[id].remove(...Array.prototype.map.call(selection, option => option.value));
      }
      this.populateListUI();
      this.syncAll();
    },

    populateListUI(widget) {
      if (!widget) {
        for (const id of ["white", "black"]) {
          this.populateListUI(document.getElementById(id));
        }
        return;
      }
      widget.innerHTML = "";
      const items = [...Model.lists[widget.id].items].sort();
      const options = new DocumentFragment();
      for (const item of items) {
        const option = document.createElement("option");
        option.value = option.textContent = option.title = item;
        options.appendChild(option);
      }
      widget.appendChild(options);
    }
  };

  const KeyEvents = {
    Delete(e) {
      if (e.target.matches("#lists select")) {
        Controller.deleteSelection();
      }
    },
    Enter(e) {
      if (e.target.id === "site") {
        e.target.parentElement.querySelector("button[default]").click();
      }
    },
    KeyA(e) {
      if (e.target.matches("select") && e.ctrlKey) {
        for (const o of e.target.options) {
          o.selected = true;
        }
        Controller.syncListsUI();
      }
    }
  }

  const Listeners = {
    async change(e) {
      const { target } = e;
      const { id } = target;

      if (id in Model.lists) {
        Controller.syncListsUI();
        const selection = target.querySelectorAll("option:checked");
        if (selection.length === 1) {
          document.getElementById("site").value = selection[0].value;
        }
        return;
      }
    },

    click(e) {
      const { target } = e;

      const match = /^cmd-(white|black|delete)(list-site)?/.exec(target.id);
      if (!match) return;
      e.preventDefault();
      const cmd = match[1];
      if (cmd === "delete") {
        Controller.deleteSelection();
        return;
      }
      const list = Model.lists[cmd];
      if (list) {
        Controller[match[2] ? "addSite" : "swapSelection"](list);
        return;
      }
    },

    keypress(e) {
      const { code } = e;
      if (code && typeof KeyEvents[code] === "function") {
        if (KeyEvents[code](e) === false) {
          e.preventDefault();
        }
        return;
      }
    },

    async input(e) {
      const { target } = e;
      const { id } = target;
      if (!id) return;

      if (id === "site") {
        Controller.syncSiteUI();
        const url = target.value;
        if (url) {
          const o = document.querySelector(`#lists select option[value="${url}"]`);
          if (o) {
            o.scrollIntoView();
            o.selected = true;
          }
        }
        return;
      }

      if (id.startsWith("pref_")) {
        await Model.save({ [id]: target.value });
        return;
      }
    }
  };

  window.addEventListener("DOMContentLoaded", async _ => {
    await Model.loading;
    Controller.init();
  });

})();
