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
* Called when something changes the persistent data of the add-on.
*
* The only things that should need to change this data are:
* a) The "Whitelist this page" button
* b) The options screen
*
* When the actual blocking is implemented, this will need to comminicate
* with its code to update accordingly
* 
*/
function options_listener(changes, area){
	console.log("Items updated in area" + area +": ");

	var changedItems = Object.keys(changes);
	var changed_items = "";
	for (var i = 0; i < changedItems.length; i++;) {
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
*	This is what you call when a page gets changed to update the info box.
*
*	Sends a message to the content script that updates the popup for a page.
*
*
*	var example_blocked_info = {
*		"accepted": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"blocked": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"url": "example.com"
*	}
*
*/

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
	console.log("Message:");	
	console.log(p);
	p.onMessage.addListener(function(m) {
		

		if(m["whitelist_script"] !== undefined){
			console.log("whitelisting script " + m["whitelist_script"][0]);
			return;
		}		


		function logTabs(tabs) {
			for(var i = 0; i < tabs.length; i++) {
				var tab = tabs[i]
				var tab_id = tab["id"]
				console.log(tab_id)
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

// some misc. debugging:
var example_input = {
	"accepted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
	"blocked": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
	"url":"example.com"
}
example_input["accepted"] = [];
example_input["blocked"] = [];

//open_popup_tab();




