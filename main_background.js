


/*
 A JavaScript implementation of the SHA family of hashes, as
 defined in FIPS PUB 180-4 and FIPS PUB 202, as well as the corresponding
 HMAC implementation as defined in FIPS PUB 198a
 Copyright Brian Turek 2008-2017
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information
 Several functions taken from Paul Johnston
*/

'use strict';(function(I){function w(c,a,d){var l=0,b=[],g=0,f,n,k,e,h,q,y,p,m=!1,t=[],r=[],u,z=!1;d=d||{};f=d.encoding||"UTF8";u=d.numRounds||1;if(u!==parseInt(u,10)||1>u)throw Error("numRounds must a integer >= 1");if(0===c.lastIndexOf("SHA-",0))if(q=function(b,a){return A(b,a,c)},y=function(b,a,l,f){var g,e;if("SHA-224"===c||"SHA-256"===c)g=(a+65>>>9<<4)+15,e=16;else throw Error("Unexpected error in SHA-2 implementation");for(;b.length<=g;)b.push(0);b[a>>>5]|=128<<24-a%32;a=a+l;b[g]=a&4294967295;
b[g-1]=a/4294967296|0;l=b.length;for(a=0;a<l;a+=e)f=A(b.slice(a,a+e),f,c);if("SHA-224"===c)b=[f[0],f[1],f[2],f[3],f[4],f[5],f[6]];else if("SHA-256"===c)b=f;else throw Error("Unexpected error in SHA-2 implementation");return b},p=function(b){return b.slice()},"SHA-224"===c)h=512,e=224;else if("SHA-256"===c)h=512,e=256;else throw Error("Chosen SHA variant is not supported");else throw Error("Chosen SHA variant is not supported");k=B(a,f);n=x(c);this.setHMACKey=function(b,a,g){var e;if(!0===m)throw Error("HMAC key already set");
if(!0===z)throw Error("Cannot set HMAC key after calling update");f=(g||{}).encoding||"UTF8";a=B(a,f)(b);b=a.binLen;a=a.value;e=h>>>3;g=e/4-1;if(e<b/8){for(a=y(a,b,0,x(c));a.length<=g;)a.push(0);a[g]&=4294967040}else if(e>b/8){for(;a.length<=g;)a.push(0);a[g]&=4294967040}for(b=0;b<=g;b+=1)t[b]=a[b]^909522486,r[b]=a[b]^1549556828;n=q(t,n);l=h;m=!0};this.update=function(a){var c,f,e,d=0,p=h>>>5;c=k(a,b,g);a=c.binLen;f=c.value;c=a>>>5;for(e=0;e<c;e+=p)d+h<=a&&(n=q(f.slice(e,e+p),n),d+=h);l+=d;b=f.slice(d>>>
5);g=a%h;z=!0};this.getHash=function(a,f){var d,h,k,q;if(!0===m)throw Error("Cannot call getHash after setting HMAC key");k=C(f);switch(a){case "HEX":d=function(a){return D(a,e,k)};break;case "B64":d=function(a){return E(a,e,k)};break;case "BYTES":d=function(a){return F(a,e)};break;case "ARRAYBUFFER":try{h=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a){return G(a,e)};break;default:throw Error("format must be HEX, B64, BYTES, or ARRAYBUFFER");
}q=y(b.slice(),g,l,p(n));for(h=1;h<u;h+=1)q=y(q,e,0,x(c));return d(q)};this.getHMAC=function(a,f){var d,k,t,u;if(!1===m)throw Error("Cannot call getHMAC without first setting HMAC key");t=C(f);switch(a){case "HEX":d=function(a){return D(a,e,t)};break;case "B64":d=function(a){return E(a,e,t)};break;case "BYTES":d=function(a){return F(a,e)};break;case "ARRAYBUFFER":try{d=new ArrayBuffer(0)}catch(v){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a){return G(a,e)};break;default:throw Error("outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER");
}k=y(b.slice(),g,l,p(n));u=q(r,x(c));u=y(k,e,h,u);return d(u)}}function m(){}function D(c,a,d){var l="";a/=8;var b,g;for(b=0;b<a;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1),l+="0123456789abcdef".charAt(g>>>4&15)+"0123456789abcdef".charAt(g&15);return d.outputUpper?l.toUpperCase():l}function E(c,a,d){var l="",b=a/8,g,f,n;for(g=0;g<b;g+=3)for(f=g+1<b?c[g+1>>>2]:0,n=g+2<b?c[g+2>>>2]:0,n=(c[g>>>2]>>>8*(3+g%4*-1)&255)<<16|(f>>>8*(3+(g+1)%4*-1)&255)<<8|n>>>8*(3+(g+2)%4*-1)&255,f=0;4>f;f+=1)8*g+6*f<=a?l+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(n>>>
6*(3-f)&63):l+=d.b64Pad;return l}function F(c,a){var d="",l=a/8,b,g;for(b=0;b<l;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1)&255,d+=String.fromCharCode(g);return d}function G(c,a){var d=a/8,l,b=new ArrayBuffer(d),g;g=new Uint8Array(b);for(l=0;l<d;l+=1)g[l]=c[l>>>2]>>>8*(3+l%4*-1)&255;return b}function C(c){var a={outputUpper:!1,b64Pad:"=",shakeLen:-1};c=c||{};a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty("b64Pad")&&(a.b64Pad=c.b64Pad);if("boolean"!==typeof a.outputUpper)throw Error("Invalid outputUpper formatting option");
if("string"!==typeof a.b64Pad)throw Error("Invalid b64Pad formatting option");return a}function B(c,a){var d;switch(a){case "UTF8":case "UTF16BE":case "UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");}switch(c){case "HEX":d=function(a,b,c){var f=a.length,d,k,e,h,q;if(0!==f%2)throw Error("String of HEX type must be in byte increments");b=b||[0];c=c||0;q=c>>>3;for(d=0;d<f;d+=2){k=parseInt(a.substr(d,2),16);if(isNaN(k))throw Error("String of HEX type contains invalid characters");
h=(d>>>1)+q;for(e=h>>>2;b.length<=e;)b.push(0);b[e]|=k<<8*(3+h%4*-1)}return{value:b,binLen:4*f+c}};break;case "TEXT":d=function(c,b,d){var f,n,k=0,e,h,q,m,p,r;b=b||[0];d=d||0;q=d>>>3;if("UTF8"===a)for(r=3,e=0;e<c.length;e+=1)for(f=c.charCodeAt(e),n=[],128>f?n.push(f):2048>f?(n.push(192|f>>>6),n.push(128|f&63)):55296>f||57344<=f?n.push(224|f>>>12,128|f>>>6&63,128|f&63):(e+=1,f=65536+((f&1023)<<10|c.charCodeAt(e)&1023),n.push(240|f>>>18,128|f>>>12&63,128|f>>>6&63,128|f&63)),h=0;h<n.length;h+=1){p=k+
q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=n[h]<<8*(r+p%4*-1);k+=1}else if("UTF16BE"===a||"UTF16LE"===a)for(r=2,n="UTF16LE"===a&&!0||"UTF16LE"!==a&&!1,e=0;e<c.length;e+=1){f=c.charCodeAt(e);!0===n&&(h=f&255,f=h<<8|f>>>8);p=k+q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=f<<8*(r+p%4*-1);k+=2}return{value:b,binLen:8*k+d}};break;case "B64":d=function(a,b,c){var f=0,d,k,e,h,q,m,p;if(-1===a.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");k=a.indexOf("=");a=a.replace(/\=/g,
"");if(-1!==k&&k<a.length)throw Error("Invalid '=' found in base-64 string");b=b||[0];c=c||0;m=c>>>3;for(k=0;k<a.length;k+=4){q=a.substr(k,4);for(e=h=0;e<q.length;e+=1)d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(q[e]),h|=d<<18-6*e;for(e=0;e<q.length-1;e+=1){p=f+m;for(d=p>>>2;b.length<=d;)b.push(0);b[d]|=(h>>>16-8*e&255)<<8*(3+p%4*-1);f+=1}}return{value:b,binLen:8*f+c}};break;case "BYTES":d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;k=c>>>3;for(n=0;n<a.length;n+=
1)d=a.charCodeAt(n),h=n+k,e=h>>>2,b.length<=e&&b.push(0),b[e]|=d<<8*(3+h%4*-1);return{value:b,binLen:8*a.length+c}};break;case "ARRAYBUFFER":try{d=new ArrayBuffer(0)}catch(l){throw Error("ARRAYBUFFER not supported by this environment");}d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;n=c>>>3;h=new Uint8Array(a);for(d=0;d<a.byteLength;d+=1)e=d+n,k=e>>>2,b.length<=k&&b.push(0),b[k]|=h[d]<<8*(3+e%4*-1);return{value:b,binLen:8*a.byteLength+c}};break;default:throw Error("format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER");
}return d}function r(c,a){return c>>>a|c<<32-a}function J(c,a,d){return c&a^~c&d}function K(c,a,d){return c&a^c&d^a&d}function L(c){return r(c,2)^r(c,13)^r(c,22)}function M(c){return r(c,6)^r(c,11)^r(c,25)}function N(c){return r(c,7)^r(c,18)^c>>>3}function O(c){return r(c,17)^r(c,19)^c>>>10}function P(c,a){var d=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(d>>>16)&65535)<<16|d&65535}function Q(c,a,d,l){var b=(c&65535)+(a&65535)+(d&65535)+(l&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>
16)&65535)<<16|b&65535}function R(c,a,d,l,b){var g=(c&65535)+(a&65535)+(d&65535)+(l&65535)+(b&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>16)+(g>>>16)&65535)<<16|g&65535}function x(c){var a=[],d;if(0===c.lastIndexOf("SHA-",0))switch(a=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case "SHA-224":break;case "SHA-256":a=d;break;case "SHA-384":a=[new m,new m,
new m,new m,new m,new m,new m,new m];break;case "SHA-512":a=[new m,new m,new m,new m,new m,new m,new m,new m];break;default:throw Error("Unknown SHA variant");}else throw Error("No SHA variants supported");return a}function A(c,a,d){var l,b,g,f,n,k,e,h,m,r,p,w,t,x,u,z,A,B,C,D,E,F,v=[],G;if("SHA-224"===d||"SHA-256"===d)r=64,w=1,F=Number,t=P,x=Q,u=R,z=N,A=O,B=L,C=M,E=K,D=J,G=H;else throw Error("Unexpected error in SHA-2 implementation");d=a[0];l=a[1];b=a[2];g=a[3];f=a[4];n=a[5];k=a[6];e=a[7];for(p=
0;p<r;p+=1)16>p?(m=p*w,h=c.length<=m?0:c[m],m=c.length<=m+1?0:c[m+1],v[p]=new F(h,m)):v[p]=x(A(v[p-2]),v[p-7],z(v[p-15]),v[p-16]),h=u(e,C(f),D(f,n,k),G[p],v[p]),m=t(B(d),E(d,l,b)),e=k,k=n,n=f,f=t(g,h),g=b,b=l,l=d,d=t(h,m);a[0]=t(d,a[0]);a[1]=t(l,a[1]);a[2]=t(b,a[2]);a[3]=t(g,a[3]);a[4]=t(f,a[4]);a[5]=t(n,a[5]);a[6]=t(k,a[6]);a[7]=t(e,a[7]);return a}var H;H=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,
2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,
2756734187,3204031479,3329325298];"function"===typeof define&&define.amd?define(function(){return w}):"undefined"!==typeof exports?("undefined"!==typeof module&&module.exports&&(module.exports=w),exports=w):I.jsSHA=w})(this);

console.debug("main_background.js");

/**
*	Wrapper around crypto lib
*
*/
function hash(source){
	var shaObj = new jsSHA("SHA-256", "TEXT");
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

// Objects which could be used to do nontrivial things.
// Scripts are not allowed to call any methods on these objects or access them in any way.
var reserved_objects = [
	"window",
	"fetch",
	"XMLHttpRequest",
	"chrome", // only on chrome
	"browser", // only on firefox
	"eval"
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
		console.log("cache flushed");
	}	
	//var flushingCache = webex.webRequest.handlerBehaviorChanged(flushed);
	

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
var active_connections = {};
var unused_data = {};
function open_popup_tab(data){
	console.log(data);
	function gotPopup(popupURL){
		var creating = webex.tabs.create({"url":popupURL},function(a){
			console.log("[TABID:"+a["id"]+"] creating unused data entry from parent window's content");
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
	console.log("Local storage cleared");
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
		console.log(new_blocked_data);
		//***********************************************************************************************//
		// store the blocked info until it is opened and needed
		if(update == false && active_connections[tab_id] === undefined){
			console.log("[TABID:"+tab_id+"]"+"Storing blocked_info for when the browser action is opened or asks for it.");
			unused_data[tab_id] = new_blocked_data; 
		} else{
			unused_data[tab_id] = new_blocked_data; 
			console.log("[TABID:"+tab_id+"]"+"Sending blocked_info directly to browser action");
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
				console.log("[TABID:"+tab_id+"] Injecting contact finder");
				//inject_contact_finder(tabs[0]["id"]);
			}
			if(update){
				console.log("%c updating tab "+tabs[0]["id"],"color: red;");
				update_popup(tabs[0]["id"],unused_data[tabs[0]["id"]],true);
				active_connections[tabs[0]["id"]] = p;
			}
			for(var i = 0; i < tabs.length; i++) {
				var tab = tabs[i];
				var tab_id = tab["id"];
				if(unused_data[tab_id] !== undefined){
					// If we have some data stored here for this tabID, send it
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
*	Makes it so we can return redirect requests to local blob URLs 
*
*	TODO: Make it so that it adds the website itself to the permissions of all keys
*
*/
function change_csp(e) {
	var index = 0;
	var csp_header = "";
	for(var i = 0; i < e["responseHeaders"].length; i++){
		if(e["responseHeaders"][i]["name"].toLowerCase() == "content-security-policy"){		
			csp_header = e["responseHeaders"][i]["value"];
			index = i;
			var keywords = csp_header.replace(/;/g,'","');
			keywords = JSON.parse('["' + keywords.substr(0,keywords.length) + '"]');
			// Iterates over the keywords inside the CSP header
			for(var j = 0; j < keywords.length; j++){
				var matchres = keywords[j].match(/[\-\w]+/g);
				if(matchres != null && matchres[0] == "script-src"){
					// Test to see if they have a hash and then delete it
					// TODO: Make sure this is a good idea.
					keywords[j] = keywords[j].replace(/\s?'sha256-[\w+/]+=+'/g,"");
					keywords[j] = keywords[j].replace(/\s?'sha384-[\w+/]+=+'/g,"");
					keywords[j] = keywords[j].replace(/\s?'sha512-[\w+/]+=+'/g,"");
					keywords[j] = keywords[j].replace(/'strict-dynamic'/g,"");
					keywords[j] = keywords[j].replace(/;/g,"");
					// This is the string that we add to every CSP
					keywords[j] += "'self' data: blob: 'report-sample'";	
					//console.log("%c new script-src section:","color:green;")					
					//console.log(keywords[j]+ "; ");			
				}
			}
			var csp_header = "";
			for(var j = 0; j < keywords.length; j++){
				csp_header = csp_header + keywords[j] + "; ";
			}
			e["responseHeaders"][i]["value"] = csp_header;
		} 
	}
	if(csp_header == ""){
		//console.log("%c no CSP.","color: red;");
	}else{
		//console.log("%c new CSP:","color: green;");
		//console.log(e["responseHeaders"][index]["value"]);	
	}
	return {responseHeaders: e.responseHeaders};
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
// (This is part of eval_test.js with a few console.logs/comments removed)

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
	console.log("------evaluation results for "+ name +"------");
	console.log("Script accesses reserved objects?");
	var flag = true;
	var reason = ""
	// 	This is where individual "passes" are made over the code
	for(var i = 0; i < reserved_objects.length; i++){
		var res = reserved_object_regex(reserved_objects[i]).exec(script);
		if(res != null){
			console.log("%c fail","color:red;");
			flag = false;		
			reason = "Script uses a reserved object (" + reserved_objects[i] + ")";
		}
	}
	if(flag){
		console.log("%c pass","color:green;");
	}
	// If flag is set true at this point, the script is trivial
	if(flag){
		reason = "Script was determined to be trivial.";
	}
	return [flag,reason+"<br>"];
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
		var matches = /\/\/\s*?(@license)\s([\S]+)\s([\S]+$)/gm.exec(unedited_src);
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
		console.log("Found a license tag");
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
			console.log("ERROR: @license with no @license-end");
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
					resolve(["\n/*\n LibreJS: Script whitelisted by user \n*/\n"+response,index]);
				} else{
					resolve("\n/*\n LibreJS: Script whitelisted by user \n*/\n"+response);
				}
			}else if(list_verdict == "bl"){
				// Blank the entire script
				if(index != -1){
					resolve(["\n/*\n LibreJS: Script blacklisted by user \n*/\n",index]);
				} else{
					resolve("\n/*\n LibreJS: Script blacklisted by user \n*/\n");
				}
			} else{
				// Return the edited (normal) version
				if(index != -1){
					resolve(["\n/*\n LibreJS: Script acknowledged\n*/\n"+edited[1],index]);
				} else{
					resolve("\n/*\n LibreJS: Script acknowledged\n*/\n"+edited[1]);
				}
			}
		});
	});
}

function read_script(a){

	var filter = webex.webRequest.filterResponseData(a.requestId);
	var decoder = new TextDecoder("utf-8");
	var encoder = new TextEncoder(); // TODO: make sure this doesn't cause undeclared decoding

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

function edit_html(html,url,tabid,wl){
	return new Promise((resolve, reject) => {
		if(wl == true){
			// Don't bother, page is whitelisted
			resolve(html);	 
		}

		// A DOMParser object won't work because the HTML doesn't exist after the DOM is built.
		// This makes it impossible to go from DOM back to HTML source without a lot of distortion.
		// For the vast majority of cases, it should work to parse the DOM, extract Javascript source,
		// and then replace the unedited source with the edited source using string.replace().
		
		var parser = new DOMParser();
		var html_doc = parser.parseFromString(html, "text/html");

		var amt_scripts = 0;
		var total_scripts = 0;
		var scripts = html_doc.scripts;		
		for(var i = 0; i < scripts.length; i++){
			if(scripts[i].src == ""){
				total_scripts++;
			}
		}
		console.log("Analyzing "+total_scripts+" inline scripts...");
		for(var i = 0; i < scripts.length; i++){
			if(scripts[i].src == ""){
				var edit_script = get_script(scripts[i].innerHTML,url,tabid,wl,i);
				edit_script.then(function(edited){
					//html_doc.scripts[edited[1]].setAttribute("type","application/json");
					console.log("%c  ------ not remote (document.scripts["+edited[1]+"]) ------","color:white");					
    				console.log("%c"+edited[1]+":"+html_doc.scripts[edited[1]].innerHTML.substr(0,100),"color:gray");
    				console.log("%c"+edited[1]+":"+edited[0].substr(0,100),"color:gray");
					//html_doc.scripts[edited[1]].insertAdjacentHTML("afterend",'<script type="text/javascript">'+edited[0]+"</script>");
					//html_doc.scripts[edited[1]].remove();				
					if(html.indexOf(html_doc.scripts[edited[1]].outerHTML) == -1){
						console.log("NOT in original source");
					}else{
						console.log("Found in original source");				
					}
					html = html.replace(html_doc.scripts[edited[1]].outerHTML,'<script type="text/javascript">'+edited[0]+"</script>");					
					amt_scripts++;
					if(amt_scripts == total_scripts){
						//resolve(html_doc.documentElement.innerHTML);
						resolve(html);
					}		
				});
			}
		}
		if(total_scripts == 0){
			console.log("Nothing to analyze.");
			resolve(html);
		}

	});
}

function read_document(a){


	var filter = webex.webRequest.filterResponseData(a.requestId);
	var decoder = new TextDecoder("utf-8");
	var encoder = new TextEncoder(); // TODO: make sure this doesn't cause undeclared decoding

	filter.ondata = event => {
		var str = decoder.decode(event.data, {stream: true});
		var res = test_url_whitelisted(a.url);
		res.then(function(whitelisted){
			var edit_page;
			if(whitelisted == true){
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

	var targetPage = "https://developer.mozilla.org/en-US/Firefox/Developer_Edition";

	// Updates the content security policy so we can redirect to local URLs
	webex.webRequest.onHeadersReceived.addListener(
		change_csp,
		{urls: ["<all_urls>"]},
		["blocking", "responseHeaders"]
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
	  console.log("[TABID:"+tab_id+"]"+"finished executing contact finder: " + result);
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
		console.log("New CSV whitelist:");
		console.log(items["pref_whitelist"]);
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
			console.log(new RegExp(domain,"g"));
			items["pref_whitelist"] = items["pref_whitelist"].replace(new RegExp(domain,"g"),"")
			// if an entry was deleted, it will leave an extra comma
			items["pref_whitelist"] = items["pref_whitelist"].replace(/,+/g,",");
			// remove trailing comma if the last one was deleted
			if(items["pref_whitelist"].charAt(items["pref_whitelist"].length-1) == ","){
				items["pref_whitelist"] = items["pref_whitelist"].substr(0,items["pref_whitelist"].length-2);
			}
		}
		console.log("New CSV whitelist:");
		console.log(items["pref_whitelist"]);
		webex.storage.local.set({"pref_whitelist":items["pref_whitelist"]});
	}
	webex.storage.local.get(storage_got);	
}

init_addon();

