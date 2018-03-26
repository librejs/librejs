/**
* GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
* *
* Copyright (C) 2017 Nathan Nichols
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

var acorn_base = require("acorn");
var acorn = require('acorn/dist/acorn_loose');
var jssha = require('jssha');
var walk = require("acorn/dist/walk");
var legacy_license_lib = require("./legacy_license_check.js");

console.log("main_background.js");
/**
*	If this is true, it evaluates entire scripts instead of returning as soon as it encounters a violation.
*
*	Also, it controls whether or not this part of the code logs to the console.
*
*/
var DEBUG = false; // debug the JS evaluation 
var PRINT_DEBUG = false; // Everything else 

function dbg_print(a,b){
	if(PRINT_DEBUG == true){
		if(b === undefined){
			console.log(a);
		} else{
			console.log(a,b);
		}
	}
}

/**
*	Wrapper around crypto lib
*
*/
function hash(source){
	var shaObj = new jssha("SHA-256","TEXT")
	shaObj.update(source);
	return shaObj.getHash("HEX");
}


// the list of all available event attributes
var intrinsic_events = [
    "onload",
    "onunload",
    "onclick",
    "ondblclick",
    "onmousedown",
    "onmouseup",
    "onmouseovr",
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
*/
var licenses = require("./licenses.json").licenses;

// These are objects that it will search for in an initial regex pass over non-free scripts.
var reserved_objects = [
	//"document",
	//"window",
	"fetch",
	"XMLHttpRequest",
	"chrome", // only on chrome
	"browser", // only on firefox
	"eval"
];


// Default whitelist, comes from the script in hash_script
var wl_data = require("./hash_script/whitelist").whitelist.jquery;
var default_whitelist = {};
for(var i = 0; i < wl_data.length; i++){
	default_whitelist[wl_data[i].hash] = true;
}


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

// Generates JSON key for local storage
function get_storage_key(script_name,src_hash){
	return script_name;
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
		dbg_print("cache flushed");
	}	
	//var flushingCache = webex.webRequest.handlerBehaviorChanged(flushed);
	

	dbg_print("Items updated in area" + area +": ");

	var changedItems = Object.keys(changes);
	var changed_items = "";
	for (var i = 0; i < changedItems.length; i++){
		var item = changedItems[i];		
		changed_items += item + ",";
	}
	dbg_print(changed_items);

}

/**
*	Executes the "Display this report in new tab" function
*	by opening a new tab with whatever HTML is in the popup
*	at the moment.
*/
var active_connections = {};
var unused_data = {};
function open_popup_tab(data){
	dbg_print(data);
	function gotPopup(popupURL){
		var creating = webex.tabs.create({"url":popupURL},function(a){
			dbg_print("[TABID:"+a["id"]+"] creating unused data entry from parent window's content");
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
	dbg_print("Local storage cleared");
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
*
*	Sends a message to the content script that sets the popup entries for a tab.
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
function update_popup(tab_id,blocked_info,update=false){
	var new_blocked_data;
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
			var temp = script_name.match(/\(.*?\)/g);
			if(temp == null){
				return "none"
			}
			var src_hash = temp[temp.length-1].substr(1,temp[0].length-2);

			for(var i in items){
				var res = i.match(/\(.*?\)/g);
				if(res != null){
					var test_hash = res[res.length-1].substr(1,res[0].length-2);
					if(test_hash == src_hash){
						return items[i];
					}		
				}
			}

			if(default_whitelist[src_hash] !== undefined){
				//console.log("Found script in default whitelist: "+default_whitelist[src_hash]);				
				return "whitelist";
			} else{
				//console.log("script " + script_name + " not in default whitelist.");
				return "none";
			}
		}
		function is_bl(script_name){
			if(get_status(script_name) == "blacklist"){
				return true;			
			}
			else return false;
		}
		function is_wl(script_name){
			if(get_status(script_name) == "whitelist"){
				return true;			
			}
			else return false;
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
					//console.log("Script " + blocked_info[type][script_arr][0] + " is blacklisted");
					continue;
				}
				if(is_wl(blocked_info[type][script_arr][0])){
					new_blocked_data["whitelisted"].push(blocked_info[type][script_arr]);
					//console.log("Script " + blocked_info[type][script_arr][0] + " is whitelisted");
					continue;
				}
				if(type == "url"){
					continue;
				}
				// either "blocked" or "accepted"
				new_blocked_data[type].push(blocked_info[type][script_arr]);
				//console.log("Script " + blocked_info[type][script_arr][0] + " isn't whitelisted or blacklisted");			
			}
		}		
		dbg_print(new_blocked_data);
		//***********************************************************************************************//
		// store the blocked info until it is opened and needed
		if(update == false && active_connections[tab_id] === undefined){
			dbg_print("[TABID:"+tab_id+"]"+"Storing blocked_info for when the browser action is opened or asks for it.");
			if(tab_id == undefined){
				dbg_print("UNDEFINED TAB_ID");
			}
			unused_data[tab_id] = new_blocked_data; 
		} else{
			if(tab_id == undefined){
				dbg_print("UNDEFINED TAB_ID");
			}
			unused_data[tab_id] = new_blocked_data; 
			dbg_print("[TABID:"+tab_id+"]"+"Sending blocked_info directly to browser action");
			active_connections[tab_id].postMessage({"show_info":new_blocked_data});
			delete active_connections[tab_id];
		}
		return 0;
	}
	webex.storage.local.get(get_sto);
}

/**
*
*	This is what you call when a page gets changed to update the info box.
*
*	Sends a message to the content script that adds a popup entry for a tab.
*
*	var example_blocked_info = {
*		"accepted"or "blocked": ["name","reason"],
*		"url": "example.com"
*	}
*
*	Returns true/false based on if script should be accepted/denied respectively
*
*	NOTE: This WILL break if you provide inconsistent URLs to it.
*	Make sure it will use the right URL when refering to a certain script.
*
*/
function add_popup_entry(tab_id,src_hash,blocked_info,update=false){
	return new Promise((resolve, reject) => {
		var new_blocked_data;

		// Make sure the entry in unused_data exists 

		var url = blocked_info["url"];		
		if(url === undefined){
			console.error("No url passed to update_popup");
			return 1;
		}

		if(unused_data[tab_id] === undefined){
			unused_data[tab_id] = {
				"accepted":[],
				"blocked":[],
				"blacklisted":[],
				"whitelisted":[],
				"url": url
			};
		}
		if(unused_data[tab_id]["accepted"] === undefined){unused_data[tab_id]["accepted"] = [];}
		if(unused_data[tab_id]["blocked"] === undefined){unused_data[tab_id]["blocked"] = [];}
		if(unused_data[tab_id]["blacklisted"] === undefined){unused_data[tab_id]["blacklisted"] = [];}
		if(unused_data[tab_id]["whitelisted"] === undefined){unused_data[tab_id]["whitelisted"] = [];}
	
		var type = "";

		if(blocked_info["accepted"] !== undefined){
			type = "accepted";
		}
		if(blocked_info["blocked"] !== undefined){
			type = "blocked";
		}

		function get_sto(items){
			function get_status(script_name,src_hash){
				var temp = script_name.match(/\(.*?\)/g);
				if(temp == null){
					return "none"
				}
				var src_hash = temp[temp.length-1].substr(1,temp[0].length-2);

				for(var i in items){
					var res = i.match(/\(.*?\)/g);
					if(res != null){
						var test_hash = res[res.length-1].substr(1,res[0].length-2);
						if(test_hash == src_hash){
							return items[i];
						}		
					}
				}

				if(default_whitelist[src_hash] !== undefined){
					//console.log("Found script in default whitelist: "+default_whitelist[src_hash]);				
					return "whitelist";
				} else{
					//console.log("script " + script_name + " not in default whitelist.");
				}

				return "none";
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
			

			// Search unused data for the given entry
			function not_duplicate(entry,key){
				var flag = true;
				for(var i = 0; i < unused_data[tab_id][entry].length; i++){
					if(unused_data[tab_id][entry][i][0] == key[0]){
						flag = false;
					}					
				}
				return flag;			
			}
			var type_key = "";
			var res = "";
			if(is_bl(blocked_info[type][0])){
				type_key = "blacklisted";
				res = "bl";
				//console.log("Script " + blocked_info[type][0] + " is blacklisted");
			}
			else if(is_wl(blocked_info[type][0])){
				type_key = "whitelisted";
				res = "wl";
				//console.log("Script " + blocked_info[type][0] + " is whitelisted");
			} else{
				type_key = type;
				res = "none";
				//console.log("Script " + blocked_info[type][0] + " isn't whitelisted or blacklisted");
			}
			if(not_duplicate(type_key,blocked_info[type])){
				dbg_print(unused_data);
				dbg_print(unused_data[tab_id]);
				dbg_print(type_key);
				unused_data[tab_id][type_key].push(blocked_info[type]);
				resolve(res);
			} else{
				resolve(res);
			}
		}
		webex.storage.local.get(get_sto);

		return 0;
	});
}


function get_domain(url){
	var domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
	if(url.indexOf("http://") == 0){
		domain = "http://" + domain;
	}
	else if(url.indexOf("https://") == 0){
		domain = "https://" + domain;
	}
	domain = domain + "/";
	domain = domain.replace(/ /g,"");
	return domain;
}

/**
*
*	This is the callback where the content scripts of the browser action will contact the background script.
*
*/
var portFromCS;
function connected(p) {
	if(p["name"] == "contact_finder"){
		// Send a message back with the relevant settings
		function cb(items){
			p.postMessage(items);
		}
		webex.storage.local.get(cb);
		return;		
	}
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
				var domain = get_domain(current_url);
				var scriptkey = m[val][0];
				if(val == "forget"){
					console.log("KEY:");
					console.log(scriptkey);					
					// TODO: This should produce a "Refresh the page for this change to take effect" message
					var prom = webex.storage.local.remove(scriptkey);
				} else{
					var newitem = {};
					newitem[scriptkey] = val;
					webex.storage.local.set(newitem);			
				}
			}
			var querying = webex.tabs.query({active: true,currentWindow: true},geturl);			
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
			console.log("Print local storage");
			debug_print_local();
		}
		// invoke_contact_finder
		if(m["invoke_contact_finder"] !== undefined){
			contact_finder = true;
			inject_contact_finder();
		}
		// a debug feature (maybe give the user an option to do this?)
		if(m["deletelocalstorage"] !== undefined){
			console.log("Delete local storage");
			debug_delete_local();
		}
		// Add this domain to the whitelist
		if(m["allow_all"] !== undefined){
			var domain = get_domain(m["allow_all"]["url"]);
			add_csv_whitelist(domain);
		}
		// Remote this domain from the whitelist
		if(m["block_all"] !== undefined){
			var domain = get_domain(m["block_all"]["url"]);
			remove_csv_whitelist(domain);
		}
		function logTabs(tabs) {
			if(contact_finder){
				dbg_print("[TABID:"+tab_id+"] Injecting contact finder");
				//inject_contact_finder(tabs[0]["id"]);
			}
			if(update){
				dbg_print("%c updating tab "+tabs[0]["id"],"color: red;");
				update_popup(tabs[0]["id"],unused_data[tabs[0]["id"]],true);
				active_connections[tabs[0]["id"]] = p;
			}
			for(var i = 0; i < tabs.length; i++) {
				var tab = tabs[i];
				var tab_id = tab["id"];
				if(unused_data[tab_id] !== undefined){
					// If we have some data stored here for this tabID, send it
					dbg_print("[TABID:"+tab_id+"]"+"Sending stored data associated with browser action");								
					p.postMessage({"show_info":unused_data[tab_id]});
				} else{
					// create a new entry
					unused_data[tab_id] = {"url":tab["url"],"blocked":"","accepted":""};
					p.postMessage({"show_info":unused_data[tab_id]});							
					dbg_print("[TABID:"+tab_id+"]"+"No data found, creating a new entry for this window.");	
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
	dbg_print("[TABID:"+tab_id+"]"+"Deleting stored info about closed tab");
	if(unused_data[tab_id] !== undefined){
		delete unused_data[tab_id];
	}
	if(active_connections[tab_id] !== undefined){
		delete active_connections[tab_id];
	}
}

/**
*	Check whitelisted by hash
*
*/
function blocked_status(hash){
	return new Promise((resolve, reject) => {
		function cb(items){
			var wl = items["pref_whitelist"];
			for(var i in items){
				var res = i.match(/\(.*?\)/g);
				if(res != null){
					var test_hash = res[res.length-1].substr(1,res[0].length-2);
					if(test_hash == hash){
						resolve(items[i]);
					}		
				}
			}
			resolve("none");
		}
		webex.storage.local.get(cb);
	});
}
/* *********************************************************************************************** */

var fname_data = require("./fname_data.json").fname_data;

//************************this part can be tested in the HTML file index.html's script test.js****************************

function full_evaluate(script){
		var res = true;		
		if(script === undefined || script == ""){
			return [true,"Harmless null script"];		
		}

		var ast = acorn.parse_dammit(script).body[0];

		var flag = false;
		var amtloops = 0;

		var loopkeys = {"for":true,"if":true,"while":true,"switch":true};
		var operators = {"||":true,"&&":true,"=":true,"==":true,"++":true,"--":true,"+=":true,"-=":true,"*":true};
		try{
			var tokens = acorn_base.tokenizer(script);	
		}catch(e){
			console.warn("Tokenizer could not be initiated (probably invalid code)");
			return [false,"Tokenizer could not be initiated (probably invalid code)"];		
		}
		try{
			var toke = tokens.getToken();
		}catch(e){
			console.warn("couldn't get first token (probably invalid code)");
			console.warn("Continuing evaluation");
		}

		/**
		* Given the end of an identifer token, it tests for bracket suffix notation
		*/
		function being_called(end){
			var i = 0;
			while(script.charAt(end+i).match(/\s/g) !== null){
				i++;
				if(i >= script.length-1){
					return false;
				}
			}

			return script.charAt(end+i) == "(";
		}
		/**
		* Given the end of an identifer token, it tests for parentheses
		*/
		function is_bsn(end){
			var i = 0;
			while(script.charAt(end+i).match(/\s/g) !== null){
				i++;
				if(i >= script.length-1){
					return false;
				}
			}
			return script.charAt(end+i) == "[";
		}
		var error_count = 0;
		while(toke !== undefined && toke.type != acorn_base.tokTypes.eof){		
			if(toke.type.keyword !== undefined){
				//dbg_print("Keyword:");
				//dbg_print(toke);
				
				// This type of loop detection ignores functional loop alternatives and ternary operators

				if(toke.type.keyword == "function"){
					dbg_print("%c NONTRIVIAL: Function declaration.","color:red");
					if(DEBUG == false){			
						return [false,"NONTRIVIAL: Function declaration."];
					}		
				}

				if(loopkeys[toke.type.keyword] !== undefined){
					amtloops++;
					if(amtloops > 3){
						dbg_print("%c NONTRIVIAL: Too many loops/conditionals.","color:red");
						if(DEBUG == false){			
							return [false,"NONTRIVIAL: Too many loops/conditionals."];
						}		
					}
				}
			}else if(toke.value !== undefined && operators[toke.value] !== undefined){
				// It's just an operator. Javascript doesn't have operator overloading so it must be some
				// kind of primitive (I.e. a number)
			}else if(toke.value !== undefined){
				var status = fname_data[toke.value];
				if(status === true){ // is the identifier banned?				
					dbg_print("%c NONTRIVIAL: nontrivial token: '"+toke.value+"'","color:red");
					if(DEBUG == false){			
						return [false,"NONTRIVIAL: nontrivial token: '"+toke.value+"'"];
					}	
				}else if(status === false){// is the identifier not banned?
					// Is there bracket suffix notation?
					if(is_bsn(toke.end)){
						dbg_print("%c NONTRIVIAL: Bracket suffix notation on variable '"+toke.value+"'","color:red");
						if(DEBUG == false){			
							return [false,"%c NONTRIVIAL: Bracket suffix notation on variable '"+toke.value+"'"];
						}	
					}
				}else if(status === undefined){// is the identifier user defined?
					// Are arguments being passed to a user defined variable?
					if(being_called(toke.end)){
						dbg_print("%c NONTRIVIAL: User defined variable '"+toke.value+"' called as function","color:red");
						if(DEBUG == false){			
							return [false,"NONTRIVIAL: User defined variable '"+toke.value+"' called as function"];
						}	
					}
					// Is there bracket suffix notation?
					if(is_bsn(toke.end)){
						dbg_print("%c NONTRIVIAL: Bracket suffix notation on variable '"+toke.value+"'","color:red");
						if(DEBUG == false){			
							return [false,"NONTRIVIAL: Bracket suffix notation on variable '"+toke.value+"'"];
						}	
					}
				}else{
					dbg_print("trivial token:"+toke.value);
				}
			}
			// If not a keyword or an identifier it's some kind of operator, field parenthesis, brackets 
			try{
				toke = tokens.getToken();
			}catch(e){
				dbg_print("Denied script because it cannot be parsed.");
				return [false,"NONTRIVIAL: Cannot be parsed. This could mean it is a 404 error."];
			}
		}

		dbg_print("%cAppears to be trivial.","color:green;");
		return [true,"Script appears to be trivial."];
}


//****************************************************************************************************
/**
*	This is the entry point for full code evaluation.
*
*	Performs the initial pass on code to see if it needs to be completely parsed
*
*	This can only determine if a script is bad, not if it's good
*
*	If it passes the intitial pass, it runs the full pass and returns the result
*
*/
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
	dbg_print("%c ------evaluation results for "+ name +"------","color:white");
	dbg_print("Script accesses reserved objects?");
	var flag = true;
	var reason = ""
	// 	This is where individual "passes" are made over the code
	for(var i = 0; i < reserved_objects.length; i++){
		var res = reserved_object_regex(reserved_objects[i]).exec(temp);
		if(res != null){
			dbg_print("%c fail","color:red;");
			flag = false;		
			reason = "Script uses a reserved object (" + reserved_objects[i] + ")";
		}
	}
	if(flag){
		dbg_print("%c pass","color:green;");
	} else{
		return [flag,reason+"<br>"];
	}
	
	var temp = full_evaluate(temp);
	temp[1] = temp[1] + "<br>";
	return temp;
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
	return [true,"Recognized license as '"+matches[3]+"'<br>"];
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
function license_read(script_src, name){
	
	var reason_text = "";

	var edited_src = "";
	var unedited_src = script_src;
	var nontrivial_status;
	var parts_denied = false;
	var parts_accepted = false;
	while(true){ // TODO: refactor me
		// TODO: support multiline comments
		var matches = /\/\s*?(@license)\s([\S]+)\s([\S]+$)/gm.exec(unedited_src);
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
			else return [true,edited_src,reason_text];
			
		}
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
		var matches_end = /\/\/\s*?(@license-end)/gm.exec(unedited_src);
		if(matches_end == null){
			dbg_print("ERROR: @license with no @license-end");
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

/**
*
*	Returns a promise that resolves with the final edited script as a string.
*/
function get_script(response,url,tabid,wl,index=-1){
	return new Promise((resolve, reject) => {
		if(unused_data[tabid] === undefined){
			unused_data[tabid] = {"url":url,"accepted":[],"blocked":[]};
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
			resolve("\n/*\n LibreJS: Script whitelisted by user (From a URL found in comma seperated whitelist)\n*/\n"+response);
			if(index != -1){
				resolve(["\n/*\n LibreJS: Script whitelisted by user (From a URL found in comma seperated whitelist)\n*/\n"+response,index]);
			} else{
				resolve("\n/*\n LibreJS: Script whitelisted by user (From a URL found in comma seperated whitelist)\n*/\n"+response);
			}
		}
	
		var src_hash = hash(response);
		var edited = license_read(response,scriptname);
		var verdict = edited[0];
		var popup_res;
		var domain = get_domain(url);

		var badge_str = 0;

		if(unused_data[tabid]["blocked"] !== undefined){
			badge_str += unused_data[tabid]["blocked"].length;
		}

		if(unused_data[tabid]["blacklisted"] !== undefined){
			badge_str += unused_data[tabid]["blacklisted"].length;
		}
		dbg_print("amt. blocked on page:"+badge_str);
		if(badge_str > 0 || verdict == false){
			webex.browserAction.setBadgeText({
				text: "GRR",
				tabId: tabid
			});
			webex.browserAction.setBadgeBackgroundColor({
				color: "red",
				tabId: tabid
			});			
		} else{
			webex.browserAction.setBadgeText({
				text: "OK",
				tabId: tabid
			});
			webex.browserAction.setBadgeBackgroundColor({
				color: "green",
				tabId: tabid
			});	
		}

		if(verdict == true){
			popup_res = add_popup_entry(tabid,src_hash,{"url":domain,"accepted":[scriptname+" ("+src_hash+")",edited[2]]});
		} else{
			popup_res = add_popup_entry(tabid,src_hash,{"url":domain,"blocked":[scriptname+" ("+src_hash+")",edited[2]]});
		}

		popup_res.then(function(list_verdict){
			var blob;
			if(list_verdict == "wl"){
				// redirect to the unedited version
				if(index != -1){
					resolve(["/* LibreJS: Script whitelisted by user */\n"+response,index]);
				} else{
					resolve("/* LibreJS: Script whitelisted by user */\n"+response);
				}
			}else if(list_verdict == "bl"){
				// Blank the entire script
				if(index != -1){
					resolve(["/* LibreJS: Script blacklisted by user */\n",index]);
				} else{
					resolve("/* LibreJS: Script blacklisted by user */\n");
				}
			} else{
				// Return the edited (normal) version
				if(index != -1){
					resolve(["/* LibreJS: Script acknowledged */\n"+edited[1],index]);
				} else{
					resolve("/* LibreJS: Script acknowledged */\n"+edited[1]);
				}
			}
		});
	});
}

/**
* 	Tests if a request is google analytics or not
*/
function test_GA(a){ // TODO: DRY me
	// This is just an HTML page
	if(a.url == 'https://www.google.com/analytics/#?modal_active=none'){
		return false;
	}
	else if(a.url.match(/https:\/\/www\.google\.com\/analytics\//g)){
		dbg_print("%c Google analytics (1)","color:red");
		return {cancel: true};
	}
	else if(a.url == 'https://www.google-analytics.com/analytics.js'){
		dbg_print("%c Google analytics (2)","color:red");
		return {cancel: true};
	}
	else if(a.url == 'https://www.google.com/analytics/js/analytics.min.js'){
		dbg_print("%c Google analytics (3)","color:red");
		return {cancel: true};
	}
	else return false;
}

/**
*	A callback that every type of request invokes.
*/
function block_ga(a){
	var GA = test_GA(a);
	if(GA != false){
		return GA;
	}
	else return {};
}

/**
*	This is a callback trigged from requests caused by script tags with the src="" attribute.
*/
function read_script(a){
	var GA = test_GA(a);
	if(GA !== false){
		return GA;
	}

	var filter = webex.webRequest.filterResponseData(a.requestId);
	var decoder = new TextDecoder("utf-8");
	var encoder = new TextEncoder();

	filter.ondata = event => {
		var str = decoder.decode(event.data, {stream: true});
		var res = test_url_whitelisted(a.url);
		res.then(function(whitelisted){
			var edit_script;
			if(whitelisted == true){
				// Doesn't matter if this is accepted or blocked, it will still be whitelisted
				edit_script = get_script(str,a.url,a["tabId"],true);
			} else{
				edit_script = get_script(str,a.url,a["tabId"],false);
			}
			edit_script.then(function(edited){
				filter.write(encoder.encode(edited));
				filter.disconnect();
			});
		});
	}
	return {};
}

/**
*	Removes noscript tags with name "librejs-path" leaving the inner content to load.
*/
function remove_noscripts(html_doc){
	for(var i = 0; i < html_doc.getElementsByName("librejs-path").length; i++){
		if(html_doc.getElementsByName("librejs-path")[i].tagName == "NOSCRIPT"){
			html_doc.getElementsByName("librejs-path")[i].outerHTML = html_doc.getElementsByName("librejs-path")[i].innerHTML;
		}
	}
	
	return html_doc.documentElement.innerHTML;
}

/**
*	Tests to see if the intrinsic events on the page are free or not.
*	returns true if they are, false if they're not
*/
function read_metadata(meta_element){

		if(meta_element === undefined || meta_element === null){
			return;		
		}

		console.log("metadata found");				
		
		var metadata = {};
		
		try{			
			metadata = JSON.parse(meta_element.innerHTML);
		}catch(error){
			console.log("Could not parse metadata on page.")
			return false;
		}
		
		var license_str = metadata["intrinsic-events"];
		if(license_str === undefined){
			console.log("No intrinsic events license");			
			return false;
		}
		console.log(license_str);

		var parts = license_str.split(" ");
		if(parts.length != 2){
			console.log("invalid (>2 tokens)");
			return false;
		}
	
		// this should be adequete to escape the HTML escaping
		parts[0] = parts[0].replace(/&amp;/g, '&');

		try{
			if(licenses[parts[1]]["Magnet link"] == parts[0]){
				return true;
			}else{
				console.log("invalid (doesn't match licenses)");
				return false;
			}
		} catch(error){
			console.log("invalid (threw error, key didn't exist)");
			return false;
		}
}

/**
* 	Reads/changes the HTML of a page and the scripts within it.
*/
function edit_html(html,url,tabid,wl){
	
	return new Promise((resolve, reject) => {
		if(wl == true){
			// Don't bother, page is whitelisted
			resolve(html);	 
		}
		
		var parser = new DOMParser();
		var html_doc = parser.parseFromString(html, "text/html");

		var amt_scripts = 0;
		var total_scripts = 0;
		var scripts = html_doc.scripts;
		
		var meta_element = html_doc.getElementById("LibreJS-info");
		var first_scipt_src = "";
		
		// get the potential inline source that can contain a license
		for(var i = 0; i < scripts.length; i++){
			// The script must be in-line and exist
			if(scripts[i] !== undefined && scripts[i].src == ""){
				first_script_src = scripts[i].innerHTML;
				break;
			}
		}
		if(read_metadata(meta_element) || legacy_license_lib.check(first_script_src)){
			console.log("Valid license for intrinsic events found");
		}else{
			// Deal with intrinsic events
			var has_intrinsic_events = [];
			for(var i = 0; i < html_doc.all.length; i++){
				for(var j = 0; j < intrinsic_events.length; j++){
					if(intrinsic_events[j] in html_doc.all[i].attributes){
						has_intrinsic_events.push([i,j]);
					}
				}
			}

			// "i" is an index in html_doc.all
			// "j" is an index in intrinsic_events
			function edit_event(src,i,j,name){
				var edited = get_script(src,name);
				edited.then(function(){
					html_doc.all[i].attributes[intrinsic_events[j]].value = edited[0];
				});
			}

			// Find all the document's elements with intrinsic events
			for(var i = 0; i < has_intrinsic_events.length; i++){
				var s_name = "Intrinsic event ["+has_intrinsic_events[i][0]+"]";
				edit_event(html_doc.all[has_intrinsic_events[i][0]].attributes[intrinsic_events[has_intrinsic_events[i][1]]].value,has_intrinsic_events[i][0],has_intrinsic_events[i][1],s_name);
			}
		}

		// Deal with inline scripts
		for(var i = 0; i < scripts.length; i++){
			if(scripts[i].src == ""){
				total_scripts++;
			}
		}

		dbg_print("Analyzing "+total_scripts+" inline scripts...");

		for(var i = 0; i < scripts.length; i++){
			if(scripts[i].src == ""){
				var edit_script = get_script(scripts[i].innerHTML,url,tabid,wl,i);
				edit_script.then(function(edited){
					var edited_source = edited[0];
					var unedited_source = html_doc.scripts[edited[1]].innerHTML.trim();

					html_doc.scripts[edited[1]].innerHTML = edited_source;
			
					amt_scripts++;

					if(amt_scripts >= total_scripts){
						resolve(remove_noscripts(html_doc));					
					}		

				});
			}
		}

		if(total_scripts == 0){
			dbg_print("Nothing to analyze.");
			resolve(remove_noscripts(html_doc));
		}

	});
}

/**
* Callback for main frame requests
* 
*/
function read_document(a){

	var GA = test_GA(a);
	if(GA != false){
		return GA;
	}

	if(unused_data[a["tabId"]] !== undefined && unused_data[a["tabId"]]["url"] != get_domain(a["url"])){
		delete unused_data[a["tabId"]];
		dbg_print("Page Changed!!!");
	}
	var str = "";
	var filter = webex.webRequest.filterResponseData(a.requestId);
	var decoder = new TextDecoder("utf-8");
	var encoder = new TextEncoder();
	filter.onerror = event => {
		dbg_print("%c Error in getting document","color:red");
	}
	filter.onstop = event => {
		var test = new ArrayBuffer();

		var res = test_url_whitelisted(a.url);
		res.then(function(whitelisted){
			var edit_page;
			if(whitelisted == true){
				dbg_print("WHITELISTED");
				// Doesn't matter if this is accepted or blocked, it will still be whitelisted
				filter.write(encoder.encode(str));
				filter.disconnect();
			} else{
				edit_page = edit_html(str,a.url,a["tabId"],false);
				edit_page.then(function(edited){
					filter.write(encoder.encode(edited));
					filter.disconnect();
				});
			}
		});
	}
	filter.ondata = event => {
		str += decoder.decode(event.data, {stream: true});
	}
	return {};
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

	// Prevents Google Analytics from being loaded from Google servers
	var all_types = [
		"beacon", "csp_report", "font", "image", "imageset", "main_frame", "media",
		"object", "object_subrequest", "ping", "script", "stylesheet", "sub_frame",
		"web_manifest", "websocket", "xbl", "xml_dtd", "xmlhttprequest", "xslt", 
		"other"
	]
	// Analyzes remote scripts
	webex.webRequest.onBeforeRequest.addListener(
		block_ga,
		{urls:["<all_urls>"], types:all_types},
		["blocking"]
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

	legacy_license_lib.init();
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
			if(wl !== undefined && wl !== ""){
				wl = wl.split(",");
			} else{
				resolve(false);
				return;
			}
			var regex;
			for(var i in wl){
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
	  dbg_print("[TABID:"+tab_id+"]"+"finished executing contact finder: " + result);
	}
	var executing = webex.tabs.executeScript(tab_id, {file: "/contact_finder.js"}, executed);
}

/**
*	Adds given domain to the whitelist in options
*/
function add_csv_whitelist(domain){
	function storage_got(items){
		if(items["pref_whitelist"] == ""){
			items["pref_whitelist"] = domain + "*";
		} else if(items["pref_whitelist"] == "undefined"){
			items["pref_whitelist"] = domain + "*";		
		} else{
			items["pref_whitelist"] += "," + domain + "*";		
		}
		dbg_print("New CSV whitelist:");
		dbg_print(items["pref_whitelist"]);
		webex.storage.local.set({"pref_whitelist":items["pref_whitelist"]});
	}
	webex.storage.local.get(storage_got);	
}

/**
*	removes given domain from the whitelist in options
*/
function remove_csv_whitelist(domain){
	function storage_got(items){
		if(items["pref_whitelist"] != ""){
			domain = domain + "\\*";
			domain.replace(/\./g,"\.");
			// remove domain
			dbg_print(new RegExp(domain,"g"));
			items["pref_whitelist"] = items["pref_whitelist"].replace(new RegExp(domain,"g"),"")
			// if an entry was deleted, it will leave an extra comma
			items["pref_whitelist"] = items["pref_whitelist"].replace(/,+/g,",");
			// remove trailing comma if the last one was deleted
			if(items["pref_whitelist"].charAt(items["pref_whitelist"].length-1) == ","){
				items["pref_whitelist"] = items["pref_whitelist"].substr(0,items["pref_whitelist"].length-2);
			}
		}
		dbg_print("New CSV whitelist:");
		dbg_print(items["pref_whitelist"]);
		webex.storage.local.set({"pref_whitelist":items["pref_whitelist"]});
	}
	webex.storage.local.get(storage_got);	
}

init_addon();
