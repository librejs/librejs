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
set_webex();


var myPort = webex.runtime.connect({name:"port-from-cs"});
var current_blocked_data;

/**
* update the HTML of the pop-up window.
* If return_HTML is true, it returns the HTML of the popup window without updating it.
*	example input: 
*
*	var example_input = {
*		"accepted": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"blocked": [["REASON 1","SOURCE 1"],["REASON 2","SOURCE 2"]],
*		"url": "example.com"
*	}
*
*/
function generate_HTML(blocked_data){
	current_blocked_data = blocked_data;
	var a = blocked_data;
	var button_complain = '<a id="complain-contact" class="button white" href="#"><span>Complain to site owner</span></a>';
    var button_allow_all = '<a id="allow-button" class="button white" href="#"><span>Allow all scripts in this page</span></a>';
    var button_block_nonfree = '<a id="disallow-button" class="button white" href="#"><span>Block all nonfree/nontrivial scripts from this page</span></a>';
    var button_new_tab = '<a id="open-in-tab" class="button white" href="#"><span>Open this report in a new tab</span></a>';
	var button_whitelist = '<div style="float:right"><input id="temp" type="button" value="whitelist"></input></div>';
	var htmlDoc = document;// Not neccessary 
	var accept = htmlDoc.getElementById("accepted");		
	var blocked = htmlDoc.getElementById("blocked");
	// HTML taken directly from the current LibreJS, display-panel.html
	if(a["accepted"].length == 0){
		accept.innerHTML = '<li>LibreJS did not allow the execution of any scripts on this page: \n\n<ul><li>There may be no scripts on this page (check source, C-u)</li><li>The inline and on-page JavaScript code may not be free and/or may not have proper license information and external scripts (if present) may have been removed by default.</li><li>External scripts may not be free and/or may not have proper licensing and are not part of the whitelist of free JavaScript libraries.</li></ul></li>';
	} else{
		accept.innerHTML = "";
		accept.innerHTML = '<h2 class="accepted-js">List of <div style="display:inline; color: green;">ACCEPTED</div> javascript in '+a["url"]+':</h2>';
		accept.innerHTML += '<ul class="accepted-js">';
	}
	// Iterate over a["accepted"] and generate bulleted list
	for(var i = 0; i < a["accepted"].length; i++){
		accept.innerHTML += "<li>" + a["accepted"][i][0] + "<br>" + a["accepted"][i][1] + "</li>";
	}
	if(a["accepted"].length != 0){
		accept.innerHTML += "</ul>";
	}
	// HTML taken directly from the current LibreJS, display-panel.html
	if(a["blocked"].length == 0){
		blocked.innerHTML += '<li>LibreJS did not block any scripts on this page: \n\n<ul><li>There may be no scripts on this page (check source, C-u).</li><li>All the scripts on this page may be trivial and/or free.</li><li>You may have whitelisted this domain name or url from the preferences (Type about:addons in your location bar to check)</li><li>You may have clicked the "allow all scripts" button, which causes LibreJS to load all JavaScript on a page regardless of whether it is free, trivial, nontrivial or nonfree. This policy is effective for the entire duration of a Firefox session.</li><li>If for any reason you think LibreJS should have blocked JavaScript code on this page, please report this issue to: <a id="report" href="mailto:bug-librejs@gnu.org" target="_blank">bug-librejs@gnu.org</a></li></ul></li>';
	} else{
		blocked.innerHTML = "";
		blocked.innerHTML = "<h2 class='blocked-js'>List of <div style='display:inline; color: red;'>BLOCKED</div> javascript in" + a["url"]+":</h2>";
		blocked.innerHTML += '<ul class="blocked-js">';
	}
	// Iterate over a["blocked"] and generate bulleted list
	for(var i = 0; i < a["blocked"].length; i++){
		blocked.innerHTML += "<li>"+a["blocked"][i][0]+ "<br>" + a["blocked"][i][1]+"\n"+button_whitelist+"</li>";
		document.getElementById("temp").id = "wl_"+i;
	}
	if(a["blocked"].length != 0){
		blocked.innerHTML += "</ul>";
		// add click listeners to the buttons		
		for(var i = 0; i < a["blocked"].length; i++){
			document.getElementById("wl_"+i).addEventListener("click",function(a){
				console.log(a.path[0].id + " clicked");
				var temp = current_blocked_data["blocked"][parseInt(a.path[0].id.substr(3))];
				console.log(temp);				
				myPort.postMessage({"whitelist_script": temp});
			});	
		}
	}
	// At this point, it has the HTML that the popup needs and the only problem is
	// getting it into the popup. (browserAction() needs a (local) URL to work).

}

myPort.onMessage.addListener(function(m) {
	if(m["show_info"] !== undefined){
		generate_HTML(m["show_info"]);
	}
});
function onGot(tabInfo) {
	myPort.postMessage({"tab_info": tabInfo});
}
var gettingCurrent = webex.tabs.getCurrent(onGot);


