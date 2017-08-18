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

/**
*
*	Runs regexes to search for explicit delcarations of script
*	licenses on the argument. 
*	It detects:	
*	//@license, //@license-end
*	//licstart, //licen
*	Returns the identifier string of the license or "fail".
*
*/
function license_read(script_src){
	if(typeof(script_src) != "string"){
		return "fail"
	}
	var license_attempts = [];
	// comment regex
	var comments = script_src.match(/(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/g);
	if(comments == null){
		comments = [];
	}
	//console.log("%c comments:","color:green;")
	//console.log(comments);

	// Not sure if there is any better way to do this.
	// More than one license section per file should be supported once we can edit scripts
	// (this will be converted to edit the script instead of just read it)
	for(var i = 0; i < comments.length; i++){
		if(comments[i] !== undefined){
			// @license regex
			if(comments[i].match(/@license[^\S\n]+magnet:\S+[^\S\n]+\S+/g) != null){
				console.log("License start detected.");
				var content = comments[i].match(/(?:magnet:\S+)(\s+.+)/g);
				if(content != null){
					content[0].replace(/\s+/g," ");
					content = content[0].split(" ");
					var magnet = content[0];
					var identifier = "";
					for(var i = 1; i < content.length; i++){
						if(i == 1){						
							identifier = identifier + content[i];
						} else{
							identifier = identifier + "-" + content[i];
						}				
					}
					var valid = true;
					if(licenses[identifier]["Magnet link"] != magnet){
						valid = false;
					}
					if((identifier in licenses) == false){
						valid = false;
					}
					console.log("Valid? " + valid);
					// TODO: Support more than one block and check for code outside of this block
					// Can't be implemented right now since we can't edit scripts.
					return valid;// TODO: this is a temporary debug solution
				} else{
					console.log("Valid? false");
				}	
			}
			// license-end regex
			if(comments[i].match(/\/\/\s*@license\-end/g) != null){
				console.log("License end:");
				console.log(comments[i])			
			}
		}
	}
	//console.log("VERDICT: probably nonfree");
	//console.log("VERDICT: probably free");
}

/**
*
*	Checks the whitelist in storage
*	(Not the comma seperated whitelist from settings)
*
*/
function is_whitelisted(){
	// TODO: implement
	return false;

}


/**
*	Parses the weblabels table from a DOM object
*
*/
function read_weblabels_table(weblabel){
	var data = {};
	var tbody = weblabel.getElementsByTagName("td");
	for(var i = 0; i < tbody.length; i++){
		var link = tbody[i].getElementsByTagName("a")[0];
		//console.log(link.href);
		if(link.innerText in licenses){
			console.log("%cFree: " + link.innerText,"color:green;");
			data[encodeURI(link.innerText)] = "free";
		} else{
			console.log("%cUnknown: " + link.innerText,"color:red;");
			data[encodeURI(link.innerText)] = "unknown";
		}
	}
	console.log("web labels table data:");
	console.log(data);
	return data;
}

/**
*	Reads the weblabels table from a link.
*
*/
function get_table(url){
	var xml = new XMLHttpRequest();
	xml.open("get",url);
	xml.onload = function(){
		var a = new DOMParser()
		var doc = a.parseFromString(this.responseText,"text/html");
		var web_label = doc.getElementById("jslicense-labels1");
		if(web_label != null){
			read_w_table(read_weblabels_table(web_label));
		}
	}
	xml.send();
}
function read_w_table(table_data=false){
	// Call license_read on all the document's scripts 
	// This is done just to debug before we can implement this in a background script,
	// where it will have access to the individual script requests and HTML document. 


	for(var i = 0; i < document.scripts.length; i++){
		// convert between relative link and file name (table_data indexes by file name)
		var scriptname = document.scripts[i].src.split("/")[document.scripts[0].src.split("/").length-1];
		if(table_data != false && scriptname in table_data){
			console.log("script contained in weblabel data.");
			if(table_data[scriptname] == "free"){
				console.log("script is free");
				continue;
			}
			console.log("script is unknown");		
		}
		if(document.scripts[i].src != ""){
			// it is a remote script ("<script src='/script.js'></script>")
			var name = document.scripts[i].src;
			var xml = new XMLHttpRequest();
			xml.open("get", document.scripts[i].src);
			xml.onload = function(response){
				console.log("%c Script " + i + ":","color:red;");
				console.log(name);
				license_read(this.responseText);
			}
			xml.send();
		} else{
			// it is an inline script ("<script>console.log('test');</script>")
			console.log("%c Script " + i + ": (src: inline)","color:red;");
			//console.log(document.scripts[i].innerText);
			license_read(document.scripts[i].innerText);	
		}	
	}
	// Find all the document's elements with intrinsic events
	for(var i = 0; i < document.all.length; i++){
		for(var j = 0; j < intrinsicEvents.length; j++){
			if(intrinsicEvents[j] in document.all[i].attributes){
				console.log("intrinsic event '"+intrinsicEvents[j]+"' JS found in element document.all[" + i + "]");
				license_read(document.all[i].attributes[intrinsicEvents[j]].value);
			}
		}
	}
}
// called when invoked by the button
function analyze(){
	// TODO: Call get_whitelisted_status on this page's URL
	
	// Test "the first piece of Javascript available to the page" for the license comment
	// TODO: Is this supposed to test if the license is free or just assume that it is?	
	if(document.scripts[0] !== undefined){
		if(document.scripts[0].src != ""){
			var name = document.scripts[0].src;
			var xml = new XMLHttpRequest();
			xml.open("get", document.scripts[0].src);
			xml.onload = function(response){
				var matches = this.responseText.match(/@licstart[\s\S]+@licend/g);
				if(matches != null){
					console.log("License comment found:");
					console.log(matches[0]);
					console.log("Trusting that the entire page is freely licensed.");
					return "do-nothing";
				}
			}
			xml.send();
		} else{
			console.log("%c Script " + i + ": (src: inline)","color:red;");
			var matches = document.scripts[0].innerText.match(/@licstart[\s\S]+@licend/g);
			if(matches != null){
				console.log("License comment found:");
				console.log(matches[0]);
				console.log("Trusting that the entire page is freely licensed.");
				return "do-nothing";
			}
		}	
	}

	var table_data = {};
	var found_table_flag = false;
	// Test for the link that has rel="jslicense", data-jslicense="1"  
	for(var i = 0; i < document.links.length; i++){
		// TODO: also check if data-jslicense == "1". (how?)
		if(document.links[i].rel == "jslicense"){
			console.log("Found HTML table link:");
			get_table(document.links[i].href);			
			found_table_flag = true;			
			break;
		}
	}
	// Test for the JavaScript Web Labels table on this page
	var weblabel = document.getElementById("jslicense-labels1");
	if(weblabel !== undefined && weblabel != null && found_table_flag == false){
		console.log("Found web labels table");
		read_w_table(table_data=read_weblabels_table(weblabel));
	} 
	if(found_table_flag == false){
		read_w_table();
	}
}

/**
*	Makes a button appear that calls a function when you press it.
*
*	I copied and pasted this from something else I wrote. It's quite useful.
*	
*/
var button_i = 0;
if(document.getElementById("abc123_main_div") !== null){
	document.getElementById("abc123_main_div").remove();
}
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

new_debug_button("Evaluate scripts",analyze);
new_debug_button("Remove these buttons",function(){
	if(document.getElementById("abc123_main_div") !== null){
		document.getElementById("abc123_main_div").remove();
	}
});


