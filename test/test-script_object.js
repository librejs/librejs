/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2014 Loic J. Duros
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

var scriptObject = require("html_script_finder/dom_handler/script_object");

exports.testCreateNewScript = function(assert) {
    var script1, script2;

    script1 = scriptObject.Script({'type': 'inline',
				   'status': 'test',
				   'text': 'test',
				   'element': {}});

    assert.equal('object', typeof script1);
    assert.equal('inline', script1.type);
    
    script2 = scriptObject.Script({'type': 'external',
				   'status': 'test',
				   'element': {}});
    assert.equal(script2.text, null);
};

exports.testRemoveNarcissusBugLine = function(assert) {
    var script = scriptObject.Script({'type': 'external',
				   'status': 'test',
				   'element': {}});
    var scriptText = "var i = 0;\n\nthis.narcissusBugFixLibreJS";
    var scriptText2 = "var i = 0;";
    assert.equal(script.removeNarcissusBugLine(scriptText), 'var i = 0;');
    assert.equal(script.removeNarcissusBugLine(scriptText2), 'var i = 0;');
};

require('sdk/test').run(exports);
