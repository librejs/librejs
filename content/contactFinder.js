/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2017 Nathan Nichols, Loic J. Duros, Nik Nyby
* Copyright (C) 2018 Giorgio Maone
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

// TO TEST THE CONTACT FINDER:
// - open the manifest.json
// - add a comma after the closing bracket of the key "background"
// - Copy and paste this after it:
/*
  "content_scripts": [{
      "matches": ["<all_urls>"],
      "js": ["/content/contactFinder.js"],
      "css": ["/content/contactFinder.css"]
    }]
*/
// Now, the contact finder will load on every page and you can test it where ever you want.


//*********************************************************************************************
function debug(format, ...args) {
  console.debug(`LibreJS - ${format}`, ...args);
}

debug("Injecting contact finder in %s", document.URL);

/**
 * contactSearchStrings
 * Contains arrays of strings classified by language
 * and by degree of certainty.
 */
const contactFrags = [
  // de
  {
    'certain': [
      '^[\\s]*Kontakt os[\\s]*$',
      '^[\\s]*Email Os[\\s]*$',
      '^[\\s]*Kontakt[\\s]*$'
    ],
    'probable': ['^[\\s]Kontakt', '^[\\s]*Email'],
    'uncertain': [
      '^[\\s]*Om Us',
      '^[\\s]*Om',
      'Hvem vi er'
    ]
  },
  // en
  {
    'certain': [
      '^[\\s]*Contact Us[\\s]*$',
      '^[\\s]*Email Us[\\s]*$',
      '^[\\s]*Contact[\\s]*$',
      '^[\\s]*Feedback[\\s]*$',
      '^[\\s]*Web.?site Feedback[\\s]*$'
    ],
    'probable': ['^[\\s]Contact', '^[\\s]*Email'],
    'uncertain': [
      '^[\\s]*About Us',
      '^[\\s]*About',
      'Who we are',
      'Who I am',
      'Company Info',
      'Customer Service'
    ]
  },
  // es
  {
    'certain': [
      '^[\\s]*contáctenos[\\s]*$',
      '^[\\s]*Email[\\s]*$'
    ],
    'probable': ['^[\\s]contáctenos', '^[\\s]*Email'],
    'uncertain': [
      'Acerca de nosotros'
    ]
  },
  // fr
  {
    'certain': [
      '^[\\s]*Contactez nous[\\s]*$',
      '^[\\s]*(Nous )?contacter[\\s]*$',
      '^[\\s]*Email[\\s]*$',
      '^[\\s]*Contact[\\s]*$',
      '^[\\s]*Commentaires[\\s]*$'
    ],
    'probable': ['^[\\s]Contact', '^[\\s]*Email'],
    'uncertain': [
      '^[\\s]*(A|À) propos',
      'Qui nous sommes',
      'Qui suis(-| )?je',
      'Info',
      'Service Client(e|è)le'
    ]
  }
];

// Taken from http://emailregex.com/
const emailRegex = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g);
//*********************************************************************************************

function findMatch(link, frag, first) {
  const strUnderTest = link.innerText + " " + link.href
  const result = (strUnderTest.match(new RegExp(frag, "g")) || []).filter(x => typeof x == "string");
  if (result.length) {
    if (first) {
      return { 'final': true, 'matched': true };
    } else {
      //console.log(link.href + " matched " + frag);
      return { 'final': false, 'matched': true };
    }
  }
  return { 'final': false, 'matched': false };
}

/**
*	Tests all links on the page for regexes under a certain certainty level.
*
*	Will return either the first regex match from the selected certainty level or all regexes that
*	match on that certainty level.
*
*	certaintyLvl can be "certain" > "probable" > "uncertain"
*/
function attempt(certaintyLvl, first = true) {
  // There needs to be some kind of max so that people can't troll by for example leaving a comment with a bunch of emails
  // to cause LibreJS users to slow down.
  const matches = [];
  const links = Array.from(document.links).filter(link => (typeof (link.innerText) === "string" || typeof (link.href) === "string"));
  for (const link of links) {
    for (const byLevel of contactFrags) {
      for (const frag of byLevel[certaintyLvl]) {
        const match = findMatch(link, frag, first);
        if (match.final) return { 'fail': false, 'result': [link] };
        match.matched && matches.push(link);
      }
    }
  }
  return { "fail": matches.length === 0, "result": matches };
}

/**
*	"LibreJS detects contact pages, email addresses that are likely to be owned by the
*	maintainer of the site, Twitter and identi.ca links, and phone numbers."
*/
function findContacts() {
  for (const type of ["certain", "probable", "uncertain"]) {
    const attempted = attempt(type);
    if (!attempted["fail"]) {
      return [type, attempted["result"]];
    }
  }
  return null;
}


function createWidget(id, tag, parent = document.body) {
  const oldWidget = document.getElementById(id);
  if (oldWidget) oldWidget.remove();
  const widget = parent.appendChild(document.createElement(tag));
  widget.id = id;
  return widget;
}

/**
*
*	Creates the contact finder / complain UI as a semi-transparent overlay
*
*/

function main() {
  const overlay = createWidget("_LibreJS_overlay", "div");
  const frame = createWidget("_LibreJS_frame", "iframe");

  const close = () => {
    frame.remove();
    overlay.remove();
  };

  const closeListener = e => {
    const t = e.currentTarget;
    if (t.href && t.href !== document.URL) { // link navigation
      if (t.href.includes("#")) {
        window.addEventListener("hashchange", close);
      }
      return;
    }
    close();
  };
  const makeCloser = clickable => clickable.addEventListener("click", closeListener);

  makeCloser(overlay);

  const initFrame = prefs => {
    debug("initFrame");
    const res = findContacts();
    const contentDoc = frame.contentWindow.document;
    const { body } = contentDoc;
    body.id = "_LibreJS_dialog";
    body.innerHTML = `<h1>LibreJS Complaint</h1><button class='close'>x</button>`;
    contentDoc.documentElement.appendChild(contentDoc.createElement("base")).target = "_top";
    const content = body.appendChild(contentDoc.createElement("div"));
    content.id = "content";
    // TODO: fix warning
    const addHTML = s => content.insertAdjacentHTML("beforeend", s);
    if (!res) {
      content.classList.toggle("_LibreJS_fail", true)
      addHTML("<div>Could not guess any contact page for this site.</div>");
    } else {
      addHTML("<h3>Contact info guessed for this site</h3>");
      for (const link of res[1]) {
        const a = contentDoc.createElement("a");
        a.href = link.href;
        a.textContent = link.textContent;
        content.appendChild(a);
      }
    }

    const emails = (document.documentElement.textContent.match(emailRegex) || []).filter(e => !!e);
    if (emails.length) {
      addHTML("<h5>Possible email addresses:</h5>");
      const list = contentDoc.createElement("ul");
      for (const recipient of emails.slice(0, 10)) {
        const a = contentDoc.createElement("a");
        // TODO: fix prefs
        a.href = `mailto:${recipient}?subject=${encodeURIComponent(prefs["pref_subject"])
          }&body=${encodeURIComponent(prefs["pref_body"])
          }`;
        a.textContent = recipient;
        list.appendChild(contentDoc.createElement("li")).appendChild(a);
      }
      content.appendChild(list);
    }
    contentDoc.querySelectorAll(".close, a").forEach(makeCloser);
    debug("frame initialized");
  }

  frame.addEventListener("load", _ => {
    debug("frame loaded");
    browser.runtime.connect({ name: "contact_finder" }).onMessage.addListener(initFrame);
  });
}

main();
