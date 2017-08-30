console.debug("main_background.js");

/**
*	This file is the "skeleton" of the final system to determine
*	if a script is accepted or blocked.
*
*	Some assets taken from script_detector.js
*
*/

// the list of all available event attributes
var intrinsicEvents = [
    "onload",
    "onunload",
    "onclick",
    "ondblclick",
    "onmousedown",
    "onmouseup",
    "onmouseover",
    "onmousemove",
    "onmouseout",
    "onfocus",
    "onblur",
    "onkeypress",
    "onkeydown",
    "onkeyup",
    "onsubmit",
    "onreset",
    "onselect",
    "onchange"
];
/*
	NONTRIVIAL THINGS:
	- Fetch
	- XMLhttpRequest
	- eval()
	- ?
	JAVASCRIPT CAN BE FOUND IN:
	- Event handlers (onclick, onload, onsubmit, etc.)
	- <script>JS</script>
	- <script src="/JS.js"></script>
	WAYS TO DETERMINE PASS/FAIL:
	- "// @license [magnet link] [identifier]" then "// @license-end" (may also use /* comments)
	- Automatic whitelist: (http://bzr.savannah.gnu.org/lh/librejs/dev/annotate/head:/data/script_libraries/script-libraries.json_
	- <table id="jslicense-labels1"><table> which may be linked to by a link tag identified by rel="jslicense" or data-jslicense="1"
	- In the first script tag, declare the license with @licstart/@licend
*/

var licenses = {
	'Apache-2.0':{
		'URL': 'http://www.apache.org/licenses/LICENSE-2.0',
		'Magnet link': 'magnet:?xt=urn:btih:8e4f440f4c65981c5bf93c76d35135ba5064d8b7&dn=apache-2.0.txt'
	},
	// No identifier was present in documentation
	'Artistic-2.0':{
		'URL': 'http://www.perlfoundation.org/artistic_license_2_0',
		'Magnet link': 'magnet:?xt=urn:btih:54fd2283f9dbdf29466d2df1a98bf8f65cafe314&dn=artistic-2.0.txt'
	},
	// No identifier was present in documentation
	'Boost':{
		'URL': 'http://www.boost.org/LICENSE_1_0.txt',
		'Magnet link': 'magnet:?xt=urn:btih:89a97c535628232f2f3888c2b7b8ffd4c078cec0&dn=Boost-1.0.txt'
	},
	// No identifier was present in documentation
	'BSD-3-Clause':{
		'URL': 'http://opensource.org/licenses/BSD-3-Clause',
		'Magnet link': 'magnet:?xt=urn:btih:c80d50af7d3db9be66a4d0a86db0286e4fd33292&dn=bsd-3-clause.txt',
	},
	'CPAL-1.0':{
		'URL': 'http://opensource.org/licenses/cpal_1.0',
		'Magnet link': 'magnet:?xt=urn:btih:84143bc45939fc8fa42921d619a95462c2031c5c&dn=cpal-1.0.txt'
	},
	'CC0-1.0':{
		'URL': 'http://creativecommons.org/publicdomain/zero/1.0/legalcode',
		'Magnet link': 'magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt'
	},
	'EPL-1.0':{
		'URL': 'http://www.eclipse.org/legal/epl-v10.html',
		'Magnet link': 'magnet:?xt=urn:btih:4c6a2ad0018cd461e9b0fc44e1b340d2c1828b22&dn=epl-1.0.txt'
	},
	'Expat':{
		'URL': 'http://www.jclark.com/xml/copying.txt',
		'Magnet link': 'magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt'
	},
	'FreeBSD':{
		'URL': 'http://www.freebsd.org/copyright/freebsd-license.html',
		'Magnet link': 'magnet:?xt=urn:btih:87f119ba0b429ba17a44b4bffcab33165ebdacc0&dn=freebsd.txt'
	},
	'GPL-2.0':{
		'URL': 'http://www.gnu.org/licenses/gpl-2.0.html',
		'Magnet link': 'magnet:?xt=urn:btih:cf05388f2679ee054f2beb29a391d25f4e673ac3&dn=gpl-2.0.txt'
	},
	'GPL-3.0':{
		'URL': 'http://www.gnu.org/licenses/gpl-3.0.html',
		'Magnet link': 'magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt'
	},
	'LGPL-2.1':{
		'URL': 'http://www.gnu.org/licenses/lgpl-2.1.html',
		'Magnet link': 'magnet:?xt=urn:btih:5de60da917303dbfad4f93fb1b985ced5a89eac2&dn=lgpl-2.1.txt'
	},
	'LGPL-3.0':{
		'URL': 'http://www.gnu.org/licenses/lgpl-3.0.html',
		'Magnet link': 'magnet:?xt=urn:btih:0ef1b8170b3b615170ff270def6427c317705f85&dn=lgpl-3.0.txt'
	},
	'AGPL-3.0':{
		'URL': 'http://www.gnu.org/licenses/agpl-3.0.html',
		'Magnet link': 'magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt'
	},
	'ISC':{
		'URL': 'https://www.isc.org/downloads/software-support-policy/isc-license/',
		'Magnet link': 'magnet:?xt=urn:btih:b8999bbaf509c08d127678643c515b9ab0836bae&dn=ISC.txt'
	},
	'MPL-2.0':{
		'URL': 'http://www.mozilla.org/MPL/2.0',
		'Magnet link': 'magnet:?xt=urn:btih:3877d6d54b3accd4bc32f8a48bf32ebc0901502a&dn=mpl-2.0.txt'
	},
	// "Public domain is not a license"
	// Replace with CC0?
	'Public-Domain':{
		'URL': 'https://www.gnu.org/licenses/license-list.html#PublicDomain',
		'Magnet link': 'magnet:?xt=urn:btih:e95b018ef3580986a04669f1b5879592219e2a7a&dn=public-domain.txt'
	},
	'UPL-1.0': {
		'URL': 'https://oss.oracle.com/licenses/upl/',
		'Magnet link': 'magnet:?xt=urn:btih:478974f4d41c3fa84c4befba25f283527fad107d&dn=upl-1.0.txt'
	},
	'WTFPL': {
		'URL': 'http://www.wtfpl.net/txt/copying/',
		'Magnet link': 'magnet:?xt=urn:btih:723febf9f6185544f57f0660a41489c7d6b4931b&dn=wtfpl.txt'
	},
	'Unlicense':{
		'URL': 'http://unlicense.org/UNLICENSE',
		'Magnet link': 'magnet:?xt=urn:btih:5ac446d35272cc2e4e85e4325b146d0b7ca8f50c&dn=unlicense.txt'
	},
	// No identifier was present in documentation
	'X11':{
		'URL': 'http://www.xfree86.org/3.3.6/COPYRIGHT2.html#3',
		'Magnet link': 'magnet:?xt=urn:btih:5305d91886084f776adcf57509a648432709a7c7&dn=x11.txt'	
	},
	// Picked one of the two links that were there
	'Modified-BSD':{
		'URL': 'http://www.xfree86.org/current/LICENSE4.html',
		'Magnet link': 'magnet:?xt=urn:btih:12f2ec9e8de2a3b0002a33d518d6010cc8ab2ae9&dn=xfree86.txt'
	}
}

// Objects which could be used to do nontrivial things
// Bracket suffix notation could still be exploited to get some of these objects 
var reserved_objects = [
	"fetch",
	"XMLHttpRequest",
	"chrome", // only on chrome
	"browser", // only on firefox
	"eval"
];
/**
*	
*	Sets global variable "webex" to either "chrome" or "browser" for
*	use on Chrome or a Firefox variant.
*
*	Change this to support a new browser that isn't Chrome or Firefox,
*	given that it supports webExtensions.
*
*	(Use the variable "webex" for all API calls after calling this)
*/
var webex;
function set_webex(){
	if(typeof(browser) == "object"){
		webex = browser;
	}
	if(typeof(chrome) == "object"){
		webex = chrome;
	}
}

/*
*
*	Called when something changes the persistent data of the add-on.
*
*	The only things that should need to change this data are:
*	a) The "Whitelist this page" button
*	b) The options screen
*
*	When the actual blocking is implemented, this will need to comminicate
*	with its code to update accordingly
*
*/
function options_listener(changes, area){
	// The cache must be flushed when settings are changed
	// TODO: See if this can be minimized
	function flushed(){
		console.log("cache flushed");
	}	
	//var flushingCache = webex.webRequest.handlerBehaviorChanged(flushed);
	

	console.log("Items updated in area" + area +": ");

	var changedItems = Object.keys(changes);
	var changed_items = "";
	for (var i = 0; i < changedItems.length; i++){
		var item = changedItems[i];		
		changed_items += item + ",";
	}
	console.log(changed_items);

}
/**
*	Executes the "Display this report in new tab" function
*	by opening a new tab with whatever HTML is in the popup
*	at the moment.
*/
var active_connections = {};
var unused_data = {};
function open_popup_tab(data){
	console.log(data);
	function gotPopup(popupURL){
		var creating = webex.tabs.create({"url":popupURL},function(a){
			console.log("[TABID:"+a["id"]+"] creating unused data entry from parent window's content");
			unused_data[a["id"]] = data;
		});
	}

	var gettingPopup = webex.browserAction.getPopup({},gotPopup);
}


/**
*
*	Clears local storage (the persistent data)
*
*/
function debug_delete_local(){
	webex.storage.local.clear();
	console.log("Local storage cleared");
}

/**
*
*	Prints local storage (the persistent data) as well as the temporary popup object
*
*/
function debug_print_local(){
	function storage_got(items){
		console.log("%c Local storage: ", 'color: red;');
		for(var i in items){
			console.log("%c "+i+" = "+items[i], 'color: blue;');
		}
	}
	console.log("%c Variable 'unused_data': ", 'color: red;');
	console.log(unused_data);
	webex.storage.local.get(storage_got);
}

/**
*
*	This is what you call when a page gets changed to update the info box.
*
*	Sends a message to the content script that updates the popup for a page.
*
*	var example_blocked_info = {
*		"accepted": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"blocked": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"url": "example.com"
*	}
*
*	NOTE: This WILL break if you provide inconsistent URLs to it.
*	Make sure it will use the right URL when refering to a certain script.
*
*/
function update_popup(tab_id,blocked_info_arg,update=false){
	var new_blocked_data;

	var blocked_info = blocked_info_arg;

	if(blocked_info["whitelisted"] === undefined){
		blocked_info["whitelisted"] = [];
	}

	if(blocked_info["blacklisted"] === undefined){
		blocked_info["blacklisted"] = [];
	}
	if(blocked_info["accepted"] === undefined){
		blocked_info["accepted"] = [];
	}

	if(blocked_info["blocked"] === undefined){
		blocked_info["blocked"] = [];
	}
	function get_sto(items){
		//************************************************************************//
		// Move scripts that are accepted/blocked but whitelisted to "whitelisted" category
		// (Ideally, they just would not be tested in the first place because that would be faster)
		var url = blocked_info["url"];		
		if(url === undefined){
			console.error("No url passed to update_popup");
			return 1;
		}

		function get_status(script_name){
			var script_key = encodeURI(url)+" "+encodeURI(script_name);
			if(items[script_key] === undefined){
				return "none";
			}
			return items[script_key];
		}
		function is_bl(script_name){
			if(get_status(script_name) == "blacklist"){
				return true;			
			}
			return false;
		}
		function is_wl(script_name){
			if(get_status(script_name) == "whitelist"){
				return true;			
			}
			return false;
		}
		new_blocked_data = {
			"accepted":[],
			"blocked":[],
			"blacklisted":[],
			"whitelisted":[],
			"url": url
		};
		for(var type in blocked_info){
			for(var script_arr in blocked_info[type]){
				if(is_bl(blocked_info[type][script_arr][0])){
					new_blocked_data["blacklisted"].push(blocked_info[type][script_arr]);
					console.log("Script " + blocked_info[type][script_arr][0] + " is blacklisted");
					continue;
				}
				if(is_wl(blocked_info[type][script_arr][0])){
					new_blocked_data["whitelisted"].push(blocked_info[type][script_arr]);
					console.log("Script " + blocked_info[type][script_arr][0] + " is whitelisted");
					continue;
				}
				if(type == "url"){
					continue;
				}
				// either "blocked" or "accepted"
				new_blocked_data[type].push(blocked_info[type][script_arr]);
				console.log("Script " + blocked_info[type][script_arr][0] + " isn't whitelisted or blacklisted");			
			}
		}		
		console.log(new_blocked_data);
		//***********************************************************************************************//
		// store the blocked info until it is opened and needed
		if(update == false && active_connections[tab_id] === undefined){
			console.log("[TABID:"+tab_id+"]"+"Storing blocked_info for when the browser action is opened or asks for it.");
			unused_data[tab_id] = new_blocked_data; 
		} else{
			unused_data[tab_id] = new_blocked_data; 
			console.log("[TABID:"+tab_id+"]"+"Sending blocked_info directly to browser action");
			active_connections[tab_id].postMessage({"show_info":new_blocked_data});
			delete active_connections[tab_id];
		}
	}
	webex.storage.local.get(get_sto);
}


/**
*
*	This is the callback where the content scripts of the browser action will contact the background script.
*
*/
var portFromCS;
function connected(p) {
	p.onMessage.addListener(function(m) {
		/**
		*	Updates the entry of the current URL in storage
		*/
		function set_script(script,val){
			if(val != "whitelist" && val != "forget" && val != "blacklist"){
				console.error("Key must be either 'whitelist', 'blacklist' or 'forget'");
			}
			// (Remember that we do not trust the names of scripts.)
			var current_url = "";
			function geturl(tabs) {
				current_url = tabs[0]["url"];

				// The space char is a valid delimiter because encodeURI() replaces it with %20 
				var scriptkey = encodeURI(current_url)+" "+encodeURI(script);
				if(val == "forget"){
					var prom = webex.storage.local.remove(scriptkey);
					// TODO: This should produce a "Refresh the page for this change to take effect" message
				} else{
					var newitem = {};
					newitem[scriptkey] = val;
					webex.storage.local.set(newitem);			
				}
			}
			var querying = webex.tabs.query({active: true,currentWindow: true},geturl);			
			return;
		}
		var update = false;
		var contact_finder = false;
		if(m["whitelist"] !== undefined){
			set_script(m["whitelist"][0],"whitelist");
			update = true;
		}
		if(m["blacklist"] !== undefined){
			set_script(m["blacklist"][0],"blacklist");
			update = true;		
		}
		if(m["forget"] !== undefined){
			set_script(m["forget"][0],"forget");
			update = true;		
		}
		// 
		if(m["open_popup_tab"] !== undefined){
			open_popup_tab(m["open_popup_tab"]);
		}
		// a debug feature
		if(m["printlocalstorage"] !== undefined){
			debug_print_local();
		}
		// invoke_contact_finder
		if(m["invoke_contact_finder"] !== undefined){
			contact_finder = true;
			inject_contact_finder();
		}
		// a debug feature (maybe give the user an option to do this?)
		if(m["deletelocalstorage"] !== undefined){
			debug_delete_local();
		}

		function logTabs(tabs) {
			if(contact_finder){
				console.log("[TABID:"+tab_id+"] Injecting contact finder");
				inject_contact_finder(tabs[0]["id"]);
			}
			if(update){
				console.log("%c updating tab "+tabs[0]["id"],"color: red;");
				update_popup(tabs[0]["id"],unused_data[tabs[0]["id"]],true);
				active_connections[tabs[0]["id"]] = p;
			}
			for(var i = 0; i < tabs.length; i++) {
				var tab = tabs[i];
				var tab_id = tab["id"];
				if(unused_data[tab_id] !== undefined){
					// If we have some data stored here for this tabID, send it
					console.log("[TABID:"+tab_id+"]"+"Sending stored data associated with browser action");								
					p.postMessage({"show_info":unused_data[tab_id]});
				} else{
					// create a new entry
					unused_data[tab_id] = {"url":tab["url"],"blocked":"","accepted":""};
					p.postMessage({"show_info":unused_data[tab_id]});							
					console.log("[TABID:"+tab_id+"]"+"No data found, creating a new entry for this window.");	
				}
			}
		}
		var querying = webex.tabs.query({active: true,currentWindow: true},logTabs);
		
	});
}

/**
*	The callback for tab closings.
*
*	Delete the info we are storing about this tab if there is any.
*
*/
function delete_removed_tab_info(tab_id, remove_info){
	console.log("[TABID:"+tab_id+"]"+"Deleting stored info about closed tab");
	if(unused_data[tab_id] !== undefined){
		delete unused_data[tab_id];
	}
	if(active_connections[tab_id] !== undefined){
		delete active_connections[tab_id];
	}
}

/**
*	Makes it so we can return redirect requests to local blob URLs 
*
*	TODO: Make it so that it adds the website itself to the permissions of all keys
*
*/
function change_csp(e) {
	var index = 0;
	var csp_header = "";
	for(var i = 0; i < e["responseHeaders"].length; i++){
		if(e["responseHeaders"][i]["name"].toLowerCase() == "content-security-policy"){		
			csp_header = e["responseHeaders"][i]["value"];
			index = i;
			var keywords = csp_header.replace(/;/g,'","');
			keywords = JSON.parse('["' + keywords.substr(0,keywords.length) + '"]');
			// Iterates over the keywords inside the CSP header
			for(var j = 0; j < keywords.length; j++){
				var matchres = keywords[j].match(/[\-\w]+/g);
				if(matchres != null && matchres[0] == "script-src"){
					// Test to see if they have a hash and then delete it
					// TODO: Make sure this is a good idea.
					keywords[j] = keywords[j].replace(/\s?'sha256-[\w+/]+=+'/g,"");
					keywords[j] = keywords[j].replace(/\s?'sha384-[\w+/]+=+'/g,"");
					keywords[j] = keywords[j].replace(/\s?'sha512-[\w+/]+=+'/g,"");
					keywords[j] = keywords[j].replace(/'strict-dynamic'/g,"");
					keywords[j] = keywords[j].replace(/;/g,"");
					// This is the string that we add to every CSP
					keywords[j] += " data: blob: 'report-sample'";	
					console.log("%c new script-src section:","color:green;")					
					console.log(keywords[j]+ "; ");			
				}
			}
			var csp_header = "";
			for(var j = 0; j < keywords.length; j++){
				csp_header = csp_header + keywords[j] + "; ";
			}
			e["responseHeaders"][i]["value"] = csp_header;
		} 
	}
	if(csp_header == ""){
		//console.log("%c no CSP.","color: red;");
	}else{
		//console.log("%c new CSP:","color: green;");
		//console.log(e["responseHeaders"][index]["value"]);	
	}
	return {responseHeaders: e.responseHeaders};
}

/*
*
*	XMLHttpRequests the content of a script so we can modify it
*	before turning it to a blob and redirecting to its URL
*
*/
function get_content(url){
	return new Promise((resolve, reject) => {
		var xhr = new XMLHttpRequest();
		xhr.open("get",url);
		xhr.onload = function(){
			resolve(this);
		}
		xhr.onerror = function(){
			console.log("%c could not get content of "+url+".","color:red;")			
			reject(JSON.stringify(this));
		}
		xhr.send();
	});
}

/**
*	Turns a blob URL into a data URL
*
*/
function get_data_url(blob,url){
	return new Promise((resolve, reject) => {
		//var url = URL.createObjectURL(blob);
		var reader  = new FileReader();
		reader.addEventListener("load", function(){
			console.log("redirecting");
			console.log(url);
			console.log("to");
			console.log(reader.result);		
			resolve({"redirectUrl": reader.result});
		});
		reader.readAsDataURL(blob);
	});
}

/* *********************************************************************************************** */
// (This is part of eval_test.js with a few console.logs/comments removed)

function evaluate(script,name){
	function reserved_object_regex(object){
		var arith_operators = "\\+\\-\\*\\/\\%\\=";
		var scope_chars = "\{\}\]\[\(\)\,";
		var trailing_chars = "\s*"+"\(\.\[";
		return new RegExp("(?:[^\\w\\d]|^|(?:"+arith_operators+"))"+object+'(?:\\s*?(?:[\\;\\,\\.\\(\\[])\\s*?)',"g");
	}		
	reserved_object_regex("window");
	var all_strings = new RegExp('".*?"'+"|'.*?'","gm");
	var ml_comment = /\/\*([\s\S]+?)\*\//g;
	var il_comment = /\/\/.+/gm;
	var bracket_pairs = /\[.+?\]/g;
	var temp = script.replace(/'.+?'+/gm,"'string'");
	temp = temp.replace(/".+?"+/gm,'"string"');
	temp = temp.replace(ml_comment,"");
	temp = temp.replace(il_comment,"");
	console.log("------evaluation results for "+ name +"------");
	console.log("Script accesses reserved objects?");
	var flag = true;
	var reason = ""
	// 	This is where individual "passes" are made over the code
	for(var i = 0; i < reserved_objects.length; i++){
		var res = reserved_object_regex(reserved_objects[i]).exec(script);
		if(res != null){
			console.log("%c fail","color:red;");
			flag = false;		
			reason = "Script uses a reserved object (" + reserved_objects[i] + ")";
		}
	}
	if(flag){
		console.log("%c pass","color:green;");
	}
	// If flag is set true at this point, the script is trivial
	if(flag){
		reason = "Script was determined to be trivial.";
	}
	return [flag,reason];
}
function license_valid(matches){
	if(matches.length != 4){
		return [false, "malformed or unrecognized license tag"];
	}
	if(matches[1] != "@license"){
		return [false, "malformed or unrecognized license tag"];	
	}
	if(licenses[matches[3]] === undefined){
		return [false, "malformed or unrecognized license tag"];
	}
	if(licenses[matches[3]]["Magnet link"] != matches[2]){
		return [false, "malformed or unrecognized license tag"];
	}
	return [true,"Recognized license as '"+matches[3]+"'\n"];
}
/**
*
*	Evaluates the content of a script (license, if it is non-trivial)
*
*	Returns
*	[ 
*		true (accepted) or false (denied),
*		edited content,
*		reason text		
*	]
*/
function license_read(script_src,name){
	
	var reason_text = "";

	var edited_src = "";
	var unedited_src = script_src;
	var nontrivial_status;
	var parts_denied = false;
	var parts_accepted = false;
	while(true){
		// TODO: support multiline comments
		var matches = /\/\/\s*?(@license)\s([\S]+)\s([\S]+$)/gm.exec(unedited_src);
		if(matches == null){
			nontrivial_status = evaluate(unedited_src,name);
			if(nontrivial_status[0] == true){
				parts_accepted = true;
				edited_src += unedited_src;
			} else{
				parts_denied = true;
				edited_src += "\n/*\nLIBREJS BLOCKED:"+nontrivial_status[1]+"\n*/\n";
			}
			reason_text += "\n" + nontrivial_status[1];
			
			if(parts_denied == true && parts_accepted == true){
				reason_text = "Script was determined partly non-trivial after editing. (check source for details)\n"+reason_text;
			}
			if(parts_denied == true && parts_accepted == false){
				return [false,edited_src,reason_text];
			}
			return [true,edited_src,reason_text];
			
		}
		console.log("Found a license tag");
		var before = unedited_src.substr(0,matches["index"]);
		nontrivial_status = evaluate(before,name);
		if(nontrivial_status[0] == true){
			parts_accepted = true;
			edited_src += before;
		} else{
			parts_denied = true;
			edited_src += "\n/*\nLIBREJS BLOCKED:"+nontrivial_status[1]+"\n*/\n";
		}
		unedited_src = unedited_src.substr(matches["index"],unedited_src.length);
		// TODO: support multiline comments
		matches_end = /\/\/\s*?(@license-end)/gm.exec(unedited_src);
		if(matches_end == null){
			console.log("ERROR: @license with no @license-end");
			return [false,"\n/*\n ERROR: @license with no @license-end \n*/\n","ERROR: @license with no @license-end"];
		}
		var endtag_end_index = matches_end["index"]+matches_end[0].length;
		var license_res = license_valid(matches);
		if(license_res[0] == true){
			edited_src =  edited_src + unedited_src.substr(0,endtag_end_index);
			reason_text += "\n" + license_res[1];		
		} else{
			edited_src = edited_src + "\n/*\n"+license_res[1]+"\n*/\n";
			reason_text += "\n" + license_res[1];
		}
		// trim off everything we just evaluated
		unedited_src = unedited_src.substr(endtag_end_index,unedited_src.length);
	}
}

/* *********************************************************************************************** */
// TODO: Test if this script is being loaded from another domain compared to unused_data[tabid]["url"]
// TODO: test if this script is whitelisted by name (from the GUI with the button)
function get_script(url,tabid,wl){
	return new Promise((resolve, reject) => {
		var response = get_content(url);
		response.then(function(response) {
			if(unused_data[tabid] === undefined){
				unused_data[tabid] = {"url":a.url,"accepted":[],"blocked":[]};
			}	
			var tok_index = url.split("/").length;		
			var scriptname = url.split("/")[tok_index-1];
			if(wl == true){
				// Accept without reading script, it was explicitly whitelisted
				if(typeof(unused_data[tabid]["accepted"].push) != "function"){
					unused_data[tabid]["accepted"] = [[scriptname,"Page is whitelisted in preferences"]];
				} else{
					unused_data[tabid]["accepted"].push([scriptname,"Page is whitelisted in preferences"]);
				}				
				var blob = new Blob([response.responseText], {type : 'application/javascript'});	
				resolve(get_data_url(blob,url));
				return;
			}
			var edited = license_read(response.responseText,scriptname);
			console.log("tabid:"+tabid);
			if(unused_data[tabid] === undefined){
				unused_data[tabid] = {"url":url,"accepted":[],"blocked":[]};
			}
			// If a script is whitelisted/blacklisted throught the GUI, put in accepted/blocked
			// and it will be sorted out by the logic for the popup. 
			if(edited[0] == true){
				if(typeof(unused_data[tabid]["accepted"].push) != "function"){
					unused_data[tabid]["accepted"] = [[scriptname,edited[2]]];
				} else{
					unused_data[tabid]["accepted"].push([scriptname,edited[2]]);
				}	
			} else{
				if(typeof(unused_data[tabid]["blocked"].push) != "function"){
					unused_data[tabid]["blocked"] = [[scriptname,edited[2]]];
				} else{
					unused_data[tabid]["blocked"].push([scriptname,edited[2]]);
				}	
			}
			var blob = new Blob(["console.log('it worked');\n"+edited[1]], {type : 'application/javascript'});
			resolve(get_data_url(blob,url));
		});
	});
}

function read_script(a){
	return new Promise((resolve, reject) => {
		var res = test_url_whitelisted(a.url);
		res.then(function(whitelisted){
			if(whitelisted == true){
				// Doesn't matter if this is accepted or blocked, it will still be whitelisted
				resolve(get_script(a.url,a["tabId"],true));
			} else{
				resolve(get_script(a.url,a["tabId"],false));
			}
		});		

	});
	/*
	// Minimal example of how to edit scripts
	var edited = "console.log('it worked');\n";
	var blob = new Blob([edited], {type : 'application/javascript'});
	return get_data_url(blob);
	*/
}

function read_document(a){
	// This needs to be handled in a different way because it sets the domain
	// of the document to "data:". This breaks relative URLs.
	return new Promise((resolve, reject) => {
		var response = get_content(a.url);
		response.then(function(res){
			if(unused_data[a["tabId"]] === undefined){
				unused_data[a["tabId"]] = {"url":a.url,"accepted":[],"blocked":[]};
			}	
			//setup_counter(res.response,a["tabId"])
			resolve();
			//var blob = new Blob([res.response], {type : 'text/html'});	
			//resolve(get_data_url(blob));
		});
	});
}

/**
*	Initializes various add-on functions
*	only meant to be called once when the script starts
*/
function init_addon(){

	set_webex();
	webex.runtime.onConnect.addListener(connected);
	webex.storage.onChanged.addListener(options_listener);
	webex.tabs.onRemoved.addListener(delete_removed_tab_info);

	var targetPage = "https://developer.mozilla.org/en-US/Firefox/Developer_Edition";

	// Updates the content security policy so we can redirect to local URLs
	webex.webRequest.onHeadersReceived.addListener(
		change_csp,
		{urls: ["<all_urls>"]},
		["blocking", "responseHeaders"]
	);
	// Analyzes remote scripts
	webex.webRequest.onBeforeRequest.addListener(
		read_script,
		{urls:["<all_urls>"], types:["script"]},
		["blocking"]
	);

	// Analyzes the scripts inside of HTML
	webex.webRequest.onBeforeRequest.addListener(
		read_document,
		{urls:["<all_urls>"], types:["main_frame"]},
		["blocking"]
	);

}

/**
*	Test if a page is whitelisted/blacklisted.
*
*	The input here is tested against the comma seperated string found in the options.
*
*	It does NOT test against the individual entries created by hitting the "whitelist"
*	button for a script in the browser action.
*/
function test_url_whitelisted(url){
	return new Promise((resolve, reject) => {
		function cb(items){
			var wl = items["pref_whitelist"];
			if(wl !== undefined){
				wl = wl.split(",");
			} else{
				resolve(false);
				return;
			}
			var regex;
			for(i in wl){
				var s = wl[i].replace(/\*/g,"\\S*");
				s = s.replace(/\./g,"\\.");
				regex = new RegExp(s, "g");
				if(url.match(regex)){
					//console.log("%c" + wl[i] + " matched " + url,"color: purple;");
					resolve(true);
					return;
				} else{
					//console.log("%c" + wl[i] + " didn't match " + url,"color: #dd0000;");
				}
			}
			resolve(false);
			return;
		}
		webex.storage.local.get(cb);
	});
}

/**
*	Loads the contact finder on the given tab ID.
*/
function inject_contact_finder(tab_id){
	function executed(result) {
	  console.log("[TABID:"+tab_id+"]"+"finished executing contact finder: " + result);
	}
	var executing = webex.tabs.executeScript(tab_id, {file: "/contact_finder.js"}, executed);
}

init_addon();

