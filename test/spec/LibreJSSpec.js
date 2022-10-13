/*
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
*
* Copyright (C) 2018 Giorgio Maone <giorgio@maone.net>
* Copyright (C) 2022 Yuchen Pei <id@ypei.org>
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

describe('LibreJS\' components', () => {
  const LibreJS = browser.extension.getBackgroundPage().LibreJS;
  const license = {
    id: 'GPL-3.0',
    url: 'http://www.gnu.org/licenses/gpl-3.0.html',
    magnet: 'magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt',
  };
  const unknownLicense = {
    id: 'Acme-proprietary-1.5',
    url: 'http://www.acme.com/license-1.5.html',
    magnet: 'magnet:?xt=urn:btih:2f739d935676111cfff4b4693e3816e664797050&dn=acme-1.5.txt'
  };

  const trivial = '1+1';
  const nontrivial = 'function nt() { document.documentElement.innerHTML=""; nt(); }';
  // code calling reserved object is nontrivial
  const nontrivialCall = 'eval();';
  // code calling anything else is trivial
  const trivialCall = 'foo();';
  const licensed = `// @license ${license.magnet} ${license.id}\n${nontrivial}\n// @license-end`;
  const unknownLicensed = `// @license ${unknownLicense.magnet} ${unknownLicense.id}\n${nontrivial}\n// @license-end`;
  const commentedOutUnknownLicensed =
    unknownLicensed.split('\n').map(y => '// ' + y).join('\n');
  const malformedLicensed = `// @license\n${nontrivial}`;
  const commentedOutMalformedLicensed =
    malformedLicensed.split('\n').map(y => '// ' + y).join('\n');
  let tab, documentUrl;
  const enableContactFinderTests = false;

  beforeAll(async () => {
    const url = browser.extension.getURL('/test/resources/index.html');
    tab = (await browser.tabs.query({ url }))[0] || (await browser.tabs.create({ url }));
    documentUrl = url;

  });

  describe('The whitelist/blacklist manager', () => {
    const { ListManager, ListStore, Storage } = LibreJS;
    const lm = new ListManager(new ListStore('_test.whitelist', Storage.CSV), new ListStore('_test.blacklist', Storage.CSV), new Set());
    const forgot = ['http://formerly.whitelist.ed/', 'http://formerly.blacklist.ed/'];

    beforeAll(async () => {
      await lm.whitelist('https://fsf.org/*', 'https://*.gnu.org/*', forgot[0]);
      await lm.blacklist('https://*.evil.gnu.org/*', 'https://verybad.com/*', forgot[1]);
    });

    it('Should handle basic CRUD operations', async () => {
      expect(lm.getStatus(forgot[0])).toBe('whitelisted');
      expect(lm.getStatus(forgot[1])).toBe('blacklisted');

      await lm.forget(...forgot);

      for (const url of forgot) {
        expect(lm.getStatus(url)).toBe('unknown');
      }
    });

    it('Should support full path wildcards', () => {
      expect(lm.getStatus('https://unknown.org')).toBe('unknown');
      expect(lm.getStatus('https://fsf.org/some/path')).toBe('whitelisted');
      expect(lm.getStatus('https://fsf.org/')).toBe('whitelisted');
      expect(lm.getStatus('https://fsf.org')).toBe('whitelisted');
      expect(lm.getStatus('https://subdomain.fsf.org')).toBe('unknown');
      expect(lm.getStatus('https://verybad.com/some/other/path?with=querystring')).toBe('blacklisted');
    });
    it('Should support subdomain wildcards', () => {
      expect(lm.getStatus('https://gnu.org')).toBe('whitelisted');
      expect(lm.getStatus('https://www.gnu.org')).toBe('whitelisted');
      expect(lm.getStatus('https://evil.gnu.org')).toBe('blacklisted');
      expect(lm.getStatus('https://more.evil.gnu.org')).toBe('blacklisted');
      expect(lm.getStatus('https://more.evil.gnu.org/some/evil/path?too')).toBe('blacklisted');
    });
  })

  describe('The external script source processor', () => {
    const url = 'https://www.gnu.org/mock-script.js';

    const processScript = async (source, whitelisted = false) =>
      await LibreJS.handleScript({
        text: source,
        request: { url, tabId: tab.id, documentUrl, frameId: 0 },
      }, whitelisted);

    it('should accept whitelisted scripts', async () => {
      expect(await processScript(nontrivial, true) || nontrivial).toContain(nontrivial);
    });

    it('should block trivial scripts too', async () => {
      const processed = await processScript(trivial);
      expect(processed || trivial).not.toContain(trivial);
    });

    it('should block non-trivial scripts', async () => {
      const processed = await processScript(nontrivial);
      expect(processed || nontrivial).not.toContain(nontrivial);
    });

    it('should accept scripts with known free license tags', async () => {
      const processed = await processScript(licensed);
      expect(processed || licensed).toContain(nontrivial);
    });

    it('should block scripts with unknown license tags', async () => {
      const processed = await processScript(unknownLicensed);
      expect(processed).not.toContain(nontrivial);
    });

    it('should leave alone scripts with commented out unknown license tags', async () => {
      const processed = await processScript(commentedOutUnknownLicensed);
      expect(processed).toContain(nontrivial);
    });

    it('should block scripts with malformed license tags', async () => {
      const processed = await processScript(malformedLicensed);
      expect(processed).not.toContain(nontrivial);
    });

    it('should leave alone scripts with commented out malformed license tags', async () => {
      const processed = await processScript(commentedOutMalformedLicensed);
      expect(processed).toContain(nontrivial);
    });
  });

  describe('The HTML processor', () => {
    const processHtml =
      async (html, whitelisted = false) =>
        LibreJS.editHtml(html, tab.url, tab.id, 0, whitelisted);

    const addScript = (html, script, before = '</head>') =>
      html.replace(before, `<script>${script}</script>${before}`);

    const addToBody = (html, fragment) => html.replace('</body>', `${fragment}</body>`);

    const jsUrl = js => `javascript:${encodeURIComponent(js)}`;

    function extractScripts(html, def = '') {
      const matches = html && html.match(/<script>[^]*?<\/script>/g);
      return matches && matches.join('') || def;
    }

    let html, nontrivialInHtml;
    beforeAll(async () => {
      html = (await browser.tabs.executeScript(tab.id, {
        runAt: 'document_start',
        code: 'document.documentElement.outerHTML'
      }))[0];
      nontrivialInHtml = addScript(html, nontrivial);
    });

    it('should not modify scriptless documents', async () => {
      expect(await processHtml(html)).toBeNull();
    });

    it('should not modify whitelisted documents', async () => {
      expect(await processHtml(nontrivialInHtml, true)).toBeNull();
    });

    it('should accept trivial scripts', async () => {
      expect(extractScripts(await processHtml(
        addScript(html, trivial)), trivial)).toContain(trivial);
      expect(extractScripts(await processHtml(
        addScript(html, trivialCall)), trivialCall)).toContain(trivialCall);
    });

    it('should block non-trivial scripts', async () => {
      expect(extractScripts(await processHtml(
        nontrivialInHtml), nontrivial)).not.toContain(nontrivial);
      expect(extractScripts(await processHtml(
        addScript(html, nontrivialCall)), nontrivialCall)).not.toContain(nontrivialCall);
    });

    it('should accept scripts with known free license tags', async () => {
      const licensedInHtml = addScript(html, licensed);
      const processed = await processHtml(licensedInHtml);
      expect(extractScripts(processed, licensed)).toContain(nontrivial);
    });

    it('should block scripts with unknown license tags', async () => {
      const unknownInHtml = addScript(html, unknownLicensed);
      const processed = await processHtml(unknownInHtml);
      expect(extractScripts(processed, nontrivial)).not.toContain(nontrivial);
    });

    it('should block scripts with malformed license tags', async () => {
      const malformedInHtml = addScript(html, malformedLicensed);
      const processed = await processHtml(malformedInHtml);
      expect(extractScripts(processed, nontrivial)).not.toContain(nontrivial);
    });

    it('should accept scripts on globally licensed pages', async () => {
      const globalLicense = `/* @licstart The following is the entire license notice
        for the JavaScript code in this page.
        -- Some free license --
        @licend The above is the entire license notice for the JavaScript code in this page. */`;

      const licensed = addScript(nontrivialInHtml, globalLicense, '<script>');
      const processed = await processHtml(html);
      expect(extractScripts(processed, licensed)).toContain(nontrivial);
    });

    it('should discriminate trivial, non-trivial and licensed mixed on the same page', async () => {
      let mixedPage = addScript(addScript(nontrivialInHtml, trivial), licensed);
      const processed = await processHtml(mixedPage);
      expect(processed).not.toBeNull();
      const scripts = extractScripts(processed, nontrivial);
      expect(scripts).toContain(trivial);
      expect(scripts).toContain(licensed);
      expect(scripts.replace(licensed, '')).not.toContain(nontrivial);
    });

    it('should correctly process (de)duplicated inline scripts', async () => {
      const trivialAsUrl = jsUrl(trivial);
      const nontrivialAsUrl = jsUrl(nontrivial);
      const a = (url, label) => `<a href="${url}">${label}</a>`;
      let mixedPage = '<body></body>';
      for (let dup = 0; dup < 3; dup++) {
        mixedPage = addToBody(mixedPage, a(trivialAsUrl, `Trivial #${dup}`));
        mixedPage = addToBody(mixedPage, a(nontrivialAsUrl, `Nontrivial #${dup}`));
      }
      const processed = await processHtml(mixedPage);
      expect(processed).not.toBeNull();
      expect(processed).toContain(trivialAsUrl);
      expect(processed).not.toContain(nontrivialAsUrl);
    });

    it('should force displaying NOSCRIPT elements (except those with @data-librejs-nodisplay) where scripts have been blocked', async () => {
      const noscriptContent = 'I\'m NOSCRIPT content';
      const asNoscript = `<noscript>${noscriptContent}</noscript>`;
      const asNodisplay = `<noscript data-librejs-nodisplay>${noscriptContent}</noscript>`;
      const asSpan = `<span>${noscriptContent}</span>`;
      const page = addToBody(addToBody(nontrivialInHtml, asNoscript), asNodisplay);
      const processed = await processHtml(page);
      expect(processed).not.toContain(asNoscript);
      expect(processed).toContain(asSpan);
      expect(processed).not.toContain(asNodisplay);
    });

    it('should always force displaying @data-librejs-display elements', async () => {
      const content = 'I\'m FORCED content';
      const asDisplay = `<span data-librejs-display>${content}</span>`;
      const asSpan = `<span>${content}</span>`;
      for (let page of [nontrivialInHtml, '<body></body>']) {
        page = addToBody(page, asDisplay);
        const processed = await processHtml(page);
        expect(processed).not.toContain(asDisplay);
        expect(processed).not.toContain(asSpan);
      }
    });
  });

  describe('The external (Web Labels) license checker', () => {
    const { ExternalLicenses } = LibreJS;
    let check;

    beforeAll(async () => {
      const args = { tabId: tab.id, frameId: 0, documentUrl };
      const resolve = url => new URL(url, documentUrl).href;
      check = async url => await ExternalLicenses.check(Object.assign({ url: resolve(url) }, args));
      await browser.tabs.executeScript(tab.id, {
        file: '/content/externalLicenseChecker.js'
      });
    });

    it('should recognize free licenses', async () => {
      const scriptInfo = await check('jquery.js');
      console.debug(scriptInfo);
      expect(scriptInfo.free).toBeTruthy();
    });
    it('should accept scripts if any of multiple licenses is free', async () => {
      const scriptInfo = await check('app-trilicensed.js');
      console.debug(scriptInfo);
      expect(scriptInfo.free).toBeTruthy();
    });
    it('should block scripts declaring only proprietary license(s)', async () => {
      const scriptInfo = await check('proprietary.js');
      console.debug(scriptInfo);
      expect(scriptInfo.free).toBeFalsy();
    });
    it('should block scripts not declaring any license', async () => {
      const scriptInfo = await check('tracker.js');
      console.debug(scriptInfo);
      expect(scriptInfo).toBeNull();
    });
  });

  if (enableContactFinderTests) {
    describe('The contact finder', () => {
      it('should display the contact finder iframe', async (done) => {
        await browser.runtime.connect({ name: "port-from-cs" }).postMessage({ invoke_contact_finder: 1 });
        // Direct await / async does not work as executeScript does not wait
        // for the listener
        setTimeout(async () => {
          const frame = await browser.tabs.executeScript(tab.id, {
            code: 'document.getElementById("_LibreJS_frame").outerHTML'
          })
          expect(frame).toBeTruthy();
          done();
        }, 100);
      });
      it('should display the correct contact info in the contact finder iframe', async (done) => {
        await browser.runtime.connect({ name: "port-from-cs" }).postMessage({ invoke_contact_finder: 1 });
        // Direct await / async does not work as executeScript does not wait
        // for the listener
        setTimeout(async () => {
          const [frameBody] = await browser.tabs.executeScript(tab.id, {
            code: 'document.getElementById("_LibreJS_frame").contentWindow.document.body.innerHTML'
          });
          expect(frameBody).not.toContain('About Us');
          expect(frameBody).toContain('Contact Us');
          expect(frameBody).toContain('Website Feedback');
          expect(frameBody).toContain('lib@re.js');
          done();
        }, 200);
      });
    });
  }

  describe('The prefs', () => {
    it('should have the defaults', async () => {
      const defaults = await browser.storage.local.get(['pref_subject', 'pref_body']);
      expect(defaults).toEqual({
        pref_subject: 'Issues with Javascript on your website',
        pref_body: `Please consider using a free license for the Javascript on your website.

[Message generated by LibreJS. See https://www.gnu.org/software/librejs/ for more information]
`
      });
    });
  });

  afterAll(async () => {
    await browser.tabs.remove(tab.id);
    browser.tabs.update((await browser.tabs.getCurrent()).id, { active: true });
  });
});
