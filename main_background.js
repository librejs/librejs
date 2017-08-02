console.debug("main_background.js");

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
	if(typeof(browser) == "undefined"){
		webex = chrome;
	} else{
		webex = browser;
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
*	The object stored in storage will look like this:
*
*
*	{
		// pref_* items are from the options page
*		pref_body : "",
*		pref_complaint_tab : "",
*		pref_notify_analyze : "",
*		pref_subject : "",
*		// The domains that are "blanket" whitelisted
*		pref_whitelist : {
*			"a.com" : true,
*			"b.com" : true
*		},
*		// Individual scripts that have been whitelisted
*		whitelist : {
*			"example.com":{
*				"a.js" : true
*			},
*			"domain.com": {
*				"a.js" : true,
*				"b.js" : false
*			}
*		},
*		blacklist : {
*			"website.com":{
*				"a.js" : true
*			},
*			"test.com": {
*				"a.js" : true,
*				"b.js" : false
*			}
*		}
*	}
*	
*	If something is set to false under whitelist/blacklist, it is the same as if it were undefined.
*	If something is undefined in whitelist/blacklist, then it should be judged by its content as LibreJS does by default. 
*
*
*
*
*/
function options_listener(changes, area){
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
function open_popup_tab(){
	function gotPopup(popupURL){
		var creating = webex.tabs.create({"url":popupURL});
	}

	var gettingPopup = webex.browserAction.getPopup({},gotPopup);
}


/**
*
*	Prints local storage (the persistent data)
*
*/
function debug_print_local(){
	function storage_got(items){
		console.log("\n\nLocal Storage:"); 
		console.log("\npref_complaint_tab:"+items["pref_complaint_tab"]);
		console.log("pref_notify_analyze:"+items["pref_notify_analyze"]);
		console.log("pref_subject:"+items["pref_subject"]);
		console.log("pref_body:"+items["pref_body"]);
		console.log("\nWHITELIST:");
		console.log(items["whitelist"]);
		console.log("\nBLACKLIST:");
		console.log(items["blacklist"]);
	}
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
*/
// This might be wasting memory
// I now realize it doesn't need to store the connections, this is left over from when I thought it did
var active_connections = {};
var unused_data = {};
function update_popup(tab_id,blocked_info){
	// this will happen almost every time (browser action not opened before javascript has been filtered)
	// store the blocked info until it is opened and needed
	if(active_connections[tab_id] === undefined){
		console.log("[TABID:"+tab_id+"]"+"Storing blocked_info for when the browser action is opened.");
		unused_data[tab_id] = blocked_info; 
	} else{
		console.log("[TABID:"+tab_id+"]"+"Sending blocked_info directly to browser action");
		active_connections[tab_id].postMessage({"show_info":blocked_info});
		delete active_connections[tab_id];
	}
}
/**
*
*	This is the callback where the content scripts of the browser action will contact the background script.
*
*/
var portFromCS;
function connected(p) {
	p.onMessage.addListener(function(m) {
		console.log("Message:");	
		console.log(p);
		/**
		*	Updates the entry of the current URL in whitelist/blacklist (possible values of arg "key") with either true or false.
		*	(Perhaps it should actually delete it to not leak memory? Not sure how that is done.)
		*/
		function set_script(script,key,tof){
			console.log("setting script '" + script + "'s entry to "+ tof + " with key '" + key + "'");
			// Remember that we do not trust the names of scripts.
			var current_url = "";
			function geturl(tabs) {
				// Got the URL of the current open tab
				current_url = tabs[0]["url"];
				function storage_got(items){
					console.log("got storage:");
					console.log(items);
					var new_items = items;
					if(new_items[key] === undefined){
						new_items[key] = {};
					}
					if(new_items[key][current_url] === undefined){
						new_items[key][current_url] = {};
					}
					console.log(script);
					
					new_items[key][current_url][script] = tof;
					webex.storage.local.set(new_items);			
				}
				webex.storage.local.get(storage_got);
			}
			var querying = webex.tabs.query({active: true,currentWindow: true},geturl);			
			return;
		}
		if(m["whitelist"] !== undefined){
			set_script(m["whitelist"][0],"whitelist",true);
			set_script(m["whitelist"][0],"blacklist",false);
		}
		if(m["blacklist"] !== undefined){
			set_script(m["blacklist"][0],"blacklist",true);
			set_script(m["blacklist"][0],"whitelist",false);
		}
		if(m["forget"] !== undefined){
			set_script(m["unwhitelist"][0],"whitelist",false);
			set_script(m["unwhitelist"][0],"blacklist",false);
		}
		// a debug feature
		if(m["printlocalstorage"] !== undefined){
			debug_print_local();
		}
		function logTabs(tabs) {
			for(var i = 0; i < tabs.length; i++) {
				var tab = tabs[i]
				var tab_id = tab["id"]
				if(unused_data[tab_id] !== undefined){
					// If we have some data stored here for this tabID, send it and then delete our copy 	
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
*	Initializes various add-on functions
*	only meant to be called once when the script starts
*/
function init_addon(){
	set_webex();
	webex.runtime.onConnect.addListener(connected);
	webex.storage.onChanged.addListener(options_listener);
	webex.tabs.onRemoved.addListener(delete_removed_tab_info);
}


init_addon();

/**************** some misc. debugging: ***************************/

function clr_local(){
	webex.storage.local.set({});				
}

// Valid input for update_popup
var example_input = {
	"accepted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
	"blocked": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
	"whitelisted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
	"blacklisted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
	"url":"example.com"
};
// To test the default text
example_input["accepted"] = [];
example_input["blocked"] = [];


update_popup(2,example_input);

