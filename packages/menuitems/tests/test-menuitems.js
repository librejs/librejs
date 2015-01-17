/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict'

const windowUtils = require("window-utils");
const menuitems = require("menuitems");

let window = windowUtils.activeBrowserWindow;
let document = window.document;
function $(id) document.getElementById(id);

function createMI(options, test) {
  test.assertEqual(!$(options.id), true);
  var mi = new menuitems.Menuitem(options);
  return mi;
}

exports.testMIDoesNotExist = function(test) {
  var options = {
    id: "test-mi-dne",
    label: "test"
  };
  createMI(options, test);
  test.assertEqual(!!$(options.id), false, 'menuitem does not exists');
};

exports.testMIDoesExist = function(test) {
  var options = {
    id: "test-mi-exists",
    label: "test",
    menuid: 'menu_FilePopup'
  };
  let mi = createMI(options, test);
  let menuitem = $(options.id);
  test.assertEqual(!!menuitem, true, 'menuitem exists');
  test.assertEqual(menuitem.id, options.id, 'menuitem id is ok');
  test.assertEqual(menuitem.getAttribute('label'), options.label, 'menuitem label is ok');
  test.assertEqual(menuitem.parentNode.id, options.menuid, 'in the file menu');
  test.assertEqual(menuitem.getAttribute('disabled'), 'false', 'menuitem not disabled');
  test.assertEqual(menuitem.getAttribute('accesskey'), '', 'menuitem accesskey is ok');
  test.assertEqual(menuitem.getAttribute('class'), '', 'menuitem class is ok');
  test.assertEqual(menuitem.nextSibling, undefined, 'menuitem is last');
  test.assertEqual(menuitem.hasAttribute("checked"), false, 'menuitem not checked');
  mi.destroy();
  test.assert(!$(options.id), 'menuitem is gone');
  test.assertEqual(menuitem.parentNode, null, 'menuitem has no parent');
};

exports.testMIOnClick = function(test) {
  test.waitUntilDone();

  let options = {
    id: "test-mi-onclick",
    label: "test",
    menuid: 'menu_FilePopup',
    onCommand: function() {
      mi.destroy();
      test.pass('onCommand worked!');
      test.done();
    }
  };

  let e = document.createEvent("UIEvents");
  e.initUIEvent("command", true, true, window, 1);

  var mi = createMI(options, test);
  let menuitem = $(options.id);
  test.assertEqual(!!menuitem, true, 'menuitem exists');
  menuitem.dispatchEvent(e);
};

exports.testMIDisabled = function(test) {
  test.waitUntilDone();

  let commandIsOK = false;
  let count = 0;
  let options = {
    id: "test-mi-disabled",
    label: "test",
    disabled: true,
    menuid: 'menu_FilePopup',
    onCommand: function() {
      count++;
      if (!commandIsOK) {
        test.fail('onCommand was called, that is not ok');
        return;
      }

      mi.destroy();
      test.assertEqual(count, 1, 'onCommand was called the correct number of times!');
      test.done();
    }
  };

  let e = document.createEvent("UIEvents");
  e.initUIEvent("command", true, true, window, 1);

  var mi = createMI(options, test);
  let menuitem = $(options.id);
  test.assertEqual(!!menuitem, true, 'menuitem exists');
  test.assertEqual(menuitem.getAttribute('disabled'), 'true', 'menuitem not disabled');
  menuitem.dispatchEvent(e);
  mi.disabled = false;
  test.assertEqual(menuitem.getAttribute('disabled'), 'false', 'menuitem not disabled');
  commandIsOK = true;
  menuitem.dispatchEvent(e);
};

exports.testMIChecked = function(test) {
  let options = {
    id: "test-mi-checked",
    label: "test",
    disabled: true,
    menuid: 'menu_FilePopup',
    checked: true
  };

  let mi = createMI(options, test);
  let menuitem = $(options.id);
  test.assertEqual(!!menuitem, true, 'menuitem exists');
  test.assertEqual(menuitem.getAttribute("checked"), "true", 'menuitem checked');
  mi.checked = false;
  test.assertEqual(menuitem.getAttribute("checked"), "false", 'menuitem checked');
  mi.destroy();
};

exports.testMIClass = function(test) {
  let options = {
    id: "test-mi-class",
    label: "pizazz",
    className: "pizazz",
    menuid: 'menu_FilePopup',
  };

  var mi = createMI(options, test);
  let menuitem = $(options.id);
  test.assertEqual(!!menuitem, true, 'menuitem exists');
  test.assertEqual(menuitem.getAttribute('class'), 'pizazz', 'menuitem not disabled');
  mi.destroy();
};

exports.testInsertBeforeExists = function(test) {
  let options = {
    id: 'test-mi-insertbefore',
    label: 'insertbefore',
    insertbefore:'menu_FileQuitItem',
    menuid: 'menu_FilePopup',
  };

  var mi = createMI(options, test);
  let menuitem = $(options.id);
  test.assertEqual(!!menuitem, true, 'menuitem exists');
  test.assertEqual(menuitem.nextSibling, $('menu_FileQuitItem'), 'menuitem not disabled');
  mi.destroy();
};

exports.testInsertBeforeDoesNotExist = function(test) {
  let options = {
    id: 'test-mi-insertbefore',
    label: 'insertbefore',
    insertbefore:'menu_ZZZDNE',
    menuid: 'menu_FilePopup',
  };

  var mi = createMI(options, test);
  let menuitem = $(options.id);
  test.assertEqual(!!menuitem, true, 'menuitem exists');
  test.assertEqual(menuitem.nextSibling, null, 'menuitem not disabled');
  mi.destroy();
};
