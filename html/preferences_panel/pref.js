/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
*
* Copyright (C) 2017 Nathan Nichols
* Copyright (C) 2018 Giorgio maone
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

	var Model = {
		lists: {},
		prefs: null,

		malformedUrl(url) {
			let error = null;
			try {
				let objUrl = new URL(url);
				url = objUrl.href;
				if (!objUrl.protocol.startsWith("http")) {
					error = "Please enter http:// or https:// URLs only";
				} else if (!/^[^*]+\*?$/.test(url)) {
					error = "Only one single trailing path wildcard (/*) allowed";
				}
			} catch (e) {
				if (/^https?:\/\/\*\./.test(url)) {
					return this.malformedUrl(url.replace("*.", ""));
				}
				error = "Invalid URL";
				if (url && !url.includes("://")) error += ": missing protocol, either http:// or https://";
				else if (url.endsWith("://")) error += ": missing domain name";
			}
			return error;
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
			let other = list === Model.lists.black ? Model.lists.white : Model.lists.black;
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
		let prefsNames =  [
			"whitelist",
			"blacklist",
			"subject",
			"body"
		];
		Model.prefs = await browser.storage.local.get(prefsNames.map(name => `pref_${name}`));

		for (let listName of LIST_NAMES) {
			let prefName = `pref_${listName}list`;
			await (Model.lists[listName] = new ListStore(prefName, Storage.CSV))
				.load(Model.prefs[prefName]);
		}
	})();

	var Controller = {
		init() {
			let widgetsRoot = this.root = document.getElementById("widgets");
			for (let widget of widgetsRoot.querySelectorAll('[id^="pref_"]')) {
				if (widget.id in Model.lists) {
					populateListUI(widget);
				} else if (widget.id in Model.prefs) {
					widget.value = Model.prefs[widget.id];
				}
			}

			this.populateListUI();
			this.syncAll();

			for (let ev in Listeners) {
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
			let url = document.getElementById("site").value.trim();

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
			let origin = list === Model.lists.black ? "white" : "black";
		  await this.addToList(list, ...Array.map(
				document.querySelectorAll(`select#${origin} option:checked`),
				option => option.value)
			);
		},

		syncAll() {
			this.syncListsUI();
			this.syncSiteUI();
		},

		syncSiteUI() {
			let widget = document.getElementById("site");
			let list2button = listName => document.getElementById(`cmd-${listName}list-site`);

			for (let bi of LIST_NAMES.map(list2button)) {
				bi.disabled = true;
			}

			let url = widget.value.trim();
			let malformedUrl = url && Model.malformedUrl(url);
			widget.classList.toggle("error", !!malformedUrl);
			document.getElementById("site-error").textContent = malformedUrl || "";
			if (!url) return;
			if (url !== widget.value) {
				widget.value = url;
			}

			for (let listName of LIST_NAMES) {
				let list = Model.lists[listName];
				if (!list.contains(url)) {
					list2button(listName).disabled = false;
				}
			}
		},

		syncListsUI() {
			let	total = 0;
			for (let id of ["black", "white"]) {
				let selected = document.querySelectorAll(`select#${id} option:checked`).length;
				let other = id === "black" ? "white" : "black";
				document.getElementById(`cmd-${other}list`).disabled = selected === 0;
				total += selected;
			}
			document.getElementById("cmd-delete").disabled = total === 0;
		},

		async deleteSelection() {
			for (let id of ["black", "white"]) {
				let selection = document.querySelectorAll(`select#${id} option:checked`);
				await Model.lists[id].remove(...Array.map(selection, option => option.value));
			}
			this.populateListUI();
			this.syncAll();
		},

		populateListUI(widget) {
			if (!widget) {
				for(let id of ["white", "black"]) {
					this.populateListUI(document.getElementById(id));
				}
				return;
			}
			widget.innerHTML = "";
			let items = [...Model.lists[widget.id].items].sort();
			let options = new DocumentFragment();
			for (let item of items) {
				let option = document.createElement("option");
				option.value = option.textContent = option.title = item;
				options.appendChild(option);
			}
			widget.appendChild(options);
		}
	};

	var KeyEvents = {
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
				for (let o of e.target.options) {
					o.selected = true;
				}
				Controller.syncListsUI();
			}
		}
	}

	var Listeners = {
		async change(e) {
			let {target} = e;
			let {id} = target;

			if (id in Model.lists) {
				Controller.syncListsUI();
				let selection = target.querySelectorAll("option:checked");
				if (selection.length === 1) {
					document.getElementById("site").value = selection[0].value;
				}
				return;
			}
		},

		click(e) {
			let {target} = e;

			if (!/^cmd-(white|black|delete)(list-site)?/.test(target.id)) return;
			e.preventDefault();
			let cmd = RegExp.$1;
			if (cmd === "delete") {
				Controller.deleteSelection();
				return;
			}
			let list = Model.lists[cmd];
			if (list) {
				Controller[RegExp.$2 ? "addSite" : "swapSelection"](list);
				return;
			}
		},

		keypress(e) {
			let {code} = e;
			if (code && typeof KeyEvents[code] === "function") {
				if (KeyEvents[code](e) === false) {
					e.preventDefault();
				}
				return;
			}
		},

		async input(e) {
			let {target} = e;
			let {id} = target;
			if (!id) return;

			if (id === "site") {
				Controller.syncSiteUI();
				let url = target.value;
				if (url) {
					let o = document.querySelector(`#lists select option[value="${url}"]`);
					if (o)	{
						o.scrollIntoView();
						o.selected = true;
					}
				}
				return;
			}

			if (id.startsWith("pref_")) {
				await Model.save({[id]: target.value});
				return;
			}
		}
	};

	window.addEventListener("DOMContentLoaded", async e => {
		await Model.loading;
		Controller.init();
	});

})();
