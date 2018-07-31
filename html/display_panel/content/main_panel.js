 /**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2017, 2018 NateN1222 <nathannichols454@gmail.com>
 * Copyright (C) 2018 Ruben Rodriguez <ruben@gnu.org>
 * Copyright (C) 2018 Giorgio Maone <giorgio@maone.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see  <http://www.gnu.org/licenses/>.
 *
 */

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

var PRINT_DEBUG = false;
function dbg_print(a,b){
	if(PRINT_DEBUG == true){
		if(b === undefined){
			console.log(a);
		} else{
			console.log(a,b);
		}
	}
}

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


// Display the actual extension version Number
document.querySelector("#version").textContent = browser.runtime.getManifest().version;

/*
*	Makes a button appear that calls a function when you press it.
*
*	I copied and pasted this from something else I wrote. It's quite useful.
*	
*/
var button_i = 0;
function new_debug_button(name_text,callback){
	if(document.getElementById("abc123_main_div") === null){
		var to_insert = '<div style="opacity: 0.5; font-size: small; z-index: 2147483647; position: fixed; right: 1%; top: 4%;" id="abc123_main_div"></div>';
		document.body.insertAdjacentHTML('afterbegin', to_insert);
	}
	var button_html = '<input id="abc123_button_' + button_i + '" value="' + name_text +'"type="button"></input><br>';
	document.getElementById("abc123_main_div").insertAdjacentHTML('afterbegin', button_html);	
	document.getElementById("abc123_button_"+button_i).addEventListener("click",callback);
	button_i = button_i + 1;
}






/* 
*	Takes in the script data and color of h2 element
*	Writes to category specified by "name" as used in HTML
*	(name will probably either be "blacklisted", "whitelisted", "accepted", or "blocked")
*/
function write_elements(data,name,color){
	var url = data["url"];
	var button_html = '<div style="float:left;"><input id="temp" type="button" value="blacklist"></input></div>';
	var button_html_2 = '<div style="float:left;"><input id="temp2" type="button" value="whitelist"></input></div>';
	var button_html_3 = '<div style="float:left;"><input id="temp3" type="button" value="forget preference"></input></div>';
	var heading = document.getElementById(name).getElementsByTagName("h2")[0];
	var list = document.getElementById(name).getElementsByTagName("ul")[0];
	if(typeof(data[name]) == "undefined" || data[name].length == 0){
		// default message
		list.innerHTML = "<li>No "+ name +" scripts on this page.</li>"
		data[name] = [];	
	} else{
		heading.innerHTML = "<h2 class='blocked-js'>List of <div style='display:inline; color:"+color+";'>" + name.toUpperCase() + "</div> javascript in " + data["url"]+":</h2>";
	}
	// Iterate over data[name] and generate list
	for(var i = 0; i < data[name].length; i++){
		list.innerHTML += "<li><a href='"+data[name][i][0]+"'><b>"+data[name][i][0]+ "</a>:</b><br>" + data[name][i][1]+"<br>"+button_html+"\n"+button_html_2+"\n"+button_html_3+"</li>";
		document.getElementById("temp").id = name+"_"+i;
		document.getElementById("temp2").id = name+"_2_"+i;
		document.getElementById("temp3").id = name+"_3_"+i;
	}
	if(data[name].length != 0){
		// add click listeners to the buttons		
		for(var i = 0; i < data[name].length; i++){
			// Make sure this causes generate_html to get called again with updated data
			document.getElementById(name+"_"+i).addEventListener("click",function(info){
				var temp = current_blocked_data[name][parseInt(info.target.id.match(/\d/g)[0])];
				console.log("Moving script " + temp[0] + " to blacklist");
				var script_name = this.parentElement.parentElement.parentElement.parentElement.id;
				myPort.postMessage({"blacklist": temp});
			});	
			document.getElementById(name+"_2_"+i).addEventListener("click",function(info){
				var temp = current_blocked_data[name][parseInt(info.target.id.match(/\d+/g)[1])];
				console.log("Moving script " + temp[0] + " to whitelist");
				var script_name = this.parentElement.parentElement.parentElement.parentElement.id;
				myPort.postMessage({"whitelist": temp});
			});	

			document.getElementById(name+"_3_"+i).addEventListener("click",function(info){
				var temp = current_blocked_data[name][parseInt(info.target.id.match(/\d/g)[1])];
				console.log("Forget preferences for script " + temp[0]);
				var script_name = this.parentElement.parentElement.parentElement.parentElement.id;
				//this.parentElement.parentElement.getElementsByTagName("b")[0].insertAdjacentHTML("beforebegin","<h3>Refresh the page to revaluate this script.</h3>");	
				myPort.postMessage({"forget": temp});
			});	
		}
	}

}

/**
*	displays the button specified by HTML string "button"
*/
var template = '<tr><td id="c1"></td><td id="c2"></td></tr>';
var lr_flag = true;
var button_num = 0;
function write_button(button,callback){
	if(document.getElementById("buttons_table").innerHTML.indexOf(button) != -1){
		return;	
	}
	var id = "buttonno_"+button_num;
	if(lr_flag){
		document.getElementById("buttons_table").insertAdjacentHTML("beforeend",template);
		document.getElementById("c1").insertAdjacentHTML("beforeend","<div id='"+id+"'>" + button + "</div>");
		document.getElementById("c1").id = "cell_"+button_num;
	}else{
		var temp = document.getElementById("c2");
		temp.id = "cell_"+button_num;
		temp.insertAdjacentHTML("beforeend","<div id='"+id+"'>" + button + "</div>");
	}

	button_num = button_num+1;
	lr_flag = !lr_flag;

	document.getElementById(id).addEventListener("click",callback);
}
/**
* update the HTML of the pop-up window.
* If return_HTML is true, it returns the HTML of the popup window without updating it.
*	example input: 
*
*	var example_input = {
*		"accepted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"blocked": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"whitelisted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"blacklisted": [["FILENAME 1","REASON 1"],["FILENAME 2","REASON 2"]],
*		"url":"example.com"
*	};
*
*/
function generate_HTML(blocked_data){
	current_blocked_data = blocked_data;//unused?

	// This should send a message to invoke the content finder
	var button_complain = '<a id="complain-contact" class="button white" href="#">Complain to site owner</a>';
	// This should update the persistent options
    var button_allow_all = '<a id="allow-button" class="button white" href="#">'+"Add page's domain to whitelist"+'</a>';
	// This will call "Forget preferences" on every script.
    var button_block_nonfree = '<a id="disallow-button" class="button white" href="#">'+"Remove page's domain from whitelist"+'</a>';
	// This should send a message that calls "open_popup_tab()" in the background script
    var button_new_tab = '<a id="open-in-tab" class="button white" href="#">Open this report in a new tab</a>';

	var to_clr = document.getElementsByClassName("blocked-js");

	for(var i = 0; i < to_clr.length; i++){
		to_clr[i].innerHTML = "";
	}
	dbg_print("REGEN HTML:");
	dbg_print(blocked_data);
	write_elements(blocked_data,"accepted","green");
	write_elements(blocked_data,"whitelisted","green");
	write_elements(blocked_data,"blocked","red");
	write_elements(blocked_data,"blacklisted","red");
	
	if( blocked_data["blacklisted"].length != 0 || blocked_data["blocked"].length != 0 ||
	blocked_data["whitelisted"].length != 0 || blocked_data["accepted"].length != 0){
		write_button(button_allow_all,function(){
			myPort.postMessage({"allow_all": blocked_data});
		});
		write_button(button_block_nonfree,function(){
			myPort.postMessage({"block_all": blocked_data});

		});
		write_button(button_complain,function(){			
			myPort.postMessage({"invoke_contact_finder": blocked_data});
		});
		write_button(button_new_tab,function(){
			myPort.postMessage({"open_popup_tab": blocked_data});
		});
	} else{
		write_button(button_new_tab,function(){
			myPort.postMessage({"open_popup_tab": blocked_data});
		});
	}
}

myPort.onMessage.addListener(function(m) {
	if(m["show_info"] !== undefined){
		generate_HTML(m["show_info"]);
	}
});
// Sends a message that tells the background script the window is open
function onGot(tabInfo) {
	myPort.postMessage({"tab_info": tabInfo});
}
var gettingCurrent = webex.tabs.getCurrent(onGot);


function print_local_storage(){
	myPort.postMessage({"printlocalstorage": true});
}
function delete_local_storage(){
	myPort.postMessage({"deletelocalstorage":true});
}

//new_debug_button("Print local storage",print_local_storage);
//new_debug_button("Clear local storage",delete_local_storage);
