/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
 * Copyright (C) 2014, 2015 Nik Nyby
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

var {Cc, Ci, Cu, Cm, Cr} = require("chrome");

var CryptoString = function() {
    this.cryptoHash = Cc["@mozilla.org/security/hash;1"]  
        .createInstance(Ci.nsICryptoHash);
    this.converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Ci.nsIScriptableUnicodeConverter);
    this.hashAlgorithm = null;
};

CryptoString.prototype.init = function(hashAlgorithm, charset) {
    this.converter.charset = charset;
    this.hashAlgorithm = hashAlgorithm;
    this.cryptoHash.init(this.cryptoHash[this.hashAlgorithm]);
};

CryptoString.prototype.encryptString = function(str) {
    var result = {};
    var data = this.converter.convertToByteArray(str, result);
    this.cryptoHash.update(data, data.length);
    var hash = this.cryptoHash.finish(false);
    return hash.map(i => this.toHexString(hash.charCodeAt(i))).join("");
};

CryptoString.prototype.toHexString = function(charCode) {
    return ("0" + charCode.toString(16)).slice(-2);  
};

var cryptoString = new CryptoString();

exports.sha1Encrypt = function(str) {
    cryptoString.init('SHA1', 'UTF-8');
    return cryptoString.encryptString(str);
};

exports.sha256Encrypt = function(str) {
    cryptoString.init('SHA256', 'UTF-8');
    return cryptoString.encryptString(str);
};
