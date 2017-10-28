(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

console.log("main_background.js");
/**
*	If this is true, it evaluates entire scripts instead of returning as soon as it encounters a violation.
*
*	Also, it controls whether or not this part of the code logs to the console.
*
*/
var DEBUG = false;

function dbg_print(a,b){
	if(DEBUG == true){
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
var intrinsicEvents = [
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

// Objects which could be used to do nontrivial things.
// Scripts are not allowed to call any methods on these objects or access them in any way.
var reserved_objects = [
	//"document",
	//"window",
	"fetch",
	"XMLHttpRequest",
	"chrome", // only on chrome
	"browser", // only on firefox
	"eval"
];
// the list of all available event attributes
var intrinsic_events = [
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

// TODO: make it so that there is a list of objects that have certain banned methods (which also means it must ban bracket suffix notation on these objects)

// Default whitelist, comes from the script in hash_script
var default_whitelist = {"052b1b5ec0c4ae78aafc7a6e8542c5a2bf31d42a40dac3cfc102e512812b8bed":"core.js","0d9027289ffa5d9f6c8b4e0782bb31bbff2cef5ee3708ccbcb7a22df9128bb21":"jquery.js","87083882cc6015984eb0411a99d3981817f5dc5c90ba24f0940420c5548d82de":"jquery.min.js","b40f32d17aa2c27a7098e225dd218070597646fc478c0f2aa74fb5b821a64668":"jquery.slim.js","9365920887b11b33a3dc4ba28a0f93951f200341263e3b9cefd384798e4be398":"jquery.slim.min.js","7c5c8f96ac182ed4d2c9ac74fda37941745f2793814fbd8b28624a9a720f9d39":"core.js","c0f149348165558e3d07e0ae008ac3afddf65d26fa264dc9d4cdb6337136ca54":"jquery.js","2405bdf4c255a4904671bcc4b97938033d39b3f5f20dd068985a8d94cde273e2":"jquery.min.js","f18ac10930e84233b80814f5595bcc1f6ffad74047d038d997114e08880aec03":"jquery.slim.js","a8b02fd240408a170764b2377efdd621329e46c517dbb85deaea4105ad0c4a8c":"jquery.slim.min.js","4a4dec7ca8f2567b4327c82b873c8d7dd774f74b9009d2ff65431a8154693dea":"core.js","d7a71d3dd740e95755227ba6446a3a21b8af6c4444f29ec2411dc7cd306e10b0":"jquery.js","85556761a8800d14ced8fcd41a6b8b26bf012d44a318866c0d81a62092efd9bf":"jquery.min.js","e62fe6437d3433befd3763950eb975ea56e88705cd51dccbfd1d9a5545f25d60":"jquery.slim.js","fd222b36abfc87a406283b8da0b180e22adeb7e9327ac0a41c6cd5514574b217":"jquery.slim.min.js","55994528e7efe901e92a76761a54ba0c3ae3f1f8d1c3a4da9a23a3e4a06d0eaa":"core.js","b25a2092f0752b754e933008f10213c55dd5ce93a791e355b0abed9182cc8df9":"jquery.js","702b9e051e82b32038ffdb33a4f7eb5f7b38f4cf6f514e4182d8898f4eb0b7fb":"jquery.min.js","2faa690232fa8e0b5199f8ae8a0784139030348da91ff5fd2016cfc9a9c9799c":"jquery.slim.js","711a568e848ec3929cc8839a64da388ba7d9f6d28f85861bea2e53f51495246f":"jquery.slim.min.js","11853583eb5ce8ab1aacc380430145de705cdfff0e72c54d3dca17d01466999b":"core.js","65ded5fa34aa91b976dae0af5888ce4c06fed34271f3665b2924505b704025c7":"jquery.js","df68e90250b9a60fc184ef194d1769d3af8aa67396cc064281cb77e2ef6bf876":"jquery.min.js","c96eeff335114aa55df0328bbe5f9202ed7a3266b6e81fcd357cd17837fa9756":"jquery.slim.js","e92bbd6e77604b75e910952f20f3c95ce29050c7b1137dc1edddad000c236b5d":"jquery.slim.min.js","78f27c3d7cb5d766466703adc7f7ad7706b7fb05514eec39be0aa253449bd0f8":"jquery.js","b72a0aa436a8a8965041beda30577232677ef6588bb933b5bebed2de02c04dc8":"jquery.min.js","4db510700e5773fc7065f36363affd4885c9d9ef257fd7757744f91ac9da5671":"jquery.slim.js","4c369c555423651822c2f7772d5e0b9a56a2372a92657bd2a696fe539b24be9e":"jquery.slim.min.js","10b3ccff4cf14cdb5e7c31b2d323be750a13125cea8ded9ca5c1da4150a69238":"jquery.js","19e065eaadf26f58c0e1081a2e0e64450eec2983eebb08f998ecaacac8642a47":"jquery.min.js","bad41b5e9f7c6b952b3a840b84ce2e97e3029bd2b2773c58a69a33e73217d1e4":"core.js","8eb3cb67ef2f0f1b76167135cef6570a409c79b23f0bc0ede71c9a4018f1408a":"jquery.js","266bcea0bb58b26aa5b16c5aee60d22ccc1ae9d67daeb21db6bad56119c3447d":"jquery.min.js","1a9ea1a741fe03b6b1835b44ac2b9c59e39cdfc8abb64556a546c16528fc2828":"jquery.slim.js","45fe0169d7f20adb2f1e63bcf4151971b62f34dbd9bce4f4f002df133bc2b03d":"jquery.slim.min.js","893e90f6230962e42231635df650f20544ad22affc3ee396df768eaa6bc5a6a2":"jquery.js","05b85d96f41fff14d8f608dad03ab71e2c1017c2da0914d7c59291bad7a54f8e":"jquery.min.js","95a5d6b46c9da70a89f0903e5fdc769a2c266a22a19fcb5598e5448a044db4fe":"jquery.js","6b6de0d4db7876d1183a3edb47ebd3bbbf93f153f5de1ba6645049348628109a":"jquery.min.js","e3fcd40aa8aad24ab1859232a781b41a4f803ad089b18d53034d24e4296c6581":"jquery.js","dfa729d82a3effadab1000181cb99108f232721e3b0af74cfae4c12704b35a32":"jquery.min.js","78d714ccede3b2fd179492ef7851246c1f1b03bfc2ae83693559375e99a7c077":"jquery.js","82f420005cd31fab6b4ab016a07d623e8f5773de90c526777de5ba91e9be3b4d":"jquery.min.js","a18aa92dea997bd71eb540d5f931620591e9dee27e5f817978bb385bab924d21":"jquery.js","8a102873a33f24f7eb22221e6b23c4f718e29f85168ecc769a35bfaed9b12cce":"jquery.min.js","b2215cce5830e2350b9d420271d9bd82340f664c3f60f0ea850f7e9c0392704e":"jquery.js","22642f202577f0ba2f22cbe56b6cf291a09374487567cd3563e0d2a29f75c0c5":"jquery.min.js","828cbbcacb430f9c5b5d27fe9302f8795eb338f2421010f5141882125226f94f":"jquery.js","2051d61446d4dbffb03727031022a08c84528ab44d203a7669c101e5fbdd5515":"jquery.min.js","07cb07bdfba40ceff869b329eb48eeede41740ba6ce833dd3830bd0af49e4898":"jquery.js","64c51d974a342e9df3ed548082a4ad7816d407b8c36b67356dde9e487b819cbe":"jquery.min.js","dc0083a233768ed8554d770d9d4eed91c0e27de031b3d9cbdcecabc034265010":"jquery.js","293c9966a4fea0fed0adc1aae242bb37e428e649337dcab65d9af5934a7cc775":"jquery.min.js","5adbbda8312291291162ab054df8927291426dbfb550099945ece85b49707290":"jquery.js","d246298c351558d4847d237bb2d052f22001ca24ea4a32c28de378c95af523c8":"jquery.min.js","e96b9e8d7a12b381d2ed1efd785faef3c7bad0ea03edf42fb15c9fde533e761f":"jquery.js","5aed44447956d7933861d56003dbd0f95504d79e19d094edacbe4a55e6cf8736":"jquery.min.js","140ff438eaaede046f1ceba27579d16dc980595709391873fa9bf74d7dbe53ac":"jquery.js","c0d4098bc8b34c6f87a3d7723988ae81214a53a0bb4a1d4d36a67640f98ed079":"jquery.min.js","88d96de8ccf65e57a3f28134616e3abfe0af2b3712302beb0a73f77f6b873fd0":"jquery.js","11f94218bacdd4dbdc5c1736ca7aa1f27bb9632bc0a1696175b408da8dcf16b3":"jquery.min.js","8eb83f00967dd0e18877b71349f5a3641b1046a1667c54e602a5682ac0f07ab9":"jquery.js","7ebd0c0a5a088da45a5ec48f4379dbe457129f2cbe434f2e045ef838136746a9":"jquery.min.js","97efd5af482f4e74c37c04970421fdbd17388fd605d992a2aa0077d388b32b6d":"jquery.js","22966516a31e64225df5e08e35f0fadb27d29a8fb2618ddca17ec171215fc323":"jquery.min.js","0fa7752926a95e3ab6b5f67a21ef40628ce4447c81ddf4f6cacf663b6fb85af7":"jquery.js","f284353a7cc4d97f6fe20a5155131bd43587a0f1c98a56eeaf52cff72910f47d":"jquery.min.js","9427fe2df51f7d4c6bf35f96d19169714d0b432b99dc18f41760d0342c538122":"jquery.js","a57b5242b9a9adc4c1ef846c365147b89c472b9cd770face331efcb965346b25":"jquery.min.js","d2ed0720108a75db0d53248ba8e36332658064c4189714d16c0f117efb42016d":"jquery.js","9d7d1c727e1cd32745764098a76e5d3d5fb7acd3b6527c5aacd85b7c6f8ce341":"jquery.min.js","820fb338fe8c7478a1b820e2708b4fd306a68825de1194803e7a93fbc2177a16":"jquery.js","4e1354fc542b617c58cbba3aeb5116a528cf08bb1299f5dc7f3bc77a3b902b68":"jquery.min.js","896e379d334cf0b16c78d9962a1579147156d4a72355032fce0de5f673d4e287":"jquery.js","d482871a5e948cb4884fa0972ea98a81abca057b6bd3f8c995a18c12487e761c":"jquery.min.js","430f36f9b5f21aae8cc9dca6a81c4d3d84da5175eaedcf2fdc2c226302cb3575":"jquery.js","668b046d12db350ccba6728890476b3efee53b2f42dbb84743e5e9f1ae0cc404":"jquery.min.js","d5732912d03878a5cd3695dc275a6630fb3c255fa7c0b744ab08897824049327":"jquery.js","69a3831c082fc105b56c53865cc797fa90b83d920fb2f9f6875b00ad83a18174":"jquery.min.js","5540b2af46570795610626e8d8391356176ca639b1520c4319a2d0c7ba9bef16":"jquery.js","95914789b5f3307a3718679e867d61b9d4c03f749cd2e2970570331d7d6c8ed9":"jquery.min.js","56e843a66b2bf7188ac2f4c81df61608843ce144bd5aa66c2df4783fba85e8ef":"jquery.js","2359d383bf2d4ab65ebf7923bdf74ce40e4093f6e58251b395a64034b3c39772":"jquery.min.js","c85537acad72f0d7d409dfc1e2d2daa59032f71d29642a8b64b9852f70166fbb":"jquery.js","5f1ab65fe2ad6b381a1ae036716475bf78c9b2e309528cf22170c1ddeefddcbf":"jquery.min.js","2065aecca0fb9b0567358d352ed5f1ab72fce139bf449b4d09805f5d9c3725ed":"jquery.js","aec3d419d50f05781a96f223e18289aeb52598b5db39be82a7b71dc67d6a7947":"jquery.min.js","58c27035b7a2e589df397e5d7e05424b90b8c1aaaf73eff47d5ed6daecb70f25":"jquery.js","d4ec583c7604001f87233d1fe0076cbd909f15a5f8c6b4c3f5dd81b462d79d32":"jquery.min.js","648dbce0f3731ebce091c283b52f60b100d73807501eea1a99f7b23140bfcefa":"jquery.js","06d766022172da3774651a3ccfeef893185f9ba46823bcbfcba744ab5e25a4bf":"jquery.min.js","8241d4982de8a6fea3e0ebc47e99445337675a777054c09221f670adb3748995":"jquery.js","a581c274adebdbc44022e45d9febf0b92c572481c58bfe562b3d74d5e8972c5a":"jquery.min.js","0aab28e2fd1f61b6282132553325bd890fef40989b698311c5b00b7b38a1e19d":"jquery.js","99ec4d1ab56cf49ee4c202cc41509ada5eeb334694815f75675792433828a527":"jquery.min.js","3029834a820c79c154c377f52e2719fc3ff2a27600a07ae089ea7fde9087f6bc":"jquery.js","540bc6dec1dd4b92ea4d3fb903f69eabf6d919afd48f4e312b163c28cff0f441":"jquery.min.js","84792d2b1ab8a2d57dcc113abb910b4c31dda357a7acd3b46ed282dd03f15d25":"jquery.js","5f58804382f5258bb6b187c1b5af1ec0b8ccbe2c904a5163580371352ca63424":"jquery.min.js","847a61382a55d0c0e5244d0621f1e0674292dee6b850640c669fd1516ec9f4f5":"jquery.js","51fc79c1828a885f3776e35d56a22895e3656d014b502b869bd05f891bd91602":"jquery.min.js","ce0343e1d6f489768eeefe022c12181c6a0822e756239851310acf076d23d10c":"jquery.js","b294e973896f8f874e90a8eb1a8908ac790980d034c4c4bdf0fc3d37b8abf682":"jquery.min.js","8ade6740a1d3cfedf81e28d9250929341207b23a55f1be90ccc26cf6d98e052a":"jquery.js","89a15e9c40bc6b14809f236ee8cd3ed1ea42393c1f6ca55c7855cd779b3f922e":"jquery.min.js","ebaded49db62a60060caa2577f2a4ec1ff68726bc40861bc65d977abeb64fa7d":"jquery.js","8bf150f6b29d6c9337de6c945a8f63c929b203442040688878bc2753fe13e007":"jquery.min.js","8aa0f84b5331efcc3cb72c7d504c2bc6ebd861da003d72c33df99ce650d4531d":"jquery.js","1e80de36726582824df3f9a7eb6ecdfe9827fc5a7c69f597b1502ebc13950ecd":"jquery.min.js","7bd80d06c01c0340c1b9159b9b4a197db882ca18cbac8e9b9aa025e68f998d40":"jquery.js","c12f6098e641aaca96c60215800f18f5671039aecf812217fab3c0d152f6adb4":"jquery.min.js","4d7b01c2f6043bcee83a33d0f627dc6fbc27dc8aeb5bdd5d863e84304b512ef3":"jquery.js","7fa0d5c3f538c76f878e012ac390597faecaabfe6fb9d459b919258e76c5df8e":"jquery.min.js","756d7dfac4a35bb57543f677283d6c682e8d704e5350884b27325badd2b3c4a7":"jquery.js","61c6caebd23921741fb5ffe6603f16634fca9840c2bf56ac8201e9264d6daccf":"jquery.min.js","ba8f203a9ebbe5771f49bcbe0804079240c7225f4be6ab424769bfbfb35ebc35":"jquery.js","f23d4b309b72743aa8afe1f8c98a25b3ee31246fa572c66d9d8cb1982cae4fbc":"jquery.min.js","7614fc75c4fcf6f32f7307f37550440e12adefb9289226acb79020c66faeffea":"jquery.js","a1305347219d673cc973172494248e557ce8eccaf65af995c07c9d7daed4475d":"jquery.min.js","04ee795a1a5a908ee339e145ae6c6b394d1dc0d971fd0896e3cb776660adba2e":"jquery.js","d73e2e1bff9c55b85284ff287cb20dc29ad9165ec09091a0597b61199f330805":"jquery.min.js","47b68dce8cb6805ad5b3ea4d27af92a241f4e29a5c12a274c852e4346a0500b4":"jquery.min.js","88171413fc76dda23ab32baa17b11e4fff89141c633ece737852445f1ba6c1bd":"jquery.min.js","ff4e4975ef403004f8fe8e59008db7ad47f54b10d84c72eb90e728d1ec9157ce":"jquery.min.js","54964f8b580ad795a962fb27066715d3281ae1ad13a28bf8aedd5d8859ebae37":"jquery.js","951d6bae39eb172f57a88bd686f7a921cf060fd21f59648f0d20b6a8f98fc5a5":"jquery.min.js","9baa10e1c5630c3dcd9bb46bf00913cc94b3855d58c9459ae9848339c566e97b":"jquery.js","d3f3779f5113da6da957c4d81481146a272c31aefe0d3e4b64414fd686fd9744":"jquery.min.js","a57292619d14eb8cbd923bde9f28cf994ac66abc48f7c975b769328ff33bddc9":"jquery.js","fefb084f14120d777c7857ba78603e8531a0778b2e639df7622513c70567afa0":"jquery.min.js","0eef76a9583a6c7a1eb764d33fe376bfe1861df79fab82c2c3f5d16183e82016":"jquery.js","c784376960f3163dc760bc019e72e5fed78203745a5510c69992a39d1d8fe776":"jquery.min.js","e2ea0a6ca6b984a9405a759d24cf3c51eb3164e5c43e95c3e9a59b316be7b3b9":"jquery.js","764b9e9f3ad386aaa5cdeae9368353994de61c0bede087c8f7e3579cb443de3b":"jquery.min.js","b31cd094af7950b3a461dc78161fd2faf01faa9d0ed8c1c072790f83ab26d482":"jquery.js","517364f2d45162fb5037437b5b6cb953d00d9b2b3b79ba87d9fe57ea6ee6070c":"jquery.min.js","0e3303a3a0cec95ebc8c3cc3e19fc71c99487faa286b05d01a3eb8cca4d90bc7":"jquery.js","f800b399e5c7a5254fc66bb407117fe38dbde0528780e68c9f7c87d299f8486a":"jquery.min.js","95c023c80dfe0d30304c58244878995061f87801a66daa5d6bf4f2512be0e6f9":"jquery.js","e23a2a4e2d7c2b41ebcdd8ffc0679df7140eb7f52e1eebabf827a88182643c59":"jquery.min.js","9edc9f813781eca2aad6de78ef85cdbe92ee32bb0a56791be4da0fa7b472c1d8":"jquery.js","2cec78f739fbddfed852cd7934d2530e7cc4c8f14b38673b03ba5fb880ad4cc7":"jquery.min.js","882927b9aadb2504b5c6a823bd8c8c516f21dec6e441fe2c8fa228e35951bcc8":"jquery.js","89abaf1e2471b00525b0694048e179c0f39a2674e3bcb34460ea6bc4801882be":"jquery.min.js","74537639fa585509395c0d3b9a5601dd1e4ca036961c53dc5ab0e87386aa9be1":"jquery.js","c8370a2d050359e9d505acc411e6f457a49b21360a21e6cbc9229bad3a767899":"jquery.min.js","0ae058559b3e65d6cc5674fe3ff01581da5ae62387bb0dfa2923997a52093a06":"jquery.js","17ec1f16efac893b9bd89bba5f13cb1e0bf938bdc9cece6cae3ed77f18fa6fd7":"jquery.min.js","a7756f21ff6c558f983d5376072174af546e8d07f8bebe1e6f760b2f4b53012d":"jquery.js","900191a443115d8b48a9d68d3062e8b3d7129727951b8617465b485baf253006":"jquery.min.js","3cc5c121471323b25de45fcab48631d4a09c78e76af21c10d747352682605587":"jquery.js","d548530775a6286f49ba66e0715876b4ec5985966b0291c21568fecfc4178e8d":"jquery.min.js","d977fc32dd4bdb0479604abf078f1045b0e922666313f2f42cd71ce7835e0061":"jquery.js","f1c4a0a7b5dead231fc9b42f06965a036ab7a2a788768847eb81e1528d6402ad":"jquery.min.js"}



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
		dbg_print("%c Local storage: ", 'color: red;');
		for(var i in items){
			dbg_print("%c "+i+" = "+items[i], 'color: blue;');
		}
	}
	dbg_print("%c Variable 'unused_data': ", 'color: red;');
	dbg_print(unused_data);
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
			unused_data[tab_id] = new_blocked_data; 
		} else{
			unused_data[tab_id] = new_blocked_data; 
			dbg_print("[TABID:"+tab_id+"]"+"Sending blocked_info directly to browser action");
			active_connections[tab_id].postMessage({"show_info":new_blocked_data});
			delete active_connections[tab_id];
		}
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
				unused_data[tab_id][type_key].push(blocked_info[type]);
				resolve(res);
			} else{
				resolve(res);
			}
		}
		webex.storage.local.get(get_sto);
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

				// The space char is a valid delimiter because encodeURI() replaces it with %20 
				var scriptkey = m[val][0];
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
*	Turns a blob URL into a data URL
*
*/
function get_data_url(blob,url){
	return new Promise((resolve, reject) => {
		//var url = URL.createObjectURL(blob);
		var reader  = new FileReader();
		reader.addEventListener("load", function(){
			//console.log("redirecting");
			//console.log(url);
			//console.log("to");
			//console.log(reader.result);		
			resolve({"redirectUrl": reader.result});
		});
		reader.readAsDataURL(blob);
	});
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
			return;
		}
		webex.storage.local.get(cb);
	});
}
/* *********************************************************************************************** */


var fname_data = {
	"WebGLShader": true,
	"WebGLShaderPrecisionFormat": true,
	"WebGLQuery": true,
	"WebGLRenderbuffer": true,
	"WebGLSampler": true,
	"WebGLUniformLocation": true,
	"WebGLFramebuffer": true,
	"WebGLProgram": true,
	"WebGLContextEvent": true,
	"WebGL2RenderingContext": true,
	"WebGLTexture": true,
	"WebGLRenderingContext": true,
	"WebGLVertexArrayObject": true,
	"WebGLActiveInfo": true,
	"WebGLTransformFeedback": true,
	"WebGLSync": true,
	"WebGLBuffer": true,
	"cat_svg": true,
	"SVGPoint": true,
	"SVGEllipseElement": true,
	"SVGRadialGradientElement": true,
	"SVGComponentTransferFunctionElement": true,
	"SVGPathSegCurvetoQuadraticAbs": true,
	"SVGAnimatedNumberList": true,
	"SVGPathSegCurvetoQuadraticSmoothRel": true,
	"SVGFEColorMatrixElement": true,
	"SVGPathSegLinetoHorizontalAbs": true,
	"SVGLinearGradientElement": true,
	"SVGStyleElement": true,
	"SVGPathSegMovetoRel": true,
	"SVGStopElement": true,
	"SVGPathSegLinetoRel": true,
	"SVGFEConvolveMatrixElement": true,
	"SVGAnimatedAngle": true,
	"SVGPathSegLinetoAbs": true,
	"SVGPreserveAspectRatio": true,
	"SVGFEOffsetElement": true,
	"SVGFEImageElement": true,
	"SVGFEDiffuseLightingElement": true,
	"SVGAnimatedNumber": true,
	"SVGTextElement": true,
	"SVGFESpotLightElement": true,
	"SVGFEMorphologyElement": true,
	"SVGAngle": true,
	"SVGScriptElement": true,
	"SVGFEDropShadowElement": true,
	"SVGPathSegArcRel": true,
	"SVGNumber": true,
	"SVGPathSegLinetoHorizontalRel": true,
	"SVGFEFuncBElement": true,
	"SVGClipPathElement": true,
	"SVGPathSeg": true,
	"SVGUseElement": true,
	"SVGPathSegArcAbs": true,
	"SVGPathSegCurvetoQuadraticSmoothAbs": true,
	"SVGRect": true,
	"SVGAnimatedPreserveAspectRatio": true,
	"SVGImageElement": true,
	"SVGAnimatedEnumeration": true,
	"SVGAnimatedLengthList": true,
	"SVGFEFloodElement": true,
	"SVGFECompositeElement": true,
	"SVGAElement": true,
	"SVGAnimatedBoolean": true,
	"SVGMaskElement": true,
	"SVGFilterElement": true,
	"SVGPathSegLinetoVerticalRel": true,
	"SVGAnimatedInteger": true,
	"SVGTSpanElement": true,
	"SVGMarkerElement": true,
	"SVGStringList": true,
	"SVGTransform": true,
	"SVGTitleElement": true,
	"SVGFEBlendElement": true,
	"SVGTextPositioningElement": true,
	"SVGFEFuncGElement": true,
	"SVGFEPointLightElement": true,
	"SVGAnimateElement": true,
	"SVGPolylineElement": true,
	"SVGDefsElement": true,
	"SVGPathSegList": true,
	"SVGAnimatedTransformList": true,
	"SVGPathSegClosePath": true,
	"SVGGradientElement": true,
	"SVGSwitchElement": true,
	"SVGViewElement": true,
	"SVGUnitTypes": true,
	"SVGPathSegMovetoAbs": true,
	"SVGSymbolElement": true,
	"SVGFEFuncAElement": true,
	"SVGAnimatedString": true,
	"SVGFEMergeElement": true,
	"SVGPathSegLinetoVerticalAbs": true,
	"SVGAnimationElement": true,
	"SVGPathSegCurvetoCubicAbs": true,
	"SVGLength": true,
	"SVGTextPathElement": true,
	"SVGPolygonElement": true,
	"SVGAnimatedRect": true,
	"SVGPathSegCurvetoCubicRel": true,
	"SVGFEFuncRElement": true,
	"SVGLengthList": true,
	"SVGTextContentElement": true,
	"SVGFETurbulenceElement": true,
	"SVGMatrix": true,
	"SVGZoomAndPan": true,
	"SVGMetadataElement": true,
	"SVGFEDistantLightElement": true,
	"SVGAnimateMotionElement": true,
	"SVGDescElement": true,
	"SVGPathSegCurvetoCubicSmoothRel": true,
	"SVGFESpecularLightingElement": true,
	"SVGFEGaussianBlurElement": true,
	"SVGFEComponentTransferElement": true,
	"SVGNumberList": true,
	"SVGTransformList": true,
	"SVGForeignObjectElement": true,
	"SVGRectElement": true,
	"SVGFEDisplacementMapElement": true,
	"SVGAnimateTransformElement": true,
	"SVGAnimatedLength": true,
	"SVGPointList": true,
	"SVGPatternElement": true,
	"SVGPathSegCurvetoCubicSmoothAbs": true,
	"SVGCircleElement": true,
	"SVGSetElement": true,
	"SVGFETileElement": true,
	"SVGMPathElement": true,
	"SVGFEMergeNodeElement": true,
	"SVGPathSegCurvetoQuadraticRel": true,
	"SVGElement": true,
	"SVGGraphicsElement": true,
	"SVGSVGElement": true,
	"SVGGElement": true,
	"SVGGeometryElement": true,
	"SVGPathElement": true,
	"SVGLineElement": true,
	"cat_html": true,
	"HTMLTimeElement": true,
	"HTMLPictureElement": true,
	"HTMLMenuItemElement": true,
	"HTMLFormElement": true,
	"HTMLOptionElement": true,
	"HTMLCanvasElement": true,
	"HTMLTableSectionElement": true,
	"HTMLSelectElement": true,
	"HTMLUListElement": true,
	"HTMLMetaElement": true,
	"HTMLLinkElement": true,
	"HTMLBaseElement": true,
	"HTMLDataListElement": true,
	"HTMLInputElement": true,
	"HTMLMeterElement": true,
	"HTMLSourceElement": true,
	"HTMLTrackElement": true,
	"HTMLTableColElement": true,
	"HTMLFieldSetElement": true,
	"HTMLDirectoryElement": true,
	"HTMLTableCellElement": true,
	"HTMLStyleElement": true,
	"HTMLAudioElement": true,
	"HTMLLegendElement": true,
	"HTMLOListElement": true,
	"HTMLEmbedElement": true,
	"HTMLQuoteElement": true,
	"HTMLMenuElement": true,
	"HTMLHeadElement": true,
	"HTMLUnknownElement": true,
	"HTMLBRElement": true,
	"HTMLProgressElement": true,
	"HTMLMediaElement": true,
	"HTMLFormControlsCollection": true,
	"HTMLCollection": true,
	"HTMLLIElement": true,
	"HTMLDetailsElement": true,
	"HTMLObjectElement": true,
	"HTMLHeadingElement": true,
	"HTMLTableCaptionElement": true,
	"HTMLPreElement": true,
	"HTMLAllCollection": true,
	"HTMLFrameSetElement": true,
	"HTMLFontElement": true,
	"HTMLFrameElement": true,
	"HTMLAnchorElement": true,
	"HTMLOptGroupElement": true,
	"HTMLVideoElement": true,
	"HTMLModElement": true,
	"HTMLBodyElement": true,
	"HTMLTableElement": true,
	"HTMLButtonElement": true,
	"HTMLTableRowElement": true,
	"HTMLAreaElement": true,
	"HTMLDataElement": true,
	"HTMLParamElement": true,
	"HTMLLabelElement": true,
	"HTMLTemplateElement": true,
	"HTMLOptionsCollection": true,
	"HTMLIFrameElement": true,
	"HTMLTitleElement": true,
	"HTMLMapElement": true,
	"HTMLOutputElement": true,
	"HTMLDListElement": true,
	"HTMLParagraphElement": true,
	"HTMLHRElement": true,
	"HTMLImageElement": true,
	"HTMLDocument": true,
	"HTMLElement": true,
	"HTMLScriptElement": true,
	"HTMLHtmlElement": true,
	"HTMLTextAreaElement": true,
	"HTMLDivElement": true,
	"HTMLSpanElement": true,
	"cat_css": true,
	"CSSStyleRule": true,
	"CSSFontFaceRule": true,
	"CSSPrimitiveValue": true,
	"CSSStyleDeclaration": true,
	"CSSStyleSheet": true,
	"CSSPageRule": true,
	"CSSSupportsRule": true,
	"CSSMozDocumentRule": true,
	"CSSKeyframeRule": true,
	"CSSGroupingRule": true,
	"CSS2Properties": true,
	"CSSFontFeatureValuesRule": true,
	"CSSRuleList": true,
	"CSSPseudoElement": true,
	"CSSMediaRule": true,
	"CSSCounterStyleRule": true,
	"CSSImportRule": true,
	"CSSTransition": true,
	"CSSAnimation": true,
	"CSSValue": true,
	"CSSNamespaceRule": true,
	"CSSRule": true,
	"CSS": true,
	"CSSKeyframesRule": true,
	"CSSConditionRule": true,
	"CSSValueList": true,
	"cat_event": true,
	"ondevicemotion": true,
	"ondeviceorientation": true,
	"onabsolutedeviceorientation": true,
	"ondeviceproximity": true,
	"onuserproximity": true,
	"ondevicelight": true,
	"onvrdisplayconnect": true,
	"onvrdisplaydisconnect": true,
	"onvrdisplayactivate": true,
	"onvrdisplaydeactivate": true,
	"onvrdisplaypresentchange": true,
	"onabort": true,
	"onblur": true,
	"onfocus": true,
	"onauxclick": true,
	"oncanplay": true,
	"oncanplaythrough": true,
	"onchange": true,
	"onclick": true,
	"onclose": true,
	"oncontextmenu": true,
	"ondblclick": true,
	"ondrag": true,
	"ondragend": true,
	"ondragenter": true,
	"ondragexit": true,
	"ondragleave": true,
	"ondragover": true,
	"ondragstart": true,
	"ondrop": true,
	"ondurationchange": true,
	"onemptied": true,
	"onended": true,
	"oninput": true,
	"oninvalid": true,
	"onkeydown": true,
	"onkeypress": true,
	"onkeyup": true,
	"onload": true,
	"onloadeddata": true,
	"onloadedmetadata": true,
	"onloadend": true,
	"onloadstart": true,
	"onmousedown": true,
	"onmouseenter": true,
	"onmouseleave": true,
	"onmousemove": true,
	"onmouseout": true,
	"onmouseover": true,
	"onmouseup": true,
	"onwheel": true,
	"onpause": true,
	"onplay": true,
	"onplaying": true,
	"onprogress": true,
	"onratechange": true,
	"onreset": true,
	"onresize": true,
	"onscroll": true,
	"onseeked": true,
	"onseeking": true,
	"onselect": true,
	"onshow": true,
	"onstalled": true,
	"onsubmit": true,
	"onsuspend": true,
	"ontimeupdate": true,
	"onvolumechange": true,
	"onwaiting": true,
	"onselectstart": true,
	"ontoggle": true,
	"onpointercancel": true,
	"onpointerdown": true,
	"onpointerup": true,
	"onpointermove": true,
	"onpointerout": true,
	"onpointerover": true,
	"onpointerenter": true,
	"onpointerleave": true,
	"ongotpointercapture": true,
	"onlostpointercapture": true,
	"onmozfullscreenchange": true,
	"onmozfullscreenerror": true,
	"onanimationcancel": true,
	"onanimationend": true,
	"onanimationiteration": true,
	"onanimationstart": true,
	"ontransitioncancel": true,
	"ontransitionend": true,
	"ontransitionrun": true,
	"ontransitionstart": true,
	"onwebkitanimationend": true,
	"onwebkitanimationiteration": true,
	"onwebkitanimationstart": true,
	"onwebkittransitionend": true,
	"onerror": true,
	"onafterprint": true,
	"onbeforeprint": true,
	"onbeforeunload": true,
	"onhashchange": true,
	"onlanguagechange": true,
	"onmessage": true,
	"onmessageerror": true,
	"onoffline": true,
	"ononline": true,
	"onpagehide": true,
	"onpageshow": true,
	"onpopstate": true,
	"onstorage": true,
	"onunload": true,
	"cat_rtc": true,
	"RTCDTMFSender": true,
	"RTCStatsReport": true,
	"RTCTrackEvent": true,
	"RTCDataChannelEvent": true,
	"RTCPeerConnectionIceEvent": true,
	"RTCCertificate": true,
	"RTCDTMFToneChangeEvent": true,
	"RTCPeerConnection": true,
	"RTCIceCandidate": true,
	"RTCRtpReceiver": true,
	"RTCRtpSender": true,
	"RTCSessionDescription": true,
	"cat_vr": true,
	"VRStageParameters": true,
	"VRFrameData": true,
	"VRDisplay": true,
	"VRDisplayEvent": true,
	"VRFieldOfView": true,
	"VRDisplayCapabilities": true,
	"VREyeParameters": true,
	"VRPose": true,
	"cat_dom": true,
	"DOMStringMap": true,
	"DOMRectReadOnly": true,
	"DOMException": true,
	"DOMRect": true,
	"DOMMatrix": true,
	"DOMMatrixReadOnly": true,
	"DOMPointReadOnly": true,
	"DOMPoint": true,
	"DOMQuad": true,
	"DOMRequest": true,
	"DOMParser": true,
	"DOMTokenList": true,
	"DOMStringList": true,
	"DOMImplementation": true,
	"DOMError": true,
	"DOMRectList": true,
	"DOMCursor": true,
	"cat_idb": true,
	"IDBFileRequest": true,
	"IDBTransaction": true,
	"IDBCursor": true,
	"IDBFileHandle": true,
	"IDBMutableFile": true,
	"IDBKeyRange": true,
	"IDBVersionChangeEvent": true,
	"IDBObjectStore": true,
	"IDBFactory": true,
	"IDBCursorWithValue": true,
	"IDBOpenDBRequest": true,
	"IDBRequest": true,
	"IDBIndex": true,
	"IDBDatabase": true,
	"cat_audio": true,
	"AudioContext": true,
	"AudioBuffer": true,
	"AudioBufferSourceNode": true,
	"Audio": true,
	"MediaElementAudioSourceNode": true,
	"AudioNode": true,
	"BaseAudioContext": true,
	"AudioListener": true,
	"MediaStreamAudioSourceNode": true,
	"OfflineAudioContext": true,
	"AudioDestinationNode": true,
	"AudioParam": true,
	"MediaStreamAudioDestinationNode": true,
	"OfflineAudioCompletionEvent": true,
	"AudioStreamTrack": true,
	"AudioScheduledSourceNode": true,
	"AudioProcessingEvent": true,
	"cat_gamepad": true,
	"GamepadButton": true,
	"GamepadHapticActuator": true,
	"GamepadAxisMoveEvent": true,
	"GamepadPose": true,
	"GamepadEvent": true,
	"Gamepad": true,
	"GamepadButtonEvent": true,
	"cat_media": true,
	"MediaKeys": true,
	"MediaKeyError": true,
	"MediaSource": true,
	"MediaDevices": true,
	"MediaKeyStatusMap": true,
	"MediaStreamTrackEvent": true,
	"MediaRecorder": true,
	"MediaQueryListEvent": true,
	"MediaStream": true,
	"MediaEncryptedEvent": true,
	"MediaStreamTrack": true,
	"MediaError": true,
	"MediaStreamEvent": true,
	"MediaQueryList": true,
	"MediaKeySystemAccess": true,
	"MediaDeviceInfo": true,
	"MediaKeySession": true,
	"MediaList": true,
	"MediaRecorderErrorEvent": true,
	"MediaKeyMessageEvent": true,
	"cat_event2": true,
	"SpeechSynthesisErrorEvent": true,
	"BeforeUnloadEvent": true,
	"CustomEvent": true,
	"PageTransitionEvent": true,
	"PopupBlockedEvent": true,
	"CloseEvent": true,
	"ProgressEvent": true,
	"MutationEvent": true,
	"MessageEvent": true,
	"FocusEvent": true,
	"TrackEvent": true,
	"DeviceMotionEvent": true,
	"TimeEvent": true,
	"PointerEvent": true,
	"UserProximityEvent": true,
	"StorageEvent": true,
	"DragEvent": true,
	"MouseScrollEvent": true,
	"EventSource": true,
	"PopStateEvent": true,
	"DeviceProximityEvent": true,
	"SpeechSynthesisEvent": true,
	"XMLHttpRequestEventTarget": true,
	"ClipboardEvent": true,
	"AnimationPlaybackEvent": true,
	"DeviceLightEvent": true,
	"BlobEvent": true,
	"MouseEvent": true,
	"WheelEvent": true,
	"InputEvent": true,
	"HashChangeEvent": true,
	"DeviceOrientationEvent": true,
	"CompositionEvent": true,
	"KeyEvent": true,
	"ScrollAreaEvent": true,
	"KeyboardEvent": true,
	"TransitionEvent": true,
	"ErrorEvent": true,
	"AnimationEvent": true,
	"FontFaceSetLoadEvent": true,
	"EventTarget": true,
	"captureEvents": true,
	"releaseEvents": true,
	"Event": true,
	"UIEvent": true,
	"cat_other": false,
	"undefined": false,
	"Array": false,
	"Boolean": false,
	"JSON": false,
	"Date": false,
	"Math": false,
	"Number": false,
	"String": false,
	"RegExp": false,
	"Error": false,
	"InternalError": false,
	"EvalError": false,
	"RangeError": false,
	"ReferenceError": false,
	"SyntaxError": false,
	"TypeError": false,
	"URIError": false,
	"ArrayBuffer": true,
	"Int8Array": true,
	"Uint8Array": true,
	"Int16Array": true,
	"Uint16Array": true,
	"Int32Array": true,
	"Uint32Array": true,
	"Float32Array": true,
	"Float64Array": true,
	"Uint8ClampedArray": true,
	"Proxy": true,
	"WeakMap": true,
	"Map": true,
	"Set": true,
	"DataView": false,
	"Symbol": false,
	"SharedArrayBuffer": true,
	"Intl": false,
	"TypedObject": true,
	"Reflect": true,
	"SIMD": true,
	"WeakSet": true,
	"Atomics": true,
	"Promise": true,
	"WebAssembly": true,
	"NaN": false,
	"Infinity": false,
	"isNaN": false,
	"isFinite": false,
	"parseFloat": false,
	"parseInt": false,
	"escape": false,
	"unescape": false,
	"decodeURI": false,
	"encodeURI": false,
	"decodeURIComponent": false,
	"encodeURIComponent": false,
	"uneval": false,
	"BatteryManager": true,
	"CanvasGradient": true,
	"TextDecoder": true,
	"Plugin": true,
	"PushManager": true,
	"ChannelMergerNode": true,
	"PerformanceResourceTiming": true,
	"ServiceWorker": true,
	"TextTrackCueList": true,
	"PerformanceEntry": true,
	"TextTrackList": true,
	"StyleSheet": true,
	"PerformanceMeasure": true,
	"DesktopNotificationCenter": true,
	"Comment": true,
	"DelayNode": true,
	"XPathResult": true,
	"CDATASection": true,
	"MessageChannel": true,
	"BiquadFilterNode": true,
	"SpeechSynthesisUtterance": true,
	"Crypto": true,
	"Navigator": true,
	"FileList": true,
	"URLSearchParams": false,
	"ServiceWorkerContainer": true,
	"ValidityState": true,
	"ProcessingInstruction": true,
	"AbortSignal": true,
	"FontFace": true,
	"FileReader": true,
	"Worker": true,
	"External": true,
	"ImageBitmap": true,
	"TimeRanges": true,
	"Option": true,
	"TextTrack": true,
	"Image": true,
	"AnimationTimeline": true,
	"VideoPlaybackQuality": true,
	"VTTCue": true,
	"Storage": true,
	"XPathExpression": true,
	"CharacterData": false,
	"TextMetrics": true,
	"AnimationEffectReadOnly": true,
	"PerformanceTiming": false,
	"PerformanceMark": true,
	"ImageBitmapRenderingContext": true,
	"Headers": true,
	"Range": false,
	"Rect": true,
	"AnimationEffectTimingReadOnly": true,
	"KeyframeEffect": true,
	"Permissions": true,
	"TextEncoder": true,
	"ImageData": true,
	"SpeechSynthesisVoice": true,
	"StorageManager": true,
	"TextTrackCue": true,
	"WebSocket": true,
	"DocumentType": true,
	"XPathEvaluator": true,
	"PerformanceNavigationTiming": true,
	"IdleDeadline": true,
	"FileSystem": true,
	"FileSystemFileEntry": true,
	"CacheStorage": true,
	"MimeType": true,
	"PannerNode": true,
	"NodeFilter": true,
	"StereoPannerNode": true,
	"console": false,
	"DynamicsCompressorNode": true,
	"PaintRequest": true,
	"RGBColor": true,
	"FontFaceSet": false,
	"PaintRequestList": true,
	"FileSystemEntry": true,
	"XMLDocument": false,
	"SourceBuffer": false,
	"Screen": true,
	"NamedNodeMap": false,
	"History": true,
	"Response": true,
	"AnimationEffectTiming": true,
	"ServiceWorkerRegistration": true,
	"CanvasRenderingContext2D": true,
	"ScriptProcessorNode": true,
	"FileSystemDirectoryReader": true,
	"MimeTypeArray": true,
	"CanvasCaptureMediaStream": true,
	"Directory": true,
	"mozRTCPeerConnection": true,
	"PerformanceObserverEntryList": true,
	"PushSubscriptionOptions": true,
	"Text": false,
	"IntersectionObserverEntry": true,
	"SubtleCrypto": true,
	"Animation": true,
	"DataTransfer": true,
	"TreeWalker": true,
	"XMLHttpRequest": true,
	"LocalMediaStream": true,
	"ConvolverNode": true,
	"WaveShaperNode": true,
	"DataTransferItemList": false,
	"Request": true,
	"SourceBufferList": false,
	"XSLTProcessor": true,
	"XMLHttpRequestUpload": true,
	"SharedWorker": true,
	"Notification": false,
	"DataTransferItem": true,
	"AnalyserNode": true,
	"mozRTCIceCandidate": true,
	"PerformanceObserver": true,
	"OfflineResourceList": true,
	"FileSystemDirectoryEntry": true,
	"DesktopNotification": false,
	"DataChannel": true,
	"IIRFilterNode": true,
	"ChannelSplitterNode": true,
	"File": true,
	"ConstantSourceNode": true,
	"CryptoKey": true,
	"GainNode": true,
	"AbortController": true,
	"Attr": true,
	"SpeechSynthesis": true,
	"PushSubscription": false,
	"XMLStylesheetProcessingInstruction": false,
	"NodeIterator": true,
	"VideoStreamTrack": true,
	"XMLSerializer": true,
	"CaretPosition": true,
	"FormData": true,
	"CanvasPattern": true,
	"mozRTCSessionDescription": true,
	"Path2D": true,
	"PerformanceNavigation": true,
	"URL": false,
	"PluginArray": true,
	"MutationRecord": true,
	"WebKitCSSMatrix": true,
	"PeriodicWave": true,
	"DocumentFragment": true,
	"DocumentTimeline": false,
	"ScreenOrientation": true,
	"BroadcastChannel": true,
	"PermissionStatus": true,
	"IntersectionObserver": true,
	"Blob": true,
	"MessagePort": true,
	"BarProp": true,
	"OscillatorNode": true,
	"Cache": true,
	"RadioNodeList": true,
	"KeyframeEffectReadOnly": true,
	"InstallTrigger": true,
	"Function": false,
	"Object": false,
	"eval": true,
	"Window": false,
	"close": false,
	"stop": false,
	"focus": false,
	"blur": false,
	"open": true,
	"alert": false,
	"confirm": false,
	"prompt": false,
	"print": false,
	"postMessage": true,
	"getSelection": true,
	"getComputedStyle": true,
	"matchMedia": true,
	"moveTo": false,
	"moveBy": false,
	"resizeTo": false,
	"resizeBy": false,
	"scroll": false,
	"scrollTo": false,
	"scrollBy": false,
	"requestAnimationFrame": true,
	"cancelAnimationFrame": true,
	"getDefaultComputedStyle": false,
	"scrollByLines": false,
	"scrollByPages": false,
	"sizeToContent": false,
	"updateCommands": true,
	"find": false,
	"dump": true,
	"setResizable": false,
	"requestIdleCallback": false,
	"cancelIdleCallback": false,
	"btoa": true,
	"atob": true,
	"setTimeout": true,
	"clearTimeout": true,
	"setInterval": true,
	"clearInterval": true,
	"createImageBitmap": true,
	"fetch": true,
	"self": true,
	"name": false,
	"history": true,
	"locationbar": true,
	"menubar": true,
	"personalbar": true,
	"scrollbars": true,
	"statusbar": true,
	"toolbar": true,
	"status": true,
	"closed": true,
	"frames": true,
	"length": false,
	"opener": true,
	"parent": true,
	"frameElement": true,
	"navigator": true,
	"external": true,
	"applicationCache": true,
	"screen": true,
	"innerWidth": true,
	"innerHeight": true,
	"scrollX": true,
	"pageXOffset": true,
	"scrollY": true,
	"pageYOffset": true,
	"screenX": true,
	"screenY": true,
	"outerWidth": true,
	"outerHeight": true,
	"performance": true,
	"mozInnerScreenX": true,
	"mozInnerScreenY": true,
	"devicePixelRatio": true,
	"scrollMaxX": true,
	"scrollMaxY": true,
	"fullScreen": false,
	"mozPaintCount": true,
	"sidebar": false,
	"crypto": true,
	"speechSynthesis": true,
	"localStorage": true,
	"origin": true,
	"isSecureContext": false,
	"indexedDB": true,
	"caches": true,
	"sessionStorage": true,
	"window": false,
	"document": true,
	"location": false,
	"top": true,
	"netscape": true,
	"Node": true,
	"Document": true,
	"Performance": false,
	"startProfiling": true,
	"stopProfiling": true,
	"pauseProfilers": true,
	"resumeProfilers": true,
	"dumpProfile": true,
	"getMaxGCPauseSinceClear": true,
	"clearMaxGCPauseAccumulator": true,
	"Location": true,
	"StyleSheetList": false,
	"Selection": false,
	"Element": true,
	"AnonymousContent": false,
	"MutationObserver": true,
	"NodeList": true,
	"StopIteration": true
};
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
			if(script.charAt(end+i) == "("){
				return true;
			}else{
				return false;
			}
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
			if(script.charAt(end+i) == "["){
				return true;
			}else{
				return false;
			}
		}
		var error_count = 0;
		while(toke.type != acorn_base.tokTypes.eof){
			if(toke.type.keyword !== undefined){
				// This type of loop detection ignores functional loop alternatives and ternary operators
				//dbg_print("Keyword:"+toke.type.keyword);

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
				return [false,"NONTRIVIAL: Cannot be parsed."];
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
function license_read(script_src,name){
	
	var reason_text = "";

	var edited_src = "";
	var unedited_src = script_src;
	var nontrivial_status;
	var parts_denied = false;
	var parts_accepted = false;
	while(true){
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
			return [true,edited_src,reason_text];
			
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

function read_script(a){

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
* 	Reads/changes the HTML of a page and the scripts within it.
*
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
		// "j" is an index in intrinsicEvents
		function edit_event(src,i,j,name){
			var edited = get_script(src,name);
			edited.then(function(){
				html_doc.all[i].attributes[intrinsicEvents[j]].value = edited[0];
			});
		}

		// Find all the document's elements with intrinsic events
		for(var i = 0; i < has_intrinsic_events.length; i++){
			var s_name = "Intrinsic event ["+has_intrinsic_events[i][0]+"]";
			edit_event(html_doc.all[has_intrinsic_events[i][0]].attributes[intrinsicEvents[has_intrinsic_events[i][1]]].value,has_intrinsic_events[i][0],has_intrinsic_events[i][1],s_name);
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
				return;
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
		return;		
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

},{"acorn":2,"acorn/dist/acorn_loose":3,"acorn/dist/walk":4,"jssha":5}],2:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.acorn = global.acorn || {})));
}(this, (function (exports) { 'use strict';

// Reserved word lists for various dialects of the language

var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};

// And the keywords

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

var keywords = {
  5: ecma5AndLessKeywords,
  6: ecma5AndLessKeywords + " const class extends export import super"
};

// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fd5\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ae\ua7b0-\ua7b7\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d4-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by bin/generate-identifier-regex.js

// eslint-disable-next-line comma-spacing
var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,17,26,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,26,45,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,785,52,76,44,33,24,27,35,42,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,25,391,63,32,0,449,56,264,8,2,36,18,0,50,29,881,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,881,68,12,0,67,12,65,0,32,6124,20,754,9486,1,3071,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,10591,541];

// eslint-disable-next-line comma-spacing
var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,1306,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,52,0,13,2,49,13,10,2,4,9,83,11,7,0,161,11,6,9,7,3,57,0,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,87,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,423,9,838,7,2,7,17,9,57,21,2,13,19882,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) { return false }
    pos += set[i + 1];
    if (pos >= code) { return true }
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code, astral) {
  if (code < 65) { return code === 36 }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes)
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code, astral) {
  if (code < 48) { return code === 36 }
  if (code < 58) { return true }
  if (code < 65) { return false }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
}

// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to check if the token ends a
// `yield` expression. It is set on all token types that either can
// directly start an expression (like a quotation mark) or can
// continue an expression (like the body of a string).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

var TokenType = function TokenType(label, conf) {
  if ( conf === void 0 ) conf = {};

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

function binop(name, prec) {
  return new TokenType(name, {beforeExpr: true, binop: prec})
}
var beforeExpr = {beforeExpr: true};
var startsExpr = {startsExpr: true};

// Map keyword names to token types.

var keywords$1 = {};

// Succinct definitions of keyword token types
function kw(name, options) {
  if ( options === void 0 ) options = {};

  options.keyword = name;
  return keywords$1[name] = new TokenType(name, options)
}

var types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
  assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
  incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
  prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", {beforeExpr: true}),

  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", {isLoop: true, beforeExpr: true}),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", {isLoop: true}),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", {isLoop: true}),
  _with: kw("with"),
  _new: kw("new", {beforeExpr: true, startsExpr: true}),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import"),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", {beforeExpr: true, binop: 7}),
  _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
  _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
  _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
  _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
};

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");

function isNewLine(code) {
  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

var ref = Object.prototype;
var hasOwnProperty = ref.hasOwnProperty;
var toString = ref.toString;

// Checks if an object has a property.

function has(obj, propName) {
  return hasOwnProperty.call(obj, propName)
}

var isArray = Array.isArray || (function (obj) { return (
  toString.call(obj) === "[object Array]"
); });

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = function Position(line, col) {
  this.line = line;
  this.column = col;
};

Position.prototype.offset = function offset (n) {
  return new Position(this.line, this.column + n)
};

var SourceLocation = function SourceLocation(p, start, end) {
  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) { this.source = p.sourceFile; }
};

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    lineBreakG.lastIndex = cur;
    var match = lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur)
    }
  }
}

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must
  // be either 3, 5, 6 (2015), 7 (2016), or 8 (2017). This influences support
  // for strict mode, the set of reserved words, and support for
  // new syntax features. The default is 7.
  ecmaVersion: 7,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"` or `"module"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called
  // when a semicolon is automatically inserted. It will be passed
  // th position of the comma as an offset, and if `locations` is
  // enabled, it is given the location as a `{line, column}` object
  // as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // When enabled, hashbang directive in the beginning of file
  // is allowed and treated as a line comment.
  allowHashBang: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false,
  plugins: {}
};

// Interpret and default an options object

function getOptions(opts) {
  var options = {};

  for (var opt in defaultOptions)
    { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]; }

  if (options.ecmaVersion >= 2015)
    { options.ecmaVersion -= 2009; }

  if (options.allowReserved == null)
    { options.allowReserved = options.ecmaVersion < 5; }

  if (isArray(options.onToken)) {
    var tokens = options.onToken;
    options.onToken = function (token) { return tokens.push(token); };
  }
  if (isArray(options.onComment))
    { options.onComment = pushComment(options, options.onComment); }

  return options
}

function pushComment(options, array) {
  return function(block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "Block" : "Line",
      value: text,
      start: start,
      end: end
    };
    if (options.locations)
      { comment.loc = new SourceLocation(this, startLoc, endLoc); }
    if (options.ranges)
      { comment.range = [start, end]; }
    array.push(comment);
  }
}

// Registered plugins
var plugins = {};

function keywordRegexp(words) {
  return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$")
}

var Parser = function Parser(options, input, startPos) {
  this.options = options = getOptions(options);
  this.sourceFile = options.sourceFile;
  this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5]);
  var reserved = "";
  if (!options.allowReserved) {
    for (var v = options.ecmaVersion;; v--)
      { if (reserved = reservedWords[v]) { break } }
    if (options.sourceType == "module") { reserved += " await"; }
  }
  this.reservedWords = keywordRegexp(reserved);
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
  this.reservedWordsStrict = keywordRegexp(reservedStrict);
  this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind);
  this.input = String(input);

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.
  this.containsEsc = false;

  // Load plugins
  this.loadPlugins(options.plugins);

  // Set up token state

  // The current position of the tokenizer in the input.
  if (startPos) {
    this.pos = startPos;
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
  } else {
    this.pos = this.lineStart = 0;
    this.curLine = 1;
  }

  // Properties of the current token:
  // Its type
  this.type = types.eof;
  // For tokens that include more information than their type, the value
  this.value = null;
  // Its start and end offset
  this.start = this.end = this.pos;
  // And, if locations are used, the {line, column} object
  // corresponding to those offsets
  this.startLoc = this.endLoc = this.curPosition();

  // Position information for the previous token
  this.lastTokEndLoc = this.lastTokStartLoc = null;
  this.lastTokStart = this.lastTokEnd = this.pos;

  // The context stack is used to superficially track syntactic
  // context to predict whether a regular expression is allowed in a
  // given position.
  this.context = this.initialContext();
  this.exprAllowed = true;

  // Figure out if it's a module code.
  this.inModule = options.sourceType === "module";
  this.strict = this.inModule || this.strictDirective(this.pos);

  // Used to signify the start of a potential arrow function
  this.potentialArrowAt = -1;

  // Flags to track whether we are in a function, a generator, an async function.
  this.inFunction = this.inGenerator = this.inAsync = false;
  // Positions to delayed-check that yield/await does not exist in default parameters.
  this.yieldPos = this.awaitPos = 0;
  // Labels in scope.
  this.labels = [];

  // If enabled, skip leading hashbang line.
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
    { this.skipLineComment(2); }

  // Scope tracking for duplicate variable names (see scope.js)
  this.scopeStack = [];
  this.enterFunctionScope();
};

// DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

Parser.prototype.extend = function extend (name, f) {
  this[name] = f(this[name]);
};

Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
    var this$1 = this;

  for (var name in pluginConfigs) {
    var plugin = plugins[name];
    if (!plugin) { throw new Error("Plugin '" + name + "' not found") }
    plugin(this$1, pluginConfigs[name]);
  }
};

Parser.prototype.parse = function parse () {
  var node = this.options.program || this.startNode();
  this.nextToken();
  return this.parseTopLevel(node)
};

var pp = Parser.prototype;

// ## Parser utilities

var literal = /^(?:'((?:\\.|[^'])*?)'|"((?:\\.|[^"])*?)"|;)/;
pp.strictDirective = function(start) {
  var this$1 = this;

  for (;;) {
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this$1.input)[0].length;
    var match = literal.exec(this$1.input.slice(start));
    if (!match) { return false }
    if ((match[1] || match[2]) == "use strict") { return true }
    start += match[0].length;
  }
};

// Predicate that tests whether the next token is of the given
// type, and if yes, consumes it as a side effect.

pp.eat = function(type) {
  if (this.type === type) {
    this.next();
    return true
  } else {
    return false
  }
};

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function(name) {
  return this.type === types.name && this.value === name
};

// Consumes contextual keyword if possible.

pp.eatContextual = function(name) {
  return this.value === name && this.eat(types.name)
};

// Asserts that following token is given contextual keyword.

pp.expectContextual = function(name) {
  if (!this.eatContextual(name)) { this.unexpected(); }
};

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function() {
  return this.type === types.eof ||
    this.type === types.braceR ||
    lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

pp.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon)
      { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
    return true
  }
};

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function() {
  if (!this.eat(types.semi) && !this.insertSemicolon()) { this.unexpected(); }
};

pp.afterTrailingComma = function(tokType, notNext) {
  if (this.type == tokType) {
    if (this.options.onTrailingComma)
      { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
    if (!notNext)
      { this.next(); }
    return true
  }
};

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function(type) {
  this.eat(type) || this.unexpected();
};

// Raise an unexpected token error.

pp.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};

function DestructuringErrors() {
  this.shorthandAssign =
  this.trailingComma =
  this.parenthesizedAssign =
  this.parenthesizedBind =
    -1;
}

pp.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) { return }
  if (refDestructuringErrors.trailingComma > -1)
    { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
  if (parens > -1) { this.raiseRecoverable(parens, "Parenthesized pattern"); }
};

pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  var pos = refDestructuringErrors ? refDestructuringErrors.shorthandAssign : -1;
  if (!andThrow) { return pos >= 0 }
  if (pos > -1) { this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns"); }
};

pp.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
    { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
  if (this.awaitPos)
    { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
};

pp.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression")
    { return this.isSimpleAssignTarget(expr.expression) }
  return expr.type === "Identifier" || expr.type === "MemberExpression"
};

var pp$1 = Parser.prototype;

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp$1.parseTopLevel = function(node) {
  var this$1 = this;

  var exports = {};
  if (!node.body) { node.body = []; }
  while (this.type !== types.eof) {
    var stmt = this$1.parseStatement(true, true, exports);
    node.body.push(stmt);
  }
  this.next();
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType;
  }
  return this.finishNode(node, "Program")
};

var loopLabel = {kind: "loop"};
var switchLabel = {kind: "switch"};

pp$1.isLet = function() {
  if (this.type !== types.name || this.options.ecmaVersion < 6 || this.value != "let") { return false }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
  if (nextCh === 91 || nextCh == 123) { return true } // '{' and '['
  if (isIdentifierStart(nextCh, true)) {
    var pos = next + 1;
    while (isIdentifierChar(this.input.charCodeAt(pos), true)) { ++pos; }
    var ident = this.input.slice(next, pos);
    if (!this.isKeyword(ident)) { return true }
  }
  return false
};

// check 'async [no LineTerminator here] function'
// - 'async /*foo*/ function' is OK.
// - 'async /*\n*/ function' is invalid.
pp$1.isAsyncFunction = function() {
  if (this.type !== types.name || this.options.ecmaVersion < 8 || this.value != "async")
    { return false }

  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length;
  return !lineBreak.test(this.input.slice(this.pos, next)) &&
    this.input.slice(next, next + 8) === "function" &&
    (next + 8 == this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
};

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp$1.parseStatement = function(declaration, topLevel, exports) {
  var starttype = this.type, node = this.startNode(), kind;

  if (this.isLet()) {
    starttype = types._var;
    kind = "let";
  }

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
  case types._break: case types._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
  case types._debugger: return this.parseDebuggerStatement(node)
  case types._do: return this.parseDoStatement(node)
  case types._for: return this.parseForStatement(node)
  case types._function:
    if (!declaration && this.options.ecmaVersion >= 6) { this.unexpected(); }
    return this.parseFunctionStatement(node, false)
  case types._class:
    if (!declaration) { this.unexpected(); }
    return this.parseClass(node, true)
  case types._if: return this.parseIfStatement(node)
  case types._return: return this.parseReturnStatement(node)
  case types._switch: return this.parseSwitchStatement(node)
  case types._throw: return this.parseThrowStatement(node)
  case types._try: return this.parseTryStatement(node)
  case types._const: case types._var:
    kind = kind || this.value;
    if (!declaration && kind != "var") { this.unexpected(); }
    return this.parseVarStatement(node, kind)
  case types._while: return this.parseWhileStatement(node)
  case types._with: return this.parseWithStatement(node)
  case types.braceL: return this.parseBlock()
  case types.semi: return this.parseEmptyStatement(node)
  case types._export:
  case types._import:
    if (!this.options.allowImportExportEverywhere) {
      if (!topLevel)
        { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
      if (!this.inModule)
        { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
    }
    return starttype === types._import ? this.parseImport(node) : this.parseExport(node, exports)

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
  default:
    if (this.isAsyncFunction() && declaration) {
      this.next();
      return this.parseFunctionStatement(node, true)
    }

    var maybeName = this.value, expr = this.parseExpression();
    if (starttype === types.name && expr.type === "Identifier" && this.eat(types.colon))
      { return this.parseLabeledStatement(node, maybeName, expr) }
    else { return this.parseExpressionStatement(node, expr) }
  }
};

pp$1.parseBreakContinueStatement = function(node, keyword) {
  var this$1 = this;

  var isBreak = keyword == "break";
  this.next();
  if (this.eat(types.semi) || this.insertSemicolon()) { node.label = null; }
  else if (this.type !== types.name) { this.unexpected(); }
  else {
    node.label = this.parseIdent();
    this.semicolon();
  }

  // Verify that there is an actual destination to break or
  // continue to.
  var i = 0;
  for (; i < this.labels.length; ++i) {
    var lab = this$1.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
      if (node.label && isBreak) { break }
    }
  }
  if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
};

pp$1.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement")
};

pp$1.parseDoStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  this.expect(types._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6)
    { this.eat(types.semi); }
  else
    { this.semicolon(); }
  return this.finishNode(node, "DoWhileStatement")
};

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp$1.parseForStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  this.enterLexicalScope();
  this.expect(types.parenL);
  if (this.type === types.semi) { return this.parseFor(node, null) }
  var isLet = this.isLet();
  if (this.type === types._var || this.type === types._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
    this.next();
    this.parseVar(init$1, true, kind);
    this.finishNode(init$1, "VariableDeclaration");
    if ((this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
        !(kind !== "var" && init$1.declarations[0].init))
      { return this.parseForIn(node, init$1) }
    return this.parseFor(node, init$1)
  }
  var refDestructuringErrors = new DestructuringErrors;
  var init = this.parseExpression(true, refDestructuringErrors);
  if (this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    this.toAssignable(init);
    this.checkLVal(init);
    this.checkPatternErrors(refDestructuringErrors, true);
    return this.parseForIn(node, init)
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  return this.parseFor(node, init)
};

pp$1.parseFunctionStatement = function(node, isAsync) {
  this.next();
  return this.parseFunction(node, true, false, isAsync)
};

pp$1.isFunction = function() {
  return this.type === types._function || this.isAsyncFunction()
};

pp$1.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  // allow function declarations in branches, but only in non-strict mode
  node.consequent = this.parseStatement(!this.strict && this.isFunction());
  node.alternate = this.eat(types._else) ? this.parseStatement(!this.strict && this.isFunction()) : null;
  return this.finishNode(node, "IfStatement")
};

pp$1.parseReturnStatement = function(node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction)
    { this.raise(this.start, "'return' outside of function"); }
  this.next();

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(types.semi) || this.insertSemicolon()) { node.argument = null; }
  else { node.argument = this.parseExpression(); this.semicolon(); }
  return this.finishNode(node, "ReturnStatement")
};

pp$1.parseSwitchStatement = function(node) {
  var this$1 = this;

  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(types.braceL);
  this.labels.push(switchLabel);
  this.enterLexicalScope();

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  var cur;
  for (var sawDefault = false; this.type != types.braceR;) {
    if (this$1.type === types._case || this$1.type === types._default) {
      var isCase = this$1.type === types._case;
      if (cur) { this$1.finishNode(cur, "SwitchCase"); }
      node.cases.push(cur = this$1.startNode());
      cur.consequent = [];
      this$1.next();
      if (isCase) {
        cur.test = this$1.parseExpression();
      } else {
        if (sawDefault) { this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses"); }
        sawDefault = true;
        cur.test = null;
      }
      this$1.expect(types.colon);
    } else {
      if (!cur) { this$1.unexpected(); }
      cur.consequent.push(this$1.parseStatement(true));
    }
  }
  this.exitLexicalScope();
  if (cur) { this.finishNode(cur, "SwitchCase"); }
  this.next(); // Closing brace
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement")
};

pp$1.parseThrowStatement = function(node) {
  this.next();
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
    { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement")
};

// Reused empty array added for node fields that are always empty.

var empty = [];

pp$1.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === types._catch) {
    var clause = this.startNode();
    this.next();
    this.expect(types.parenL);
    clause.param = this.parseBindingAtom();
    this.enterLexicalScope();
    this.checkLVal(clause.param, "let");
    this.expect(types.parenR);
    clause.body = this.parseBlock(false);
    this.exitLexicalScope();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(types._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer)
    { this.raise(node.start, "Missing catch or finally clause"); }
  return this.finishNode(node, "TryStatement")
};

pp$1.parseVarStatement = function(node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration")
};

pp$1.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "WhileStatement")
};

pp$1.parseWithStatement = function(node) {
  if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement(false);
  return this.finishNode(node, "WithStatement")
};

pp$1.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement")
};

pp$1.parseLabeledStatement = function(node, maybeName, expr) {
  var this$1 = this;

  for (var i$1 = 0, list = this$1.labels; i$1 < list.length; i$1 += 1)
    {
    var label = list[i$1];

    if (label.name === maybeName)
      { this$1.raise(expr.start, "Label '" + maybeName + "' is already declared");
  } }
  var kind = this.type.isLoop ? "loop" : this.type === types._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label$1 = this$1.labels[i];
    if (label$1.statementStart == node.start) {
      label$1.statementStart = this$1.start;
      label$1.kind = kind;
    } else { break }
  }
  this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
  node.body = this.parseStatement(true);
  if (node.body.type == "ClassDeclaration" ||
      node.body.type == "VariableDeclaration" && node.body.kind != "var" ||
      node.body.type == "FunctionDeclaration" && (this.strict || node.body.generator))
    { this.raiseRecoverable(node.body.start, "Invalid labeled declaration"); }
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement")
};

pp$1.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement")
};

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp$1.parseBlock = function(createNewLexicalScope) {
  var this$1 = this;
  if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;

  var node = this.startNode();
  node.body = [];
  this.expect(types.braceL);
  if (createNewLexicalScope) {
    this.enterLexicalScope();
  }
  while (!this.eat(types.braceR)) {
    var stmt = this$1.parseStatement(true);
    node.body.push(stmt);
  }
  if (createNewLexicalScope) {
    this.exitLexicalScope();
  }
  return this.finishNode(node, "BlockStatement")
};

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp$1.parseFor = function(node, init) {
  node.init = init;
  this.expect(types.semi);
  node.test = this.type === types.semi ? null : this.parseExpression();
  this.expect(types.semi);
  node.update = this.type === types.parenR ? null : this.parseExpression();
  this.expect(types.parenR);
  this.exitLexicalScope();
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "ForStatement")
};

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp$1.parseForIn = function(node, init) {
  var type = this.type === types._in ? "ForInStatement" : "ForOfStatement";
  this.next();
  node.left = init;
  node.right = this.parseExpression();
  this.expect(types.parenR);
  this.exitLexicalScope();
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, type)
};

// Parse a list of variable declarations.

pp$1.parseVar = function(node, isFor, kind) {
  var this$1 = this;

  node.declarations = [];
  node.kind = kind;
  for (;;) {
    var decl = this$1.startNode();
    this$1.parseVarId(decl, kind);
    if (this$1.eat(types.eq)) {
      decl.init = this$1.parseMaybeAssign(isFor);
    } else if (kind === "const" && !(this$1.type === types._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
      this$1.unexpected();
    } else if (decl.id.type != "Identifier" && !(isFor && (this$1.type === types._in || this$1.isContextual("of")))) {
      this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"));
    if (!this$1.eat(types.comma)) { break }
  }
  return node
};

pp$1.parseVarId = function(decl, kind) {
  decl.id = this.parseBindingAtom(kind);
  this.checkLVal(decl.id, kind, false);
};

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseFunction = function(node, isStatement, allowExpressionBody, isAsync) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6 && !isAsync)
    { node.generator = this.eat(types.star); }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  if (isStatement) {
    node.id = isStatement === "nullableID" && this.type != types.name ? null : this.parseIdent();
    if (node.id) {
      this.checkLVal(node.id, "var");
    }
  }

  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;
  this.inGenerator = node.generator;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;
  this.enterFunctionScope();

  if (!isStatement)
    { node.id = this.type == types.name ? this.parseIdent() : null; }

  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
};

pp$1.parseFunctionParams = function(node) {
  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
};

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseClass = function(node, isStatement) {
  var this$1 = this;

  this.next();

  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (this$1.eat(types.semi)) { continue }
    var method = this$1.startNode();
    var isGenerator = this$1.eat(types.star);
    var isAsync = false;
    var isMaybeStatic = this$1.type === types.name && this$1.value === "static";
    this$1.parsePropertyName(method);
    method.static = isMaybeStatic && this$1.type !== types.parenL;
    if (method.static) {
      if (isGenerator) { this$1.unexpected(); }
      isGenerator = this$1.eat(types.star);
      this$1.parsePropertyName(method);
    }
    if (this$1.options.ecmaVersion >= 8 && !isGenerator && !method.computed &&
        method.key.type === "Identifier" && method.key.name === "async" && this$1.type !== types.parenL &&
        !this$1.canInsertSemicolon()) {
      isAsync = true;
      this$1.parsePropertyName(method);
    }
    method.kind = "method";
    var isGetSet = false;
    if (!method.computed) {
      var key = method.key;
      if (!isGenerator && !isAsync && key.type === "Identifier" && this$1.type !== types.parenL && (key.name === "get" || key.name === "set")) {
        isGetSet = true;
        method.kind = key.name;
        key = this$1.parsePropertyName(method);
      }
      if (!method.static && (key.type === "Identifier" && key.name === "constructor" ||
          key.type === "Literal" && key.value === "constructor")) {
        if (hadConstructor) { this$1.raise(key.start, "Duplicate constructor in the same class"); }
        if (isGetSet) { this$1.raise(key.start, "Constructor can't have get/set modifier"); }
        if (isGenerator) { this$1.raise(key.start, "Constructor can't be a generator"); }
        if (isAsync) { this$1.raise(key.start, "Constructor can't be an async method"); }
        method.kind = "constructor";
        hadConstructor = true;
      }
    }
    this$1.parseClassMethod(classBody, method, isGenerator, isAsync);
    if (isGetSet) {
      var paramCount = method.kind === "get" ? 0 : 1;
      if (method.value.params.length !== paramCount) {
        var start = method.value.start;
        if (method.kind === "get")
          { this$1.raiseRecoverable(start, "getter should have no params"); }
        else
          { this$1.raiseRecoverable(start, "setter should have exactly one param"); }
      } else {
        if (method.kind === "set" && method.value.params[0].type === "RestElement")
          { this$1.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params"); }
      }
    }
  }
  node.body = this.finishNode(classBody, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
};

pp$1.parseClassMethod = function(classBody, method, isGenerator, isAsync) {
  method.value = this.parseMethod(isGenerator, isAsync);
  classBody.body.push(this.finishNode(method, "MethodDefinition"));
};

pp$1.parseClassId = function(node, isStatement) {
  node.id = this.type === types.name ? this.parseIdent() : isStatement === true ? this.unexpected() : null;
};

pp$1.parseClassSuper = function(node) {
  node.superClass = this.eat(types._extends) ? this.parseExprSubscripts() : null;
};

// Parses module export declaration.

pp$1.parseExport = function(node, exports) {
  var this$1 = this;

  this.next();
  // export * from '...'
  if (this.eat(types.star)) {
    this.expectContextual("from");
    node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration")
  }
  if (this.eat(types._default)) { // export default ...
    this.checkExport(exports, "default", this.lastTokStart);
    var isAsync;
    if (this.type === types._function || (isAsync = this.isAsyncFunction())) {
      var fNode = this.startNode();
      this.next();
      if (isAsync) { this.next(); }
      node.declaration = this.parseFunction(fNode, "nullableID", false, isAsync);
    } else if (this.type === types._class) {
      var cNode = this.startNode();
      node.declaration = this.parseClass(cNode, "nullableID");
    } else {
      node.declaration = this.parseMaybeAssign();
      this.semicolon();
    }
    return this.finishNode(node, "ExportDefaultDeclaration")
  }
  // export var|const|let|function|class ...
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(true);
    if (node.declaration.type === "VariableDeclaration")
      { this.checkVariableExport(exports, node.declaration.declarations); }
    else
      { this.checkExport(exports, node.declaration.id.name, node.declaration.id.start); }
    node.specifiers = [];
    node.source = null;
  } else { // export { x, y as z } [from '...']
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports);
    if (this.eatContextual("from")) {
      node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
    } else {
      // check for keywords used as local names
      for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
        var spec = list[i];

        this$1.checkUnreserved(spec.local);
      }

      node.source = null;
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration")
};

pp$1.checkExport = function(exports, name, pos) {
  if (!exports) { return }
  if (has(exports, name))
    { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
  exports[name] = true;
};

pp$1.checkPatternExport = function(exports, pat) {
  var this$1 = this;

  var type = pat.type;
  if (type == "Identifier")
    { this.checkExport(exports, pat.name, pat.start); }
  else if (type == "ObjectPattern")
    { for (var i = 0, list = pat.properties; i < list.length; i += 1)
      {
        var prop = list[i];

        this$1.checkPatternExport(exports, prop.value);
      } }
  else if (type == "ArrayPattern")
    { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
      var elt = list$1[i$1];

        if (elt) { this$1.checkPatternExport(exports, elt); }
    } }
  else if (type == "AssignmentPattern")
    { this.checkPatternExport(exports, pat.left); }
  else if (type == "ParenthesizedExpression")
    { this.checkPatternExport(exports, pat.expression); }
};

pp$1.checkVariableExport = function(exports, decls) {
  var this$1 = this;

  if (!exports) { return }
  for (var i = 0, list = decls; i < list.length; i += 1)
    {
    var decl = list[i];

    this$1.checkPatternExport(exports, decl.id);
  }
};

pp$1.shouldParseExportStatement = function() {
  return this.type.keyword === "var" ||
    this.type.keyword === "const" ||
    this.type.keyword === "class" ||
    this.type.keyword === "function" ||
    this.isLet() ||
    this.isAsyncFunction()
};

// Parses a comma-separated list of module exports.

pp$1.parseExportSpecifiers = function(exports) {
  var this$1 = this;

  var nodes = [], first = true;
  // export { x, y as z } [from '...']
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node = this$1.startNode();
    node.local = this$1.parseIdent(true);
    node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local;
    this$1.checkExport(exports, node.exported.name, node.exported.start);
    nodes.push(this$1.finishNode(node, "ExportSpecifier"));
  }
  return nodes
};

// Parses import declaration.

pp$1.parseImport = function(node) {
  this.next();
  // import '...'
  if (this.type === types.string) {
    node.specifiers = empty;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration")
};

// Parses a comma-separated list of module imports.

pp$1.parseImportSpecifiers = function() {
  var this$1 = this;

  var nodes = [], first = true;
  if (this.type === types.name) {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLVal(node.local, "let");
    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
    if (!this.eat(types.comma)) { return nodes }
  }
  if (this.type === types.star) {
    var node$1 = this.startNode();
    this.next();
    this.expectContextual("as");
    node$1.local = this.parseIdent();
    this.checkLVal(node$1.local, "let");
    nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"));
    return nodes
  }
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node$2 = this$1.startNode();
    node$2.imported = this$1.parseIdent(true);
    if (this$1.eatContextual("as")) {
      node$2.local = this$1.parseIdent();
    } else {
      this$1.checkUnreserved(node$2.imported);
      node$2.local = node$2.imported;
    }
    this$1.checkLVal(node$2.local, "let");
    nodes.push(this$1.finishNode(node$2, "ImportSpecifier"));
  }
  return nodes
};

var pp$2 = Parser.prototype;

// Convert existing expression atom to assignable pattern
// if possible.

pp$2.toAssignable = function(node, isBinding) {
  var this$1 = this;

  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
    case "Identifier":
      if (this.inAsync && node.name === "await")
        { this.raise(node.start, "Can not use 'await' as identifier inside an async function"); }
      break

    case "ObjectPattern":
    case "ArrayPattern":
      break

    case "ObjectExpression":
      node.type = "ObjectPattern";
      for (var i = 0, list = node.properties; i < list.length; i += 1) {
        var prop = list[i];

      if (prop.kind !== "init") { this$1.raise(prop.key.start, "Object pattern can't contain getter or setter"); }
        this$1.toAssignable(prop.value, isBinding);
      }
      break

    case "ArrayExpression":
      node.type = "ArrayPattern";
      this.toAssignableList(node.elements, isBinding);
      break

    case "AssignmentExpression":
      if (node.operator === "=") {
        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isBinding);
        // falls through to AssignmentPattern
      } else {
        this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
        break
      }

    case "AssignmentPattern":
      break

    case "ParenthesizedExpression":
      this.toAssignable(node.expression, isBinding);
      break

    case "MemberExpression":
      if (!isBinding) { break }

    default:
      this.raise(node.start, "Assigning to rvalue");
    }
  }
  return node
};

// Convert list of expression atoms to binding list.

pp$2.toAssignableList = function(exprList, isBinding) {
  var this$1 = this;

  var end = exprList.length;
  if (end) {
    var last = exprList[end - 1];
    if (last && last.type == "RestElement") {
      --end;
    } else if (last && last.type == "SpreadElement") {
      last.type = "RestElement";
      var arg = last.argument;
      this.toAssignable(arg, isBinding);
      --end;
    }

    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
      { this.unexpected(last.argument.start); }
  }
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) { this$1.toAssignable(elt, isBinding); }
  }
  return exprList
};

// Parses spread element.

pp$2.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
  return this.finishNode(node, "SpreadElement")
};

pp$2.parseRestBinding = function() {
  var node = this.startNode();
  this.next();

  // RestElement inside of a function parameter must be an identifier
  if (this.options.ecmaVersion === 6 && this.type !== types.name)
    { this.unexpected(); }

  node.argument = this.parseBindingAtom();

  return this.finishNode(node, "RestElement")
};

// Parses lvalue (assignable) atom.

pp$2.parseBindingAtom = function() {
  if (this.options.ecmaVersion < 6) { return this.parseIdent() }
  switch (this.type) {
  case types.name:
    return this.parseIdent()

  case types.bracketL:
    var node = this.startNode();
    this.next();
    node.elements = this.parseBindingList(types.bracketR, true, true);
    return this.finishNode(node, "ArrayPattern")

  case types.braceL:
    return this.parseObj(true)

  default:
    this.unexpected();
  }
};

pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (first) { first = false; }
    else { this$1.expect(types.comma); }
    if (allowEmpty && this$1.type === types.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
      break
    } else if (this$1.type === types.ellipsis) {
      var rest = this$1.parseRestBinding();
      this$1.parseBindingListItem(rest);
      elts.push(rest);
      if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
      this$1.expect(close);
      break
    } else {
      var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc);
      this$1.parseBindingListItem(elem);
      elts.push(elem);
    }
  }
  return elts
};

pp$2.parseBindingListItem = function(param) {
  return param
};

// Parses assignment pattern around given atom if possible.

pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(types.eq)) { return left }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern")
};

// Verify that a node is an lval — something that can be assigned
// to.
// bindingType can be either:
// 'var' indicating that the lval creates a 'var' binding
// 'let' indicating that the lval creates a lexical ('let' or 'const') binding
// 'none' indicating that the binding should be checked for illegal identifiers, but not for duplicate references

pp$2.checkLVal = function(expr, bindingType, checkClashes) {
  var this$1 = this;

  switch (expr.type) {
  case "Identifier":
    if (this.strict && this.reservedWordsStrictBind.test(expr.name))
      { this.raiseRecoverable(expr.start, (bindingType ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
    if (checkClashes) {
      if (has(checkClashes, expr.name))
        { this.raiseRecoverable(expr.start, "Argument name clash"); }
      checkClashes[expr.name] = true;
    }
    if (bindingType && bindingType !== "none") {
      if (
        bindingType === "var" && !this.canDeclareVarName(expr.name) ||
        bindingType !== "var" && !this.canDeclareLexicalName(expr.name)
      ) {
        this.raiseRecoverable(expr.start, ("Identifier '" + (expr.name) + "' has already been declared"));
      }
      if (bindingType === "var") {
        this.declareVarName(expr.name);
      } else {
        this.declareLexicalName(expr.name);
      }
    }
    break

  case "MemberExpression":
    if (bindingType) { this.raiseRecoverable(expr.start, (bindingType ? "Binding" : "Assigning to") + " member expression"); }
    break

  case "ObjectPattern":
    for (var i = 0, list = expr.properties; i < list.length; i += 1)
      {
    var prop = list[i];

    this$1.checkLVal(prop.value, bindingType, checkClashes);
  }
    break

  case "ArrayPattern":
    for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
      var elem = list$1[i$1];

    if (elem) { this$1.checkLVal(elem, bindingType, checkClashes); }
    }
    break

  case "AssignmentPattern":
    this.checkLVal(expr.left, bindingType, checkClashes);
    break

  case "RestElement":
    this.checkLVal(expr.argument, bindingType, checkClashes);
    break

  case "ParenthesizedExpression":
    this.checkLVal(expr.expression, bindingType, checkClashes);
    break

  default:
    this.raise(expr.start, (bindingType ? "Binding" : "Assigning to") + " rvalue");
  }
};

// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

var pp$3 = Parser.prototype;

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash —
// either with each other or with an init property — and in
// strict mode, init properties are also not allowed to be repeated.

pp$3.checkPropClash = function(prop, propHash) {
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
    { return }
  var key = prop.key;
  var name;
  switch (key.type) {
  case "Identifier": name = key.name; break
  case "Literal": name = String(key.value); break
  default: return
  }
  var kind = prop.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) { this.raiseRecoverable(key.start, "Redefinition of __proto__ property"); }
      propHash.proto = true;
    }
    return
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var redefinition;
    if (kind === "init") {
      redefinition = this.strict && other.init || other.get || other.set;
    } else {
      redefinition = other.init || other[kind];
    }
    if (redefinition)
      { this.raiseRecoverable(key.start, "Redefinition of property"); }
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp$3.parseExpression = function(noIn, refDestructuringErrors) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
  if (this.type === types.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(types.comma)) { node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors)); }
    return this.finishNode(node, "SequenceExpression")
  }
  return expr
};

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
  if (this.inGenerator && this.isContextual("yield")) { return this.parseYield() }

  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1;
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
    oldTrailingComma = refDestructuringErrors.trailingComma;
    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
  } else {
    refDestructuringErrors = new DestructuringErrors;
    ownDestructuringErrors = true;
  }

  var startPos = this.start, startLoc = this.startLoc;
  if (this.type == types.parenL || this.type == types.name)
    { this.potentialArrowAt = this.start; }
  var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
  if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
  if (this.type.isAssign) {
    this.checkPatternErrors(refDestructuringErrors, true);
    if (!ownDestructuringErrors) { DestructuringErrors.call(refDestructuringErrors); }
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.left = this.type === types.eq ? this.toAssignable(left) : left;
    refDestructuringErrors.shorthandAssign = -1; // reset because shorthand default was used correctly
    this.checkLVal(left);
    this.next();
    node.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "AssignmentExpression")
  } else {
    if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
  }
  if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
  if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
  return left
};

// Parse a ternary conditional (`?:`) operator.

pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprOps(noIn, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  if (this.eat(types.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(types.colon);
    node.alternate = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "ConditionalExpression")
  }
  return expr
};

// Start the precedence parser.

pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors, false);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  return expr.start == startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, noIn)
};

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.type.binop;
  if (prec != null && (!noIn || this.type !== types._in)) {
    if (prec > minPrec) {
      var logical = this.type === types.logicalOR || this.type === types.logicalAND;
      var op = this.value;
      this.next();
      var startPos = this.start, startLoc = this.startLoc;
      var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn);
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical);
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
    }
  }
  return left
};

pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.operator = op;
  node.right = right;
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
};

// Parse unary operators, both prefix and postfix.

pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, expr;
  if (this.inAsync && this.isContextual("await")) {
    expr = this.parseAwait(refDestructuringErrors);
    sawUnary = true;
  } else if (this.type.prefix) {
    var node = this.startNode(), update = this.type === types.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(null, true);
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) { this.checkLVal(node.argument); }
    else if (this.strict && node.operator === "delete" &&
             node.argument.type === "Identifier")
      { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
    else { sawUnary = true; }
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.operator = this$1.value;
      node$1.prefix = false;
      node$1.argument = expr;
      this$1.checkLVal(expr);
      this$1.next();
      expr = this$1.finishNode(node$1, "UpdateExpression");
    }
  }

  if (!sawUnary && this.eat(types.starstar))
    { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false) }
  else
    { return expr }
};

// Parse call, dot, and `[]`-subscript expressions.

pp$3.parseExprSubscripts = function(refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors);
  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")";
  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) { return expr }
  var result = this.parseSubscripts(expr, startPos, startLoc);
  if (refDestructuringErrors && result.type === "MemberExpression") {
    if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
    if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
  }
  return result
};

pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
  var this$1 = this;

  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
      this.lastTokEnd == base.end && !this.canInsertSemicolon();
  for (var computed = (void 0);;) {
    if ((computed = this$1.eat(types.bracketL)) || this$1.eat(types.dot)) {
      var node = this$1.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = computed ? this$1.parseExpression() : this$1.parseIdent(true);
      node.computed = !!computed;
      if (computed) { this$1.expect(types.bracketR); }
      base = this$1.finishNode(node, "MemberExpression");
    } else if (!noCalls && this$1.eat(types.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this$1.yieldPos, oldAwaitPos = this$1.awaitPos;
      this$1.yieldPos = 0;
      this$1.awaitPos = 0;
      var exprList = this$1.parseExprList(types.parenR, this$1.options.ecmaVersion >= 8, false, refDestructuringErrors);
      if (maybeAsyncArrow && !this$1.canInsertSemicolon() && this$1.eat(types.arrow)) {
        this$1.checkPatternErrors(refDestructuringErrors, false);
        this$1.checkYieldAwaitInDefaultParams();
        this$1.yieldPos = oldYieldPos;
        this$1.awaitPos = oldAwaitPos;
        return this$1.parseArrowExpression(this$1.startNodeAt(startPos, startLoc), exprList, true)
      }
      this$1.checkExpressionErrors(refDestructuringErrors, true);
      this$1.yieldPos = oldYieldPos || this$1.yieldPos;
      this$1.awaitPos = oldAwaitPos || this$1.awaitPos;
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.callee = base;
      node$1.arguments = exprList;
      base = this$1.finishNode(node$1, "CallExpression");
    } else if (this$1.type === types.backQuote) {
      var node$2 = this$1.startNodeAt(startPos, startLoc);
      node$2.tag = base;
      node$2.quasi = this$1.parseTemplate({isTagged: true});
      base = this$1.finishNode(node$2, "TaggedTemplateExpression");
    } else {
      return base
    }
  }
};

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp$3.parseExprAtom = function(refDestructuringErrors) {
  var node, canBeArrow = this.potentialArrowAt == this.start;
  switch (this.type) {
  case types._super:
    if (!this.inFunction)
      { this.raise(this.start, "'super' outside of function or class"); }

  case types._this:
    var type = this.type === types._this ? "ThisExpression" : "Super";
    node = this.startNode();
    this.next();
    return this.finishNode(node, type)

  case types.name:
    var startPos = this.start, startLoc = this.startLoc;
    var id = this.parseIdent(this.type !== types.name);
    if (this.options.ecmaVersion >= 8 && id.name === "async" && !this.canInsertSemicolon() && this.eat(types._function))
      { return this.parseFunction(this.startNodeAt(startPos, startLoc), false, false, true) }
    if (canBeArrow && !this.canInsertSemicolon()) {
      if (this.eat(types.arrow))
        { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false) }
      if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types.name) {
        id = this.parseIdent();
        if (this.canInsertSemicolon() || !this.eat(types.arrow))
          { this.unexpected(); }
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
      }
    }
    return id

  case types.regexp:
    var value = this.value;
    node = this.parseLiteral(value.value);
    node.regex = {pattern: value.pattern, flags: value.flags};
    return node

  case types.num: case types.string:
    return this.parseLiteral(this.value)

  case types._null: case types._true: case types._false:
    node = this.startNode();
    node.value = this.type === types._null ? null : this.type === types._true;
    node.raw = this.type.keyword;
    this.next();
    return this.finishNode(node, "Literal")

  case types.parenL:
    var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow);
    if (refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
        { refDestructuringErrors.parenthesizedAssign = start; }
      if (refDestructuringErrors.parenthesizedBind < 0)
        { refDestructuringErrors.parenthesizedBind = start; }
    }
    return expr

  case types.bracketL:
    node = this.startNode();
    this.next();
    node.elements = this.parseExprList(types.bracketR, true, true, refDestructuringErrors);
    return this.finishNode(node, "ArrayExpression")

  case types.braceL:
    return this.parseObj(false, refDestructuringErrors)

  case types._function:
    node = this.startNode();
    this.next();
    return this.parseFunction(node, false)

  case types._class:
    return this.parseClass(this.startNode(), false)

  case types._new:
    return this.parseNew()

  case types.backQuote:
    return this.parseTemplate()

  default:
    this.unexpected();
  }
};

pp$3.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  this.next();
  return this.finishNode(node, "Literal")
};

pp$3.parseParenExpression = function() {
  this.expect(types.parenL);
  var val = this.parseExpression();
  this.expect(types.parenR);
  return val
};

pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();

    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart, innerParenStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    while (this.type !== types.parenR) {
      first ? first = false : this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(types.parenR, true)) {
        lastIsComma = true;
        break
      } else if (this$1.type === types.ellipsis) {
        spreadStart = this$1.start;
        exprList.push(this$1.parseParenItem(this$1.parseRestBinding()));
        if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
        break
      } else {
        if (this$1.type === types.parenL && !innerParenStart) {
          innerParenStart = this$1.start;
        }
        exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem));
      }
    }
    var innerEndPos = this.start, innerEndLoc = this.startLoc;
    this.expect(types.parenR);

    if (canBeArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      if (innerParenStart) { this.unexpected(innerParenStart); }
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList)
    }

    if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
    if (spreadStart) { this.unexpected(spreadStart); }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression")
  } else {
    return val
  }
};

pp$3.parseParenItem = function(item) {
  return item
};

pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
};

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty$1 = [];

pp$3.parseNew = function() {
  var node = this.startNode();
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(types.dot)) {
    node.meta = meta;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target")
      { this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target"); }
    if (!this.inFunction)
      { this.raiseRecoverable(node.start, "new.target can only be used in functions"); }
    return this.finishNode(node, "MetaProperty")
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  if (this.eat(types.parenL)) { node.arguments = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8, false); }
  else { node.arguments = empty$1; }
  return this.finishNode(node, "NewExpression")
};

// Parse template expression.

pp$3.parseTemplateElement = function(ref) {
  var isTagged = ref.isTagged;

  var elem = this.startNode();
  if (this.type === types.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value,
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types.backQuote;
  return this.finishNode(elem, "TemplateElement")
};

pp$3.parseTemplate = function(ref) {
  var this$1 = this;
  if ( ref === void 0 ) ref = {};
  var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({isTagged: isTagged});
  node.quasis = [curElt];
  while (!curElt.tail) {
    this$1.expect(types.dollarBraceL);
    node.expressions.push(this$1.parseExpression());
    this$1.expect(types.braceR);
    node.quasis.push(curElt = this$1.parseTemplateElement({isTagged: isTagged}));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral")
};

// Parse an object literal or binding pattern.

pp$3.isAsyncProp = function(prop) {
  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
    (this.type === types.name || this.type === types.num || this.type === types.string || this.type === types.bracketL || this.type.keyword) &&
    !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

pp$3.parseObj = function(isPattern, refDestructuringErrors) {
  var this$1 = this;

  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var prop = this$1.startNode(), isGenerator = (void 0), isAsync = (void 0), startPos = (void 0), startLoc = (void 0);
    if (this$1.options.ecmaVersion >= 6) {
      prop.method = false;
      prop.shorthand = false;
      if (isPattern || refDestructuringErrors) {
        startPos = this$1.start;
        startLoc = this$1.startLoc;
      }
      if (!isPattern)
        { isGenerator = this$1.eat(types.star); }
    }
    this$1.parsePropertyName(prop);
    if (!isPattern && this$1.options.ecmaVersion >= 8 && !isGenerator && this$1.isAsyncProp(prop)) {
      isAsync = true;
      this$1.parsePropertyName(prop, refDestructuringErrors);
    } else {
      isAsync = false;
    }
    this$1.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors);
    this$1.checkPropClash(prop, propHash);
    node.properties.push(this$1.finishNode(prop, "Property"));
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
};

pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors) {
  if ((isGenerator || isAsync) && this.type === types.colon)
    { this.unexpected(); }

  if (this.eat(types.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types.parenL) {
    if (isPattern) { this.unexpected(); }
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
  } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
             (prop.key.name === "get" || prop.key.name === "set") &&
             (this.type != types.comma && this.type != types.braceR)) {
    if (isGenerator || isAsync || isPattern) { this.unexpected(); }
    prop.kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get")
        { this.raiseRecoverable(start, "getter should have no params"); }
      else
        { this.raiseRecoverable(start, "setter should have exactly one param"); }
    } else {
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
    }
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    this.checkUnreserved(prop.key);
    prop.kind = "init";
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else if (this.type === types.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0)
        { refDestructuringErrors.shorthandAssign = this.start; }
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else {
      prop.value = prop.key;
    }
    prop.shorthand = true;
  } else { this.unexpected(); }
};

pp$3.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types.bracketR);
      return prop.key
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === types.num || this.type === types.string ? this.parseExprAtom() : this.parseIdent(true)
};

// Initialize empty function node.

pp$3.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = false;
    node.expression = false;
  }
  if (this.options.ecmaVersion >= 8)
    { node.async = false; }
};

// Parse object or class method.

pp$3.parseMethod = function(isGenerator, isAsync) {
  var node = this.startNode(), oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;

  this.initFunction(node);
  if (this.options.ecmaVersion >= 6)
    { node.generator = isGenerator; }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.inGenerator = node.generator;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;
  this.enterFunctionScope();

  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, "FunctionExpression")
};

// Parse arrow function expression with given parameters.

pp$3.parseArrowExpression = function(node, params, isAsync) {
  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;

  this.enterFunctionScope();
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.inGenerator = false;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;

  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, "ArrowFunctionExpression")
};

// Parse function body and check parameters.

pp$3.parseFunctionBody = function(node, isArrowFunction) {
  var isExpression = isArrowFunction && this.type !== types.braceL;
  var oldStrict = this.strict, useStrict = false;

  if (isExpression) {
    node.body = this.parseMaybeAssign();
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      // If this is a strict mode function, verify that argument names
      // are not repeated, and it does not try to bind the words `eval`
      // or `arguments`.
      if (useStrict && nonSimple)
        { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
    }
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) { this.strict = true; }

    // Add the params to varDeclaredNames to ensure that an error is thrown
    // if a let/const declaration in the function clashes with one of the params.
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && this.isSimpleParamList(node.params));
    node.body = this.parseBlock(false);
    node.expression = false;
    this.labels = oldLabels;
  }
  this.exitFunctionScope();

  if (this.strict && node.id) {
    // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
    this.checkLVal(node.id, "none");
  }
  this.strict = oldStrict;
};

pp$3.isSimpleParamList = function(params) {
  for (var i = 0, list = params; i < list.length; i += 1)
    {
    var param = list[i];

    if (param.type !== "Identifier") { return false
  } }
  return true
};

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp$3.checkParams = function(node, allowDuplicates) {
  var this$1 = this;

  var nameHash = {};
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    this$1.checkLVal(param, "var", allowDuplicates ? null : nameHash);
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(close)) { break }
    } else { first = false; }

    var elt = (void 0);
    if (allowEmpty && this$1.type === types.comma)
      { elt = null; }
    else if (this$1.type === types.ellipsis) {
      elt = this$1.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this$1.type === types.comma && refDestructuringErrors.trailingComma < 0)
        { refDestructuringErrors.trailingComma = this$1.start; }
    } else {
      elt = this$1.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp$3.checkUnreserved = function(ref) {
  var start = ref.start;
  var end = ref.end;
  var name = ref.name;

  if (this.inGenerator && name === "yield")
    { this.raiseRecoverable(start, "Can not use 'yield' as identifier inside a generator"); }
  if (this.inAsync && name === "await")
    { this.raiseRecoverable(start, "Can not use 'await' as identifier inside an async function"); }
  if (this.isKeyword(name))
    { this.raise(start, ("Unexpected keyword '" + name + "'")); }
  if (this.options.ecmaVersion < 6 &&
    this.input.slice(start, end).indexOf("\\") != -1) { return }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name))
    { this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved")); }
};

pp$3.parseIdent = function(liberal, isBinding) {
  var node = this.startNode();
  if (liberal && this.options.allowReserved == "never") { liberal = false; }
  if (this.type === types.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "Identifier");
  if (!liberal) { this.checkUnreserved(node); }
  return node
};

// Parses yield expression inside generator.

pp$3.parseYield = function() {
  if (!this.yieldPos) { this.yieldPos = this.start; }

  var node = this.startNode();
  this.next();
  if (this.type == types.semi || this.canInsertSemicolon() || (this.type != types.star && !this.type.startsExpr)) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types.star);
    node.argument = this.parseMaybeAssign();
  }
  return this.finishNode(node, "YieldExpression")
};

pp$3.parseAwait = function() {
  if (!this.awaitPos) { this.awaitPos = this.start; }

  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true);
  return this.finishNode(node, "AwaitExpression")
};

var pp$4 = Parser.prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
  throw err
};

pp$4.raiseRecoverable = pp$4.raise;

pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart)
  }
};

var pp$5 = Parser.prototype;

// Object.assign polyfill
var assign = Object.assign || function(target) {
  var sources = [], len = arguments.length - 1;
  while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];

  for (var i = 0, list = sources; i < list.length; i += 1) {
    var source = list[i];

    for (var key in source) {
      if (has(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target
};

// The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

pp$5.enterFunctionScope = function() {
  // var: a hash of var-declared names in the current lexical scope
  // lexical: a hash of lexically-declared names in the current lexical scope
  // childVar: a hash of var-declared names in all child lexical scopes of the current lexical scope (within the current function scope)
  // parentLexical: a hash of lexically-declared names in all parent lexical scopes of the current lexical scope (within the current function scope)
  this.scopeStack.push({var: {}, lexical: {}, childVar: {}, parentLexical: {}});
};

pp$5.exitFunctionScope = function() {
  this.scopeStack.pop();
};

pp$5.enterLexicalScope = function() {
  var parentScope = this.scopeStack[this.scopeStack.length - 1];
  var childScope = {var: {}, lexical: {}, childVar: {}, parentLexical: {}};

  this.scopeStack.push(childScope);
  assign(childScope.parentLexical, parentScope.lexical, parentScope.parentLexical);
};

pp$5.exitLexicalScope = function() {
  var childScope = this.scopeStack.pop();
  var parentScope = this.scopeStack[this.scopeStack.length - 1];

  assign(parentScope.childVar, childScope.var, childScope.childVar);
};

/**
 * A name can be declared with `var` if there are no variables with the same name declared with `let`/`const`
 * in the current lexical scope or any of the parent lexical scopes in this function.
 */
pp$5.canDeclareVarName = function(name) {
  var currentScope = this.scopeStack[this.scopeStack.length - 1];

  return !has(currentScope.lexical, name) && !has(currentScope.parentLexical, name)
};

/**
 * A name can be declared with `let`/`const` if there are no variables with the same name declared with `let`/`const`
 * in the current scope, and there are no variables with the same name declared with `var` in the current scope or in
 * any child lexical scopes in this function.
 */
pp$5.canDeclareLexicalName = function(name) {
  var currentScope = this.scopeStack[this.scopeStack.length - 1];

  return !has(currentScope.lexical, name) && !has(currentScope.var, name) && !has(currentScope.childVar, name)
};

pp$5.declareVarName = function(name) {
  this.scopeStack[this.scopeStack.length - 1].var[name] = true;
};

pp$5.declareLexicalName = function(name) {
  this.scopeStack[this.scopeStack.length - 1].lexical[name] = true;
};

var Node = function Node(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations)
    { this.loc = new SourceLocation(parser, loc); }
  if (parser.options.directSourceFile)
    { this.sourceFile = parser.options.directSourceFile; }
  if (parser.options.ranges)
    { this.range = [pos, 0]; }
};

// Start an AST node, attaching a start offset.

var pp$6 = Parser.prototype;

pp$6.startNode = function() {
  return new Node(this, this.start, this.startLoc)
};

pp$6.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc)
};

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations)
    { node.loc.end = loc; }
  if (this.options.ranges)
    { node.range[1] = pos; }
  return node
}

pp$6.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
};

// Finish node at given position

pp$6.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc)
};

// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
  this.generator = !!generator;
};

var types$1 = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", false),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
  f_stat: new TokContext("function", false),
  f_expr: new TokContext("function", true),
  f_expr_gen: new TokContext("function", true, false, null, true),
  f_gen: new TokContext("function", false, false, null, true)
};

var pp$7 = Parser.prototype;

pp$7.initialContext = function() {
  return [types$1.b_stat]
};

pp$7.braceIsBlock = function(prevType) {
  var parent = this.curContext();
  if (parent === types$1.f_expr || parent === types$1.f_stat)
    { return true }
  if (prevType === types.colon && (parent === types$1.b_stat || parent === types$1.b_expr))
    { return !parent.isExpr }

  // The check for `tt.name && exprAllowed` detects whether we are
  // after a `yield` or `of` construct. See the `updateContext` for
  // `tt.name`.
  if (prevType === types._return || prevType == types.name && this.exprAllowed)
    { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
  if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR || prevType == types.arrow)
    { return true }
  if (prevType == types.braceL)
    { return parent === types$1.b_stat }
  if (prevType == types._var || prevType == types.name)
    { return false }
  return !this.exprAllowed
};

pp$7.inGeneratorContext = function() {
  var this$1 = this;

  for (var i = this.context.length - 1; i >= 1; i--) {
    var context = this$1.context[i];
    if (context.token === "function")
      { return context.generator }
  }
  return false
};

pp$7.updateContext = function(prevType) {
  var update, type = this.type;
  if (type.keyword && prevType == types.dot)
    { this.exprAllowed = false; }
  else if (update = type.updateContext)
    { update.call(this, prevType); }
  else
    { this.exprAllowed = type.beforeExpr; }
};

// Token-specific context update code

types.parenR.updateContext = types.braceR.updateContext = function() {
  if (this.context.length == 1) {
    this.exprAllowed = true;
    return
  }
  var out = this.context.pop();
  if (out === types$1.b_stat && this.curContext().token === "function") {
    out = this.context.pop();
  }
  this.exprAllowed = !out.isExpr;
};

types.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types$1.b_stat : types$1.b_expr);
  this.exprAllowed = true;
};

types.dollarBraceL.updateContext = function() {
  this.context.push(types$1.b_tmpl);
  this.exprAllowed = true;
};

types.parenL.updateContext = function(prevType) {
  var statementParens = prevType === types._if || prevType === types._for || prevType === types._with || prevType === types._while;
  this.context.push(statementParens ? types$1.p_stat : types$1.p_expr);
  this.exprAllowed = true;
};

types.incDec.updateContext = function() {
  // tokExprAllowed stays unchanged
};

types._function.updateContext = types._class.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== types.semi && prevType !== types._else &&
      !((prevType === types.colon || prevType === types.braceL) && this.curContext() === types$1.b_stat))
    { this.context.push(types$1.f_expr); }
  else
    { this.context.push(types$1.f_stat); }
  this.exprAllowed = false;
};

types.backQuote.updateContext = function() {
  if (this.curContext() === types$1.q_tmpl)
    { this.context.pop(); }
  else
    { this.context.push(types$1.q_tmpl); }
  this.exprAllowed = false;
};

types.star.updateContext = function(prevType) {
  if (prevType == types._function) {
    var index = this.context.length - 1;
    if (this.context[index] === types$1.f_expr)
      { this.context[index] = types$1.f_expr_gen; }
    else
      { this.context[index] = types$1.f_gen; }
  }
  this.exprAllowed = true;
};

types.name.updateContext = function(prevType) {
  var allowed = false;
  if (this.options.ecmaVersion >= 6) {
    if (this.value == "of" && !this.exprAllowed ||
        this.value == "yield" && this.inGeneratorContext())
      { allowed = true; }
  }
  this.exprAllowed = allowed;
};

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations)
    { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
  if (p.options.ranges)
    { this.range = [p.start, p.end]; }
};

// ## Tokenizer

var pp$8 = Parser.prototype;

// Are we running under Rhino?
var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]";

// Move to the next token

pp$8.next = function() {
  if (this.options.onToken)
    { this.options.onToken(new Token(this)); }

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp$8.getToken = function() {
  this.next();
  return new Token(this)
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined")
  { pp$8[Symbol.iterator] = function() {
    var this$1 = this;

    return {
      next: function () {
        var token = this$1.getToken();
        return {
          done: token.type === types.eof,
          value: token
        }
      }
    }
  }; }

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp$8.curContext = function() {
  return this.context[this.context.length - 1]
};

// Read a single token, updating the parser object's token-related
// properties.

pp$8.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

  this.start = this.pos;
  if (this.options.locations) { this.startLoc = this.curPosition(); }
  if (this.pos >= this.input.length) { return this.finishToken(types.eof) }

  if (curContext.override) { return curContext.override(this) }
  else { this.readToken(this.fullCharCodeAtPos()); }
};

pp$8.readToken = function(code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
    { return this.readWord() }

  return this.getTokenFromCode(code)
};

pp$8.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 0xd7ff || code >= 0xe000) { return code }
  var next = this.input.charCodeAt(this.pos + 1);
  return (code << 10) + next - 0x35fdc00
};

pp$8.skipBlockComment = function() {
  var this$1 = this;

  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
  this.pos = end + 2;
  if (this.options.locations) {
    lineBreakG.lastIndex = start;
    var match;
    while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this$1.curLine;
      this$1.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment)
    { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                           startLoc, this.curPosition()); }
};

pp$8.skipLineComment = function(startSkip) {
  var this$1 = this;

  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this$1.input.charCodeAt(++this$1.pos);
  }
  if (this.options.onComment)
    { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                           startLoc, this.curPosition()); }
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp$8.skipSpace = function() {
  var this$1 = this;

  loop: while (this.pos < this.input.length) {
    var ch = this$1.input.charCodeAt(this$1.pos);
    switch (ch) {
    case 32: case 160: // ' '
      ++this$1.pos;
      break
    case 13:
      if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
        ++this$1.pos;
      }
    case 10: case 8232: case 8233:
      ++this$1.pos;
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      break
    case 47: // '/'
      switch (this$1.input.charCodeAt(this$1.pos + 1)) {
      case 42: // '*'
        this$1.skipBlockComment();
        break
      case 47:
        this$1.skipLineComment(2);
        break
      default:
        break loop
      }
      break
    default:
      if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++this$1.pos;
      } else {
        break loop
      }
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp$8.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) { this.endLoc = this.curPosition(); }
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp$8.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) { return this.readNumber(true) }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(types.ellipsis)
  } else {
    ++this.pos;
    return this.finishToken(types.dot)
  }
};

pp$8.readToken_slash = function() { // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.slash, 1)
};

pp$8.readToken_mult_modulo_exp = function(code) { // '%*'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types.star : types.modulo;

  // exponentiation operator ** and **=
  if (this.options.ecmaVersion >= 7 && next === 42) {
    ++size;
    tokentype = types.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }

  if (next === 61) { return this.finishOp(types.assign, size + 1) }
  return this.finishOp(tokentype, size)
};

pp$8.readToken_pipe_amp = function(code) { // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) { return this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2) }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1)
};

pp$8.readToken_caret = function() { // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.bitwiseXOR, 1)
};

pp$8.readToken_plus_min = function(code) { // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next == 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) == 62 &&
        (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken()
    }
    return this.finishOp(types.incDec, 2)
  }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.plusMin, 1)
};

pp$8.readToken_lt_gt = function(code) { // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types.assign, size + 1) }
    return this.finishOp(types.bitShift, size)
  }
  if (next == 33 && code == 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) == 45 &&
      this.input.charCodeAt(this.pos + 3) == 45) {
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken()
  }
  if (next === 61) { size = 2; }
  return this.finishOp(types.relational, size)
};

pp$8.readToken_eq_excl = function(code) { // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
    this.pos += 2;
    return this.finishToken(types.arrow)
  }
  return this.finishOp(code === 61 ? types.eq : types.prefix, 1)
};

pp$8.getTokenFromCode = function(code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
  case 46: // '.'
    return this.readToken_dot()

    // Punctuation tokens.
  case 40: ++this.pos; return this.finishToken(types.parenL)
  case 41: ++this.pos; return this.finishToken(types.parenR)
  case 59: ++this.pos; return this.finishToken(types.semi)
  case 44: ++this.pos; return this.finishToken(types.comma)
  case 91: ++this.pos; return this.finishToken(types.bracketL)
  case 93: ++this.pos; return this.finishToken(types.bracketR)
  case 123: ++this.pos; return this.finishToken(types.braceL)
  case 125: ++this.pos; return this.finishToken(types.braceR)
  case 58: ++this.pos; return this.finishToken(types.colon)
  case 63: ++this.pos; return this.finishToken(types.question)

  case 96: // '`'
    if (this.options.ecmaVersion < 6) { break }
    ++this.pos;
    return this.finishToken(types.backQuote)

  case 48: // '0'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
    if (this.options.ecmaVersion >= 6) {
      if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
      if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
    }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
    return this.readNumber(false)

    // Quotes produce strings.
  case 34: case 39: // '"', "'"
    return this.readString(code)

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

  case 47: // '/'
    return this.readToken_slash()

  case 37: case 42: // '%*'
    return this.readToken_mult_modulo_exp(code)

  case 124: case 38: // '|&'
    return this.readToken_pipe_amp(code)

  case 94: // '^'
    return this.readToken_caret()

  case 43: case 45: // '+-'
    return this.readToken_plus_min(code)

  case 60: case 62: // '<>'
    return this.readToken_lt_gt(code)

  case 61: case 33: // '=!'
    return this.readToken_eq_excl(code)

  case 126: // '~'
    return this.finishOp(types.prefix, 1)
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp$8.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str)
};

// Parse a regular expression. Some context-awareness is necessary,
// since a '/' inside a '[]' set does not end the expression.

function tryCreateRegexp(src, flags, throwErrorAt, parser) {
  try {
    return new RegExp(src, flags)
  } catch (e) {
    if (throwErrorAt !== undefined) {
      if (e instanceof SyntaxError) { parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message); }
      throw e
    }
  }
}

var regexpUnicodeSupport = !!tryCreateRegexp("\uffff", "u");

pp$8.readRegexp = function() {
  var this$1 = this;

  var escaped, inClass, start = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(start, "Unterminated regular expression"); }
    var ch = this$1.input.charAt(this$1.pos);
    if (lineBreak.test(ch)) { this$1.raise(start, "Unterminated regular expression"); }
    if (!escaped) {
      if (ch === "[") { inClass = true; }
      else if (ch === "]" && inClass) { inClass = false; }
      else if (ch === "/" && !inClass) { break }
      escaped = ch === "\\";
    } else { escaped = false; }
    ++this$1.pos;
  }
  var content = this.input.slice(start, this.pos);
  ++this.pos;
  // Need to use `readWord1` because '\uXXXX' sequences are allowed
  // here (don't ask).
  var mods = this.readWord1();
  var tmp = content, tmpFlags = "";
  if (mods) {
    var validFlags = /^[gim]*$/;
    if (this.options.ecmaVersion >= 6) { validFlags = /^[gimuy]*$/; }
    if (!validFlags.test(mods)) { this.raise(start, "Invalid regular expression flag"); }
    if (mods.indexOf("u") >= 0) {
      if (regexpUnicodeSupport) {
        tmpFlags = "u";
      } else {
        // Replace each astral symbol and every Unicode escape sequence that
        // possibly represents an astral symbol or a paired surrogate with a
        // single ASCII symbol to avoid throwing on regular expressions that
        // are only valid in combination with the `/u` flag.
        // Note: replacing with the ASCII symbol `x` might cause false
        // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
        // perfectly valid pattern that is equivalent to `[a-b]`, but it would
        // be replaced by `[x-b]` which throws an error.
        tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
          code = Number("0x" + code);
          if (code > 0x10FFFF) { this$1.raise(start + offset + 3, "Code point out of bounds"); }
          return "x"
        });
        tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
        tmpFlags = tmpFlags.replace("u", "");
      }
    }
  }
  // Detect invalid regular expressions.
  var value = null;
  // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
  // so don't do detection if we are running under Rhino
  if (!isRhino) {
    tryCreateRegexp(tmp, tmpFlags, start, this);
    // Get a regular expression object for this pattern-flag pair, or `null` in
    // case the current environment doesn't support the flags it uses.
    value = tryCreateRegexp(content, mods);
  }
  return this.finishToken(types.regexp, {pattern: content, flags: mods, value: value})
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp$8.readInt = function(radix, len) {
  var this$1 = this;

  var start = this.pos, total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this$1.input.charCodeAt(this$1.pos), val = (void 0);
    if (code >= 97) { val = code - 97 + 10; } // a
    else if (code >= 65) { val = code - 65 + 10; } // A
    else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
    else { val = Infinity; }
    if (val >= radix) { break }
    ++this$1.pos;
    total = total * radix + val;
  }
  if (this.pos === start || len != null && this.pos - start !== len) { return null }

  return total
};

pp$8.readRadixNumber = function(radix) {
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
  return this.finishToken(types.num, val)
};

// Read an integer, octal integer, or floating-point number.

pp$8.readNumber = function(startsWithDot) {
  var start = this.pos, isFloat = false, octal = this.input.charCodeAt(this.pos) === 48;
  if (!startsWithDot && this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  if (octal && this.pos == start + 1) { octal = false; }
  var next = this.input.charCodeAt(this.pos);
  if (next === 46 && !octal) { // '.'
    ++this.pos;
    this.readInt(10);
    isFloat = true;
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) { // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) { ++this.pos; } // '+-'
    if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
    isFloat = true;
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

  var str = this.input.slice(start, this.pos), val;
  if (isFloat) { val = parseFloat(str); }
  else if (!octal || str.length === 1) { val = parseInt(str, 10); }
  else if (this.strict) { this.raise(start, "Invalid number"); }
  else if (/[89]/.test(str)) { val = parseInt(str, 10); }
  else { val = parseInt(str, 8); }
  return this.finishToken(types.num, val)
};

// Read a string value, interpreting backslash-escapes.

pp$8.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;

  if (ch === 123) { // '{'
    if (this.options.ecmaVersion < 6) { this.unexpected(); }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
  } else {
    code = this.readHexChar(4);
  }
  return code
};

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) { return String.fromCharCode(code) }
  code -= 0x10000;
  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
}

pp$8.readString = function(quote) {
  var this$1 = this;

  var out = "", chunkStart = ++this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated string constant"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === quote) { break }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(false);
      chunkStart = this$1.pos;
    } else {
      if (isNewLine(ch)) { this$1.raise(this$1.start, "Unterminated string constant"); }
      ++this$1.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types.string, out)
};

// Reads template string tokens.

var INVALID_TEMPLATE_ESCAPE_ERROR = {};

pp$8.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err
    }
  }

  this.inTemplateElement = false;
};

pp$8.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR
  } else {
    this.raise(position, message);
  }
};

pp$8.readTmplToken = function() {
  var this$1 = this;

  var out = "", chunkStart = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated template"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
      if (this$1.pos === this$1.start && (this$1.type === types.template || this$1.type === types.invalidTemplate)) {
        if (ch === 36) {
          this$1.pos += 2;
          return this$1.finishToken(types.dollarBraceL)
        } else {
          ++this$1.pos;
          return this$1.finishToken(types.backQuote)
        }
      }
      out += this$1.input.slice(chunkStart, this$1.pos);
      return this$1.finishToken(types.template, out)
    }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(true);
      chunkStart = this$1.pos;
    } else if (isNewLine(ch)) {
      out += this$1.input.slice(chunkStart, this$1.pos);
      ++this$1.pos;
      switch (ch) {
      case 13:
        if (this$1.input.charCodeAt(this$1.pos) === 10) { ++this$1.pos; }
      case 10:
        out += "\n";
        break
      default:
        out += String.fromCharCode(ch);
        break
      }
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      chunkStart = this$1.pos;
    } else {
      ++this$1.pos;
    }
  }
};

// Reads a template token to search for the end, without validating any escape sequences
pp$8.readInvalidTemplateToken = function() {
  var this$1 = this;

  for (; this.pos < this.input.length; this.pos++) {
    switch (this$1.input[this$1.pos]) {
    case "\\":
      ++this$1.pos;
      break

    case "$":
      if (this$1.input[this$1.pos + 1] !== "{") {
        break
      }
    // falls through

    case "`":
      return this$1.finishToken(types.invalidTemplate, this$1.input.slice(this$1.start, this$1.pos))

    // no default
    }
  }
  this.raise(this.start, "Unterminated template");
};

// Used to read escaped characters

pp$8.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
  case 110: return "\n" // 'n' -> '\n'
  case 114: return "\r" // 'r' -> '\r'
  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
  case 117: return codePointToString(this.readCodePoint()) // 'u'
  case 116: return "\t" // 't' -> '\t'
  case 98: return "\b" // 'b' -> '\b'
  case 118: return "\u000b" // 'v' -> '\u000b'
  case 102: return "\f" // 'f' -> '\f'
  case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
  case 10: // ' \n'
    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
    return ""
  default:
    if (ch >= 48 && ch <= 55) {
      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
      var octal = parseInt(octalStr, 8);
      if (octal > 255) {
        octalStr = octalStr.slice(0, -1);
        octal = parseInt(octalStr, 8);
      }
      if (octalStr !== "0" && (this.strict || inTemplate)) {
        this.invalidStringToken(this.pos - 2, "Octal literal in strict mode");
      }
      this.pos += octalStr.length - 1;
      return String.fromCharCode(octal)
    }
    return String.fromCharCode(ch)
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp$8.readHexChar = function(len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
  return n
};

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp$8.readWord1 = function() {
  var this$1 = this;

  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this$1.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this$1.pos += ch <= 0xffff ? 1 : 2;
    } else if (ch === 92) { // "\"
      this$1.containsEsc = true;
      word += this$1.input.slice(chunkStart, this$1.pos);
      var escStart = this$1.pos;
      if (this$1.input.charCodeAt(++this$1.pos) != 117) // "u"
        { this$1.invalidStringToken(this$1.pos, "Expecting Unicode escape sequence \\uXXXX"); }
      ++this$1.pos;
      var esc = this$1.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
        { this$1.invalidStringToken(escStart, "Invalid Unicode escape"); }
      word += codePointToString(esc);
      chunkStart = this$1.pos;
    } else {
      break
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos)
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp$8.readWord = function() {
  var word = this.readWord1();
  var type = types.name;
  if (this.keywords.test(word)) {
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword " + word); }
    type = keywords$1[word];
  }
  return this.finishToken(type, word)
};

// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/ternjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/ternjs/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

var version = "5.1.2";

// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return new Parser(options, input).parse()
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  var p = new Parser(options, input, pos);
  p.nextToken();
  return p.parseExpression()
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return new Parser(options, input)
}

// This is a terrible kludge to support the existing, pre-ES6
// interface where the loose parser module retroactively adds exports
// to this module.
 // eslint-disable-line camelcase
function addLooseExports(parse, Parser$$1, plugins$$1) {
  exports.parse_dammit = parse; // eslint-disable-line camelcase
  exports.LooseParser = Parser$$1;
  exports.pluginsLoose = plugins$$1;
}

exports.version = version;
exports.parse = parse;
exports.parseExpressionAt = parseExpressionAt;
exports.tokenizer = tokenizer;
exports.addLooseExports = addLooseExports;
exports.Parser = Parser;
exports.plugins = plugins;
exports.defaultOptions = defaultOptions;
exports.Position = Position;
exports.SourceLocation = SourceLocation;
exports.getLineInfo = getLineInfo;
exports.Node = Node;
exports.TokenType = TokenType;
exports.tokTypes = types;
exports.keywordTypes = keywords$1;
exports.TokContext = TokContext;
exports.tokContexts = types$1;
exports.isIdentifierChar = isIdentifierChar;
exports.isIdentifierStart = isIdentifierStart;
exports.Token = Token;
exports.isNewLine = isNewLine;
exports.lineBreak = lineBreak;
exports.lineBreakG = lineBreakG;
exports.nonASCIIwhitespace = nonASCIIwhitespace;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],3:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('./acorn')) :
	typeof define === 'function' && define.amd ? define(['exports', './acorn'], factory) :
	(factory((global.acorn = global.acorn || {}, global.acorn.loose = global.acorn.loose || {}),global.acorn));
}(this, (function (exports,__acorn) { 'use strict';

// Registered plugins
var pluginsLoose = {};

var LooseParser = function LooseParser(input, options) {
  if ( options === void 0 ) options = {};

  this.toks = __acorn.tokenizer(input, options);
  this.options = this.toks.options;
  this.input = this.toks.input;
  this.tok = this.last = {type: __acorn.tokTypes.eof, start: 0, end: 0};
  if (this.options.locations) {
    var here = this.toks.curPosition();
    this.tok.loc = new __acorn.SourceLocation(this.toks, here, here);
  }
  this.ahead = []; // Tokens ahead
  this.context = []; // Indentation contexted
  this.curIndent = 0;
  this.curLineStart = 0;
  this.nextLineStart = this.lineEnd(this.curLineStart) + 1;
  this.inAsync = false;
  // Load plugins
  this.options.pluginsLoose = options.pluginsLoose || {};
  this.loadPlugins(this.options.pluginsLoose);
};

LooseParser.prototype.startNode = function startNode () {
  return new __acorn.Node(this.toks, this.tok.start, this.options.locations ? this.tok.loc.start : null)
};

LooseParser.prototype.storeCurrentPos = function storeCurrentPos () {
  return this.options.locations ? [this.tok.start, this.tok.loc.start] : this.tok.start
};

LooseParser.prototype.startNodeAt = function startNodeAt (pos) {
  if (this.options.locations) {
    return new __acorn.Node(this.toks, pos[0], pos[1])
  } else {
    return new __acorn.Node(this.toks, pos)
  }
};

LooseParser.prototype.finishNode = function finishNode (node, type) {
  node.type = type;
  node.end = this.last.end;
  if (this.options.locations)
    { node.loc.end = this.last.loc.end; }
  if (this.options.ranges)
    { node.range[1] = this.last.end; }
  return node
};

LooseParser.prototype.dummyNode = function dummyNode (type) {
  var dummy = this.startNode();
  dummy.type = type;
  dummy.end = dummy.start;
  if (this.options.locations)
    { dummy.loc.end = dummy.loc.start; }
  if (this.options.ranges)
    { dummy.range[1] = dummy.start; }
  this.last = {type: __acorn.tokTypes.name, start: dummy.start, end: dummy.start, loc: dummy.loc};
  return dummy
};

LooseParser.prototype.dummyIdent = function dummyIdent () {
  var dummy = this.dummyNode("Identifier");
  dummy.name = "✖";
  return dummy
};

LooseParser.prototype.dummyString = function dummyString () {
  var dummy = this.dummyNode("Literal");
  dummy.value = dummy.raw = "✖";
  return dummy
};

LooseParser.prototype.eat = function eat (type) {
  if (this.tok.type === type) {
    this.next();
    return true
  } else {
    return false
  }
};

LooseParser.prototype.isContextual = function isContextual (name) {
  return this.tok.type === __acorn.tokTypes.name && this.tok.value === name
};

LooseParser.prototype.eatContextual = function eatContextual (name) {
  return this.tok.value === name && this.eat(__acorn.tokTypes.name)
};

LooseParser.prototype.canInsertSemicolon = function canInsertSemicolon () {
  return this.tok.type === __acorn.tokTypes.eof || this.tok.type === __acorn.tokTypes.braceR ||
    __acorn.lineBreak.test(this.input.slice(this.last.end, this.tok.start))
};

LooseParser.prototype.semicolon = function semicolon () {
  return this.eat(__acorn.tokTypes.semi)
};

LooseParser.prototype.expect = function expect (type) {
    var this$1 = this;

  if (this.eat(type)) { return true }
  for (var i = 1; i <= 2; i++) {
    if (this$1.lookAhead(i).type == type) {
      for (var j = 0; j < i; j++) { this$1.next(); }
      return true
    }
  }
};

LooseParser.prototype.pushCx = function pushCx () {
  this.context.push(this.curIndent);
};

LooseParser.prototype.popCx = function popCx () {
  this.curIndent = this.context.pop();
};

LooseParser.prototype.lineEnd = function lineEnd (pos) {
  while (pos < this.input.length && !__acorn.isNewLine(this.input.charCodeAt(pos))) { ++pos; }
  return pos
};

LooseParser.prototype.indentationAfter = function indentationAfter (pos) {
    var this$1 = this;

  for (var count = 0;; ++pos) {
    var ch = this$1.input.charCodeAt(pos);
    if (ch === 32) { ++count; }
    else if (ch === 9) { count += this$1.options.tabSize; }
    else { return count }
  }
};

LooseParser.prototype.closes = function closes (closeTok, indent, line, blockHeuristic) {
  if (this.tok.type === closeTok || this.tok.type === __acorn.tokTypes.eof) { return true }
  return line != this.curLineStart && this.curIndent < indent && this.tokenStartsLine() &&
    (!blockHeuristic || this.nextLineStart >= this.input.length ||
     this.indentationAfter(this.nextLineStart) < indent)
};

LooseParser.prototype.tokenStartsLine = function tokenStartsLine () {
    var this$1 = this;

  for (var p = this.tok.start - 1; p >= this.curLineStart; --p) {
    var ch = this$1.input.charCodeAt(p);
    if (ch !== 9 && ch !== 32) { return false }
  }
  return true
};

LooseParser.prototype.extend = function extend (name, f) {
  this[name] = f(this[name]);
};

LooseParser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
    var this$1 = this;

  for (var name in pluginConfigs) {
    var plugin = pluginsLoose[name];
    if (!plugin) { throw new Error("Plugin '" + name + "' not found") }
    plugin(this$1, pluginConfigs[name]);
  }
};

LooseParser.prototype.parse = function parse () {
  this.next();
  return this.parseTopLevel()
};

var lp = LooseParser.prototype;

function isSpace(ch) {
  return (ch < 14 && ch > 8) || ch === 32 || ch === 160 || __acorn.isNewLine(ch)
}

lp.next = function() {
  var this$1 = this;

  this.last = this.tok;
  if (this.ahead.length)
    { this.tok = this.ahead.shift(); }
  else
    { this.tok = this.readToken(); }

  if (this.tok.start >= this.nextLineStart) {
    while (this.tok.start >= this.nextLineStart) {
      this$1.curLineStart = this$1.nextLineStart;
      this$1.nextLineStart = this$1.lineEnd(this$1.curLineStart) + 1;
    }
    this.curIndent = this.indentationAfter(this.curLineStart);
  }
};

lp.readToken = function() {
  var this$1 = this;

  for (;;) {
    try {
      this$1.toks.next();
      if (this$1.toks.type === __acorn.tokTypes.dot &&
          this$1.input.substr(this$1.toks.end, 1) === "." &&
          this$1.options.ecmaVersion >= 6) {
        this$1.toks.end++;
        this$1.toks.type = __acorn.tokTypes.ellipsis;
      }
      return new __acorn.Token(this$1.toks)
    } catch (e) {
      if (!(e instanceof SyntaxError)) { throw e }

      // Try to skip some text, based on the error message, and then continue
      var msg = e.message, pos = e.raisedAt, replace = true;
      if (/unterminated/i.test(msg)) {
        pos = this$1.lineEnd(e.pos + 1);
        if (/string/.test(msg)) {
          replace = {start: e.pos, end: pos, type: __acorn.tokTypes.string, value: this$1.input.slice(e.pos + 1, pos)};
        } else if (/regular expr/i.test(msg)) {
          var re = this$1.input.slice(e.pos, pos);
          try { re = new RegExp(re); } catch (e) { /* ignore compilation error due to new syntax */ }
          replace = {start: e.pos, end: pos, type: __acorn.tokTypes.regexp, value: re};
        } else if (/template/.test(msg)) {
          replace = {
            start: e.pos,
            end: pos,
            type: __acorn.tokTypes.template,
            value: this$1.input.slice(e.pos, pos)
          };
        } else {
          replace = false;
        }
      } else if (/invalid (unicode|regexp|number)|expecting unicode|octal literal|is reserved|directly after number|expected number in radix/i.test(msg)) {
        while (pos < this.input.length && !isSpace(this.input.charCodeAt(pos))) { ++pos; }
      } else if (/character escape|expected hexadecimal/i.test(msg)) {
        while (pos < this.input.length) {
          var ch = this$1.input.charCodeAt(pos++);
          if (ch === 34 || ch === 39 || __acorn.isNewLine(ch)) { break }
        }
      } else if (/unexpected character/i.test(msg)) {
        pos++;
        replace = false;
      } else if (/regular expression/i.test(msg)) {
        replace = true;
      } else {
        throw e
      }
      this$1.resetTo(pos);
      if (replace === true) { replace = {start: pos, end: pos, type: __acorn.tokTypes.name, value: "✖"}; }
      if (replace) {
        if (this$1.options.locations)
          { replace.loc = new __acorn.SourceLocation(
            this$1.toks,
            __acorn.getLineInfo(this$1.input, replace.start),
            __acorn.getLineInfo(this$1.input, replace.end)); }
        return replace
      }
    }
  }
};

lp.resetTo = function(pos) {
  var this$1 = this;

  this.toks.pos = pos;
  var ch = this.input.charAt(pos - 1);
  this.toks.exprAllowed = !ch || /[[{(,;:?/*=+\-~!|&%^<>]/.test(ch) ||
    /[enwfd]/.test(ch) &&
    /\b(keywords|case|else|return|throw|new|in|(instance|type)of|delete|void)$/.test(this.input.slice(pos - 10, pos));

  if (this.options.locations) {
    this.toks.curLine = 1;
    this.toks.lineStart = __acorn.lineBreakG.lastIndex = 0;
    var match;
    while ((match = __acorn.lineBreakG.exec(this.input)) && match.index < pos) {
      ++this$1.toks.curLine;
      this$1.toks.lineStart = match.index + match[0].length;
    }
  }
};

lp.lookAhead = function(n) {
  var this$1 = this;

  while (n > this.ahead.length)
    { this$1.ahead.push(this$1.readToken()); }
  return this.ahead[n - 1]
};

function isDummy(node) { return node.name == "✖" }

var lp$1 = LooseParser.prototype;

lp$1.parseTopLevel = function() {
  var this$1 = this;

  var node = this.startNodeAt(this.options.locations ? [0, __acorn.getLineInfo(this.input, 0)] : 0);
  node.body = [];
  while (this.tok.type !== __acorn.tokTypes.eof) { node.body.push(this$1.parseStatement()); }
  this.last = this.tok;
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType;
  }
  return this.finishNode(node, "Program")
};

lp$1.parseStatement = function() {
  var this$1 = this;

  var starttype = this.tok.type, node = this.startNode(), kind;

  if (this.toks.isLet()) {
    starttype = __acorn.tokTypes._var;
    kind = "let";
  }

  switch (starttype) {
  case __acorn.tokTypes._break: case __acorn.tokTypes._continue:
    this.next();
    var isBreak = starttype === __acorn.tokTypes._break;
    if (this.semicolon() || this.canInsertSemicolon()) {
      node.label = null;
    } else {
      node.label = this.tok.type === __acorn.tokTypes.name ? this.parseIdent() : null;
      this.semicolon();
    }
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")

  case __acorn.tokTypes._debugger:
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement")

  case __acorn.tokTypes._do:
    this.next();
    node.body = this.parseStatement();
    node.test = this.eat(__acorn.tokTypes._while) ? this.parseParenExpression() : this.dummyIdent();
    this.semicolon();
    return this.finishNode(node, "DoWhileStatement")

  case __acorn.tokTypes._for:
    this.next();
    this.pushCx();
    this.expect(__acorn.tokTypes.parenL);
    if (this.tok.type === __acorn.tokTypes.semi) { return this.parseFor(node, null) }
    var isLet = this.toks.isLet();
    if (isLet || this.tok.type === __acorn.tokTypes._var || this.tok.type === __acorn.tokTypes._const) {
      var init$1 = this.parseVar(true, isLet ? "let" : this.tok.value);
      if (init$1.declarations.length === 1 && (this.tok.type === __acorn.tokTypes._in || this.isContextual("of"))) {
        return this.parseForIn(node, init$1)
      }
      return this.parseFor(node, init$1)
    }
    var init = this.parseExpression(true);
    if (this.tok.type === __acorn.tokTypes._in || this.isContextual("of"))
      { return this.parseForIn(node, this.toAssignable(init)) }
    return this.parseFor(node, init)

  case __acorn.tokTypes._function:
    this.next();
    return this.parseFunction(node, true)

  case __acorn.tokTypes._if:
    this.next();
    node.test = this.parseParenExpression();
    node.consequent = this.parseStatement();
    node.alternate = this.eat(__acorn.tokTypes._else) ? this.parseStatement() : null;
    return this.finishNode(node, "IfStatement")

  case __acorn.tokTypes._return:
    this.next();
    if (this.eat(__acorn.tokTypes.semi) || this.canInsertSemicolon()) { node.argument = null; }
    else { node.argument = this.parseExpression(); this.semicolon(); }
    return this.finishNode(node, "ReturnStatement")

  case __acorn.tokTypes._switch:
    var blockIndent = this.curIndent, line = this.curLineStart;
    this.next();
    node.discriminant = this.parseParenExpression();
    node.cases = [];
    this.pushCx();
    this.expect(__acorn.tokTypes.braceL);

    var cur;
    while (!this.closes(__acorn.tokTypes.braceR, blockIndent, line, true)) {
      if (this$1.tok.type === __acorn.tokTypes._case || this$1.tok.type === __acorn.tokTypes._default) {
        var isCase = this$1.tok.type === __acorn.tokTypes._case;
        if (cur) { this$1.finishNode(cur, "SwitchCase"); }
        node.cases.push(cur = this$1.startNode());
        cur.consequent = [];
        this$1.next();
        if (isCase) { cur.test = this$1.parseExpression(); }
        else { cur.test = null; }
        this$1.expect(__acorn.tokTypes.colon);
      } else {
        if (!cur) {
          node.cases.push(cur = this$1.startNode());
          cur.consequent = [];
          cur.test = null;
        }
        cur.consequent.push(this$1.parseStatement());
      }
    }
    if (cur) { this.finishNode(cur, "SwitchCase"); }
    this.popCx();
    this.eat(__acorn.tokTypes.braceR);
    return this.finishNode(node, "SwitchStatement")

  case __acorn.tokTypes._throw:
    this.next();
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement")

  case __acorn.tokTypes._try:
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.tok.type === __acorn.tokTypes._catch) {
      var clause = this.startNode();
      this.next();
      this.expect(__acorn.tokTypes.parenL);
      clause.param = this.toAssignable(this.parseExprAtom(), true);
      this.expect(__acorn.tokTypes.parenR);
      clause.body = this.parseBlock();
      node.handler = this.finishNode(clause, "CatchClause");
    }
    node.finalizer = this.eat(__acorn.tokTypes._finally) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer) { return node.block }
    return this.finishNode(node, "TryStatement")

  case __acorn.tokTypes._var:
  case __acorn.tokTypes._const:
    return this.parseVar(false, kind || this.tok.value)

  case __acorn.tokTypes._while:
    this.next();
    node.test = this.parseParenExpression();
    node.body = this.parseStatement();
    return this.finishNode(node, "WhileStatement")

  case __acorn.tokTypes._with:
    this.next();
    node.object = this.parseParenExpression();
    node.body = this.parseStatement();
    return this.finishNode(node, "WithStatement")

  case __acorn.tokTypes.braceL:
    return this.parseBlock()

  case __acorn.tokTypes.semi:
    this.next();
    return this.finishNode(node, "EmptyStatement")

  case __acorn.tokTypes._class:
    return this.parseClass(true)

  case __acorn.tokTypes._import:
    return this.parseImport()

  case __acorn.tokTypes._export:
    return this.parseExport()

  default:
    if (this.toks.isAsyncFunction()) {
      this.next();
      this.next();
      return this.parseFunction(node, true, true)
    }
    var expr = this.parseExpression();
    if (isDummy(expr)) {
      this.next();
      if (this.tok.type === __acorn.tokTypes.eof) { return this.finishNode(node, "EmptyStatement") }
      return this.parseStatement()
    } else if (starttype === __acorn.tokTypes.name && expr.type === "Identifier" && this.eat(__acorn.tokTypes.colon)) {
      node.body = this.parseStatement();
      node.label = expr;
      return this.finishNode(node, "LabeledStatement")
    } else {
      node.expression = expr;
      this.semicolon();
      return this.finishNode(node, "ExpressionStatement")
    }
  }
};

lp$1.parseBlock = function() {
  var this$1 = this;

  var node = this.startNode();
  this.pushCx();
  this.expect(__acorn.tokTypes.braceL);
  var blockIndent = this.curIndent, line = this.curLineStart;
  node.body = [];
  while (!this.closes(__acorn.tokTypes.braceR, blockIndent, line, true))
    { node.body.push(this$1.parseStatement()); }
  this.popCx();
  this.eat(__acorn.tokTypes.braceR);
  return this.finishNode(node, "BlockStatement")
};

lp$1.parseFor = function(node, init) {
  node.init = init;
  node.test = node.update = null;
  if (this.eat(__acorn.tokTypes.semi) && this.tok.type !== __acorn.tokTypes.semi) { node.test = this.parseExpression(); }
  if (this.eat(__acorn.tokTypes.semi) && this.tok.type !== __acorn.tokTypes.parenR) { node.update = this.parseExpression(); }
  this.popCx();
  this.expect(__acorn.tokTypes.parenR);
  node.body = this.parseStatement();
  return this.finishNode(node, "ForStatement")
};

lp$1.parseForIn = function(node, init) {
  var type = this.tok.type === __acorn.tokTypes._in ? "ForInStatement" : "ForOfStatement";
  this.next();
  node.left = init;
  node.right = this.parseExpression();
  this.popCx();
  this.expect(__acorn.tokTypes.parenR);
  node.body = this.parseStatement();
  return this.finishNode(node, type)
};

lp$1.parseVar = function(noIn, kind) {
  var this$1 = this;

  var node = this.startNode();
  node.kind = kind;
  this.next();
  node.declarations = [];
  do {
    var decl = this$1.startNode();
    decl.id = this$1.options.ecmaVersion >= 6 ? this$1.toAssignable(this$1.parseExprAtom(), true) : this$1.parseIdent();
    decl.init = this$1.eat(__acorn.tokTypes.eq) ? this$1.parseMaybeAssign(noIn) : null;
    node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"));
  } while (this.eat(__acorn.tokTypes.comma))
  if (!node.declarations.length) {
    var decl$1 = this.startNode();
    decl$1.id = this.dummyIdent();
    node.declarations.push(this.finishNode(decl$1, "VariableDeclarator"));
  }
  if (!noIn) { this.semicolon(); }
  return this.finishNode(node, "VariableDeclaration")
};

lp$1.parseClass = function(isStatement) {
  var this$1 = this;

  var node = this.startNode();
  this.next();
  if (this.tok.type === __acorn.tokTypes.name) { node.id = this.parseIdent(); }
  else if (isStatement === true) { node.id = this.dummyIdent(); }
  else { node.id = null; }
  node.superClass = this.eat(__acorn.tokTypes._extends) ? this.parseExpression() : null;
  node.body = this.startNode();
  node.body.body = [];
  this.pushCx();
  var indent = this.curIndent + 1, line = this.curLineStart;
  this.eat(__acorn.tokTypes.braceL);
  if (this.curIndent + 1 < indent) { indent = this.curIndent; line = this.curLineStart; }
  while (!this.closes(__acorn.tokTypes.braceR, indent, line)) {
    if (this$1.semicolon()) { continue }
    var method = this$1.startNode(), isGenerator = (void 0), isAsync = (void 0);
    if (this$1.options.ecmaVersion >= 6) {
      method.static = false;
      isGenerator = this$1.eat(__acorn.tokTypes.star);
    }
    this$1.parsePropertyName(method);
    if (isDummy(method.key)) { if (isDummy(this$1.parseMaybeAssign())) { this$1.next(); } this$1.eat(__acorn.tokTypes.comma); continue }
    if (method.key.type === "Identifier" && !method.computed && method.key.name === "static" &&
        (this$1.tok.type != __acorn.tokTypes.parenL && this$1.tok.type != __acorn.tokTypes.braceL)) {
      method.static = true;
      isGenerator = this$1.eat(__acorn.tokTypes.star);
      this$1.parsePropertyName(method);
    } else {
      method.static = false;
    }
    if (!method.computed &&
        method.key.type === "Identifier" && method.key.name === "async" && this$1.tok.type !== __acorn.tokTypes.parenL &&
        !this$1.canInsertSemicolon()) {
      this$1.parsePropertyName(method);
      isAsync = true;
    } else {
      isAsync = false;
    }
    if (this$1.options.ecmaVersion >= 5 && method.key.type === "Identifier" &&
        !method.computed && (method.key.name === "get" || method.key.name === "set") &&
        this$1.tok.type !== __acorn.tokTypes.parenL && this$1.tok.type !== __acorn.tokTypes.braceL) {
      method.kind = method.key.name;
      this$1.parsePropertyName(method);
      method.value = this$1.parseMethod(false);
    } else {
      if (!method.computed && !method.static && !isGenerator && !isAsync && (
        method.key.type === "Identifier" && method.key.name === "constructor" ||
          method.key.type === "Literal" && method.key.value === "constructor")) {
        method.kind = "constructor";
      } else {
        method.kind = "method";
      }
      method.value = this$1.parseMethod(isGenerator, isAsync);
    }
    node.body.body.push(this$1.finishNode(method, "MethodDefinition"));
  }
  this.popCx();
  if (!this.eat(__acorn.tokTypes.braceR)) {
    // If there is no closing brace, make the node span to the start
    // of the next token (this is useful for Tern)
    this.last.end = this.tok.start;
    if (this.options.locations) { this.last.loc.end = this.tok.loc.start; }
  }
  this.semicolon();
  this.finishNode(node.body, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
};

lp$1.parseFunction = function(node, isStatement, isAsync) {
  var oldInAsync = this.inAsync;
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6) {
    node.generator = this.eat(__acorn.tokTypes.star);
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  if (this.tok.type === __acorn.tokTypes.name) { node.id = this.parseIdent(); }
  else if (isStatement === true) { node.id = this.dummyIdent(); }
  this.inAsync = node.async;
  node.params = this.parseFunctionParams();
  node.body = this.parseBlock();
  this.inAsync = oldInAsync;
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
};

lp$1.parseExport = function() {
  var node = this.startNode();
  this.next();
  if (this.eat(__acorn.tokTypes.star)) {
    node.source = this.eatContextual("from") ? this.parseExprAtom() : this.dummyString();
    return this.finishNode(node, "ExportAllDeclaration")
  }
  if (this.eat(__acorn.tokTypes._default)) {
    // export default (function foo() {}) // This is FunctionExpression.
    var isAsync;
    if (this.tok.type === __acorn.tokTypes._function || (isAsync = this.toks.isAsyncFunction())) {
      var fNode = this.startNode();
      this.next();
      if (isAsync) { this.next(); }
      node.declaration = this.parseFunction(fNode, "nullableID", isAsync);
    } else if (this.tok.type === __acorn.tokTypes._class) {
      node.declaration = this.parseClass("nullableID");
    } else {
      node.declaration = this.parseMaybeAssign();
      this.semicolon();
    }
    return this.finishNode(node, "ExportDefaultDeclaration")
  }
  if (this.tok.type.keyword || this.toks.isLet() || this.toks.isAsyncFunction()) {
    node.declaration = this.parseStatement();
    node.specifiers = [];
    node.source = null;
  } else {
    node.declaration = null;
    node.specifiers = this.parseExportSpecifierList();
    node.source = this.eatContextual("from") ? this.parseExprAtom() : null;
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration")
};

lp$1.parseImport = function() {
  var node = this.startNode();
  this.next();
  if (this.tok.type === __acorn.tokTypes.string) {
    node.specifiers = [];
    node.source = this.parseExprAtom();
    node.kind = "";
  } else {
    var elt;
    if (this.tok.type === __acorn.tokTypes.name && this.tok.value !== "from") {
      elt = this.startNode();
      elt.local = this.parseIdent();
      this.finishNode(elt, "ImportDefaultSpecifier");
      this.eat(__acorn.tokTypes.comma);
    }
    node.specifiers = this.parseImportSpecifierList();
    node.source = this.eatContextual("from") && this.tok.type == __acorn.tokTypes.string ? this.parseExprAtom() : this.dummyString();
    if (elt) { node.specifiers.unshift(elt); }
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration")
};

lp$1.parseImportSpecifierList = function() {
  var this$1 = this;

  var elts = [];
  if (this.tok.type === __acorn.tokTypes.star) {
    var elt = this.startNode();
    this.next();
    elt.local = this.eatContextual("as") ? this.parseIdent() : this.dummyIdent();
    elts.push(this.finishNode(elt, "ImportNamespaceSpecifier"));
  } else {
    var indent = this.curIndent, line = this.curLineStart, continuedLine = this.nextLineStart;
    this.pushCx();
    this.eat(__acorn.tokTypes.braceL);
    if (this.curLineStart > continuedLine) { continuedLine = this.curLineStart; }
    while (!this.closes(__acorn.tokTypes.braceR, indent + (this.curLineStart <= continuedLine ? 1 : 0), line)) {
      var elt$1 = this$1.startNode();
      if (this$1.eat(__acorn.tokTypes.star)) {
        elt$1.local = this$1.eatContextual("as") ? this$1.parseIdent() : this$1.dummyIdent();
        this$1.finishNode(elt$1, "ImportNamespaceSpecifier");
      } else {
        if (this$1.isContextual("from")) { break }
        elt$1.imported = this$1.parseIdent();
        if (isDummy(elt$1.imported)) { break }
        elt$1.local = this$1.eatContextual("as") ? this$1.parseIdent() : elt$1.imported;
        this$1.finishNode(elt$1, "ImportSpecifier");
      }
      elts.push(elt$1);
      this$1.eat(__acorn.tokTypes.comma);
    }
    this.eat(__acorn.tokTypes.braceR);
    this.popCx();
  }
  return elts
};

lp$1.parseExportSpecifierList = function() {
  var this$1 = this;

  var elts = [];
  var indent = this.curIndent, line = this.curLineStart, continuedLine = this.nextLineStart;
  this.pushCx();
  this.eat(__acorn.tokTypes.braceL);
  if (this.curLineStart > continuedLine) { continuedLine = this.curLineStart; }
  while (!this.closes(__acorn.tokTypes.braceR, indent + (this.curLineStart <= continuedLine ? 1 : 0), line)) {
    if (this$1.isContextual("from")) { break }
    var elt = this$1.startNode();
    elt.local = this$1.parseIdent();
    if (isDummy(elt.local)) { break }
    elt.exported = this$1.eatContextual("as") ? this$1.parseIdent() : elt.local;
    this$1.finishNode(elt, "ExportSpecifier");
    elts.push(elt);
    this$1.eat(__acorn.tokTypes.comma);
  }
  this.eat(__acorn.tokTypes.braceR);
  this.popCx();
  return elts
};

var lp$2 = LooseParser.prototype;

lp$2.checkLVal = function(expr) {
  if (!expr) { return expr }
  switch (expr.type) {
  case "Identifier":
  case "MemberExpression":
    return expr

  case "ParenthesizedExpression":
    expr.expression = this.checkLVal(expr.expression);
    return expr

  default:
    return this.dummyIdent()
  }
};

lp$2.parseExpression = function(noIn) {
  var this$1 = this;

  var start = this.storeCurrentPos();
  var expr = this.parseMaybeAssign(noIn);
  if (this.tok.type === __acorn.tokTypes.comma) {
    var node = this.startNodeAt(start);
    node.expressions = [expr];
    while (this.eat(__acorn.tokTypes.comma)) { node.expressions.push(this$1.parseMaybeAssign(noIn)); }
    return this.finishNode(node, "SequenceExpression")
  }
  return expr
};

lp$2.parseParenExpression = function() {
  this.pushCx();
  this.expect(__acorn.tokTypes.parenL);
  var val = this.parseExpression();
  this.popCx();
  this.expect(__acorn.tokTypes.parenR);
  return val
};

lp$2.parseMaybeAssign = function(noIn) {
  if (this.toks.isContextual("yield")) {
    var node = this.startNode();
    this.next();
    if (this.semicolon() || this.canInsertSemicolon() || (this.tok.type != __acorn.tokTypes.star && !this.tok.type.startsExpr)) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = this.eat(__acorn.tokTypes.star);
      node.argument = this.parseMaybeAssign();
    }
    return this.finishNode(node, "YieldExpression")
  }

  var start = this.storeCurrentPos();
  var left = this.parseMaybeConditional(noIn);
  if (this.tok.type.isAssign) {
    var node$1 = this.startNodeAt(start);
    node$1.operator = this.tok.value;
    node$1.left = this.tok.type === __acorn.tokTypes.eq ? this.toAssignable(left) : this.checkLVal(left);
    this.next();
    node$1.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node$1, "AssignmentExpression")
  }
  return left
};

lp$2.parseMaybeConditional = function(noIn) {
  var start = this.storeCurrentPos();
  var expr = this.parseExprOps(noIn);
  if (this.eat(__acorn.tokTypes.question)) {
    var node = this.startNodeAt(start);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    node.alternate = this.expect(__acorn.tokTypes.colon) ? this.parseMaybeAssign(noIn) : this.dummyIdent();
    return this.finishNode(node, "ConditionalExpression")
  }
  return expr
};

lp$2.parseExprOps = function(noIn) {
  var start = this.storeCurrentPos();
  var indent = this.curIndent, line = this.curLineStart;
  return this.parseExprOp(this.parseMaybeUnary(false), start, -1, noIn, indent, line)
};

lp$2.parseExprOp = function(left, start, minPrec, noIn, indent, line) {
  if (this.curLineStart != line && this.curIndent < indent && this.tokenStartsLine()) { return left }
  var prec = this.tok.type.binop;
  if (prec != null && (!noIn || this.tok.type !== __acorn.tokTypes._in)) {
    if (prec > minPrec) {
      var node = this.startNodeAt(start);
      node.left = left;
      node.operator = this.tok.value;
      this.next();
      if (this.curLineStart != line && this.curIndent < indent && this.tokenStartsLine()) {
        node.right = this.dummyIdent();
      } else {
        var rightStart = this.storeCurrentPos();
        node.right = this.parseExprOp(this.parseMaybeUnary(false), rightStart, prec, noIn, indent, line);
      }
      this.finishNode(node, /&&|\|\|/.test(node.operator) ? "LogicalExpression" : "BinaryExpression");
      return this.parseExprOp(node, start, minPrec, noIn, indent, line)
    }
  }
  return left
};

lp$2.parseMaybeUnary = function(sawUnary) {
  var this$1 = this;

  var start = this.storeCurrentPos(), expr;
  if (this.options.ecmaVersion >= 8 && this.inAsync && this.toks.isContextual("await")) {
    expr = this.parseAwait();
    sawUnary = true;
  } else if (this.tok.type.prefix) {
    var node = this.startNode(), update = this.tok.type === __acorn.tokTypes.incDec;
    if (!update) { sawUnary = true; }
    node.operator = this.tok.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(true);
    if (update) { node.argument = this.checkLVal(node.argument); }
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  } else if (this.tok.type === __acorn.tokTypes.ellipsis) {
    var node$1 = this.startNode();
    this.next();
    node$1.argument = this.parseMaybeUnary(sawUnary);
    expr = this.finishNode(node$1, "SpreadElement");
  } else {
    expr = this.parseExprSubscripts();
    while (this.tok.type.postfix && !this.canInsertSemicolon()) {
      var node$2 = this$1.startNodeAt(start);
      node$2.operator = this$1.tok.value;
      node$2.prefix = false;
      node$2.argument = this$1.checkLVal(expr);
      this$1.next();
      expr = this$1.finishNode(node$2, "UpdateExpression");
    }
  }

  if (!sawUnary && this.eat(__acorn.tokTypes.starstar)) {
    var node$3 = this.startNodeAt(start);
    node$3.operator = "**";
    node$3.left = expr;
    node$3.right = this.parseMaybeUnary(false);
    return this.finishNode(node$3, "BinaryExpression")
  }

  return expr
};

lp$2.parseExprSubscripts = function() {
  var start = this.storeCurrentPos();
  return this.parseSubscripts(this.parseExprAtom(), start, false, this.curIndent, this.curLineStart)
};

lp$2.parseSubscripts = function(base, start, noCalls, startIndent, line) {
  var this$1 = this;

  for (;;) {
    if (this$1.curLineStart != line && this$1.curIndent <= startIndent && this$1.tokenStartsLine()) {
      if (this$1.tok.type == __acorn.tokTypes.dot && this$1.curIndent == startIndent)
        { --startIndent; }
      else
        { return base }
    }

    var maybeAsyncArrow = base.type === "Identifier" && base.name === "async" && !this$1.canInsertSemicolon();

    if (this$1.eat(__acorn.tokTypes.dot)) {
      var node = this$1.startNodeAt(start);
      node.object = base;
      if (this$1.curLineStart != line && this$1.curIndent <= startIndent && this$1.tokenStartsLine())
        { node.property = this$1.dummyIdent(); }
      else
        { node.property = this$1.parsePropertyAccessor() || this$1.dummyIdent(); }
      node.computed = false;
      base = this$1.finishNode(node, "MemberExpression");
    } else if (this$1.tok.type == __acorn.tokTypes.bracketL) {
      this$1.pushCx();
      this$1.next();
      var node$1 = this$1.startNodeAt(start);
      node$1.object = base;
      node$1.property = this$1.parseExpression();
      node$1.computed = true;
      this$1.popCx();
      this$1.expect(__acorn.tokTypes.bracketR);
      base = this$1.finishNode(node$1, "MemberExpression");
    } else if (!noCalls && this$1.tok.type == __acorn.tokTypes.parenL) {
      var exprList = this$1.parseExprList(__acorn.tokTypes.parenR);
      if (maybeAsyncArrow && this$1.eat(__acorn.tokTypes.arrow))
        { return this$1.parseArrowExpression(this$1.startNodeAt(start), exprList, true) }
      var node$2 = this$1.startNodeAt(start);
      node$2.callee = base;
      node$2.arguments = exprList;
      base = this$1.finishNode(node$2, "CallExpression");
    } else if (this$1.tok.type == __acorn.tokTypes.backQuote) {
      var node$3 = this$1.startNodeAt(start);
      node$3.tag = base;
      node$3.quasi = this$1.parseTemplate();
      base = this$1.finishNode(node$3, "TaggedTemplateExpression");
    } else {
      return base
    }
  }
};

lp$2.parseExprAtom = function() {
  var node;
  switch (this.tok.type) {
  case __acorn.tokTypes._this:
  case __acorn.tokTypes._super:
    var type = this.tok.type === __acorn.tokTypes._this ? "ThisExpression" : "Super";
    node = this.startNode();
    this.next();
    return this.finishNode(node, type)

  case __acorn.tokTypes.name:
    var start = this.storeCurrentPos();
    var id = this.parseIdent();
    var isAsync = false;
    if (id.name === "async" && !this.canInsertSemicolon()) {
      if (this.eat(__acorn.tokTypes._function))
        { return this.parseFunction(this.startNodeAt(start), false, true) }
      if (this.tok.type === __acorn.tokTypes.name) {
        id = this.parseIdent();
        isAsync = true;
      }
    }
    return this.eat(__acorn.tokTypes.arrow) ? this.parseArrowExpression(this.startNodeAt(start), [id], isAsync) : id

  case __acorn.tokTypes.regexp:
    node = this.startNode();
    var val = this.tok.value;
    node.regex = {pattern: val.pattern, flags: val.flags};
    node.value = val.value;
    node.raw = this.input.slice(this.tok.start, this.tok.end);
    this.next();
    return this.finishNode(node, "Literal")

  case __acorn.tokTypes.num: case __acorn.tokTypes.string:
    node = this.startNode();
    node.value = this.tok.value;
    node.raw = this.input.slice(this.tok.start, this.tok.end);
    this.next();
    return this.finishNode(node, "Literal")

  case __acorn.tokTypes._null: case __acorn.tokTypes._true: case __acorn.tokTypes._false:
    node = this.startNode();
    node.value = this.tok.type === __acorn.tokTypes._null ? null : this.tok.type === __acorn.tokTypes._true;
    node.raw = this.tok.type.keyword;
    this.next();
    return this.finishNode(node, "Literal")

  case __acorn.tokTypes.parenL:
    var parenStart = this.storeCurrentPos();
    this.next();
    var inner = this.parseExpression();
    this.expect(__acorn.tokTypes.parenR);
    if (this.eat(__acorn.tokTypes.arrow)) {
      // (a,)=>a // SequenceExpression makes dummy in the last hole. Drop the dummy.
      var params = inner.expressions || [inner];
      if (params.length && isDummy(params[params.length - 1]))
        { params.pop(); }
      return this.parseArrowExpression(this.startNodeAt(parenStart), params)
    }
    if (this.options.preserveParens) {
      var par = this.startNodeAt(parenStart);
      par.expression = inner;
      inner = this.finishNode(par, "ParenthesizedExpression");
    }
    return inner

  case __acorn.tokTypes.bracketL:
    node = this.startNode();
    node.elements = this.parseExprList(__acorn.tokTypes.bracketR, true);
    return this.finishNode(node, "ArrayExpression")

  case __acorn.tokTypes.braceL:
    return this.parseObj()

  case __acorn.tokTypes._class:
    return this.parseClass(false)

  case __acorn.tokTypes._function:
    node = this.startNode();
    this.next();
    return this.parseFunction(node, false)

  case __acorn.tokTypes._new:
    return this.parseNew()

  case __acorn.tokTypes.backQuote:
    return this.parseTemplate()

  default:
    return this.dummyIdent()
  }
};

lp$2.parseNew = function() {
  var node = this.startNode(), startIndent = this.curIndent, line = this.curLineStart;
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(__acorn.tokTypes.dot)) {
    node.meta = meta;
    node.property = this.parseIdent(true);
    return this.finishNode(node, "MetaProperty")
  }
  var start = this.storeCurrentPos();
  node.callee = this.parseSubscripts(this.parseExprAtom(), start, true, startIndent, line);
  if (this.tok.type == __acorn.tokTypes.parenL) {
    node.arguments = this.parseExprList(__acorn.tokTypes.parenR);
  } else {
    node.arguments = [];
  }
  return this.finishNode(node, "NewExpression")
};

lp$2.parseTemplateElement = function() {
  var elem = this.startNode();

  // The loose parser accepts invalid unicode escapes even in untagged templates.
  if (this.tok.type === __acorn.tokTypes.invalidTemplate) {
    elem.value = {
      raw: this.tok.value,
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.tok.start, this.tok.end).replace(/\r\n?/g, "\n"),
      cooked: this.tok.value
    };
  }
  this.next();
  elem.tail = this.tok.type === __acorn.tokTypes.backQuote;
  return this.finishNode(elem, "TemplateElement")
};

lp$2.parseTemplate = function() {
  var this$1 = this;

  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement();
  node.quasis = [curElt];
  while (!curElt.tail) {
    this$1.next();
    node.expressions.push(this$1.parseExpression());
    if (this$1.expect(__acorn.tokTypes.braceR)) {
      curElt = this$1.parseTemplateElement();
    } else {
      curElt = this$1.startNode();
      curElt.value = {cooked: "", raw: ""};
      curElt.tail = true;
      this$1.finishNode(curElt, "TemplateElement");
    }
    node.quasis.push(curElt);
  }
  this.expect(__acorn.tokTypes.backQuote);
  return this.finishNode(node, "TemplateLiteral")
};

lp$2.parseObj = function() {
  var this$1 = this;

  var node = this.startNode();
  node.properties = [];
  this.pushCx();
  var indent = this.curIndent + 1, line = this.curLineStart;
  this.eat(__acorn.tokTypes.braceL);
  if (this.curIndent + 1 < indent) { indent = this.curIndent; line = this.curLineStart; }
  while (!this.closes(__acorn.tokTypes.braceR, indent, line)) {
    var prop = this$1.startNode(), isGenerator = (void 0), isAsync = (void 0), start = (void 0);
    if (this$1.options.ecmaVersion >= 6) {
      start = this$1.storeCurrentPos();
      prop.method = false;
      prop.shorthand = false;
      isGenerator = this$1.eat(__acorn.tokTypes.star);
    }
    this$1.parsePropertyName(prop);
    if (this$1.toks.isAsyncProp(prop)) {
      this$1.parsePropertyName(prop);
      isAsync = true;
    } else {
      isAsync = false;
    }
    if (isDummy(prop.key)) { if (isDummy(this$1.parseMaybeAssign())) { this$1.next(); } this$1.eat(__acorn.tokTypes.comma); continue }
    if (this$1.eat(__acorn.tokTypes.colon)) {
      prop.kind = "init";
      prop.value = this$1.parseMaybeAssign();
    } else if (this$1.options.ecmaVersion >= 6 && (this$1.tok.type === __acorn.tokTypes.parenL || this$1.tok.type === __acorn.tokTypes.braceL)) {
      prop.kind = "init";
      prop.method = true;
      prop.value = this$1.parseMethod(isGenerator, isAsync);
    } else if (this$1.options.ecmaVersion >= 5 && prop.key.type === "Identifier" &&
               !prop.computed && (prop.key.name === "get" || prop.key.name === "set") &&
               (this$1.tok.type != __acorn.tokTypes.comma && this$1.tok.type != __acorn.tokTypes.braceR)) {
      prop.kind = prop.key.name;
      this$1.parsePropertyName(prop);
      prop.value = this$1.parseMethod(false);
    } else {
      prop.kind = "init";
      if (this$1.options.ecmaVersion >= 6) {
        if (this$1.eat(__acorn.tokTypes.eq)) {
          var assign = this$1.startNodeAt(start);
          assign.operator = "=";
          assign.left = prop.key;
          assign.right = this$1.parseMaybeAssign();
          prop.value = this$1.finishNode(assign, "AssignmentExpression");
        } else {
          prop.value = prop.key;
        }
      } else {
        prop.value = this$1.dummyIdent();
      }
      prop.shorthand = true;
    }
    node.properties.push(this$1.finishNode(prop, "Property"));
    this$1.eat(__acorn.tokTypes.comma);
  }
  this.popCx();
  if (!this.eat(__acorn.tokTypes.braceR)) {
    // If there is no closing brace, make the node span to the start
    // of the next token (this is useful for Tern)
    this.last.end = this.tok.start;
    if (this.options.locations) { this.last.loc.end = this.tok.loc.start; }
  }
  return this.finishNode(node, "ObjectExpression")
};

lp$2.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(__acorn.tokTypes.bracketL)) {
      prop.computed = true;
      prop.key = this.parseExpression();
      this.expect(__acorn.tokTypes.bracketR);
      return
    } else {
      prop.computed = false;
    }
  }
  var key = (this.tok.type === __acorn.tokTypes.num || this.tok.type === __acorn.tokTypes.string) ? this.parseExprAtom() : this.parseIdent();
  prop.key = key || this.dummyIdent();
};

lp$2.parsePropertyAccessor = function() {
  if (this.tok.type === __acorn.tokTypes.name || this.tok.type.keyword) { return this.parseIdent() }
};

lp$2.parseIdent = function() {
  var name = this.tok.type === __acorn.tokTypes.name ? this.tok.value : this.tok.type.keyword;
  if (!name) { return this.dummyIdent() }
  var node = this.startNode();
  this.next();
  node.name = name;
  return this.finishNode(node, "Identifier")
};

lp$2.initFunction = function(node) {
  node.id = null;
  node.params = [];
  if (this.options.ecmaVersion >= 6) {
    node.generator = false;
    node.expression = false;
  }
  if (this.options.ecmaVersion >= 8)
    { node.async = false; }
};

// Convert existing expression atom to assignable pattern
// if possible.

lp$2.toAssignable = function(node, binding) {
  var this$1 = this;

  if (!node || node.type == "Identifier" || (node.type == "MemberExpression" && !binding)) {
    // Okay
  } else if (node.type == "ParenthesizedExpression") {
    this.toAssignable(node.expression, binding);
  } else if (this.options.ecmaVersion < 6) {
    return this.dummyIdent()
  } else if (node.type == "ObjectExpression") {
    node.type = "ObjectPattern";
    var props = node.properties;
    for (var i = 0, list = props; i < list.length; i += 1)
      {
      var prop = list[i];

      this$1.toAssignable(prop.value, binding);
    }
  } else if (node.type == "ArrayExpression") {
    node.type = "ArrayPattern";
    this.toAssignableList(node.elements, binding);
  } else if (node.type == "SpreadElement") {
    node.type = "RestElement";
    this.toAssignable(node.argument, binding);
  } else if (node.type == "AssignmentExpression") {
    node.type = "AssignmentPattern";
    delete node.operator;
  } else {
    return this.dummyIdent()
  }
  return node
};

lp$2.toAssignableList = function(exprList, binding) {
  var this$1 = this;

  for (var i = 0, list = exprList; i < list.length; i += 1)
    {
    var expr = list[i];

    this$1.toAssignable(expr, binding);
  }
  return exprList
};

lp$2.parseFunctionParams = function(params) {
  params = this.parseExprList(__acorn.tokTypes.parenR);
  return this.toAssignableList(params, true)
};

lp$2.parseMethod = function(isGenerator, isAsync) {
  var node = this.startNode(), oldInAsync = this.inAsync;
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6)
    { node.generator = !!isGenerator; }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }
  this.inAsync = node.async;
  node.params = this.parseFunctionParams();
  node.expression = this.options.ecmaVersion >= 6 && this.tok.type !== __acorn.tokTypes.braceL;
  node.body = node.expression ? this.parseMaybeAssign() : this.parseBlock();
  this.inAsync = oldInAsync;
  return this.finishNode(node, "FunctionExpression")
};

lp$2.parseArrowExpression = function(node, params, isAsync) {
  var oldInAsync = this.inAsync;
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }
  this.inAsync = node.async;
  node.params = this.toAssignableList(params, true);
  node.expression = this.tok.type !== __acorn.tokTypes.braceL;
  node.body = node.expression ? this.parseMaybeAssign() : this.parseBlock();
  this.inAsync = oldInAsync;
  return this.finishNode(node, "ArrowFunctionExpression")
};

lp$2.parseExprList = function(close, allowEmpty) {
  var this$1 = this;

  this.pushCx();
  var indent = this.curIndent, line = this.curLineStart, elts = [];
  this.next(); // Opening bracket
  while (!this.closes(close, indent + 1, line)) {
    if (this$1.eat(__acorn.tokTypes.comma)) {
      elts.push(allowEmpty ? null : this$1.dummyIdent());
      continue
    }
    var elt = this$1.parseMaybeAssign();
    if (isDummy(elt)) {
      if (this$1.closes(close, indent, line)) { break }
      this$1.next();
    } else {
      elts.push(elt);
    }
    this$1.eat(__acorn.tokTypes.comma);
  }
  this.popCx();
  if (!this.eat(close)) {
    // If there is no closing brace, make the node span to the start
    // of the next token (this is useful for Tern)
    this.last.end = this.tok.start;
    if (this.options.locations) { this.last.loc.end = this.tok.loc.start; }
  }
  return elts
};

lp$2.parseAwait = function() {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary();
  return this.finishNode(node, "AwaitExpression")
};

// Acorn: Loose parser
//
// This module provides an alternative parser (`parse_dammit`) that
// exposes that same interface as `parse`, but will try to parse
// anything as JavaScript, repairing syntax error the best it can.
// There are circumstances in which it will raise an error and give
// up, but they are very rare. The resulting AST will be a mostly
// valid JavaScript AST (as per the [Mozilla parser API][api], except
// that:
//
// - Return outside functions is allowed
//
// - Label consistency (no conflicts, break only to existing labels)
//   is not enforced.
//
// - Bogus Identifier nodes with a name of `"✖"` are inserted whenever
//   the parser got too confused to return anything meaningful.
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
//
// The expected use for this is to *first* try `acorn.parse`, and only
// if that fails switch to `parse_dammit`. The loose parser might
// parse badly indented code incorrectly, so **don't** use it as
// your default parser.
//
// Quite a lot of acorn.js is duplicated here. The alternative was to
// add a *lot* of extra cruft to that file, making it less readable
// and slower. Copying and editing the code allowed me to make
// invasive changes and simplifications without creating a complicated
// tangle.

__acorn.defaultOptions.tabSize = 4;

// eslint-disable-next-line camelcase
function parse_dammit(input, options) {
  return new LooseParser(input, options).parse()
}

__acorn.addLooseExports(parse_dammit, LooseParser, pluginsLoose);

exports.parse_dammit = parse_dammit;
exports.LooseParser = LooseParser;
exports.pluginsLoose = pluginsLoose;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{"./acorn":2}],4:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.acorn = global.acorn || {}, global.acorn.walk = global.acorn.walk || {})));
}(this, (function (exports) { 'use strict';

// AST walker module for Mozilla Parser API compatible trees

// A simple walk is one where you simply specify callbacks to be
// called on specific nodes. The last two arguments are optional. A
// simple use would be
//
//     walk.simple(myTree, {
//         Expression: function(node) { ... }
//     });
//
// to do something with all expressions. All Parser API node types
// can be used to identify node types, as well as Expression,
// Statement, and ScopeBody, which denote categories of nodes.
//
// The base argument can be used to pass a custom (recursive)
// walker, and state can be used to give this walked an initial
// state.

function simple(node, visitors, base, state, override) {
  if (!base) { base = exports.base
  ; }(function c(node, st, override) {
    var type = override || node.type, found = visitors[type];
    base[type](node, st, c);
    if (found) { found(node, st); }
  })(node, state, override);
}

// An ancestor walk keeps an array of ancestor nodes (including the
// current node) and passes them to the callback as third parameter
// (and also as state parameter when no other state is present).
function ancestor(node, visitors, base, state) {
  if (!base) { base = exports.base; }
  var ancestors = [];(function c(node, st, override) {
    var type = override || node.type, found = visitors[type];
    var isNew = node != ancestors[ancestors.length - 1];
    if (isNew) { ancestors.push(node); }
    base[type](node, st, c);
    if (found) { found(node, st || ancestors, ancestors); }
    if (isNew) { ancestors.pop(); }
  })(node, state);
}

// A recursive walk is one where your functions override the default
// walkers. They can modify and replace the state parameter that's
// threaded through the walk, and can opt how and whether to walk
// their child nodes (by calling their third argument on these
// nodes).
function recursive(node, state, funcs, base, override) {
  var visitor = funcs ? exports.make(funcs, base) : base;(function c(node, st, override) {
    visitor[override || node.type](node, st, c);
  })(node, state, override);
}

function makeTest(test) {
  if (typeof test == "string")
    { return function (type) { return type == test; } }
  else if (!test)
    { return function () { return true; } }
  else
    { return test }
}

var Found = function Found(node, state) { this.node = node; this.state = state; };

// A full walk triggers the callback on each node
function full(node, callback, base, state, override) {
  if (!base) { base = exports.base
  ; }(function c(node, st, override) {
    var type = override || node.type;
    base[type](node, st, c);
    callback(node, st, type);
  })(node, state, override);
}

// An fullAncestor walk is like an ancestor walk, but triggers
// the callback on each node
function fullAncestor(node, callback, base, state) {
  if (!base) { base = exports.base; }
  var ancestors = [];(function c(node, st, override) {
    var type = override || node.type;
    var isNew = node != ancestors[ancestors.length - 1];
    if (isNew) { ancestors.push(node); }
    base[type](node, st, c);
    callback(node, st || ancestors, ancestors, type);
    if (isNew) { ancestors.pop(); }
  })(node, state);
}

// Find a node with a given start, end, and type (all are optional,
// null can be used as wildcard). Returns a {node, state} object, or
// undefined when it doesn't find a matching node.
function findNodeAt(node, start, end, test, base, state) {
  test = makeTest(test);
  if (!base) { base = exports.base; }
  try {
    (function c(node, st, override) {
      var type = override || node.type;
      if ((start == null || node.start <= start) &&
          (end == null || node.end >= end))
        { base[type](node, st, c); }
      if ((start == null || node.start == start) &&
          (end == null || node.end == end) &&
          test(type, node))
        { throw new Found(node, st) }
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the innermost node of a given type that contains the given
// position. Interface similar to findNodeAt.
function findNodeAround(node, pos, test, base, state) {
  test = makeTest(test);
  if (!base) { base = exports.base; }
  try {
    (function c(node, st, override) {
      var type = override || node.type;
      if (node.start > pos || node.end < pos) { return }
      base[type](node, st, c);
      if (test(type, node)) { throw new Found(node, st) }
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the outermost matching node after a given position.
function findNodeAfter(node, pos, test, base, state) {
  test = makeTest(test);
  if (!base) { base = exports.base; }
  try {
    (function c(node, st, override) {
      if (node.end < pos) { return }
      var type = override || node.type;
      if (node.start >= pos && test(type, node)) { throw new Found(node, st) }
      base[type](node, st, c);
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the outermost matching node before a given position.
function findNodeBefore(node, pos, test, base, state) {
  test = makeTest(test);
  if (!base) { base = exports.base; }
  var max;(function c(node, st, override) {
    if (node.start > pos) { return }
    var type = override || node.type;
    if (node.end <= pos && (!max || max.node.end < node.end) && test(type, node))
      { max = new Found(node, st); }
    base[type](node, st, c);
  })(node, state);
  return max
}

// Fallback to an Object.create polyfill for older environments.
var create = Object.create || function(proto) {
  function Ctor() {}
  Ctor.prototype = proto;
  return new Ctor
};

// Used to create a custom walker. Will fill in all missing node
// type properties with the defaults.
function make(funcs, base) {
  if (!base) { base = exports.base; }
  var visitor = create(base);
  for (var type in funcs) { visitor[type] = funcs[type]; }
  return visitor
}

function skipThrough(node, st, c) { c(node, st); }
function ignore(_node, _st, _c) {}

// Node walkers.

var base = {};

base.Program = base.BlockStatement = function (node, st, c) {
  for (var i = 0, list = node.body; i < list.length; i += 1)
    {
    var stmt = list[i];

    c(stmt, st, "Statement");
  }
};
base.Statement = skipThrough;
base.EmptyStatement = ignore;
base.ExpressionStatement = base.ParenthesizedExpression =
  function (node, st, c) { return c(node.expression, st, "Expression"); };
base.IfStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Statement");
  if (node.alternate) { c(node.alternate, st, "Statement"); }
};
base.LabeledStatement = function (node, st, c) { return c(node.body, st, "Statement"); };
base.BreakStatement = base.ContinueStatement = ignore;
base.WithStatement = function (node, st, c) {
  c(node.object, st, "Expression");
  c(node.body, st, "Statement");
};
base.SwitchStatement = function (node, st, c) {
  c(node.discriminant, st, "Expression");
  for (var i = 0, list = node.cases; i < list.length; i += 1) {
    var cs = list[i];

    if (cs.test) { c(cs.test, st, "Expression"); }
    for (var i$1 = 0, list$1 = cs.consequent; i$1 < list$1.length; i$1 += 1)
      {
      var cons = list$1[i$1];

      c(cons, st, "Statement");
    }
  }
};
base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function (node, st, c) {
  if (node.argument) { c(node.argument, st, "Expression"); }
};
base.ThrowStatement = base.SpreadElement =
  function (node, st, c) { return c(node.argument, st, "Expression"); };
base.TryStatement = function (node, st, c) {
  c(node.block, st, "Statement");
  if (node.handler) { c(node.handler, st); }
  if (node.finalizer) { c(node.finalizer, st, "Statement"); }
};
base.CatchClause = function (node, st, c) {
  c(node.param, st, "Pattern");
  c(node.body, st, "ScopeBody");
};
base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForStatement = function (node, st, c) {
  if (node.init) { c(node.init, st, "ForInit"); }
  if (node.test) { c(node.test, st, "Expression"); }
  if (node.update) { c(node.update, st, "Expression"); }
  c(node.body, st, "Statement");
};
base.ForInStatement = base.ForOfStatement = function (node, st, c) {
  c(node.left, st, "ForInit");
  c(node.right, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForInit = function (node, st, c) {
  if (node.type == "VariableDeclaration") { c(node, st); }
  else { c(node, st, "Expression"); }
};
base.DebuggerStatement = ignore;

base.FunctionDeclaration = function (node, st, c) { return c(node, st, "Function"); };
base.VariableDeclaration = function (node, st, c) {
  for (var i = 0, list = node.declarations; i < list.length; i += 1)
    {
    var decl = list[i];

    c(decl, st);
  }
};
base.VariableDeclarator = function (node, st, c) {
  c(node.id, st, "Pattern");
  if (node.init) { c(node.init, st, "Expression"); }
};

base.Function = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    c(param, st, "Pattern");
  }
  c(node.body, st, node.expression ? "ScopeExpression" : "ScopeBody");
};
// FIXME drop these node types in next major version
// (They are awkward, and in ES6 every block can be a scope.)
base.ScopeBody = function (node, st, c) { return c(node, st, "Statement"); };
base.ScopeExpression = function (node, st, c) { return c(node, st, "Expression"); };

base.Pattern = function (node, st, c) {
  if (node.type == "Identifier")
    { c(node, st, "VariablePattern"); }
  else if (node.type == "MemberExpression")
    { c(node, st, "MemberPattern"); }
  else
    { c(node, st); }
};
base.VariablePattern = ignore;
base.MemberPattern = skipThrough;
base.RestElement = function (node, st, c) { return c(node.argument, st, "Pattern"); };
base.ArrayPattern = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Pattern"); }
  }
};
base.ObjectPattern = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1)
    {
    var prop = list[i];

    c(prop.value, st, "Pattern");
  }
};

base.Expression = skipThrough;
base.ThisExpression = base.Super = base.MetaProperty = ignore;
base.ArrayExpression = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Expression"); }
  }
};
base.ObjectExpression = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1)
    {
    var prop = list[i];

    c(prop, st);
  }
};
base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
base.SequenceExpression = base.TemplateLiteral = function (node, st, c) {
  for (var i = 0, list = node.expressions; i < list.length; i += 1)
    {
    var expr = list[i];

    c(expr, st, "Expression");
  }
};
base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
  c(node.argument, st, "Expression");
};
base.BinaryExpression = base.LogicalExpression = function (node, st, c) {
  c(node.left, st, "Expression");
  c(node.right, st, "Expression");
};
base.AssignmentExpression = base.AssignmentPattern = function (node, st, c) {
  c(node.left, st, "Pattern");
  c(node.right, st, "Expression");
};
base.ConditionalExpression = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Expression");
  c(node.alternate, st, "Expression");
};
base.NewExpression = base.CallExpression = function (node, st, c) {
  c(node.callee, st, "Expression");
  if (node.arguments)
    { for (var i = 0, list = node.arguments; i < list.length; i += 1)
      {
        var arg = list[i];

        c(arg, st, "Expression");
      } }
};
base.MemberExpression = function (node, st, c) {
  c(node.object, st, "Expression");
  if (node.computed) { c(node.property, st, "Expression"); }
};
base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function (node, st, c) {
  if (node.declaration)
    { c(node.declaration, st, node.type == "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression"); }
  if (node.source) { c(node.source, st, "Expression"); }
};
base.ExportAllDeclaration = function (node, st, c) {
  c(node.source, st, "Expression");
};
base.ImportDeclaration = function (node, st, c) {
  for (var i = 0, list = node.specifiers; i < list.length; i += 1)
    {
    var spec = list[i];

    c(spec, st);
  }
  c(node.source, st, "Expression");
};
base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.Literal = ignore;

base.TaggedTemplateExpression = function (node, st, c) {
  c(node.tag, st, "Expression");
  c(node.quasi, st);
};
base.ClassDeclaration = base.ClassExpression = function (node, st, c) { return c(node, st, "Class"); };
base.Class = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  if (node.superClass) { c(node.superClass, st, "Expression"); }
  for (var i = 0, list = node.body.body; i < list.length; i += 1)
    {
    var item = list[i];

    c(item, st);
  }
};
base.MethodDefinition = base.Property = function (node, st, c) {
  if (node.computed) { c(node.key, st, "Expression"); }
  c(node.value, st, "Expression");
};

exports.simple = simple;
exports.ancestor = ancestor;
exports.recursive = recursive;
exports.full = full;
exports.fullAncestor = fullAncestor;
exports.findNodeAt = findNodeAt;
exports.findNodeAround = findNodeAround;
exports.findNodeAfter = findNodeAfter;
exports.findNodeBefore = findNodeBefore;
exports.make = make;
exports.base = base;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],5:[function(require,module,exports){
/*
 A JavaScript implementation of the SHA family of hashes, as
 defined in FIPS PUB 180-4 and FIPS PUB 202, as well as the corresponding
 HMAC implementation as defined in FIPS PUB 198a

 Copyright Brian Turek 2008-2017
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnston
*/
'use strict';(function(Y){function C(c,a,b){var e=0,h=[],n=0,g,l,d,f,m,q,u,r,I=!1,v=[],w=[],t,y=!1,z=!1,x=-1;b=b||{};g=b.encoding||"UTF8";t=b.numRounds||1;if(t!==parseInt(t,10)||1>t)throw Error("numRounds must a integer >= 1");if("SHA-1"===c)m=512,q=K,u=Z,f=160,r=function(a){return a.slice()};else if(0===c.lastIndexOf("SHA-",0))if(q=function(a,b){return L(a,b,c)},u=function(a,b,h,e){var k,f;if("SHA-224"===c||"SHA-256"===c)k=(b+65>>>9<<4)+15,f=16;else if("SHA-384"===c||"SHA-512"===c)k=(b+129>>>10<<
5)+31,f=32;else throw Error("Unexpected error in SHA-2 implementation");for(;a.length<=k;)a.push(0);a[b>>>5]|=128<<24-b%32;b=b+h;a[k]=b&4294967295;a[k-1]=b/4294967296|0;h=a.length;for(b=0;b<h;b+=f)e=L(a.slice(b,b+f),e,c);if("SHA-224"===c)a=[e[0],e[1],e[2],e[3],e[4],e[5],e[6]];else if("SHA-256"===c)a=e;else if("SHA-384"===c)a=[e[0].a,e[0].b,e[1].a,e[1].b,e[2].a,e[2].b,e[3].a,e[3].b,e[4].a,e[4].b,e[5].a,e[5].b];else if("SHA-512"===c)a=[e[0].a,e[0].b,e[1].a,e[1].b,e[2].a,e[2].b,e[3].a,e[3].b,e[4].a,
e[4].b,e[5].a,e[5].b,e[6].a,e[6].b,e[7].a,e[7].b];else throw Error("Unexpected error in SHA-2 implementation");return a},r=function(a){return a.slice()},"SHA-224"===c)m=512,f=224;else if("SHA-256"===c)m=512,f=256;else if("SHA-384"===c)m=1024,f=384;else if("SHA-512"===c)m=1024,f=512;else throw Error("Chosen SHA variant is not supported");else if(0===c.lastIndexOf("SHA3-",0)||0===c.lastIndexOf("SHAKE",0)){var F=6;q=D;r=function(a){var c=[],e;for(e=0;5>e;e+=1)c[e]=a[e].slice();return c};x=1;if("SHA3-224"===
c)m=1152,f=224;else if("SHA3-256"===c)m=1088,f=256;else if("SHA3-384"===c)m=832,f=384;else if("SHA3-512"===c)m=576,f=512;else if("SHAKE128"===c)m=1344,f=-1,F=31,z=!0;else if("SHAKE256"===c)m=1088,f=-1,F=31,z=!0;else throw Error("Chosen SHA variant is not supported");u=function(a,c,e,b,h){e=m;var k=F,f,g=[],n=e>>>5,l=0,d=c>>>5;for(f=0;f<d&&c>=e;f+=n)b=D(a.slice(f,f+n),b),c-=e;a=a.slice(f);for(c%=e;a.length<n;)a.push(0);f=c>>>3;a[f>>2]^=k<<f%4*8;a[n-1]^=2147483648;for(b=D(a,b);32*g.length<h;){a=b[l%
5][l/5|0];g.push(a.b);if(32*g.length>=h)break;g.push(a.a);l+=1;0===64*l%e&&D(null,b)}return g}}else throw Error("Chosen SHA variant is not supported");d=M(a,g,x);l=A(c);this.setHMACKey=function(a,b,h){var k;if(!0===I)throw Error("HMAC key already set");if(!0===y)throw Error("Cannot set HMAC key after calling update");if(!0===z)throw Error("SHAKE is not supported for HMAC");g=(h||{}).encoding||"UTF8";b=M(b,g,x)(a);a=b.binLen;b=b.value;k=m>>>3;h=k/4-1;if(k<a/8){for(b=u(b,a,0,A(c),f);b.length<=h;)b.push(0);
b[h]&=4294967040}else if(k>a/8){for(;b.length<=h;)b.push(0);b[h]&=4294967040}for(a=0;a<=h;a+=1)v[a]=b[a]^909522486,w[a]=b[a]^1549556828;l=q(v,l);e=m;I=!0};this.update=function(a){var c,b,k,f=0,g=m>>>5;c=d(a,h,n);a=c.binLen;b=c.value;c=a>>>5;for(k=0;k<c;k+=g)f+m<=a&&(l=q(b.slice(k,k+g),l),f+=m);e+=f;h=b.slice(f>>>5);n=a%m;y=!0};this.getHash=function(a,b){var k,g,d,m;if(!0===I)throw Error("Cannot call getHash after setting HMAC key");d=N(b);if(!0===z){if(-1===d.shakeLen)throw Error("shakeLen must be specified in options");
f=d.shakeLen}switch(a){case "HEX":k=function(a){return O(a,f,x,d)};break;case "B64":k=function(a){return P(a,f,x,d)};break;case "BYTES":k=function(a){return Q(a,f,x)};break;case "ARRAYBUFFER":try{g=new ArrayBuffer(0)}catch(p){throw Error("ARRAYBUFFER not supported by this environment");}k=function(a){return R(a,f,x)};break;default:throw Error("format must be HEX, B64, BYTES, or ARRAYBUFFER");}m=u(h.slice(),n,e,r(l),f);for(g=1;g<t;g+=1)!0===z&&0!==f%32&&(m[m.length-1]&=16777215>>>24-f%32),m=u(m,f,
0,A(c),f);return k(m)};this.getHMAC=function(a,b){var k,g,d,p;if(!1===I)throw Error("Cannot call getHMAC without first setting HMAC key");d=N(b);switch(a){case "HEX":k=function(a){return O(a,f,x,d)};break;case "B64":k=function(a){return P(a,f,x,d)};break;case "BYTES":k=function(a){return Q(a,f,x)};break;case "ARRAYBUFFER":try{k=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}k=function(a){return R(a,f,x)};break;default:throw Error("outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER");
}g=u(h.slice(),n,e,r(l),f);p=q(w,A(c));p=u(g,f,m,p,f);return k(p)}}function b(c,a){this.a=c;this.b=a}function O(c,a,b,e){var h="";a/=8;var n,g,d;d=-1===b?3:0;for(n=0;n<a;n+=1)g=c[n>>>2]>>>8*(d+n%4*b),h+="0123456789abcdef".charAt(g>>>4&15)+"0123456789abcdef".charAt(g&15);return e.outputUpper?h.toUpperCase():h}function P(c,a,b,e){var h="",n=a/8,g,d,p,f;f=-1===b?3:0;for(g=0;g<n;g+=3)for(d=g+1<n?c[g+1>>>2]:0,p=g+2<n?c[g+2>>>2]:0,p=(c[g>>>2]>>>8*(f+g%4*b)&255)<<16|(d>>>8*(f+(g+1)%4*b)&255)<<8|p>>>8*(f+
(g+2)%4*b)&255,d=0;4>d;d+=1)8*g+6*d<=a?h+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(p>>>6*(3-d)&63):h+=e.b64Pad;return h}function Q(c,a,b){var e="";a/=8;var h,d,g;g=-1===b?3:0;for(h=0;h<a;h+=1)d=c[h>>>2]>>>8*(g+h%4*b)&255,e+=String.fromCharCode(d);return e}function R(c,a,b){a/=8;var e,h=new ArrayBuffer(a),d,g;g=new Uint8Array(h);d=-1===b?3:0;for(e=0;e<a;e+=1)g[e]=c[e>>>2]>>>8*(d+e%4*b)&255;return h}function N(c){var a={outputUpper:!1,b64Pad:"=",shakeLen:-1};c=c||{};
a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty("b64Pad")&&(a.b64Pad=c.b64Pad);if(!0===c.hasOwnProperty("shakeLen")){if(0!==c.shakeLen%8)throw Error("shakeLen must be a multiple of 8");a.shakeLen=c.shakeLen}if("boolean"!==typeof a.outputUpper)throw Error("Invalid outputUpper formatting option");if("string"!==typeof a.b64Pad)throw Error("Invalid b64Pad formatting option");return a}function M(c,a,b){switch(a){case "UTF8":case "UTF16BE":case "UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");
}switch(c){case "HEX":c=function(a,c,d){var g=a.length,l,p,f,m,q,u;if(0!==g%2)throw Error("String of HEX type must be in byte increments");c=c||[0];d=d||0;q=d>>>3;u=-1===b?3:0;for(l=0;l<g;l+=2){p=parseInt(a.substr(l,2),16);if(isNaN(p))throw Error("String of HEX type contains invalid characters");m=(l>>>1)+q;for(f=m>>>2;c.length<=f;)c.push(0);c[f]|=p<<8*(u+m%4*b)}return{value:c,binLen:4*g+d}};break;case "TEXT":c=function(c,h,d){var g,l,p=0,f,m,q,u,r,t;h=h||[0];d=d||0;q=d>>>3;if("UTF8"===a)for(t=-1===
b?3:0,f=0;f<c.length;f+=1)for(g=c.charCodeAt(f),l=[],128>g?l.push(g):2048>g?(l.push(192|g>>>6),l.push(128|g&63)):55296>g||57344<=g?l.push(224|g>>>12,128|g>>>6&63,128|g&63):(f+=1,g=65536+((g&1023)<<10|c.charCodeAt(f)&1023),l.push(240|g>>>18,128|g>>>12&63,128|g>>>6&63,128|g&63)),m=0;m<l.length;m+=1){r=p+q;for(u=r>>>2;h.length<=u;)h.push(0);h[u]|=l[m]<<8*(t+r%4*b);p+=1}else if("UTF16BE"===a||"UTF16LE"===a)for(t=-1===b?2:0,l="UTF16LE"===a&&1!==b||"UTF16LE"!==a&&1===b,f=0;f<c.length;f+=1){g=c.charCodeAt(f);
!0===l&&(m=g&255,g=m<<8|g>>>8);r=p+q;for(u=r>>>2;h.length<=u;)h.push(0);h[u]|=g<<8*(t+r%4*b);p+=2}return{value:h,binLen:8*p+d}};break;case "B64":c=function(a,c,d){var g=0,l,p,f,m,q,u,r,t;if(-1===a.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");p=a.indexOf("=");a=a.replace(/\=/g,"");if(-1!==p&&p<a.length)throw Error("Invalid '=' found in base-64 string");c=c||[0];d=d||0;u=d>>>3;t=-1===b?3:0;for(p=0;p<a.length;p+=4){q=a.substr(p,4);for(f=m=0;f<q.length;f+=1)l="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(q[f]),
m|=l<<18-6*f;for(f=0;f<q.length-1;f+=1){r=g+u;for(l=r>>>2;c.length<=l;)c.push(0);c[l]|=(m>>>16-8*f&255)<<8*(t+r%4*b);g+=1}}return{value:c,binLen:8*g+d}};break;case "BYTES":c=function(a,c,d){var g,l,p,f,m,q;c=c||[0];d=d||0;p=d>>>3;q=-1===b?3:0;for(l=0;l<a.length;l+=1)g=a.charCodeAt(l),m=l+p,f=m>>>2,c.length<=f&&c.push(0),c[f]|=g<<8*(q+m%4*b);return{value:c,binLen:8*a.length+d}};break;case "ARRAYBUFFER":try{c=new ArrayBuffer(0)}catch(e){throw Error("ARRAYBUFFER not supported by this environment");}c=
function(a,c,d){var g,l,p,f,m,q;c=c||[0];d=d||0;l=d>>>3;m=-1===b?3:0;q=new Uint8Array(a);for(g=0;g<a.byteLength;g+=1)f=g+l,p=f>>>2,c.length<=p&&c.push(0),c[p]|=q[g]<<8*(m+f%4*b);return{value:c,binLen:8*a.byteLength+d}};break;default:throw Error("format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER");}return c}function y(c,a){return c<<a|c>>>32-a}function S(c,a){return 32<a?(a-=32,new b(c.b<<a|c.a>>>32-a,c.a<<a|c.b>>>32-a)):0!==a?new b(c.a<<a|c.b>>>32-a,c.b<<a|c.a>>>32-a):c}function w(c,a){return c>>>
a|c<<32-a}function t(c,a){var k=null,k=new b(c.a,c.b);return k=32>=a?new b(k.a>>>a|k.b<<32-a&4294967295,k.b>>>a|k.a<<32-a&4294967295):new b(k.b>>>a-32|k.a<<64-a&4294967295,k.a>>>a-32|k.b<<64-a&4294967295)}function T(c,a){var k=null;return k=32>=a?new b(c.a>>>a,c.b>>>a|c.a<<32-a&4294967295):new b(0,c.a>>>a-32)}function aa(c,a,b){return c&a^~c&b}function ba(c,a,k){return new b(c.a&a.a^~c.a&k.a,c.b&a.b^~c.b&k.b)}function U(c,a,b){return c&a^c&b^a&b}function ca(c,a,k){return new b(c.a&a.a^c.a&k.a^a.a&
k.a,c.b&a.b^c.b&k.b^a.b&k.b)}function da(c){return w(c,2)^w(c,13)^w(c,22)}function ea(c){var a=t(c,28),k=t(c,34);c=t(c,39);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function fa(c){return w(c,6)^w(c,11)^w(c,25)}function ga(c){var a=t(c,14),k=t(c,18);c=t(c,41);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function ha(c){return w(c,7)^w(c,18)^c>>>3}function ia(c){var a=t(c,1),k=t(c,8);c=T(c,7);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function ja(c){return w(c,17)^w(c,19)^c>>>10}function ka(c){var a=t(c,19),k=t(c,61);
c=T(c,6);return new b(a.a^k.a^c.a,a.b^k.b^c.b)}function G(c,a){var b=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(b>>>16)&65535)<<16|b&65535}function la(c,a,b,e){var h=(c&65535)+(a&65535)+(b&65535)+(e&65535);return((c>>>16)+(a>>>16)+(b>>>16)+(e>>>16)+(h>>>16)&65535)<<16|h&65535}function H(c,a,b,e,h){var d=(c&65535)+(a&65535)+(b&65535)+(e&65535)+(h&65535);return((c>>>16)+(a>>>16)+(b>>>16)+(e>>>16)+(h>>>16)+(d>>>16)&65535)<<16|d&65535}function ma(c,a){var d,e,h;d=(c.b&65535)+(a.b&65535);e=(c.b>>>16)+
(a.b>>>16)+(d>>>16);h=(e&65535)<<16|d&65535;d=(c.a&65535)+(a.a&65535)+(e>>>16);e=(c.a>>>16)+(a.a>>>16)+(d>>>16);return new b((e&65535)<<16|d&65535,h)}function na(c,a,d,e){var h,n,g;h=(c.b&65535)+(a.b&65535)+(d.b&65535)+(e.b&65535);n=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(h>>>16);g=(n&65535)<<16|h&65535;h=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(n>>>16);n=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(h>>>16);return new b((n&65535)<<16|h&65535,g)}function oa(c,a,d,e,h){var n,g,l;n=(c.b&
65535)+(a.b&65535)+(d.b&65535)+(e.b&65535)+(h.b&65535);g=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(h.b>>>16)+(n>>>16);l=(g&65535)<<16|n&65535;n=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(h.a&65535)+(g>>>16);g=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(h.a>>>16)+(n>>>16);return new b((g&65535)<<16|n&65535,l)}function B(c,a){return new b(c.a^a.a,c.b^a.b)}function A(c){var a=[],d;if("SHA-1"===c)a=[1732584193,4023233417,2562383102,271733878,3285377520];else if(0===c.lastIndexOf("SHA-",0))switch(a=
[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case "SHA-224":break;case "SHA-256":a=d;break;case "SHA-384":a=[new b(3418070365,a[0]),new b(1654270250,a[1]),new b(2438529370,a[2]),new b(355462360,a[3]),new b(1731405415,a[4]),new b(41048885895,a[5]),new b(3675008525,a[6]),new b(1203062813,a[7])];break;case "SHA-512":a=[new b(d[0],4089235720),new b(d[1],2227873595),
new b(d[2],4271175723),new b(d[3],1595750129),new b(d[4],2917565137),new b(d[5],725511199),new b(d[6],4215389547),new b(d[7],327033209)];break;default:throw Error("Unknown SHA variant");}else if(0===c.lastIndexOf("SHA3-",0)||0===c.lastIndexOf("SHAKE",0))for(c=0;5>c;c+=1)a[c]=[new b(0,0),new b(0,0),new b(0,0),new b(0,0),new b(0,0)];else throw Error("No SHA variants supported");return a}function K(c,a){var b=[],e,d,n,g,l,p,f;e=a[0];d=a[1];n=a[2];g=a[3];l=a[4];for(f=0;80>f;f+=1)b[f]=16>f?c[f]:y(b[f-
3]^b[f-8]^b[f-14]^b[f-16],1),p=20>f?H(y(e,5),d&n^~d&g,l,1518500249,b[f]):40>f?H(y(e,5),d^n^g,l,1859775393,b[f]):60>f?H(y(e,5),U(d,n,g),l,2400959708,b[f]):H(y(e,5),d^n^g,l,3395469782,b[f]),l=g,g=n,n=y(d,30),d=e,e=p;a[0]=G(e,a[0]);a[1]=G(d,a[1]);a[2]=G(n,a[2]);a[3]=G(g,a[3]);a[4]=G(l,a[4]);return a}function Z(c,a,b,e){var d;for(d=(a+65>>>9<<4)+15;c.length<=d;)c.push(0);c[a>>>5]|=128<<24-a%32;a+=b;c[d]=a&4294967295;c[d-1]=a/4294967296|0;a=c.length;for(d=0;d<a;d+=16)e=K(c.slice(d,d+16),e);return e}function L(c,
a,k){var e,h,n,g,l,p,f,m,q,u,r,t,v,w,y,A,z,x,F,B,C,D,E=[],J;if("SHA-224"===k||"SHA-256"===k)u=64,t=1,D=Number,v=G,w=la,y=H,A=ha,z=ja,x=da,F=fa,C=U,B=aa,J=d;else if("SHA-384"===k||"SHA-512"===k)u=80,t=2,D=b,v=ma,w=na,y=oa,A=ia,z=ka,x=ea,F=ga,C=ca,B=ba,J=V;else throw Error("Unexpected error in SHA-2 implementation");k=a[0];e=a[1];h=a[2];n=a[3];g=a[4];l=a[5];p=a[6];f=a[7];for(r=0;r<u;r+=1)16>r?(q=r*t,m=c.length<=q?0:c[q],q=c.length<=q+1?0:c[q+1],E[r]=new D(m,q)):E[r]=w(z(E[r-2]),E[r-7],A(E[r-15]),E[r-
16]),m=y(f,F(g),B(g,l,p),J[r],E[r]),q=v(x(k),C(k,e,h)),f=p,p=l,l=g,g=v(n,m),n=h,h=e,e=k,k=v(m,q);a[0]=v(k,a[0]);a[1]=v(e,a[1]);a[2]=v(h,a[2]);a[3]=v(n,a[3]);a[4]=v(g,a[4]);a[5]=v(l,a[5]);a[6]=v(p,a[6]);a[7]=v(f,a[7]);return a}function D(c,a){var d,e,h,n,g=[],l=[];if(null!==c)for(e=0;e<c.length;e+=2)a[(e>>>1)%5][(e>>>1)/5|0]=B(a[(e>>>1)%5][(e>>>1)/5|0],new b(c[e+1],c[e]));for(d=0;24>d;d+=1){n=A("SHA3-");for(e=0;5>e;e+=1){h=a[e][0];var p=a[e][1],f=a[e][2],m=a[e][3],q=a[e][4];g[e]=new b(h.a^p.a^f.a^
m.a^q.a,h.b^p.b^f.b^m.b^q.b)}for(e=0;5>e;e+=1)l[e]=B(g[(e+4)%5],S(g[(e+1)%5],1));for(e=0;5>e;e+=1)for(h=0;5>h;h+=1)a[e][h]=B(a[e][h],l[e]);for(e=0;5>e;e+=1)for(h=0;5>h;h+=1)n[h][(2*e+3*h)%5]=S(a[e][h],W[e][h]);for(e=0;5>e;e+=1)for(h=0;5>h;h+=1)a[e][h]=B(n[e][h],new b(~n[(e+1)%5][h].a&n[(e+2)%5][h].a,~n[(e+1)%5][h].b&n[(e+2)%5][h].b));a[0][0]=B(a[0][0],X[d])}return a}var d,V,W,X;d=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,
1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,
2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];V=[new b(d[0],3609767458),new b(d[1],602891725),new b(d[2],3964484399),new b(d[3],2173295548),new b(d[4],4081628472),new b(d[5],3053834265),new b(d[6],2937671579),new b(d[7],3664609560),new b(d[8],2734883394),new b(d[9],1164996542),new b(d[10],1323610764),new b(d[11],3590304994),new b(d[12],4068182383),new b(d[13],991336113),new b(d[14],633803317),new b(d[15],3479774868),new b(d[16],2666613458),new b(d[17],944711139),new b(d[18],2341262773),
new b(d[19],2007800933),new b(d[20],1495990901),new b(d[21],1856431235),new b(d[22],3175218132),new b(d[23],2198950837),new b(d[24],3999719339),new b(d[25],766784016),new b(d[26],2566594879),new b(d[27],3203337956),new b(d[28],1034457026),new b(d[29],2466948901),new b(d[30],3758326383),new b(d[31],168717936),new b(d[32],1188179964),new b(d[33],1546045734),new b(d[34],1522805485),new b(d[35],2643833823),new b(d[36],2343527390),new b(d[37],1014477480),new b(d[38],1206759142),new b(d[39],344077627),
new b(d[40],1290863460),new b(d[41],3158454273),new b(d[42],3505952657),new b(d[43],106217008),new b(d[44],3606008344),new b(d[45],1432725776),new b(d[46],1467031594),new b(d[47],851169720),new b(d[48],3100823752),new b(d[49],1363258195),new b(d[50],3750685593),new b(d[51],3785050280),new b(d[52],3318307427),new b(d[53],3812723403),new b(d[54],2003034995),new b(d[55],3602036899),new b(d[56],1575990012),new b(d[57],1125592928),new b(d[58],2716904306),new b(d[59],442776044),new b(d[60],593698344),new b(d[61],
3733110249),new b(d[62],2999351573),new b(d[63],3815920427),new b(3391569614,3928383900),new b(3515267271,566280711),new b(3940187606,3454069534),new b(4118630271,4000239992),new b(116418474,1914138554),new b(174292421,2731055270),new b(289380356,3203993006),new b(460393269,320620315),new b(685471733,587496836),new b(852142971,1086792851),new b(1017036298,365543100),new b(1126000580,2618297676),new b(1288033470,3409855158),new b(1501505948,4234509866),new b(1607167915,987167468),new b(1816402316,
1246189591)];X=[new b(0,1),new b(0,32898),new b(2147483648,32906),new b(2147483648,2147516416),new b(0,32907),new b(0,2147483649),new b(2147483648,2147516545),new b(2147483648,32777),new b(0,138),new b(0,136),new b(0,2147516425),new b(0,2147483658),new b(0,2147516555),new b(2147483648,139),new b(2147483648,32905),new b(2147483648,32771),new b(2147483648,32770),new b(2147483648,128),new b(0,32778),new b(2147483648,2147483658),new b(2147483648,2147516545),new b(2147483648,32896),new b(0,2147483649),
new b(2147483648,2147516424)];W=[[0,36,3,41,18],[1,44,10,45,2],[62,6,43,15,61],[28,55,25,21,56],[27,20,39,8,14]];"function"===typeof define&&define.amd?define(function(){return C}):"undefined"!==typeof exports?("undefined"!==typeof module&&module.exports&&(module.exports=C),exports=C):Y.jsSHA=C})(this);

},{}]},{},[1]);
