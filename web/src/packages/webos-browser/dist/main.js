/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/@babel/runtime/helpers/arrayLikeToArray.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/arrayLikeToArray.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

module.exports = _arrayLikeToArray;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/arrayWithHoles.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/arrayWithHoles.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

module.exports = _arrayWithHoles;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/arrayWithoutHoles.js":
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/arrayWithoutHoles.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayLikeToArray = __webpack_require__(/*! ./arrayLikeToArray.js */ "./node_modules/@babel/runtime/helpers/arrayLikeToArray.js");

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return arrayLikeToArray(arr);
}

module.exports = _arrayWithoutHoles;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/iterableToArray.js":
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/iterableToArray.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}

module.exports = _iterableToArray;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/iterableToArrayLimit.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/iterableToArrayLimit.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _iterableToArrayLimit(arr, i) {
  var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]);

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

module.exports = _iterableToArrayLimit;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/nonIterableRest.js":
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/nonIterableRest.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

module.exports = _nonIterableRest;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/nonIterableSpread.js":
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/nonIterableSpread.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

module.exports = _nonIterableSpread;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/slicedToArray.js":
/*!**************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/slicedToArray.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayWithHoles = __webpack_require__(/*! ./arrayWithHoles.js */ "./node_modules/@babel/runtime/helpers/arrayWithHoles.js");

var iterableToArrayLimit = __webpack_require__(/*! ./iterableToArrayLimit.js */ "./node_modules/@babel/runtime/helpers/iterableToArrayLimit.js");

var unsupportedIterableToArray = __webpack_require__(/*! ./unsupportedIterableToArray.js */ "./node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js");

var nonIterableRest = __webpack_require__(/*! ./nonIterableRest.js */ "./node_modules/@babel/runtime/helpers/nonIterableRest.js");

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
}

module.exports = _slicedToArray;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/toConsumableArray.js":
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/toConsumableArray.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayWithoutHoles = __webpack_require__(/*! ./arrayWithoutHoles.js */ "./node_modules/@babel/runtime/helpers/arrayWithoutHoles.js");

var iterableToArray = __webpack_require__(/*! ./iterableToArray.js */ "./node_modules/@babel/runtime/helpers/iterableToArray.js");

var unsupportedIterableToArray = __webpack_require__(/*! ./unsupportedIterableToArray.js */ "./node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js");

var nonIterableSpread = __webpack_require__(/*! ./nonIterableSpread.js */ "./node_modules/@babel/runtime/helpers/nonIterableSpread.js");

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
}

module.exports = _toConsumableArray;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/typeof.js":
/*!*******************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/typeof.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  }

  return _typeof(obj);
}

module.exports = _typeof;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayLikeToArray = __webpack_require__(/*! ./arrayLikeToArray.js */ "./node_modules/@babel/runtime/helpers/arrayLikeToArray.js");

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}

module.exports = _unsupportedIterableToArray;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./src/packages/_shared/ui.js":
/*!************************************!*\
  !*** ./src/packages/_shared/ui.js ***!
  \************************************/
/*! exports provided: el, css, toolbar, button, table, statusbar, baseStyles, layout, confirmDialog, promptText, formWindow */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "el", function() { return el; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "css", function() { return css; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toolbar", function() { return toolbar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "button", function() { return button; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "table", function() { return table; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "statusbar", function() { return statusbar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "baseStyles", function() { return baseStyles; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "layout", function() { return layout; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "confirmDialog", function() { return confirmDialog; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "promptText", function() { return promptText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "formWindow", function() { return formWindow; });
/* harmony import */ var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ "./node_modules/@babel/runtime/helpers/toConsumableArray.js");
/* harmony import */ var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/typeof */ "./node_modules/@babel/runtime/helpers/typeof.js");
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ "./node_modules/@babel/runtime/helpers/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_2__);




/*
 * Minimal DOM helpers so apps don't need a framework.
 */
var el = function el(tag) {
  var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var node = document.createElement(tag);
  Object.entries(attrs).forEach(function (_ref) {
    var _ref2 = _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_2___default()(_ref, 2),
        k = _ref2[0],
        v = _ref2[1];

    if (k === 'style' && _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_1___default()(v) === 'object') {
      Object.assign(node.style, v);
    } else if (k.startsWith('on')) {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'class') {
      node.className = v;
    } else if (v !== null && v !== undefined && v !== false) {
      node.setAttribute(k, v === true ? '' : v);
    }
  });

  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  children.flat(9).forEach(function (c) {
    if (c === null || c === undefined || c === false) {
      return;
    }

    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
};
var css = function () {
  var done = new Set();
  return function (id, text) {
    if (done.has(id)) {
      return;
    }

    done.add(id);
    var style = document.createElement('style');
    style.dataset.webos = id;
    style.textContent = text;
    document.head.appendChild(style);
  };
}();
var toolbar = function toolbar() {
  for (var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    items[_key2] = arguments[_key2];
  }

  return el.apply(void 0, ['div', {
    "class": 'webos-toolbar'
  }].concat(items));
};
var button = function button(label, onclick, title) {
  return el('button', {
    "class": 'webos-btn',
    onclick: onclick,
    title: title
  }, label);
};
var table = function table(columns, rows, onRow) {
  var thead = el('thead', {}, el.apply(void 0, ['tr', {}].concat(_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0___default()(columns.map(function (c) {
    return el('th', {}, c);
  })))));
  var tbody = el.apply(void 0, ['tbody', {}].concat(_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0___default()(rows.map(function (r) {
    var tr = el.apply(void 0, ['tr', {}].concat(_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0___default()(r.map(function (c) {
      return el('td', {}, c instanceof Node ? c : String(c !== null && c !== void 0 ? c : ''));
    }))));

    if (onRow) {
      tr.addEventListener('click', function () {
        return onRow(tr);
      });
    }

    return tr;
  }))));
  return el('table', {
    "class": 'webos-table'
  }, thead, tbody);
};
var statusbar = function statusbar() {
  var node = el('div', {
    "class": 'webos-status'
  });

  node.set = function (msg) {
    node.textContent = msg;
  };

  node.error = function (msg) {
    node.textContent = "Error: ".concat(msg);
    node.style.color = '#f66';
    setTimeout(function () {
      node.style.color = '';
    }, 4000);
  };

  return node;
};
var baseStyles = function baseStyles() {
  return css('base', "\n  .webos-root { display: flex; flex-direction: column; height: 100%; width: 100%;\n    font-family: sans-serif; font-size: 13px; background: #20232a; color: #e8e8e8; }\n  .webos-toolbar { display: flex; gap: 6px; padding: 6px; align-items: center;\n    background: #2a2e37; border-bottom: 1px solid #17191f; flex: 0 0 auto; flex-wrap: wrap; }\n  .webos-body { flex: 1 1 auto; overflow: auto; padding: 0; }\n  .webos-body.padded { padding: 10px; }\n  .webos-table { width: 100%; border-collapse: collapse; }\n  .webos-table th { text-align: left; padding: 6px 8px; background: #2a2e37;\n    position: sticky; top: 0; border-bottom: 1px solid #17191f; }\n  .webos-table td { padding: 5px 8px; border-bottom: 1px solid #262a33; }\n  .webos-table tbody tr:hover { background: #2d3244; }\n  .webos-table tbody tr.selected { background: #3a4160; }\n  .webos-btn { background: #3a4150; color: #e8e8e8; border: 1px solid #4a5165;\n    border-radius: 3px; padding: 4px 10px; cursor: pointer; font-size: 12px; }\n  .webos-btn:hover { background: #4a5165; }\n  .webos-btn.danger { background: #6e3038; border-color: #8a4148; }\n  .webos-btn.danger:hover { background: #8a4148; }\n  .webos-input { background: #17191f; color: #e8e8e8; border: 1px solid #3a4150;\n    border-radius: 3px; padding: 4px 8px; font-size: 12px; }\n  .webos-status { padding: 4px 8px; background: #2a2e37; border-top: 1px solid #17191f;\n    flex: 0 0 auto; min-height: 22px; font-size: 12px; color: #aab; }\n  .webos-badge { display: inline-block; padding: 1px 7px; border-radius: 8px;\n    font-size: 11px; }\n  .webos-badge.on { background: #2c5b2f; color: #9f9; }\n  .webos-badge.off { background: #4a4a4a; color: #bbb; }\n  .webos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));\n    gap: 14px; padding: 18px; }\n  .webos-iconbtn { display: flex; flex-direction: column; align-items: center; gap: 8px;\n    padding: 14px 8px; background: #262a33; border: 1px solid #333845; border-radius: 6px;\n    cursor: pointer; text-align: center; }\n  .webos-iconbtn:hover { background: #313748; }\n  .webos-iconbtn .glyph { font-size: 30px; }\n  .webos-kv { display: grid; grid-template-columns: 160px 1fr; gap: 4px 12px; }\n  .webos-kv b { color: #9ab; }\n");
};
var layout = function layout(tb, body, sb) {
  baseStyles();
  var b = el('div', {
    "class": 'webos-body'
  }, body);
  return el('div', {
    "class": 'webos-root'
  }, tb, b, sb);
};
var confirmDialog = function confirmDialog(core, title, message) {
  return new Promise(function (resolve) {
    core.make('osjs/dialog', 'confirm', {
      title: title,
      message: message
    }, function (btn) {
      return resolve(btn === 'yes' || btn === 'ok');
    });
  });
};
var promptText = function promptText(core, title, message) {
  var value = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
  return new Promise(function (resolve) {
    core.make('osjs/dialog', 'prompt', {
      title: title,
      message: message,
      value: value
    }, function (btn, v) {
      return resolve(btn === 'ok' ? v : null);
    });
  });
};
/*
 * Small form window inside the app process.
 * fields: [{name, label, type ('text'|'password')}]
 * cb(values | null)
 */

var formWindow = function formWindow(proc, _ref3, cb) {
  var title = _ref3.title,
      fields = _ref3.fields;
  var win = proc.createWindow({
    title: title,
    dimension: {
      width: 340,
      height: 110 + fields.length * 36
    },
    attributes: {
      gravity: 'center',
      resizable: false,
      maximizable: false,
      minimizable: false
    }
  });
  win.on('destroy', function () {
    return cb(null);
  });
  win.render(function ($c) {
    baseStyles();
    var inputs = {};
    var form = el.apply(void 0, ['div', {
      style: {
        padding: '12px',
        display: 'grid',
        gap: '8px'
      }
    }].concat(_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0___default()(fields.map(function (f) {
      inputs[f.name] = f.options ? el('select', {
        "class": 'webos-input'
      }, f.options.map(function (o) {
        var _o$value, _o$label;

        return el('option', {
          value: (_o$value = o.value) !== null && _o$value !== void 0 ? _o$value : o
        }, (_o$label = o.label) !== null && _o$label !== void 0 ? _o$label : o);
      })) : el('input', {
        "class": 'webos-input',
        type: f.type || 'text',
        placeholder: f.placeholder || '',
        value: f.value || ''
      });
      if (f.value) inputs[f.name].value = f.value;
      return el('label', {
        style: {
          display: 'grid',
          gap: '3px'
        }
      }, f.label, inputs[f.name]);
    })), [el('div', {
      style: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }
    }, button('Cancel', function () {
      cb = function cb() {};

      win.close();
    }), button('OK', function () {
      var values = {};
      Object.keys(inputs).forEach(function (k) {
        values[k] = inputs[k].value;
      });
      var done = cb;

      cb = function cb() {};

      win.close();
      done(values);
    }))]));
    $c.appendChild(form);
  });
  return win;
};

/***/ }),

/***/ "./src/packages/webos-browser/index.js":
/*!*********************************************!*\
  !*** ./src/packages/webos-browser/index.js ***!
  \*********************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var osjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! osjs */ "osjs");
/* harmony import */ var osjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(osjs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _metadata_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./metadata.json */ "./src/packages/webos-browser/metadata.json");
var _metadata_json__WEBPACK_IMPORTED_MODULE_1___namespace = /*#__PURE__*/__webpack_require__.t(/*! ./metadata.json */ "./src/packages/webos-browser/metadata.json", 1);
/* harmony import */ var _shared_ui_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../_shared/ui.js */ "./src/packages/_shared/ui.js");



Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["css"])('webos-browser', `
  .nn-root { display: flex; flex-direction: column; height: 100%; width: 100%;
    background: #c0c0c0; font-family: "MS Sans Serif", Tahoma, Verdana, sans-serif;
    font-size: 12px; color: #000; }
  .nn-menus { display: flex; gap: 2px; padding: 2px 6px; background: #c0c0c0;
    border-bottom: 1px solid #808080; }
  .nn-menus span { padding: 1px 7px; cursor: default; }
  .nn-menus span:hover { background: #000080; color: #fff; }
  .nn-toolbar { display: flex; gap: 4px; padding: 4px 6px; align-items: center;
    background: #c0c0c0; border-bottom: 2px groove #dfdfdf; }
  .nn-btn { display: flex; flex-direction: column; align-items: center; gap: 1px;
    min-width: 52px; padding: 3px 6px; background: #c0c0c0; color: #000;
    border: 2px outset #efefef; font: 11px Tahoma, sans-serif; cursor: pointer; }
  .nn-btn:active { border-style: inset; }
  .nn-btn:disabled { color: #808080; cursor: default; }
  .nn-btn:disabled:active { border-style: outset; }
  .nn-btn .ic { font-size: 16px; line-height: 1; }
  .nn-throb { margin-left: auto; width: 34px; height: 34px; border: 2px inset #efefef;
    display: flex; align-items: center; justify-content: center;
    font: bold 20px/1 Georgia, serif; color: #ffe; background: #0a4a8a; }
  .nn-throb.on { animation: nnspin 0.9s infinite; background: #c0392b; }
  @keyframes nnspin { 0% {transform: rotate(0)} 100% {transform: rotate(360deg)} }
  .nn-locbar { display: flex; gap: 6px; align-items: center; padding: 4px 6px;
    background: #c0c0c0; border-bottom: 1px solid #808080; }
  .nn-locbar label { font-weight: bold; }
  .nn-loc { flex: 1; border: 2px inset #fff; background: #fff; color: #000;
    padding: 3px 5px; font: 12px monospace; }
  .nn-proxy { display: flex; align-items: center; gap: 3px; font-size: 11px; }
  .nn-view { flex: 1 1 auto; border: 2px inset #808080; margin: 0; background: #fff; }
  .nn-status { display: flex; align-items: center; gap: 8px; padding: 2px 6px;
    background: #c0c0c0; border-top: 2px groove #dfdfdf; font-size: 11px; }
  .nn-msg { flex: 1; border: 1px inset #fff; padding: 1px 6px; background: #c0c0c0; }
`);
const MENUS = ['File', 'Edit', 'View', 'Go', 'Bookmarks', 'Options', 'Directory', 'Window', 'Help'];
const HOME_HTML = `<!DOCTYPE html><html><body bgcolor="#c0c0c0" text="#000" link="#0000ee">
<center><table width="70%"><tr><td align="center">
<font face="Georgia,serif" size="7" color="#0a4a8a"><b>N</b></font>
<h2>Netscape Navigator</h2>
<p>Welcome aboard, navigator. Type an address in <b>Location</b> or pick a destination:</p>
<table cellpadding="8"><tr>
<td bgcolor="#e8e8e8"><a href="https://lite.duckduckgo.com/lite/"><b>DuckDuckGo Lite</b></a><br><font size="2">search</font></td>
<td bgcolor="#e8e8e8"><a href="https://en.wikipedia.org"><b>Wikipedia</b></a><br><font size="2">encyclopedia</font></td>
<td bgcolor="#e8e8e8"><a href="https://news.ycombinator.com"><b>Hacker News</b></a><br><font size="2">tech news</font></td>
</tr></table>
<p><font size="2" color="#444">Some sites refuse to load inside a window — tick <b>proxy</b> to fetch them through the server.</font></p>
</td></tr></table></center>
<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(a){e.preventDefault();parent.postMessage({webosNav:a.href},'*')}});</script>
</body></html>`;

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {
    args,
    options,
    metadata
  });
  const frame = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('iframe', {
    class: 'nn-view',
    sandbox: 'allow-scripts allow-forms allow-popups'
  });
  const msg = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('span', {
    class: 'nn-msg'
  }, 'Document: Done');
  const throb = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('div', {
    class: 'nn-throb'
  }, 'N');
  const url = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('input', {
    class: 'nn-loc',
    spellcheck: 'false'
  });
  const proxy = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('input', {
    type: 'checkbox'
  });
  const hist = [];
  let hi = -1;
  const back = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('button', {
    class: 'nn-btn'
  }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('span', {
    class: 'ic'
  }, '⬅'), 'Back');
  const fwd = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('button', {
    class: 'nn-btn'
  }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('span', {
    class: 'ic'
  }, '➡'), 'Forward');

  const state = () => {
    back.disabled = hi <= 0;
    fwd.disabled = hi >= hist.length - 1;
  };

  const normalize = u => {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^[a-z]+:/i.test(u)) u = (u.includes('.') && !u.includes(' ') ? 'https://' : 'https://lite.duckduckgo.com/lite/?q=') + (u.includes('.') && !u.includes(' ') ? u : encodeURIComponent(u));
    return u;
  };

  const load = u => {
    msg.textContent = 'Loading ' + u + ' ...';
    throb.classList.add('on');
    frame.removeAttribute('srcdoc');
    frame.src = proxy.checked ? '/api/webos/browser/browse?url=' + encodeURIComponent(u) : u;
  };

  const nav = u => {
    u = normalize(u);
    if (!u) return;
    hist.splice(hi + 1);
    hist.push(u);
    hi = hist.length - 1;
    url.value = u;
    state();
    load(u);
  };

  back.onclick = () => {
    if (hi > 0) {
      hi--;
      url.value = hist[hi];
      state();
      load(hist[hi]);
    }
  };

  fwd.onclick = () => {
    if (hi < hist.length - 1) {
      hi++;
      url.value = hist[hi];
      state();
      load(hist[hi]);
    }
  };

  frame.addEventListener('load', () => {
    throb.classList.remove('on');
    msg.textContent = 'Document: Done';
  });
  url.addEventListener('keydown', e => {
    if (e.key === 'Enter') nav(url.value);
  });

  const onMsg = e => {
    if (e.data && e.data.webosNav) nav(e.data.webosNav);
  };

  window.addEventListener('message', onMsg);

  const home = () => {
    url.value = '';
    throb.classList.remove('on');
    frame.srcdoc = HOME_HTML;
    msg.textContent = 'Document: Done';
  };

  proc.createWindow({
    id: 'WebOSBrowserWindow',
    title: 'Netscape Navigator — Malta OS',
    dimension: {
      width: 920,
      height: 560
    }
  }).on('destroy', () => {
    window.removeEventListener('message', onMsg);
    proc.destroy();
  }).render($c => {
    $c.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('div', {
      class: 'nn-root'
    }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('div', {
      class: 'nn-menus'
    }, ...MENUS.map(m => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('span', {}, m))), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('div', {
      class: 'nn-toolbar'
    }, back, fwd, (() => {
      const b = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('button', {
        class: 'nn-btn'
      }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('span', {
        class: 'ic'
      }, '⟳'), 'Reload');

      b.onclick = () => load(url.value || hist[hi] || '');

      return b;
    })(), (() => {
      const b = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('button', {
        class: 'nn-btn'
      }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('span', {
        class: 'ic'
      }, '⌂'), 'Home');
      b.onclick = home;
      return b;
    })(), (() => {
      const b = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('button', {
        class: 'nn-btn'
      }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('span', {
        class: 'ic'
      }, '✕'), 'Stop');

      b.onclick = () => {
        frame.src = 'about:blank';
        throb.classList.remove('on');
        msg.textContent = 'Stopped.';
      };

      return b;
    })(), throb), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('div', {
      class: 'nn-locbar'
    }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('label', {}, 'Location:'), url, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('label', {
      class: 'nn-proxy'
    }, proxy, 'proxy'), (() => {
      const b = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('button', {
        class: 'nn-btn',
        style: 'min-width:40px'
      }, 'Go');

      b.onclick = () => nav(url.value);

      return b;
    })()), frame, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_2__["el"])('div', {
      class: 'nn-status'
    }, '🔒', msg)));
    state();
    home();
  });
  return proc;
};

osjs__WEBPACK_IMPORTED_MODULE_0___default.a.register(_metadata_json__WEBPACK_IMPORTED_MODULE_1__["name"], register);

/***/ }),

/***/ "./src/packages/webos-browser/metadata.json":
/*!**************************************************!*\
  !*** ./src/packages/webos-browser/metadata.json ***!
  \**************************************************/
/*! exports provided: type, name, category, title, description, files, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"type\":\"application\",\"name\":\"WebOSBrowser\",\"category\":\"utilities\",\"title\":{\"en_EN\":\"Navigator\",\"pt_BR\":\"Navigator\"},\"description\":{\"en_EN\":\"Web browser (Netscape style)\",\"pt_BR\":\"Navegador web (estilo Netscape)\"},\"files\":[\"main.js\"]}");

/***/ }),

/***/ 0:
/*!***************************************************!*\
  !*** multi ./src/packages/webos-browser/index.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/tiagoiwamoto/shared-drive/workspace/01-development/20-python/linux-webos/web/src/packages/webos-browser/index.js */"./src/packages/webos-browser/index.js");


/***/ }),

/***/ "osjs":
/*!***********************!*\
  !*** external "OSjs" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = OSjs;

/***/ })

/******/ });
//# sourceMappingURL=main.js.map