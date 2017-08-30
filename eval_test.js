
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

function get_final_page(html_string, callback){

	/**
	*	Determines if a block of javascript is trivial or not.
	*
	*	true = trivial, false = nontrivial	
	*
	*/
	function evaluate(script,name){
		function reserved_object_regex(object){
			// Matches use of object as a variable	
			
			// This accounts for both unary, binary and assignment operators
			var arith_operators = "\\+\\-\\*\\/\\%\\=";
			
			// These are allowed to preceed or trail a variable as in 'if(true){eval("thiscode")};'
			// However, if you have 'function(){eval}' where the "}" char trails "eval", this can't
			// be used to invoke member objects or pass arguments.
			var scope_chars = "\{\}\]\[\(\)\,";
		
			// No property accessors are allowed to follow the string stored in "object"
			// Whitespace is allowed to come between these property accessors 
			var trailing_chars = "\s*"+"\(\.\[";

			return new RegExp("(?:[^\\w\\d]|^|(?:"+arith_operators+"))"+object+'(?:\\s*?(?:[\\;\\,\\.\\(\\[])\\s*?)',"g");
		}		
		reserved_object_regex("window");
		// Strings
		var all_strings = new RegExp('".*?"'+"|'.*?'","gm");
		// multi-line "/*" "*/" comments
		var ml_comment = /\/\*([\s\S]+?)\*\//g;
		// in-line "//" comments
		var il_comment = /\/\/.+/gm;
		// The contents of bracket pairs
		var bracket_pairs = /\[.+?\]/g;

		// Replace string consts with values that won't interfere
		var temp = script.replace(/'.+?'+/gm,"'string'");
		temp = temp.replace(/".+?"+/gm,'"string"');
		// Remove comments
		temp = temp.replace(ml_comment,"");
		temp = temp.replace(il_comment,"");
		// Now that there can't be any brackets inside of comments or strings,
		//  

		console.log("------evaluation results for "+ name +"------");
		console.log("Script accesses reserved objects?");
		var flag = true;
		for(var i = 0; i < reserved_objects.length; i++){
			var res = reserved_object_regex(reserved_objects[i]).exec(script);
			if(res != null){
				console.log("%c fail","color:red;");
				console.log(res["input"].substr(res["index"]-15,res["index"]+15));
				flag = false;		
			}
		}
		if(flag){
			console.log("%c pass","color:green;");
		}

		return flag;
	}

	/**
	*	Looks at the output of the @license regex and determines if the
	*	license is good.
	*/
	function license_valid(matches){
		// Being overly careful with safety checks
		if(matches.length != 4){
			return false;
		}
		if(matches[1] != "@license"){
			return false;	
		}
		if(licenses[matches[3]] === undefined){
			return false;
		}
		if(licenses[matches[3]]["Magnet link"] != matches[2]){
			return false;
		}
		return true;
	}
	/**
	*
	*	Runs regexes to search for explicit delcarations of script
	*	licenses on the argument. 
	*	It detects:	
	*	//@license, //@license-end
	*	//licstart, //licend
	*	
	*	We are assuming that the "stack depth" of @license tags can not exceed 1.
	*	If this isn't correct, we can make it recursive. 
	*
	*/
	// TODO: Known bug: extra \n chars thrown in at some splices 
	function license_read(script_src,name){
		if(typeof(script_src) != "string"){
			return "fail"
		}
		// Contains only good Javascript
		var edited_src = "";
		// Once Javascript has been "judged", remove it from here
		var unedited_src = script_src;
		var first = true;
		while(true){
			if(first){
				first = false;
				//console.log("input:");
				//console.log("%c"+unedited_src,"color:#550000");
			}
			var matches = /^(@license)\s([\S]+)\s([\S]+$)/gm.exec(unedited_src);
			if(matches == null){
				//console.log("No more matches, almost done");
				if(evaluate(unedited_src,name)){
					edited_src += unedited_src;
				}
				return edited_src;
			}
			// operate on everything before the next match.
			//console.log("Everything before the next match");
			var before = unedited_src.substr(0,matches["index"]);
			//console.log(before);
			if(evaluate(before,name)){
				edited_src += before;
			}
			// This should remove the substring "before"
			unedited_src = unedited_src.substr(matches["index"],unedited_src.length);
			// find the end tag and check if it is valid
			matches_end = /^(@license-end)/gm.exec(unedited_src);
			if(matches_end == null){
				console.log("ERROR: @license with no @license-end");
				return [false,"ERROR: @license with no @license-end"];
			}
			var endtag_end_index = matches_end["index"]+matches_end[0].length;
			// accept next tag if its license is good.
			if(license_valid(matches)){
				edited_src =  edited_src + unedited_src.substr(0,endtag_end_index);
			}
			// Remove the next tag (it will be in edited_src if it was accepted)
			unedited_src = unedited_src.substr(endtag_end_index,unedited_src.length);
			//console.log("New input after iteration:");		
			//console.log("%c"+unedited_src,"color:red;");
			//console.log("Current output:");
			//console.log("%c"+edited_src,"color:green;");
		}
	}
	/**
	*
	*	Checks the whitelist in storage
	*	(Not the comma seperated whitelist from settings)
	*
	*/
	function is_whitelisted(){
		// TODO: implement when this is a background script
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
	function get_table(html_doc, callback, url){
		var xml = new XMLHttpRequest();
		xml.open("get",url);
		xml.onload = function(){
			var a = new DOMParser()
			var doc = a.parseFromString(this.responseText,"text/html");
			var web_label = doc.getElementById("jslicense-labels1");
			if(web_label != null){
				read_w_table(html_doc, callback, table_data=read_weblabels_table(web_label));
			}
		}
		xml.send();
	}
	/**
	*	Basically an extension of "analyze" 
	*
	*	Calls license_read() on all the document's scripts. license_read() then returns an edited version
	*	according to license status and trivial/nontrivial status.
	*
	*	Added because I was having async issues	
	*/
	function read_w_table(html_doc, callback, table_data=false){
		
		var has_intrinsic_events = [];
		for(var i = 0; i < html_doc.all.length; i++){
			for(var j = 0; j < intrinsicEvents.length; j++){
				if(intrinsicEvents[j] in html_doc.all[i].attributes){
					has_intrinsic_events.push([i,j]);
				}
			}
		}

		var done = false;
		var amt_done = 0;
		var amt_remote_scripts = 0;
		var amt_todo = html_doc.scripts.length + has_intrinsic_events.length;

		function check_done(){
			console.log(amt_done + "/" + (amt_todo - amt_remote_scripts) );
			if(amt_done > amt_todo){
				console.warn("Not supposed to happen");
			}
			if(done == false && amt_done >= (amt_todo - amt_remote_scripts) ){
				console.log("%c DONE.","color:red;");
				callback(html_doc);
				done = true;
				// TODO: Convert this to async
				// TODO: Call update_popup() here with reasons
			}
		}
		// "i" is an index in html_doc.scripts
		function edit_src(src, i, name){
			var edited = license_read(src,name);
			if(edited == "string"){
				html_doc.scripts[i].outerHTML = "<script name='librejs-accepted'>"+edited+"</script>";
			} else{
				html_doc.scripts[i].outerHTML = "<script name='librejs-denied'>"+name+"</script>";
			}
			amt_done++;
		}
		// "i" is an index in html_doc.all
		// "j" is an index in intrinsicEvents
		function edit_event(src,i,j,name){
			var edited = license_read(src,name);

			if(edited == "string"){
				html_doc.all[i].attributes[intrinsicEvents[j]].value = edited;
			} else{
				html_doc.all[i].attributes[intrinsicEvents[j]].value = "//Denied by LibreJS";
			}
			amt_done++;
		}

		for(var i = 0; i < html_doc.scripts.length; i++){
			// convert between relative link and file name (table_data indexes by file name)
			var tok_index = html_doc.scripts[i].src.split("/").length;
			var scriptname = html_doc.scripts[i].src.split("/")[tok_index-1];

			if(table_data != false && scriptname in table_data){
				console.log("script contained in weblabel data.");
				if(table_data[scriptname] == "free"){
					console.log("script is free");
					continue;
				}

				console.log("script is unknown");		
			}

			if(html_doc.scripts[i].src != ""){
				// this is a remote script ("<script src='script.js'></script>")
				var name = html_doc.scripts[i].src;
				console.log("%c Will evaluate script '" + name + "' when it arrives. Document.scripts index: "+i,"color:blue;");	
				amt_remote_scripts++;

			} else{
				// it is an inline script ("<script>console.log('test');</script>")
				console.log("%c Evaluating inline script. Document.scripts index: "+i,"color:blue;");
				//console.log(html_doc.scripts[i].innerText);
				edit_src(html_doc.scripts[i].innerText, i, "src: inline (index "+i+")");
			}	
		}
		// Find all the document's elements with intrinsic events
		for(var i = 0; i < has_intrinsic_events.length; i++){
			var s_name = "html_doc.all["+has_intrinsic_events[i][0]+"]";
			edit_event(html_doc.all[has_intrinsic_events[i][0]].attributes[intrinsicEvents[has_intrinsic_events[i][1]]].value,has_intrinsic_events[i][0],has_intrinsic_events[i][1],s_name);
		}

		check_done();

	}
	/*
	*	Basically just calls license_read() on all the Javascript in html_source
	*/
	function analyze(html_source,callback){
		// TODO: Call get_whitelisted_status on this page's URL

		var parser = new DOMParser();
		var html_doc = parser.parseFromString(html_source, "text/html");

		// Test "the first piece of Javascript available to the page" for the license comment
		var finished = false;
		if(html_doc.scripts[0] !== undefined){
			if(html_doc.scripts[0].src != ""){
				// this function is here because otherwise there would be async issues
				function get_first_js(){
					var name = html_doc.scripts[0].src;
					var xml = new XMLHttpRequest();
					xml.open("get", html_doc.scripts[0].src);
					xml.onload = function(response){
						var matches = this.responseText.match(/@licstart[\s\S]+@licend/g);
						if(matches != null){
							console.log("License comment found:");
							console.log(matches[0]);
							console.log("Trusting that the entire page is freely licensed.");
							callback(true);
						}
					}
					xml.send();
				}
				get_first_js();
			} else{
				console.log("%c Script " + i + ": (src: inline)","color:red;");
				var matches = html_doc.scripts[0].innerText.match(/@licstart[\s\S]+@licend/g);
				if(matches != null){
					console.log("License comment found:");
					console.log(matches[0]);
					console.log("Trusting that the entire page is freely licensed.");
					callback(true);
				}
			}	
		}

		var table_data = {};
		var found_table_flag = false;
		// Test for the link that has rel="jslicense", data-jslicense="1"  
		for(var i = 0; i < html_doc.links.length; i++){
			// TODO: also check if data-jslicense == "1". (how?)
			if(html_doc.links[i].rel == "jslicense"){
				console.log("Found HTML table link:");
				get_table(html_doc, callback, html_doc.links[i].href);			
				found_table_flag = true;			
				break;
			}
		}
		// Test for the JavaScript Web Labels table on this page
		var weblabel = html_doc.getElementById("jslicense-labels1");
		if(weblabel !== undefined && weblabel != null && found_table_flag == false){
			console.log("Found web labels table");
			read_w_table(html_doc, callback, table_data=read_weblabels_table(weblabel));
		} 
		if(found_table_flag == false){
			read_w_table(html_doc, callback);
		}
	}

	analyze(html_string,callback);

}

get_final_page(document.documentElement.outerHTML,function(a){
	console.log("returned");
	if(typeof(a) == "boolean"){
		return;
	}
	document.documentElement.innerHTML = a.documentElement.innerHTML;
});





