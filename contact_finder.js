// TO TEST THE CONTACT FINDER:
// - open the manifest.json
// - add a comma after the closing bracket of the key "background"
// - Copy and paste this after it:
/* 
	"content_scripts": [{"matches": ["<all_urls>"],"js": ["contact_finder.js"]}]
*/
// Now, the contact finder will load on every page and you can test it where ever you want.


//*********************************************************************************************
//Regexes taken from "contact_regex.js" in the current LibreJS
//Copyright (C) 2011, 2012, 2014 Loic J. Duros
//Copyright (C) 2014, 2015 Nik Nyby

console.log("contact_finder.js");

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
*
*	Creates a transparent floating button from a name string and a callback
*
*
*/
function new_debug_button(name_text,callback){
	if(document.getElementById("abc123_main_div") !== null){
		document.getElementById("abc123_main_div").remove();
	}
	console.log("adding button");
	if(document.getElementById("abc123_main_div") === null){
		var to_insert = '<div style="opacity: 0.5; font-size: small; z-index: 2147483647; position: fixed; right: 1%; top: 4%;" id="abc123_main_div"></div>';
		document.body.insertAdjacentHTML('afterbegin', to_insert);
	}
	var button_html = '<input id="abc123_button_complain" value="' + name_text +'" type="button"></input><br>';
	document.getElementById("abc123_main_div").insertAdjacentHTML('afterbegin', button_html);	document.getElementById("abc123_button_complain").addEventListener("click",callback);

}
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
// need to have this so the handler doesn't take too long
function handler(){
	var res = find_contacts();
	if(document.getElementById("librejs_contactfinder") != null){
		document.getElementById("librejs_contactfinder").remove();
	}
	var to_insert;
	if("fail" in res){
		to_insert = '<div style="font-size: small; z-index: 2147483647; background-color: #eeeeee;'+
						'position: fixed; display:inline-block; border: 3px solid #990000; width: 50%;"'+
						' id="librejs_contactfinder">'+
						"Contact finder failed.";
	} else{
		if(typeof(res[1]) == "string"){
			to_insert = '<div style="font-size: small; z-index: 2147483647; background-color: #eeeeee;'+
							'position: fixed; display:inline-block; border: 3px solid #990000; width: 50%;"'+
							' id="librejs_contactfinder"><b>Result:</b><br>'+
							res[0] + ": " + '<a href="' + res[1] + '>'+res[1]+'</a>';
		}
		if(typeof(res[1]) == "object"){
			to_insert = '<div style="font-size: small; z-index: 2147483647; background-color: #eeeeee;'+
							'position: fixed; display:inline-block; border: 3px solid #990000; width: 50%;"'+
							' id="librejs_contactfinder"><b>Result:</b><br>'+
							res[0]+": "+res[1].outerHTML;

		}
	}

	var email = document.documentElement.innerText.match(email_regex);
	if(email != null){
		var max_i = 0;
		if(email.length >= 10){
			max_i = 10;
		} else{
			max_i = email.length;
		}
		for(var i = 0; i < max_i; i++){
			var mailto = "mailto:"+email[i]+"?subject="+encodeURI(prefs["pref_subject"])+"&body="+encodeURI(prefs["pref_body"]);
			to_insert += '<br>' + 'Possible email: <a href="' + mailto + '">'+email[i]+'</a>';
		}
	}

	to_insert += '</div>';

	setTimeout(function(){document.getElementById("librejs_contactfinder").remove()}, 7500);
	document.body.insertAdjacentHTML("afterbegin",to_insert);
	return 0;

}

function main(){
	new_debug_button("Complain to website",handler);
}

// See main_background.js
var webex;
var myPort;
function set_webex(){
	if(typeof(browser) == "object"){
		webex = browser;
	}
	if(typeof(chrome) == "object"){
		webex = chrome;
	}
}
set_webex();
var myPort = webex.runtime.connect({name:"contact_finder"});

myPort.onMessage.addListener(function(m) {
	prefs = m;
	main();
});
























