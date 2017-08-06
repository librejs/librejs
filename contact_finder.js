// TO TEST THE CONTACT FINDER:
// - open the manifest.json
// - add a comma after the closing bracket of the key "background"
// - Copy and paste this after it:
/* 
	"content_scripts": [{"matches": ["<all_urls>"],"js": ["contact_finder.js"]}]
*/
// Now, the contact finder will load on every page and you can test it where ever you want.

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
/**
*	"LibreJS detects contact pages, email addresses that are likely to be owned by the 
*	maintainer of the site, Twitter and identi.ca links, and phone numbers."
*/
function find_contacts(){
	var all = document.documentElement.innerHTML;
	var emails = [];	
	emails.push(all.match(/\S+@\S+\.\S+\b/g));
	// 1.555.123.4567
	//+1.555.123.4567
	var phone_num = []; 
	phone_num.push(all.match(/(\d{1,3}\.)?(\d\d\d)\.(\d\d\d)\.(\d\d\d\d)/g));
	// 1-555-123-4567
	//+1-555-123-4567
	phone_num.push(all.match(/(\+?\d)?([\-|\.])(\d\d\d)\2(\d\d\d)\2(\d\d\d\d)/g));
	// +15554567890
	phone_num.push(all.match(/\+?\d{10,15}\b/g));
	// twitter handles 
	var twitter = [];
	twitter.push(all.match(/@\w{3,15}\b/g));
	// twitter links
	var twitlinks = [];
	twitlinks.push(all.match(/twitter\.com\/\w{3,15}\b/g));
	// identi.ca link	
	// 25 is my guess at the max username length (I don't actually know)
	var identi = [];
	identi.push(all.match(/identi\.ca\/\w{3,25}\b/g));
	// Attempt to find contact pages
	var contact_pages = [];	
	var links = document.getElementsByTagName("a");
	for(i in links){
		if(links[i].href !== undefined && links[i].href.indexOf("contact") != -1){
			contact_pages.push(links[i]);
		}
	}
	console.log("********************************************************");
	console.log("%c RESULTS: ","color: #dd0000;");
	console.log("%c " + phone_num.length + "%c phone numbers","color: red;","color: purple;");
	console.log("%c " + twitter.length + "%c twitter handles","color: red;","color: purple;");
	console.log("%c " + twitlinks.length + "%c twitter links","color: red;","color: purple;");
	console.log("%c " + identi.length + "%c identi.ca links","color: red;","color: purple;");
	console.log("%c " + contact_pages.length + "%c possible contact pages","color: red;","color: purple;");
	console.log("********************************************************");




}

new_debug_button("Complain to website",find_contacts);
new_debug_button("Remove these buttons",function(){
	if(document.getElementById("abc123_main_div") !== null){
		document.getElementById("abc123_main_div").remove();
	}
});
