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
var store;
function set_webex(){
	if(typeof(browser) == "undefined"){
		webex = chrome;
	} else{
		webex = browser;
	}
}
set_webex();

function storage_got(items){
	var inputs = document.getElementsByTagName("input");
	for(var i = 0; i < inputs.length; i++){
		if(inputs[i].id.indexOf("pref_") != -1){
			if(inputs[i].type == "checkbox" && items[inputs[i].id]){
				inputs[i].checked = true;
			}
			if(inputs[i].type == "text"){
				inputs[i].value = items[inputs[i].id];
			} 
		}
	}
}
webex.storage.local.get(storage_got);

document.getElementById("save_changes").addEventListener("click", function(){
	var inputs = document.getElementsByTagName("input");
	// TODO: validate/sanitize the user inputs
	var data = {};
	for(var i = 0; i < inputs.length; i++){
		if(inputs[i].id.indexOf("pref_") != -1){
			var input_val = "";
			if(inputs[i].type == "checkbox"){
				input_val = inputs[i].checked;
			} else{
				input_val = inputs[i].value;
			}
			var input_id = inputs[i].id;
			data[input_id] = input_val;
		}
	}
	console.log(data);
	webex.storage.local.set(data);
});


