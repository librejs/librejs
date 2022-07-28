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

'use strict';
const Test = (() => {
  const RUNNER_URL = browser.runtime.getURL('/test/SpecRunner.html');
  return {
    /*
      returns RUNNER_URL if it's a test-enabled build or an about:debugging
      temporary extension session, null otherwise
    */
    async getURL() {
      try {
        await fetch(RUNNER_URL);
        return RUNNER_URL;
      } catch (e) {
        return null;
      }
    },

    async getTab(activate = false) {
      const url = await this.getURL();
      const tab = url ? (await browser.tabs.query({ url }))[0] ||
        (await browser.tabs.create({ url }))
        : null;
      if (tab && activate) {
        await browser.tabs.update(tab.id, { active: true });
      }
      return tab;
    }
  };
})();
if (typeof module === 'object') {
  module.exports = Test;
}
