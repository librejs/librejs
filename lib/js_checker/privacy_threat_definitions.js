/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
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

exports.js = {
    /**
     * googleAnalytics
     * Tracking code for Google Analytics.
     * It corresponds to:
     *       var _gaq = _gaq || [];
     *       _gaq.push(['_setAccount', 'UA-XXXXXXX-X']);
     *       _gaq.push(['_trackPageview']);
     *
     *  (function() {
     *   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
     *   ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
     *   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
     * })();
     *
     * It also matches GA code that doesn't track a page view, like this:
     * var _gaq = _gaq || [];
     *  _gaq.push(['_setAccount', 'UA-5936383-6']);
     *
     * (function() {
     *   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
     *   ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
     *   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
     * })();
     *
     */
    googleAnalytics: [
            /var_gaq=_gaq\|\|\[\];_gaq\.push\(\['_setAccount','UA[0-9\-]*?'\]\);(_gaq.push\(\['_setDomainName','[a-z\.]*?'\]\);)?(_gaq\.push\(\['_trackPageview'\]\);)?\(function\(\){varga=document\.createElement\('script'\);ga\.type='text\/javascript\';ga\.async=true;ga\.src=\(\'https:\'==document\.location\.protocol\?'https:\/\/ssl':'http:\/\/www'\)\+'\.google\-analytics\.com\/ga\.js';vars=document\.getElementsByTagName\('script'\)\[0\];s\.parentNode\.insertBefore\(ga,s\);}\)\(\);/i,
            /vargaJsHost\=\(\(\"https\:\"\=\=document\.location\.protocol\)\?\"https\:\/\/ssl\.\"\:\"http\:\/\/www\.\"\)\;document\.write\(unescape\(\"\%3Cscriptsrc\=\'\"\+gaJsHost\+\"google\-analytics\.com\/ga\.js\'type\=\'text\/javascript\'\%3E\%3C\/script\%3E\"\)\)\;/i,
            /try{varpageTracker\=\_gat\.\_getTracker\(\"UA[0-9\-]*?\"\)\;pageTracker\.\_trackPageview\(\)\;}catch\(err\){}/i
    ]
};
