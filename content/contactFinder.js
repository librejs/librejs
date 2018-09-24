/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2017 Nathan Nichols, Loic J. Duros, Nik Nyby
* Copyright (C) 2018 Giorgio Maone
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
//Regexes taken from "contact_regex.js" in the current LibreJS
//Copyright (C) 2011, 2012, 2014 Loic J. Duros
//Copyright (C) 2014, 2015 Nik Nyby

function debug(format, ...args) {
  console.debug(`LibreJS - ${format}`, ...args);
}

var myPort;

debug("Injecting contact finder in %s", document.URL);

// email address regexp
var reEmail = /^mailto\:(admin|feedback|webmaster|info|contact|support|comments|team|help)\@[a-z0-9.\-]+\.[a-z]{2,4}$/i;

var reAnyEmail = /^mailto\:.*?\@[a-z0-9\.\-]+\.[a-z]{2,4}$/i;

// twitter address regexp
var reTwitter = /twitter\.com\/(\!?#\/)?[a-z0-9]*/i;

// identi.ca address regexp
var reIdentiCa = /identi\.ca\/(?!notice\/)[a-z0-9]*/i;

/**
 * contactSearchStrings
 * Contains arrays of strings classified by language
 * and by degree of certainty.
 */
var contactStr = {
    'da': {
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
    'en': {
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
    'es': {
        'certain': [
            '^[\\s]*contáctenos[\\s]*$',
            '^[\\s]*Email[\\s]*$'
        ],
        'probable': ['^[\\s]contáctenos', '^[\\s]*Email'],
        'uncertain': [
            'Acerca de nosotros'
        ]
    },
    'fr': {
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
};

var usaPhoneNumber = new RegExp(/(?:\+ ?1 ?)?\(?[2-9]{1}[0-9]{2}\)?(?:\-|\.| )?[0-9]{3}(?:\-|\.| )[0-9]{4}(?:[^0-9])/mg);
// Taken from http://emailregex.com/
var email_regex = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g);
//*********************************************************************************************

var prefs;

/**
*	returns input with all elements not of type string removed
*/
function remove_not_str(a){
	var new_a = [];
	for(var i in a){
		if(typeof(a[i]) == "string"){
			new_a.push(a[i])
		}
	}
	return new_a;
}
/**
*	Tests all links on the page for regexes under a certain certainty level.
*
*	Will return either the first regex match from the selected certainty level or all regexes that
*	match on that certainty level.
*
*	certainty_lvl can be "certain" > "probable" > "uncertain"
*/
function attempt(certainty_lvl, first=true){
	// There needs to be some kind of max so that people can't troll by for example leaving a comment with a bunch of emails
	// to cause LibreJS users to slow down.
	var fail_flag = true;
	var flag;
	var matches = [];
	var result = [];
	var str_under_test = "";
	for(var i in document.links){
		if( typeof(document.links[i].innerText) != "string" || typeof(document.links[i].href) != "string"){
			continue;
		}
		str_under_test = document.links[i].innerText + " " + document.links[i].href;
		flag = true;
		for(var j in contactStr){
			for(var k in contactStr[j][certainty_lvl]){
				if(flag){
					result = [];
					result = str_under_test.match(new RegExp(contactStr[j][certainty_lvl][k],"g"));
					result = remove_not_str(result);
					if(result !== undefined && typeof(result[0]) == "string" ){
						if(first){
							return {"fail":false,"result":document.links[i]};
						} else{
							//console.log(document.links[i].href + " matched " + contactStr[j][certainty_lvl][k]);
							matches.push(document.links[i]);
							fail_flag = false;
							flag = false;
						}
					}
				}
			}
		}
	}
	return {"fail":fail_flag,"result":matches};
}

/**
*	"LibreJS detects contact pages, email addresses that are likely to be owned by the
*	maintainer of the site, Twitter and identi.ca links, and phone numbers."
*/
function find_contacts(){
	var all = document.documentElement.innerText;
	var phone_num = [];
	var twitlinks = [];
	var identi = [];
	var contact_pages = [];
	var res = attempt("certain");
	var flag = true;
	var type = "";
	if(res["fail"] == false){
		type = "certain";
		res = res["result"];
		flag = false;
	}
	if(flag){
		res = attempt("probable");
		if(res["fail"] == false){
			type = "probable";
			res = res["result"];
			flag = false;
		}
	}
	if(flag){
		res = attempt("uncertain");
		if(res["fail"] == false){
			type = "uncertain";
			res = res["result"];
			flag = false;
		}
	}
	if(flag){
		return res;
	}
	return [type,res];
}


function createWidget(id, tag, parent = document.body) {
  let widget = document.getElementById(id);
  if (widget)  widget.remove();
  widget = parent.appendChild(document.createElement(tag));
  widget.id = id;
  return widget;
}

/**
*
*	Creates the contact finder / complain UI as a semi-transparent overlay
*
*/

function main() {
  let overlay = createWidget("_LibreJS_overlay", "div");
  let frame = createWidget("_LibreJS_frame", "iframe");

  let close = () => {
    frame.remove();
    overlay.remove();
  };

  let closeListener = e => {
    let t = e.currentTarget;
    if (t.href) { // link navigation
      if (t.href !== document.URL) {
        if (t.href.includes("#")) {
          window.addEventListener("hashchange", close);
        }
        return;
      }
    }
    close();
  };
  let makeCloser = clickable => clickable.addEventListener("click", closeListener);

  makeCloser(overlay);

  let initFrame = () => {
    debug("initFrame");
    let res = find_contacts();
    let contentDoc = frame.contentWindow.document;
    let {body} = contentDoc;
    body.id = "_LibreJS_dialog";
    body.innerHTML = `<h1>LibreJS Complaint</h1><button class='close'>x</button>`;
    contentDoc.documentElement.appendChild(contentDoc.createElement("base")).target = "_top";
    let content = body.appendChild(contentDoc.createElement("div"));
    content.id = "content";
    let addHTML = s => content.insertAdjacentHTML("beforeend", s);
    if ("fail" in res) {
      content.classList.toggle("_LibreJS_fail", true)
  		addHTML("<div>Could not guess any contact page for this site.</div>");
  	} else {
      addHTML("<h3>Contact info guessed for this site</h3>");
  		if(typeof(res[1]) === "string") {
        let a = contentDoc.createElement("a");
        a.href = a.textContent = res[1];
        content.appendChild(a);
  		} else if (typeof(res[1]) === "object"){
  			 addHTML(`${res[0]}: ${res[1].outerHTML}`);
  		}
  	}

  	let emails = document.documentElement.textContent.match(email_regex);
  	if (emails  && (emails = Array.filter(emails, e => !!e)).length) {
      addHTML("<h5>Possible email addresses:</h5>");
      let list = contentDoc.createElement("ul");
  		for (let i = 0, max = Math.min(emails.length, 10); i < max; i++) {
        let recipient = emails[i];
        let a = contentDoc.createElement("a");
        a.href = `mailto:${recipient}?subject${
            encodeURIComponent(prefs["pref_subject"])
          }&body=${
            encodeURIComponent(prefs["pref_body"])
          }`;
        a.textContent = recipient;
        list.appendChild(contentDoc.createElement("li")).appendChild(a);
  		}
      content.appendChild(list);
  	}
    Array.forEach(contentDoc.querySelectorAll(".close, a"), makeCloser);
    debug("frame initialized");
  }



  frame.addEventListener("load", e => {
    debug("frame loaded");
    myPort = browser.runtime.connect({name: "contact_finder"}).onMessage.addListener(m => {
    	prefs = m;
    	initFrame();
    });
  });
}

main();
