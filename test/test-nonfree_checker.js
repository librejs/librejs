/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2014 Loic J. Duros
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

const check = require("js_checker/free_checker");
const licenses = require("js_checker/license_definitions");
const mockNodes = require("./mock/mock_nodes_with_comments");

var mockLicense = function ()  {
 return {
	'name': 'A Fake License',
    'licenseFragments': [{text: "<VERSION>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id libero ut justo laoreet congue sed a tortor. Sed iaculis, lacus sit amet cursus facilisis, ligula ligula rutrum leo, et laoreet urna sapien id risus. Curabitur suscipit felis vitae nisl laoreet tempor. Nulla facilisi. Praesent sem magna, sodales sed blandit ut, hendrerit sit amet ante. Quisque sed erat eget ante vehicula fermentum sit amet ac nibh. Ut euismod, lorem non dignissim auctor, orci nulla facilisis nibh, congue aliquam ante libero non metus. Nam vitae lorem tortor. Nunc vehicula justo a odio ornare sollicitudin. Quisque egestas ultrices pretium. Sed tortor quam, dictum sed cursus suscipit, rhoncus id lacus.\nIn eu feugiat ipsum. Integer fringilla dapibus nunc iaculis imperdiet. Duis eros felis, eleifend ac lobortis convallis, hendrerit in ligula. Curabitur volutpat, turpis sed pretium vestibulum, ipsum sem sollicitudin turpis, a sollicitudin enim erat eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque tristique imperdiet libero et iaculis. Aliquam facilisis mauris at neque tincidunt suscipit facilisis felis eleifend. Aliquam condimentum enim at nisi placerat ultrices. Nullam id sapien lectus. Vivamus id felis lorem, at hendrerit est.\n\nCurabitur augue urna, eleifend ac rutrum venenatis, lobortis sagittis purus. Etiam quam odio, sodales elementum volutpat eu, condimentum eu nunc. In hac habitasse platea dictumst. Cras eu arcu a arcu scelerisque iaculis in vel nunc. Integer vitae varius leo. Vestibulum ultricies, magna nec sodales gravida, leo eros tincidunt mi, ac ornare nibh magna vel turpis. Sed ornare viverra lectus, et varius orci vehicula ac.\n\n", type: licenses.types.SHORT}, {text: "A very short license mention", type: licenses.types.SHORT}]
 };
};

exports.testStripLicenseToRegexp_1 = function (test) {
    test.assert(check.freeCheck.stripLicenseToRegexp(mockLicense()));
    test.done();
};
exports.testStripLicenseToRegexp_2 = function (test) {
    var resultText = /.*?LoremipsumdolorsitametconsecteturadipiscingelitCurabituridliberoutjustolaoreetconguesedatortorSediaculislacussitametcursusfacilisisligulaligularutrumleoetlaoreeturnasapienidrisusCurabitursuscipitfelisvitaenisllaoreettemporNullafacilisiPraesentsemmagnasodalessedblandituthendreritsitametanteQuisquesederategetantevehiculafermentumsitametacnibhUteuismodloremnondignissimauctororcinullafacilisisnibhconguealiquamanteliberononmetusNamvitaeloremtortorNuncvehiculajustoaodioornaresollicitudinQuisqueegestasultricespretiumSedtortorquamdictumsedcursussuscipitrhoncusidlacusIneufeugiatipsumIntegerfringilladapibusnunciaculisimperdietDuiserosfeliseleifendaclobortisconvallishendreritinligulaCurabiturvolutpatturpissedpretiumvestibulumipsumsemsollicitudinturpisasollicitudinenimerategetdolorLoremipsumdolorsitametconsecteturadipiscingelitPellentesquetristiqueimperdietliberoetiaculisAliquamfacilisismaurisatnequetinciduntsuscipitfacilisisfeliseleifendAliquamcondimentumenimatnisiplaceratultricesNullamidsapienlectusVivamusidfelisloremathendreritestCurabituraugueurnaeleifendacrutrumvenenatislobortissagittispurusEtiamquamodiosodaleselementumvolutpateucondimentumeununcInhachabitasseplateadictumstCraseuarcuaarcuscelerisqueiaculisinvelnuncIntegervitaevariusleoVestibulumultriciesmagnanecsodalesgravidaleoerostinciduntmiacornarenibhmagnavelturpisSedornareviverralectusetvariusorcivehiculaac/i;
    var t = check.freeCheck.stripLicenseToRegexp(mockLicense());
    test.assertEqual(resultText.toString(), t.licenseFragments[0].regex.toString());
    test.done();
};

exports.testStripLicenseToRegexpForMultipleStrings = function (test) {
    var resultText = /Averyshortlicensemention/i;
    var item;
    t = check.freeCheck.stripLicenseToRegexp(mockLicense());
    for (item in t.licenseFragments) {
	test.assert(t.licenseFragments[item].text);
	test.assert(t.licenseFragments[item].type);
	test.assert(t.licenseFragments[item].regex);
    }
    test.assertEqual(resultText.toString(), t.licenseFragments[1].regex.toString());
    test.done();
};

exports.testGetComment = function (test) {
    var n = mockNodes.mockNodesWithComments.gplv3Node;
    var comment = "*@licstart  The following is the entire license notice for the JavaScript code in this page.* A Fake JS Library\n * Copyright (C) 2011  Patrick Star\n * \n * This program is free software: you can redistribute it and/or modify\n * it under the terms of the GNU General Public License as published by\n * the Free Software Foundation, either version 3 of the License, or\n * (at your option) any later version.\n * \n * This program is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n * \n * You should have received a copy of the GNU General Public License\n * along with this program.  If not, see .\n @licend  The above is the entire license notice for the JavaScript code in this page.";

    test.assertEqual(comment, check.freeCheck.getComment(n.children[0]));
};

exports.testGetSingleLineComment = function (test) {
    var n = mockNodes.mockNodesWithComments.gplv3Node.children[1];
    var comment = " a single line comment. another single line comment.";

    test.assertEqual(comment, check.freeCheck.getComment(n));
};

exports.testCheckNodeFreeLicense = function (test) {
    var n = mockNodes.mockNodesWithComments.gplv3Node.children[0];
    n.counter = 2;
    n.parent = {type: 42};
    test.assertEqual('GNU General Public License (GPL) version 3',
            check.freeCheck.checkNodeFreeLicense(n).licenseName);
};

exports.testCheckNodeFreeLicense2 = function (test) {
    var n = { blockComments: "/*\n * Piwik - Web Analytics\n *\n * JavaScript tracking client\n *\n * @link http://piwik.org\n * @source http://dev.piwik.org/trac/browser/trunk/js/piwik.js\n * @license http://www.opensource.org/licenses/bsd-license.php Simplified BSD\n *\n *\n*@licstart  The following is the entire license notice for the JavaScript code in this page.\n\nCopyright (c) 1999, Loic Duros\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\n    Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n    Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n    Neither the name of the Blah nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.@licend  The above is the entire license notice for the JavaScript code in this page. */", counter: 2, parent: {type: 42} };
 
    test.assertEqual(
        'BSD 3-Clause License',
        check.freeCheck.checkNodeFreeLicense(n).licenseName);

	  
};

exports.testCheckNodeFreeLicenseNotFree = function (test) {
    var n = mockNodes.mockNodesWithComments.gplv3Node.children[1];
    test.assertNotEqual(true, check.freeCheck.checkNodeFreeLicense(n));
};

/*
exports.testLicenseToRegexp = function (test) {
    var loader = test.makeSandboxedLoader();
    var module = loader.require('js_checker/free_checker');
    var privateScope = loader.findSandboxForModule('js_checker/free_checker'.toString()).globalScope;
    // ensure the regex values are truthy.
    test.assert(privateScope.licenses.licenses.gplv2.licenseFragments[0].regex);
}
*/
