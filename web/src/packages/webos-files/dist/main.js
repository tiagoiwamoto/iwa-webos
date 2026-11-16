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

/***/ "./node_modules/@babel/runtime/helpers/asyncToGenerator.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/asyncToGenerator.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;
module.exports["default"] = module.exports, module.exports.__esModule = true;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/defineProperty.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/defineProperty.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;
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

/***/ "./node_modules/@babel/runtime/regenerator/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@babel/runtime/regenerator/index.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! regenerator-runtime */ "./node_modules/regenerator-runtime/runtime.js");


/***/ }),

/***/ "./node_modules/regenerator-runtime/runtime.js":
/*!*****************************************************!*\
  !*** ./node_modules/regenerator-runtime/runtime.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   true ? module.exports : undefined
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}


/***/ }),

/***/ "./src/packages/_shared/api.js":
/*!*************************************!*\
  !*** ./src/packages/_shared/api.js ***!
  \*************************************/
/*! exports provided: api, terminalSocket, formatBytes */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "api", function() { return api; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "terminalSocket", function() { return terminalSocket; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "formatBytes", function() { return formatBytes; });
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ "./node_modules/@babel/runtime/helpers/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ "./node_modules/@babel/runtime/helpers/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/regenerator */ "./node_modules/@babel/runtime/regenerator/index.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_2__);




/*
 * Shared helpers for WebOS apps: calls the privileged agent through the
 * authenticated OS.js server proxy at /api/webos/*.
 */
var request = function request(method, path, body) {
  var options = {
    method: method,
    headers: body !== undefined ? {
      'Content-Type': 'application/json'
    } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  };
  return fetch("/api/webos/".concat(path), options).then( /*#__PURE__*/function () {
    var _ref = _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_2___default.a.mark(function _callee(res) {
      var text, data, detail;
      return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_2___default.a.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return res.text();

            case 2:
              text = _context.sent;

              try {
                data = JSON.parse(text);
              } catch (e) {
                data = text;
              }

              if (res.ok) {
                _context.next = 7;
                break;
              }

              detail = data && data.detail ? data.detail : res.statusText;
              throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));

            case 7:
              return _context.abrupt("return", data);

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
};

var qs = function qs(params) {
  var clean = Object.entries(params || {}).filter(function (_ref2) {
    var _ref3 = _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_0___default()(_ref2, 2),
        v = _ref3[1];

    return v !== undefined && v !== null && v !== '';
  });
  return clean.length ? '?' + new URLSearchParams(clean).toString() : '';
};

var api = {
  get: function get(path, params) {
    return request('GET', path + qs(params));
  },
  post: function post(path, body) {
    return request('POST', path, body || {});
  },
  put: function put(path, body) {
    return request('PUT', path, body || {});
  },
  del: function del(path, params) {
    return request('DELETE', path + qs(params));
  }
};
var terminalSocket = function terminalSocket() {
  return new WebSocket("".concat(location.protocol === 'https:' ? 'wss' : 'ws', "://").concat(location.host, "/ws/webos/terminal"));
};
var formatBytes = function formatBytes(n) {
  if (n === null || n === undefined) {
    return '-';
  }

  var units = ['B', 'K', 'M', 'G', 'T', 'P'];
  var i = 0;
  var v = Number(n);

  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }

  return "".concat(v.toFixed(v >= 100 || i === 0 ? 0 : 1)).concat(units[i]);
};

/***/ }),

/***/ "./src/packages/_shared/i18n.js":
/*!**************************************!*\
  !*** ./src/packages/_shared/i18n.js ***!
  \**************************************/
/*! exports provided: LOCALES, intlLocale, getLocale, setLocale, watchLocale, useI18n, metaTitle */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LOCALES", function() { return LOCALES; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intlLocale", function() { return intlLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLocale", function() { return getLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLocale", function() { return setLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "watchLocale", function() { return watchLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "useI18n", function() { return useI18n; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "metaTitle", function() { return metaTitle; });
/*
 * Local i18n — user-chosen language stored in osjs/settings ('webos.locale'),
 * independent of the browser language. Dictionaries are namespaced per app
 * ('files', 'shell', ...) plus a shared 'common' pack.
 *
 * const {t, onLocale} = useI18n(core);
 * t('newFolder')           -> common.newFolder lookup? no — app keys are
 * t('files.newFolder')      namespaced; bare keys hit 'common'.
 * t('files.deleteMsg', {name: 'x'})  -> '{name}' interpolation.
 */
var DICTS = {};

var registerDict = function registerDict(ns, dict) {
  DICTS[ns] = dict;
};

var LOCALES = [{
  id: 'en',
  label: 'English'
}, {
  id: 'pt_BR',
  label: 'Português (BR)'
}, {
  id: 'pt_PT',
  label: 'Português (PT)'
}, {
  id: 'es',
  label: 'Español'
}, {
  id: 'ja',
  label: '日本語'
}, {
  id: 'zh',
  label: '中文'
}]; // BCP-47 for Intl APIs (clock etc.)

var intlLocale = function intlLocale(id) {
  return {
    en: 'en',
    pt_BR: 'pt-BR',
    pt_PT: 'pt-PT',
    es: 'es',
    ja: 'ja',
    zh: 'zh'
  }[id] || 'en';
};
var getLocale = function getLocale(core) {
  try {
    return core.make('osjs/settings').get('webos', 'locale') || 'en';
  } catch (e) {
    return 'en';
  }
}; // OS.js core only ships these translations — dialogs fall back to en_EN

var OSJS_LOCALE = {
  en: 'en_EN',
  pt_BR: 'pt_BR',
  zh: 'zh_CN'
};
var setLocale = function setLocale(core, id) {
  var s = core.make('osjs/settings');
  s.set('webos', 'locale', id);
  s.set('osjs/locale', 'language', OSJS_LOCALE[id] || 'en_EN'); // apply immediately — a failed save must never gate the UI switch

  document.dispatchEvent(new CustomEvent('webos:locale'));
  return s.save()["catch"](function (e) {
    return console.warn('settings save failed', e);
  });
}; // call fn on every locale change; auto-unsubscribes when proc dies

var watchLocale = function watchLocale(proc, fn) {
  var h = function h() {
    return fn();
  };

  document.addEventListener('webos:locale', h);
  proc.on('destroy', function () {
    return document.removeEventListener('webos:locale', h);
  });
};
var useI18n = function useI18n(core) {
  var t = function t(key, vars) {
    var dot = key.indexOf('.');
    var ns = dot > 0 ? key.slice(0, dot) : 'common';
    var k = dot > 0 ? key.slice(dot + 1) : key;
    var loc = getLocale(core);
    var dict = DICTS[ns] || {};
    var s = dict[loc] && dict[loc][k] || dict.en && dict.en[k] || key;

    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, v) {
        return vars[v] !== undefined ? vars[v] : m;
      });
    }

    return s;
  };

  var onLocale = function onLocale(fn) {
    var h = function h() {
      return fn();
    };

    document.addEventListener('webos:locale', h);
    return function () {
      return document.removeEventListener('webos:locale', h);
    };
  };

  return {
    t: t,
    onLocale: onLocale,
    locale: function locale() {
      return getLocale(core);
    }
  };
}; // package metadata titles use OS.js locale ids (en_EN, pt_BR, ...)

var META_LOCALE = {
  en: 'en_EN',
  pt_BR: 'pt_BR',
  pt_PT: 'pt_PT',
  es: 'es_ES',
  ja: 'ja_JP',
  zh: 'zh_CN'
};
var metaTitle = function metaTitle(core, m) {
  var title = m && m.title || {};
  return title[META_LOCALE[getLocale(core)]] || title.en_EN || m && m.name || '';
}; // ---------------------------------------------------------------------------

registerDict('common', {
  en: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    del: 'Delete',
    refresh: 'Refresh',
    loading: 'loading…',
    error: 'Error',
    name: 'Name',
    size: 'Size',
    type: 'Type',
    modified: 'Modified',
    add: 'Add',
    close: 'Close',
    select: 'Select',
    go: 'Go'
  },
  pt_BR: {
    ok: 'OK',
    cancel: 'Cancelar',
    save: 'Salvar',
    del: 'Excluir',
    refresh: 'Atualizar',
    loading: 'carregando…',
    error: 'Erro',
    name: 'Nome',
    size: 'Tamanho',
    type: 'Tipo',
    modified: 'Modificado',
    add: 'Adicionar',
    close: 'Fechar',
    select: 'Selecionar',
    go: 'Ir'
  },
  pt_PT: {
    ok: 'OK',
    cancel: 'Cancelar',
    save: 'Guardar',
    del: 'Eliminar',
    refresh: 'Atualizar',
    loading: 'a carregar…',
    error: 'Erro',
    name: 'Nome',
    size: 'Tamanho',
    type: 'Tipo',
    modified: 'Modificado',
    add: 'Adicionar',
    close: 'Fechar',
    select: 'Selecionar',
    go: 'Ir'
  },
  es: {
    ok: 'OK',
    cancel: 'Cancelar',
    save: 'Guardar',
    del: 'Eliminar',
    refresh: 'Actualizar',
    loading: 'cargando…',
    error: 'Error',
    name: 'Nombre',
    size: 'Tamaño',
    type: 'Tipo',
    modified: 'Modificado',
    add: 'Añadir',
    close: 'Cerrar',
    select: 'Seleccionar',
    go: 'Ir'
  },
  ja: {
    ok: 'OK',
    cancel: 'キャンセル',
    save: '保存',
    del: '削除',
    refresh: '更新',
    loading: '読み込み中…',
    error: 'エラー',
    name: '名前',
    size: 'サイズ',
    type: '種類',
    modified: '更新日時',
    add: '追加',
    close: '閉じる',
    select: '選択',
    go: '移動'
  },
  zh: {
    ok: '确定',
    cancel: '取消',
    save: '保存',
    del: '删除',
    refresh: '刷新',
    loading: '加载中…',
    error: '错误',
    name: '名称',
    size: '大小',
    type: '类型',
    modified: '修改时间',
    add: '添加',
    close: '关闭',
    select: '选择',
    go: '前往'
  }
});
registerDict('shell', {
  en: {
    search: 'Type to search…',
    saveSession: 'Save session',
    logout: 'Log out',
    language: 'Language',
    session: 'Session',
    'app.Terminal': 'Terminal',
    'app.Tasks': 'Tasks',
    'app.Services': 'Services',
    'app.Docker': 'Docker',
    'app.App Store': 'App Store',
    'app.Disks': 'Disks',
    'app.Users': 'Users',
    'app.Files': 'Files',
    'app.Editor': 'Editor',
    'app.System': 'System',
    'app.Logs': 'Logs',
    'app.Cron': 'Cron',
    'app.Remote': 'Remote',
    'app.Navigator': 'Navigator',
    'app.Backup': 'Backup',
    'app.Server': 'Server',
    'app.Settings': 'Settings'
  },
  pt_BR: {
    search: 'Digite para buscar…',
    saveSession: 'Salvar sessão',
    logout: 'Sair',
    language: 'Idioma',
    session: 'Sessão',
    'app.Terminal': 'Terminal',
    'app.Tasks': 'Tarefas',
    'app.Services': 'Serviços',
    'app.Docker': 'Docker',
    'app.App Store': 'Loja de Apps',
    'app.Disks': 'Discos',
    'app.Users': 'Usuários',
    'app.Files': 'Arquivos',
    'app.Editor': 'Editor',
    'app.System': 'Sistema',
    'app.Logs': 'Logs',
    'app.Cron': 'Cron',
    'app.Remote': 'Remoto',
    'app.Navigator': 'Navegador',
    'app.Backup': 'Backup',
    'app.Server': 'Servidor',
    'app.Settings': 'Configurações'
  },
  pt_PT: {
    search: 'Escreva para procurar…',
    saveSession: 'Guardar sessão',
    logout: 'Terminar sessão',
    language: 'Idioma',
    session: 'Sessão',
    'app.Terminal': 'Terminal',
    'app.Tasks': 'Tarefas',
    'app.Services': 'Serviços',
    'app.Docker': 'Docker',
    'app.App Store': 'Loja de Apps',
    'app.Disks': 'Discos',
    'app.Users': 'Utilizadores',
    'app.Files': 'Ficheiros',
    'app.Editor': 'Editor',
    'app.System': 'Sistema',
    'app.Logs': 'Registos',
    'app.Cron': 'Cron',
    'app.Remote': 'Remoto',
    'app.Navigator': 'Navegador',
    'app.Backup': 'Cópia de segurança',
    'app.Server': 'Servidor',
    'app.Settings': 'Definições'
  },
  es: {
    search: 'Escribe para buscar…',
    saveSession: 'Guardar sesión',
    logout: 'Cerrar sesión',
    language: 'Idioma',
    session: 'Sesión',
    'app.Terminal': 'Terminal',
    'app.Tasks': 'Tareas',
    'app.Services': 'Servicios',
    'app.Docker': 'Docker',
    'app.App Store': 'Tienda de Apps',
    'app.Disks': 'Discos',
    'app.Users': 'Usuarios',
    'app.Files': 'Archivos',
    'app.Editor': 'Editor',
    'app.System': 'Sistema',
    'app.Logs': 'Registros',
    'app.Cron': 'Cron',
    'app.Remote': 'Remoto',
    'app.Navigator': 'Navegador',
    'app.Backup': 'Copia de seguridad',
    'app.Server': 'Servidor',
    'app.Settings': 'Configuración'
  },
  ja: {
    search: '入力して検索…',
    saveSession: 'セッションを保存',
    logout: 'ログアウト',
    language: '言語',
    session: 'セッション',
    'app.Terminal': 'ターミナル',
    'app.Tasks': 'タスク',
    'app.Services': 'サービス',
    'app.Docker': 'Docker',
    'app.App Store': 'アプリストア',
    'app.Disks': 'ディスク',
    'app.Users': 'ユーザー',
    'app.Files': 'ファイル',
    'app.Editor': 'エディタ',
    'app.System': 'システム',
    'app.Logs': 'ログ',
    'app.Cron': 'Cron',
    'app.Remote': 'リモート',
    'app.Navigator': 'ナビゲーター',
    'app.Backup': 'バックアップ',
    'app.Server': 'サーバー',
    'app.Settings': '設定'
  },
  zh: {
    search: '输入以搜索…',
    saveSession: '保存会话',
    logout: '注销',
    language: '语言',
    session: '会话',
    'app.Terminal': '终端',
    'app.Tasks': '任务',
    'app.Services': '服务',
    'app.Docker': 'Docker',
    'app.App Store': '应用商店',
    'app.Disks': '磁盘',
    'app.Users': '用户',
    'app.Files': '文件',
    'app.Editor': '编辑器',
    'app.System': '系统',
    'app.Logs': '日志',
    'app.Cron': 'Cron',
    'app.Remote': '远程',
    'app.Navigator': '导航器',
    'app.Backup': '备份',
    'app.Server': '服务器',
    'app.Settings': '设置'
  }
});
registerDict('files', {
  en: {
    newFolder: 'New folder',
    newFolderMsg: 'Folder name in {dir}',
    newFile: 'New file',
    newFileMsg: 'File name in {dir}',
    rename: 'Rename',
    renameMsg: 'New name for {name}',
    deleteTitle: 'Delete',
    deleteMsg: 'Permanently delete {name}?',
    open: 'Open',
    openWith: 'Open with…',
    favorite: '★ Favorite',
    unfavPlace: '★ Remove favorite',
    favPlace: '★ Favorite folder',
    paste: 'Paste',
    cut: 'Cut',
    copy: 'Copy',
    download: 'Download',
    upload: 'Upload file…',
    refresh: 'Refresh',
    places: 'Places',
    devices: 'Devices',
    favorites: 'Favorites',
    noVolumes: 'no volumes',
    noFavorites: 'no favorites — use ★ in the toolbar',
    emptyFolder: 'empty folder',
    items: '{n} item(s)',
    folders: '{n} folder(s)',
    clip: '{n} in clipboard',
    clipCut: ' (cut)',
    mounting: 'mounting {dev}…',
    unmount: 'Unmount {dev}',
    notMounted: 'not mounted',
    editPath: 'Edit path (Ctrl+L)',
    favTitle: 'Add/remove favorite',
    viewToggle: 'Toggle list/icons',
    showHidden: 'Show hidden files',
    selInfo: '{name} — {info}',
    folder: 'folder',
    file: 'file',
    removeFav: 'Remove favorite',
    selItem: 'select an item',
    back: 'Back',
    forward: 'Forward',
    up: 'Up',
    uploading: 'uploading {name}…',
    uploaded: '{name} sent'
  },
  pt_BR: {
    newFolder: 'Nova pasta',
    newFolderMsg: 'Nome da pasta em {dir}',
    newFile: 'Novo arquivo',
    newFileMsg: 'Nome do arquivo em {dir}',
    rename: 'Renomear',
    renameMsg: 'Novo nome para {name}',
    deleteTitle: 'Excluir',
    deleteMsg: 'Excluir {name} definitivamente?',
    open: 'Abrir',
    openWith: 'Abrir com…',
    favorite: '★ Favoritar',
    unfavPlace: '★ Remover favorito',
    favPlace: '★ Favoritar pasta',
    paste: 'Colar',
    cut: 'Recortar',
    copy: 'Copiar',
    download: 'Download',
    upload: 'Enviar arquivo…',
    refresh: 'Atualizar',
    places: 'Locais',
    devices: 'Dispositivos',
    favorites: 'Favoritos',
    noVolumes: 'nenhum volume',
    noFavorites: 'nenhum favorito — use ★ na barra',
    emptyFolder: 'pasta vazia',
    items: '{n} item(s)',
    folders: '{n} pasta(s)',
    clip: '{n} na área de transferência',
    clipCut: ' (recortar)',
    mounting: 'montando {dev}…',
    unmount: 'Desmontar {dev}',
    notMounted: 'não montado',
    editPath: 'Editar caminho (Ctrl+L)',
    favTitle: 'Adicionar/remover favorito',
    viewToggle: 'Alternar lista/ícones',
    showHidden: 'Mostrar arquivos ocultos',
    selInfo: '{name} — {info}',
    folder: 'pasta',
    file: 'arquivo',
    removeFav: 'Remover favorito',
    selItem: 'selecione um item',
    back: 'Voltar',
    forward: 'Avançar',
    up: 'Subir',
    uploading: 'enviando {name}…',
    uploaded: '{name} enviado'
  },
  pt_PT: {
    newFolder: 'Nova pasta',
    newFolderMsg: 'Nome da pasta em {dir}',
    newFile: 'Novo ficheiro',
    newFileMsg: 'Nome do ficheiro em {dir}',
    rename: 'Mudar o nome',
    renameMsg: 'Novo nome para {name}',
    deleteTitle: 'Eliminar',
    deleteMsg: 'Eliminar {name} definitivamente?',
    open: 'Abrir',
    openWith: 'Abrir com…',
    favorite: '★ Favorito',
    unfavPlace: '★ Remover favorito',
    favPlace: '★ Marcador de pasta',
    paste: 'Colar',
    cut: 'Cortar',
    copy: 'Copiar',
    download: 'Descarregar',
    upload: 'Enviar ficheiro…',
    refresh: 'Atualizar',
    places: 'Locais',
    devices: 'Dispositivos',
    favorites: 'Favoritos',
    noVolumes: 'sem volumes',
    noFavorites: 'sem favoritos — use ★ na barra',
    emptyFolder: 'pasta vazia',
    items: '{n} item(s)',
    folders: '{n} pasta(s)',
    clip: '{n} na área de transferência',
    clipCut: ' (cortar)',
    mounting: 'a montar {dev}…',
    unmount: 'Desmontar {dev}',
    notMounted: 'não montado',
    editPath: 'Editar caminho (Ctrl+L)',
    favTitle: 'Adicionar/remover favorito',
    viewToggle: 'Alternar lista/ícones',
    showHidden: 'Mostrar ficheiros ocultos',
    selInfo: '{name} — {info}',
    folder: 'pasta',
    file: 'ficheiro',
    removeFav: 'Remover favorito',
    selItem: 'selecione um item',
    back: 'Voltar',
    forward: 'Avançar',
    up: 'Subir',
    uploading: 'a enviar {name}…',
    uploaded: '{name} enviado'
  },
  es: {
    newFolder: 'Nueva carpeta',
    newFolderMsg: 'Nombre de la carpeta en {dir}',
    newFile: 'Nuevo archivo',
    newFileMsg: 'Nombre del archivo en {dir}',
    rename: 'Renombrar',
    renameMsg: 'Nuevo nombre para {name}',
    deleteTitle: 'Eliminar',
    deleteMsg: '¿Eliminar {name} definitivamente?',
    open: 'Abrir',
    openWith: 'Abrir con…',
    favorite: '★ Favorito',
    unfavPlace: '★ Quitar favorito',
    favPlace: '★ Carpeta favorita',
    paste: 'Pegar',
    cut: 'Cortar',
    copy: 'Copiar',
    download: 'Descargar',
    upload: 'Subir archivo…',
    refresh: 'Actualizar',
    places: 'Lugares',
    devices: 'Dispositivos',
    favorites: 'Favoritos',
    noVolumes: 'sin volúmenes',
    noFavorites: 'sin favoritos — usa ★ en la barra',
    emptyFolder: 'carpeta vacía',
    items: '{n} elemento(s)',
    folders: '{n} carpeta(s)',
    clip: '{n} en el portapapeles',
    clipCut: ' (cortar)',
    mounting: 'montando {dev}…',
    unmount: 'Desmontar {dev}',
    notMounted: 'sin montar',
    editPath: 'Editar ruta (Ctrl+L)',
    favTitle: 'Añadir/quitar favorito',
    viewToggle: 'Alternar lista/iconos',
    showHidden: 'Mostrar archivos ocultos',
    selInfo: '{name} — {info}',
    folder: 'carpeta',
    file: 'archivo',
    removeFav: 'Quitar favorito',
    selItem: 'seleccione un elemento',
    back: 'Atrás',
    forward: 'Adelante',
    up: 'Subir',
    uploading: 'subiendo {name}…',
    uploaded: '{name} enviado'
  },
  ja: {
    newFolder: '新しいフォルダ',
    newFolderMsg: '{dir} のフォルダ名',
    newFile: '新しいファイル',
    newFileMsg: '{dir} のファイル名',
    rename: '名前を変更',
    renameMsg: '{name} の新しい名前',
    deleteTitle: '削除',
    deleteMsg: '{name} を完全に削除しますか?',
    open: '開く',
    openWith: 'アプリで開く…',
    favorite: '★ お気に入り',
    unfavPlace: '★ お気に入り解除',
    favPlace: '★ フォルダをお気に入りに',
    paste: '貼り付け',
    cut: '切り取り',
    copy: 'コピー',
    download: 'ダウンロード',
    upload: 'ファイルをアップロード…',
    refresh: '更新',
    places: '場所',
    devices: 'デバイス',
    favorites: 'お気に入り',
    noVolumes: 'ボリュームなし',
    noFavorites: 'お気に入りなし — ツールバーの ★ を使用',
    emptyFolder: '空のフォルダ',
    items: '{n} 個のアイテム',
    folders: '{n} 個のフォルダ',
    clip: '{n} 個をコピー中',
    clipCut: ' (切り取り)',
    mounting: '{dev} をマウント中…',
    unmount: '{dev} をアンマウント',
    notMounted: '未マウント',
    editPath: 'パスを編集 (Ctrl+L)',
    favTitle: 'お気に入りの追加/削除',
    viewToggle: 'リスト/アイコン切替',
    showHidden: '隠しファイルを表示',
    selInfo: '{name} — {info}',
    folder: 'フォルダ',
    file: 'ファイル',
    removeFav: 'お気に入りを削除',
    selItem: '項目を選択',
    back: '戻る',
    forward: '進む',
    up: '上へ',
    uploading: '{name} をアップロード中…',
    uploaded: '{name} を送信しました'
  },
  zh: {
    newFolder: '新建文件夹',
    newFolderMsg: '{dir} 中的文件夹名',
    newFile: '新建文件',
    newFileMsg: '{dir} 中的文件名',
    rename: '重命名',
    renameMsg: '{name} 的新名称',
    deleteTitle: '删除',
    deleteMsg: '永久删除 {name}？',
    open: '打开',
    openWith: '打开方式…',
    favorite: '★ 收藏',
    unfavPlace: '★ 移除收藏',
    favPlace: '★ 收藏此文件夹',
    paste: '粘贴',
    cut: '剪切',
    copy: '复制',
    download: '下载',
    upload: '上传文件…',
    refresh: '刷新',
    places: '位置',
    devices: '设备',
    favorites: '收藏',
    noVolumes: '无卷',
    noFavorites: '无收藏 — 使用工具栏 ★',
    emptyFolder: '空文件夹',
    items: '{n} 个项目',
    folders: '{n} 个文件夹',
    clip: '剪贴板中 {n} 项',
    clipCut: ' (剪切)',
    mounting: '正在挂载 {dev}…',
    unmount: '卸载 {dev}',
    notMounted: '未挂载',
    editPath: '编辑路径 (Ctrl+L)',
    favTitle: '添加/移除收藏',
    viewToggle: '切换列表/图标',
    showHidden: '显示隐藏文件',
    selInfo: '{name} — {info}',
    folder: '文件夹',
    file: '文件',
    removeFav: '移除收藏',
    selItem: '请选择项目',
    back: '后退',
    forward: '前进',
    up: '向上',
    uploading: '正在上传 {name}…',
    uploaded: '{name} 已上传'
  }
});
registerDict('disks', {
  en: {
    noDisk: 'no disk found',
    selDisk: 'select a disk',
    selPart: 'select a partition in the list',
    noParts: 'no partitions — create a table (New table) or a partition',
    free: 'unallocated',
    unknown: 'unknown',
    usb: 'USB/removable',
    part: 'Partition',
    fs: 'Filesystem',
    label: 'Label',
    used: 'Used',
    mountedAt: 'Mounted at',
    newPart: 'New partition',
    format: 'Format',
    "delete": 'Delete',
    mount: 'Mount',
    unmount: 'Unmount',
    newTable: 'New table',
    eject: 'Eject',
    refresh: 'Refresh',
    newPartTitle: 'New partition on {dev}',
    formatTitle: 'Format {dev}',
    newTableTitle: 'New partition table on {dev}',
    type: 'Type',
    start: 'Start (%)',
    end: 'End (%)',
    labelOpt: 'Label (optional)',
    confirmTable: 'Create {label} table on {dev}? ALL partitions and data will be lost.',
    confirmFormat: 'Format {dev} as {fs}? All data will be lost.',
    confirmDelete: 'Delete {dev}? Your data will be lost.',
    wipeAll: 'Wipe all',
    mountMsg: 'Mountpoint for {dev} (empty = auto/udisks)',
    disk: 'disk',
    delPart: 'Delete partition',
    diskTag: '{n} disk(s)',
    gpt: 'GPT (recommended)',
    msdos: 'MSDOS/MBR (legacy)'
  },
  pt_BR: {
    noDisk: 'nenhum disco encontrado',
    selDisk: 'selecione um disco',
    selPart: 'selecione uma partição na lista',
    noParts: 'sem partições — crie uma tabela (Nova tabela) ou uma partição',
    free: 'não alocado',
    unknown: 'desconhecido',
    usb: 'USB/removível',
    part: 'Partição',
    fs: 'Sistema de arquivos',
    label: 'Rótulo',
    used: 'Usado',
    mountedAt: 'Montado em',
    newPart: 'Nova partição',
    format: 'Formatar',
    "delete": 'Excluir',
    mount: 'Montar',
    unmount: 'Desmontar',
    newTable: 'Nova tabela',
    eject: 'Ejetar',
    refresh: 'Atualizar',
    newPartTitle: 'Nova partição em {dev}',
    formatTitle: 'Formatar {dev}',
    newTableTitle: 'Nova tabela de partições em {dev}',
    type: 'Tipo',
    start: 'Início (%)',
    end: 'Fim (%)',
    labelOpt: 'Rótulo (opcional)',
    confirmTable: 'Criar tabela {label} em {dev}? TODAS as partições e dados serão perdidos.',
    confirmFormat: 'Formatar {dev} como {fs}? Todos os dados serão perdidos.',
    confirmDelete: 'Excluir {dev}? Seus dados serão perdidos.',
    wipeAll: 'Apagar tudo',
    mountMsg: 'Ponto de montagem para {dev} (vazio = automático/udisks)',
    disk: 'disco',
    delPart: 'Excluir partição',
    diskTag: '{n} disco(s)',
    gpt: 'GPT (recomendado)',
    msdos: 'MSDOS/MBR (legado)'
  },
  pt_PT: {
    noDisk: 'nenhum disco encontrado',
    selDisk: 'selecione um disco',
    selPart: 'selecione uma partição na lista',
    noParts: 'sem partições — crie uma tabela (Nova tabela) ou uma partição',
    free: 'não alocado',
    unknown: 'desconhecido',
    usb: 'USB/amovível',
    part: 'Partição',
    fs: 'Sistema de ficheiros',
    label: 'Etiqueta',
    used: 'Usado',
    mountedAt: 'Montado em',
    newPart: 'Nova partição',
    format: 'Formatar',
    "delete": 'Eliminar',
    mount: 'Montar',
    unmount: 'Desmontar',
    newTable: 'Nova tabela',
    eject: 'Ejetar',
    refresh: 'Atualizar',
    newPartTitle: 'Nova partição em {dev}',
    formatTitle: 'Formatar {dev}',
    newTableTitle: 'Nova tabela de partições em {dev}',
    type: 'Tipo',
    start: 'Início (%)',
    end: 'Fim (%)',
    labelOpt: 'Etiqueta (opcional)',
    confirmTable: 'Criar tabela {label} em {dev}? TODAS as partições e dados serão perdidos.',
    confirmFormat: 'Formatar {dev} como {fs}? Todos os dados serão perdidos.',
    confirmDelete: 'Eliminar {dev}? Os seus dados serão perdidos.',
    wipeAll: 'Apagar tudo',
    mountMsg: 'Ponto de montagem para {dev} (vazio = automático/udisks)',
    disk: 'disco',
    delPart: 'Eliminar partição',
    diskTag: '{n} disco(s)',
    gpt: 'GPT (recomendado)',
    msdos: 'MSDOS/MBR (legado)'
  },
  es: {
    noDisk: 'ningún disco encontrado',
    selDisk: 'seleccione un disco',
    selPart: 'seleccione una partición de la lista',
    noParts: 'sin particiones — cree una tabla (Nueva tabla) o una partición',
    free: 'sin asignar',
    unknown: 'desconocido',
    usb: 'USB/extraíble',
    part: 'Partición',
    fs: 'Sistema de archivos',
    label: 'Etiqueta',
    used: 'Usado',
    mountedAt: 'Montado en',
    newPart: 'Nueva partición',
    format: 'Formatear',
    "delete": 'Eliminar',
    mount: 'Montar',
    unmount: 'Desmontar',
    newTable: 'Nueva tabla',
    eject: 'Expulsar',
    refresh: 'Actualizar',
    newPartTitle: 'Nueva partición en {dev}',
    formatTitle: 'Formatear {dev}',
    newTableTitle: 'Nueva tabla de particiones en {dev}',
    type: 'Tipo',
    start: 'Inicio (%)',
    end: 'Fin (%)',
    labelOpt: 'Etiqueta (opcional)',
    confirmTable: '¿Crear tabla {label} en {dev}? TODAS las particiones y datos se perderán.',
    confirmFormat: '¿Formatear {dev} como {fs}? Todos los datos se perderán.',
    confirmDelete: '¿Eliminar {dev}? Sus datos se perderán.',
    wipeAll: 'Borrar todo',
    mountMsg: 'Punto de montaje para {dev} (vacío = automático/udisks)',
    disk: 'disco',
    delPart: 'Eliminar partición',
    diskTag: '{n} disco(s)',
    gpt: 'GPT (recomendado)',
    msdos: 'MSDOS/MBR (heredado)'
  },
  ja: {
    noDisk: 'ディスクが見つかりません',
    selDisk: 'ディスクを選択',
    selPart: 'リストからパーティションを選択',
    noParts: 'パーティションなし — テーブル (新しいテーブル) またはパーティションを作成',
    free: '未割り当て',
    unknown: '不明',
    usb: 'USB/リムーバブル',
    part: 'パーティション',
    fs: 'ファイルシステム',
    label: 'ラベル',
    used: '使用済み',
    mountedAt: 'マウント先',
    newPart: '新しいパーティション',
    format: 'フォーマット',
    "delete": '削除',
    mount: 'マウント',
    unmount: 'アンマウント',
    newTable: '新しいテーブル',
    eject: '取り出し',
    refresh: '更新',
    newPartTitle: '{dev} に新しいパーティション',
    formatTitle: '{dev} をフォーマット',
    newTableTitle: '{dev} に新しいパーティションテーブル',
    type: 'タイプ',
    start: '開始 (%)',
    end: '終了 (%)',
    labelOpt: 'ラベル (省略可)',
    confirmTable: '{dev} に {label} テーブルを作成しますか？すべてのパーティションとデータが失われます。',
    confirmFormat: '{dev} を {fs} でフォーマットしますか？すべてのデータが失われます。',
    confirmDelete: '{dev} を削除しますか？データが失われます。',
    wipeAll: 'すべて消去',
    mountMsg: '{dev} のマウントポイント (空 = 自動/udisks)',
    disk: 'ディスク',
    delPart: 'パーティションを削除',
    diskTag: '{n} 個のディスク',
    gpt: 'GPT (推奨)',
    msdos: 'MSDOS/MBR (レガシー)'
  },
  zh: {
    noDisk: '未找到磁盘',
    selDisk: '请选择磁盘',
    selPart: '请在列表中选择分区',
    noParts: '无分区 — 请创建分区表（新建分区表）或分区',
    free: '未分配',
    unknown: '未知',
    usb: 'USB/可移动',
    part: '分区',
    fs: '文件系统',
    label: '标签',
    used: '已用',
    mountedAt: '挂载于',
    newPart: '新建分区',
    format: '格式化',
    "delete": '删除',
    mount: '挂载',
    unmount: '卸载',
    newTable: '新建分区表',
    eject: '弹出',
    refresh: '刷新',
    newPartTitle: '在 {dev} 上新建分区',
    formatTitle: '格式化 {dev}',
    newTableTitle: '在 {dev} 上新建分区表',
    type: '类型',
    start: '起始 (%)',
    end: '结束 (%)',
    labelOpt: '标签（可选）',
    confirmTable: '在 {dev} 上创建 {label} 分区表？所有分区和数据将丢失。',
    confirmFormat: '将 {dev} 格式化为 {fs}？所有数据将丢失。',
    confirmDelete: '删除 {dev}？数据将丢失。',
    wipeAll: '全部擦除',
    mountMsg: '{dev} 的挂载点（空 = 自动/udisks）',
    disk: '磁盘',
    delPart: '删除分区',
    diskTag: '{n} 个磁盘',
    gpt: 'GPT（推荐）',
    msdos: 'MSDOS/MBR（旧式）'
  }
});
registerDict('update', {
  en: {
    idle: 'no update in progress',
    hint: 'Check and install the latest version.',
    btn: 'Update now',
    title: 'Update Malta OS',
    confirm: 'Downloads the latest version and reinstalls preserving settings, ' + 'backup jobs and connections. Services restart at the end.',
    running: 'Updating… services will restart (session may drop).',
    runningSb: 'updating…',
    done: 'Update finished.',
    failed: 'Failed (rc={rc}).',
    doneSb: 'done ✓',
    failedSb: 'failed — see the log',
    restarting: 'Services restarting… waiting for it to come back.',
    avail: 'new version available',
    availTag: '  —  update available ⬆',
    ready: 'ready',
    started: 'update started from {src}'
  },
  pt_BR: {
    idle: 'sem atualização em andamento',
    hint: 'Verifique e instale a versão mais recente.',
    btn: 'Atualizar agora',
    title: 'Atualizar Malta OS',
    confirm: 'Baixa a versão mais recente e reinstala preservando configurações, ' + 'jobs de backup e conexões. Os serviços reiniciam no final.',
    running: 'Atualizando… os serviços vão reiniciar (a sessão pode cair).',
    runningSb: 'atualizando…',
    done: 'Atualização concluída.',
    failed: 'Falhou (rc={rc}).',
    doneSb: 'concluído ✓',
    failedSb: 'falhou — veja o log',
    restarting: 'Serviços reiniciando… aguardando retorno.',
    avail: 'nova versão disponível',
    availTag: '  —  atualização disponível ⬆',
    ready: 'pronto',
    started: 'update iniciado em {src}'
  },
  pt_PT: {
    idle: 'sem atualização em curso',
    hint: 'Verifique e instale a versão mais recente.',
    btn: 'Atualizar agora',
    title: 'Atualizar Malta OS',
    confirm: 'Transfere a versão mais recente e reinstala preservando configurações, ' + 'tarefas de backup e ligações. Os serviços reiniciam no final.',
    running: 'A atualizar… os serviços vão reiniciar (a sessão pode cair).',
    runningSb: 'a atualizar…',
    done: 'Atualização concluída.',
    failed: 'Falhou (rc={rc}).',
    doneSb: 'concluído ✓',
    failedSb: 'falhou — veja o registo',
    restarting: 'Serviços a reiniciar… a aguardar retorno.',
    avail: 'nova versão disponível',
    availTag: '  —  atualização disponível ⬆',
    ready: 'pronto',
    started: 'atualização iniciada em {src}'
  },
  es: {
    idle: 'sin actualización en curso',
    hint: 'Compruebe e instale la última versión.',
    btn: 'Actualizar ahora',
    title: 'Actualizar Malta OS',
    confirm: 'Descarga la última versión y reinstala preservando configuración, ' + 'tareas de copia y conexiones. Los servicios reinician al final.',
    running: 'Actualizando… los servicios reiniciarán (la sesión puede caer).',
    runningSb: 'actualizando…',
    done: 'Actualización completada.',
    failed: 'Falló (rc={rc}).',
    doneSb: 'completado ✓',
    failedSb: 'falló — vea el registro',
    restarting: 'Servicios reiniciando… esperando respuesta.',
    avail: 'nueva versión disponible',
    availTag: '  —  actualización disponible ⬆',
    ready: 'listo',
    started: 'actualización iniciada desde {src}'
  },
  ja: {
    idle: 'アップデートは実行されていません',
    hint: '最新バージョンを確認してインストールします。',
    btn: '今すぐアップデート',
    title: 'Malta OS をアップデート',
    confirm: '最新バージョンをダウンロードし、設定・バックアップジョブ・接続を保持して再インストールします。' + '最後にサービスが再起動します。',
    running: 'アップデート中… サービスが再起動します（セッションが切れる場合があります）。',
    runningSb: 'アップデート中…',
    done: 'アップデートが完了しました。',
    failed: '失敗しました (rc={rc})。',
    doneSb: '完了 ✓',
    failedSb: '失敗 — ログを確認',
    restarting: 'サービス再起動中… 復帰を待っています。',
    avail: '新しいバージョンがあります',
    availTag: '  —  アップデートあり ⬆',
    ready: '準備完了',
    started: '{src} からアップデートを開始'
  },
  zh: {
    idle: '当前没有更新进行中',
    hint: '检查并安装最新版本。',
    btn: '立即更新',
    title: '更新 Malta OS',
    confirm: '下载最新版本并重新安装，保留设置、备份任务和连接。服务将在最后重启。',
    running: '正在更新… 服务将重启（会话可能中断）。',
    runningSb: '更新中…',
    done: '更新完成。',
    failed: '失败 (rc={rc})。',
    doneSb: '完成 ✓',
    failedSb: '失败 — 查看日志',
    restarting: '服务重启中… 等待恢复。',
    avail: '有新版本可用',
    availTag: '  —  有可用更新 ⬆',
    ready: '就绪',
    started: '已从 {src} 开始更新'
  }
});
registerDict('backup', {
  en: {
    rcloneMissing: 'rclone not installed — install the rclone package',
    connected: 'connected',
    usedOf: ' — used {used} of {total}',
    disconnectTitle: 'Disconnect',
    disconnectMsg: 'Remove the Google Drive connection?',
    notConnected: 'not connected — authorize access to your Google account',
    connectDrive: 'Connect Google Drive',
    manualToken: 'Paste manual token',
    startingOAuth: 'starting OAuth…',
    step1: '1. Open the link and authorize access:',
    step2: '2. The browser will fail at http://127.0.0.1:53682/... — ' + 'copy the full address-bar URL and paste below:',
    finish: 'Finish',
    cancel: 'Cancel',
    connectedMsg: 'connected!',
    manualStep: 'Alternative: run `rclone authorize "drive"` on any machine ' + 'with a browser and paste the generated JSON:',
    saveToken: 'Save token',
    noSubdirs: '(no subfolders)',
    errPrefix: 'error: ',
    pickLocal: 'Select local folder',
    pickRemote: 'Select Google Drive folder',
    selThis: 'Select this folder',
    syncDone: 'sync done',
    syncFinished: 'sync finished',
    syncStarted: 'sync started',
    syncAll: 'Sync all',
    localPh: 'local folder (e.g. /home/user/photos)',
    remotePh: 'Drive folder (e.g. backup/photos)',
    noJobs: 'no folders configured — add below',
    hLocal: 'local',
    hRemote: '→ drive',
    hStatus: 'status',
    hLast: 'last sync',
    pending: 'pending',
    disabled: 'disabled',
    syncedFolders: 'Synced folders',
    hint: 'Select the folders — the system syncs with Google Drive'
  },
  pt_BR: {
    rcloneMissing: 'rclone não instalado — instale o pacote rclone',
    connected: 'conectado',
    usedOf: ' — usado {used} de {total}',
    disconnectTitle: 'Disconnect',
    disconnectMsg: 'Remover a conexão com o Google Drive?',
    notConnected: 'não conectado — autorize o acesso à sua conta Google',
    connectDrive: 'Conectar Google Drive',
    manualToken: 'Colar token manual',
    startingOAuth: 'iniciando OAuth…',
    step1: '1. Abra o link e autorize o acesso:',
    step2: '2. O navegador vai falhar em http://127.0.0.1:53682/... — ' + 'copie a URL completa da barra de endereços e cole abaixo:',
    finish: 'Concluir',
    cancel: 'Cancelar',
    connectedMsg: 'conectado!',
    manualStep: 'Alternativa: rode `rclone authorize "drive"` em qualquer máquina com ' + 'navegador e cole o JSON gerado:',
    saveToken: 'Salvar token',
    noSubdirs: '(sem subpastas)',
    errPrefix: 'erro: ',
    pickLocal: 'Selecionar pasta local',
    pickRemote: 'Selecionar pasta no Google Drive',
    selThis: 'Selecionar esta pasta',
    syncDone: 'sync concluído',
    syncFinished: 'sync finalizado',
    syncStarted: 'sync iniciado',
    syncAll: 'Sync tudo',
    localPh: 'pasta local (ex: /home/usuario/fotos)',
    remotePh: 'pasta no Drive (ex: backup/fotos)',
    noJobs: 'nenhuma pasta configurada — adicione abaixo',
    hLocal: 'local',
    hRemote: '→ drive',
    hStatus: 'status',
    hLast: 'último sync',
    pending: 'pendente',
    disabled: 'desativado',
    syncedFolders: 'Pastas sincronizadas',
    hint: 'Selecione as pastas — o sistema sincroniza com o Google Drive'
  },
  pt_PT: {
    rcloneMissing: 'rclone não instalado — instale o pacote rclone',
    connected: 'ligado',
    usedOf: ' — {used} de {total} utilizados',
    disconnectTitle: 'Desligar',
    disconnectMsg: 'Remover a ligação ao Google Drive?',
    notConnected: 'não ligado — autorize o acesso à sua conta Google',
    connectDrive: 'Ligar Google Drive',
    manualToken: 'Colar token manual',
    startingOAuth: 'a iniciar OAuth…',
    step1: '1. Abra o link e autorize o acesso:',
    step2: '2. O navegador vai falhar em http://127.0.0.1:53682/... — ' + 'copie o URL completo da barra de endereços e cole abaixo:',
    finish: 'Concluir',
    cancel: 'Cancelar',
    connectedMsg: 'ligado!',
    manualStep: 'Alternativa: execute `rclone authorize "drive"` em qualquer máquina com ' + 'navegador e cole o JSON gerado:',
    saveToken: 'Guardar token',
    noSubdirs: '(sem subpastas)',
    errPrefix: 'erro: ',
    pickLocal: 'Selecionar pasta local',
    pickRemote: 'Selecionar pasta no Google Drive',
    selThis: 'Selecionar esta pasta',
    syncDone: 'sincronização concluída',
    syncFinished: 'sincronização finalizada',
    syncStarted: 'sincronização iniciada',
    syncAll: 'Sincronizar tudo',
    localPh: 'pasta local (ex: /home/utilizador/fotos)',
    remotePh: 'pasta no Drive (ex: backup/fotos)',
    noJobs: 'nenhuma pasta configurada — adicione abaixo',
    hLocal: 'local',
    hRemote: '→ drive',
    hStatus: 'estado',
    hLast: 'última sincronização',
    pending: 'pendente',
    disabled: 'desativado',
    syncedFolders: 'Pastas sincronizadas',
    hint: 'Selecione as pastas — o sistema sincroniza com o Google Drive'
  },
  es: {
    rcloneMissing: 'rclone no instalado — instale el paquete rclone',
    connected: 'conectado',
    usedOf: ' — usado {used} de {total}',
    disconnectTitle: 'Desconectar',
    disconnectMsg: '¿Quitar la conexión con Google Drive?',
    notConnected: 'no conectado — autorice el acceso a su cuenta de Google',
    connectDrive: 'Conectar Google Drive',
    manualToken: 'Pegar token manual',
    startingOAuth: 'iniciando OAuth…',
    step1: '1. Abra el enlace y autorice el acceso:',
    step2: '2. El navegador fallará en http://127.0.0.1:53682/... — ' + 'copie la URL completa de la barra de direcciones y péguela abajo:',
    finish: 'Finalizar',
    cancel: 'Cancelar',
    connectedMsg: '¡conectado!',
    manualStep: 'Alternativa: ejecute `rclone authorize "drive"` en cualquier máquina ' + 'con navegador y pegue el JSON generado:',
    saveToken: 'Guardar token',
    noSubdirs: '(sin subcarpetas)',
    errPrefix: 'error: ',
    pickLocal: 'Seleccionar carpeta local',
    pickRemote: 'Seleccionar carpeta de Google Drive',
    selThis: 'Seleccionar esta carpeta',
    syncDone: 'sincronización completada',
    syncFinished: 'sincronización finalizada',
    syncStarted: 'sincronización iniciada',
    syncAll: 'Sincronizar todo',
    localPh: 'carpeta local (ej: /home/usuario/fotos)',
    remotePh: 'carpeta en Drive (ej: backup/fotos)',
    noJobs: 'ninguna carpeta configurada — añada abajo',
    hLocal: 'local',
    hRemote: '→ drive',
    hStatus: 'estado',
    hLast: 'última sync',
    pending: 'pendiente',
    disabled: 'desactivado',
    syncedFolders: 'Carpetas sincronizadas',
    hint: 'Seleccione las carpetas — el sistema sincroniza con Google Drive'
  },
  ja: {
    rcloneMissing: 'rclone が未インストール — rclone パッケージをインストールしてください',
    connected: '接続済み',
    usedOf: ' — {total} 中 {used} 使用',
    disconnectTitle: '切断',
    disconnectMsg: 'Google Drive との接続を解除しますか?',
    notConnected: '未接続 — Google アカウントへのアクセスを承認してください',
    connectDrive: 'Google Drive に接続',
    manualToken: '手動トークンを貼り付け',
    startingOAuth: 'OAuth を開始中…',
    step1: '1. リンクを開いてアクセスを承認:',
    step2: '2. ブラウザは http://127.0.0.1:53682/... で失敗します — ' + 'アドレスバーの URL をすべてコピーして下に貼り付け:',
    finish: '完了',
    cancel: 'キャンセル',
    connectedMsg: '接続しました!',
    manualStep: '代替方法: ブラウザのある任意のマシンで `rclone authorize "drive"` を実行し、' + '生成された JSON を貼り付け:',
    saveToken: 'トークンを保存',
    noSubdirs: '(サブフォルダなし)',
    errPrefix: 'エラー: ',
    pickLocal: 'ローカルフォルダを選択',
    pickRemote: 'Google Drive フォルダを選択',
    selThis: 'このフォルダを選択',
    syncDone: '同期完了',
    syncFinished: '同期終了',
    syncStarted: '同期開始',
    syncAll: 'すべて同期',
    localPh: 'ローカルフォルダ (例: /home/user/photos)',
    remotePh: 'Drive フォルダ (例: backup/photos)',
    noJobs: 'フォルダ未設定 — 下から追加',
    hLocal: 'ローカル',
    hRemote: '→ drive',
    hStatus: '状態',
    hLast: '最終同期',
    pending: '保留中',
    disabled: '無効',
    syncedFolders: '同期フォルダ',
    hint: 'フォルダを選択 — システムが Google Drive と同期します'
  },
  zh: {
    rcloneMissing: '未安装 rclone — 请安装 rclone 软件包',
    connected: '已连接',
    usedOf: ' — 已用 {used} / {total}',
    disconnectTitle: '断开连接',
    disconnectMsg: '移除 Google Drive 连接？',
    notConnected: '未连接 — 请授权访问您的 Google 帐户',
    connectDrive: '连接 Google Drive',
    manualToken: '粘贴手动令牌',
    startingOAuth: '正在启动 OAuth…',
    step1: '1. 打开链接并授权访问：',
    step2: '2. 浏览器会在 http://127.0.0.1:53682/... 失败 — ' + '请复制地址栏完整 URL 并粘贴到下方：',
    finish: '完成',
    cancel: '取消',
    connectedMsg: '已连接！',
    manualStep: '替代方法：在任意有浏览器的机器上运行 `rclone authorize "drive"`，' + '然后粘贴生成的 JSON：',
    saveToken: '保存令牌',
    noSubdirs: '（无子文件夹）',
    errPrefix: '错误：',
    pickLocal: '选择本地文件夹',
    pickRemote: '选择 Google Drive 文件夹',
    selThis: '选择此文件夹',
    syncDone: '同步完成',
    syncFinished: '同步已结束',
    syncStarted: '同步已开始',
    syncAll: '全部同步',
    localPh: '本地文件夹（例：/home/user/photos）',
    remotePh: 'Drive 文件夹（例：backup/photos）',
    noJobs: '未配置文件夹 — 请在下方添加',
    hLocal: '本地',
    hRemote: '→ drive',
    hStatus: '状态',
    hLast: '上次同步',
    pending: '待处理',
    disabled: '已禁用',
    syncedFolders: '同步文件夹',
    hint: '选择文件夹 — 系统将与 Google Drive 同步'
  }
});
registerDict('remote', {
  en: {
    aliasPh: 'alias',
    secretPh: 'password or key path',
    dirPh: 'initial dir (optional)',
    savedConn: '— saved connection —',
    emptyDir: 'empty directory',
    connectFirst: 'connect to a server first',
    downloading: 'downloading {name}…',
    savedTo: 'saved to {path}',
    itemsIn: '{n} items in {dir}',
    listing: 'listing {dir}…',
    newDir: 'New dir',
    newDirMsg: 'Directory name:',
    localPathMsg: 'Local path (on this server):',
    sending: 'sending…',
    uploadOk: 'upload ok',
    destLocal: 'Local destination:',
    newNameMsg: 'New name:',
    deleteTitle: 'Delete',
    deleteMsg: 'Remove {path}?',
    cmdPh: 'remote command… (e.g. systemctl status nginx)',
    running: 'running…',
    gitNoCred: 'no credential (public https/agent key)',
    repoUrlPh: 'repo url (git@host:repo.git / https://…/repo.git)',
    localDirPh: 'local directory',
    selConn: 'select a connection',
    fillAliasHost: 'fill in alias + host',
    connSaved: "connection '{name}' saved",
    delConnMsg: "Remove connection '{name}'?",
    connectedTo: 'connected: {name}'
  },
  pt_BR: {
    aliasPh: 'alias',
    secretPh: 'senha ou caminho da chave',
    dirPh: 'diretório inicial (opcional)',
    savedConn: '— conexão salva —',
    emptyDir: 'diretório vazio',
    connectFirst: 'conecte-se a um servidor',
    downloading: 'baixando {name}…',
    savedTo: 'salvo em {path}',
    itemsIn: '{n} itens em {dir}',
    listing: 'listando {dir}…',
    newDir: 'Nova pasta',
    newDirMsg: 'Nome do diretório:',
    localPathMsg: 'Caminho local (neste servidor):',
    sending: 'enviando…',
    uploadOk: 'upload ok',
    destLocal: 'Destino local:',
    newNameMsg: 'Novo nome:',
    deleteTitle: 'Excluir',
    deleteMsg: 'Remover {path}?',
    cmdPh: 'comando remoto… (ex: systemctl status nginx)',
    running: 'executando…',
    gitNoCred: 'sem credencial (https público/chave do agente)',
    repoUrlPh: 'url do repo (git@host:repo.git / https://…/repo.git)',
    localDirPh: 'diretório local',
    selConn: 'selecione uma conexão',
    fillAliasHost: 'preencha alias + host',
    connSaved: "conexão '{name}' salva",
    delConnMsg: "Remover conexão '{name}'?",
    connectedTo: 'conectado: {name}'
  },
  pt_PT: {
    aliasPh: 'alias',
    secretPh: 'palavra-passe ou caminho da chave',
    dirPh: 'diretório inicial (opcional)',
    savedConn: '— ligação guardada —',
    emptyDir: 'diretório vazio',
    connectFirst: 'ligue-se a um servidor',
    downloading: 'a descarregar {name}…',
    savedTo: 'guardado em {path}',
    itemsIn: '{n} itens em {dir}',
    listing: 'a listar {dir}…',
    newDir: 'Nova pasta',
    newDirMsg: 'Nome do diretório:',
    localPathMsg: 'Caminho local (neste servidor):',
    sending: 'a enviar…',
    uploadOk: 'upload ok',
    destLocal: 'Destino local:',
    newNameMsg: 'Novo nome:',
    deleteTitle: 'Eliminar',
    deleteMsg: 'Remover {path}?',
    cmdPh: 'comando remoto… (ex: systemctl status nginx)',
    running: 'a executar…',
    gitNoCred: 'sem credencial (https público/chave do agente)',
    repoUrlPh: 'url do repo (git@host:repo.git / https://…/repo.git)',
    localDirPh: 'diretório local',
    selConn: 'selecione uma ligação',
    fillAliasHost: 'preencha alias + host',
    connSaved: "ligação '{name}' guardada",
    delConnMsg: "Remover ligação '{name}'?",
    connectedTo: 'ligado: {name}'
  },
  es: {
    aliasPh: 'alias',
    secretPh: 'contraseña o ruta de la clave',
    dirPh: 'directorio inicial (opcional)',
    savedConn: '— conexión guardada —',
    emptyDir: 'directorio vacío',
    connectFirst: 'conéctese a un servidor',
    downloading: 'descargando {name}…',
    savedTo: 'guardado en {path}',
    itemsIn: '{n} elementos en {dir}',
    listing: 'listando {dir}…',
    newDir: 'Nueva carpeta',
    newDirMsg: 'Nombre del directorio:',
    localPathMsg: 'Ruta local (en este servidor):',
    sending: 'enviando…',
    uploadOk: 'subida ok',
    destLocal: 'Destino local:',
    newNameMsg: 'Nuevo nombre:',
    deleteTitle: 'Eliminar',
    deleteMsg: '¿Eliminar {path}?',
    cmdPh: 'comando remoto… (ej: systemctl status nginx)',
    running: 'ejecutando…',
    gitNoCred: 'sin credencial (https público/clave del agente)',
    repoUrlPh: 'url del repo (git@host:repo.git / https://…/repo.git)',
    localDirPh: 'directorio local',
    selConn: 'seleccione una conexión',
    fillAliasHost: 'complete alias + host',
    connSaved: "conexión '{name}' guardada",
    delConnMsg: "¿Eliminar conexión '{name}'?",
    connectedTo: 'conectado: {name}'
  },
  ja: {
    aliasPh: 'エイリアス',
    secretPh: 'パスワードまたは鍵のパス',
    dirPh: '初期ディレクトリ (省略可)',
    savedConn: '— 保存済み接続 —',
    emptyDir: '空のディレクトリ',
    connectFirst: '先にサーバーへ接続してください',
    downloading: '{name} をダウンロード中…',
    savedTo: '{path} に保存しました',
    itemsIn: '{dir} に {n} 件',
    listing: '{dir} を一覧中…',
    newDir: '新規ディレクトリ',
    newDirMsg: 'ディレクトリ名:',
    localPathMsg: 'ローカルパス (このサーバー上):',
    sending: '送信中…',
    uploadOk: 'アップロード完了',
    destLocal: 'ローカルの保存先:',
    newNameMsg: '新しい名前:',
    deleteTitle: '削除',
    deleteMsg: '{path} を削除しますか?',
    cmdPh: 'リモートコマンド… (例: systemctl status nginx)',
    running: '実行中…',
    gitNoCred: '認証情報なし (公開https/エージェント鍵)',
    repoUrlPh: 'リポジトリURL (git@host:repo.git / https://…/repo.git)',
    localDirPh: 'ローカルディレクトリ',
    selConn: '接続を選択',
    fillAliasHost: 'エイリアスとホストを入力',
    connSaved: "接続 '{name}' を保存しました",
    delConnMsg: "接続 '{name}' を削除しますか?",
    connectedTo: '接続中: {name}'
  },
  zh: {
    aliasPh: '别名',
    secretPh: '密码或密钥路径',
    dirPh: '初始目录（可选）',
    savedConn: '— 已保存的连接 —',
    emptyDir: '空目录',
    connectFirst: '请先连接服务器',
    downloading: '正在下载 {name}…',
    savedTo: '已保存到 {path}',
    itemsIn: '{dir} 中 {n} 项',
    listing: '正在列出 {dir}…',
    newDir: '新建目录',
    newDirMsg: '目录名：',
    localPathMsg: '本地路径（此服务器上）：',
    sending: '发送中…',
    uploadOk: '上传完成',
    destLocal: '本地目标：',
    newNameMsg: '新名称：',
    deleteTitle: '删除',
    deleteMsg: '删除 {path}？',
    cmdPh: '远程命令…（例：systemctl status nginx）',
    running: '执行中…',
    gitNoCred: '无凭据（公开 https/代理密钥）',
    repoUrlPh: '仓库地址（git@host:repo.git / https://…/repo.git）',
    localDirPh: '本地目录',
    selConn: '请选择连接',
    fillAliasHost: '请填写别名 + 主机',
    connSaved: "连接 '{name}' 已保存",
    delConnMsg: "删除连接 '{name}'？",
    connectedTo: '已连接：{name}'
  }
}); // ---------------------------------------------------------------------------
// WebOSServer — consolidated server administration

registerDict('server', {
  en: {
    firewall: 'Firewall',
    network: 'Network',
    packages: 'Packages',
    webSites: 'Web sites',
    certs: 'Certificates',
    databases: 'Databases',
    shares: 'Shares',
    security: 'Security',
    smart: 'Disk health',
    vpn: 'VPN',
    alerts: 'Alerts',
    notInstalled: 'tool not installed on this system',
    port: 'port',
    fwQuick: 'Quick allow — port:',
    allow: 'Allow',
    fwAdvanced: 'Advanced…',
    action: 'Action',
    direction: 'Direction',
    from: 'From',
    to: 'To',
    comment: 'Comment',
    fwEnable: 'Enable firewall',
    fwDisable: 'Disable firewall',
    fwTo: 'To',
    delRule: 'Delete rule',
    rules: 'rules',
    hostname: 'Hostname',
    setHostname: 'Set hostname…',
    interfaces: 'Interfaces',
    state: 'State',
    gateway: 'Gateway / DNS',
    listening: 'Listening ports',
    filter: 'filter…',
    address: 'Address',
    process: 'Process',
    ports: 'listening ports',
    pkgSearch: 'search or package name…',
    search: 'Search',
    pkgUpdates: 'Updates',
    pkgAdvanced: 'Advanced…',
    pkgInstalled: 'Installed',
    pkgFilter: 'filter',
    pkgInfo: 'Info',
    install: 'Install',
    remove: 'Remove',
    pkgRemove: 'Remove package',
    pkgHint: 'search a package, check updates, or open Advanced for apt ops',
    webQuick: 'New site — domain:',
    create: 'Create',
    webAdvanced: 'Advanced…',
    confName: 'Config name',
    domains: 'Domains',
    type: 'Type',
    staticSite: 'Static files',
    proxyPass: 'Reverse proxy',
    site: 'Site',
    target: 'Target',
    enabled: 'Enabled',
    delSite: 'Delete site',
    certQuick: 'Issue — domain + email:',
    domain: 'Domain',
    email: 'E-mail',
    issue: 'Issue',
    certAdvanced: 'Advanced…',
    extraDomains: 'Extra domains',
    forceHttps: 'Force HTTPS',
    no: 'No',
    yes: 'Yes',
    renewAll: 'Renew all',
    cert: 'Certificate',
    expiry: 'Expiry',
    dbQuick: 'New database:',
    dbName: 'Name',
    dbAdvanced: 'Advanced…',
    engine: 'Engine',
    dbOwner: 'Owner',
    dropDb: 'Drop database',
    shareQuick: 'Share a folder:',
    shareName: 'Name',
    path: 'Path',
    share: 'Share',
    shareAdvanced: 'Advanced…',
    readOnly: 'Read-only',
    guestOk: 'Guest access',
    nfsHosts: 'Allowed hosts',
    smbUsers: 'Valid users',
    smbShares: 'Samba shares',
    nfsExports: 'NFS exports',
    delShare: 'Delete share',
    sshd: 'SSH server',
    fail2ban: 'fail2ban',
    secQuick: 'Jail + IP:',
    ipAddr: 'IP address',
    ban: 'Ban',
    unban: 'Unban',
    jail: 'Jail',
    banned: 'Banned',
    ips: 'IPs',
    device: 'Device',
    model: 'Model',
    health: 'Health',
    temp: 'Temp',
    hours: 'Power-on h',
    iface: 'Interface',
    vpnUp: 'Up',
    vpnDown: 'Down',
    peerAdd: 'Add peer',
    peerAdvanced: 'Advanced…',
    clientConf: 'Client configuration — copy to the device',
    vpnNone: 'no wireguard configs in /etc/wireguard',
    peers: 'Peers',
    pubkey: 'Public key',
    handshake: 'Last handshake',
    peerDel: 'Remove peer',
    alertQuick: 'Alert when',
    alertAdvanced: 'Advanced…',
    metric: 'Metric',
    mountPoint: 'Mount point',
    note: 'Note',
    disk: 'Disk',
    current: 'Current'
  },
  pt_BR: {
    firewall: 'Firewall',
    network: 'Rede',
    packages: 'Pacotes',
    webSites: 'Sites web',
    certs: 'Certificados',
    databases: 'Bancos de dados',
    shares: 'Compartilhamentos',
    security: 'Segurança',
    smart: 'Saúde do disco',
    vpn: 'VPN',
    alerts: 'Alertas',
    notInstalled: 'ferramenta não instalada neste sistema',
    port: 'porta',
    fwQuick: 'Liberação rápida — porta:',
    allow: 'Liberar',
    fwAdvanced: 'Avançado…',
    action: 'Ação',
    direction: 'Direção',
    from: 'De',
    to: 'Para',
    comment: 'Comentário',
    fwEnable: 'Ativar firewall',
    fwDisable: 'Desativar firewall',
    fwTo: 'Para',
    delRule: 'Excluir regra',
    rules: 'regras',
    hostname: 'Hostname',
    setHostname: 'Definir hostname…',
    interfaces: 'Interfaces',
    state: 'Estado',
    gateway: 'Gateway / DNS',
    listening: 'Portas abertas',
    filter: 'filtrar…',
    address: 'Endereço',
    process: 'Processo',
    ports: 'portas escutando',
    pkgSearch: 'buscar ou nome do pacote…',
    search: 'Buscar',
    pkgUpdates: 'Atualizações',
    pkgAdvanced: 'Avançado…',
    pkgInstalled: 'Instalados',
    pkgFilter: 'filtro',
    pkgInfo: 'Info',
    install: 'Instalar',
    remove: 'Remover',
    pkgRemove: 'Remover pacote',
    pkgHint: 'busque um pacote, veja atualizações ou abra Avançado p/ apt',
    webQuick: 'Novo site — domínio:',
    create: 'Criar',
    webAdvanced: 'Avançado…',
    confName: 'Nome da config',
    domains: 'Domínios',
    type: 'Tipo',
    staticSite: 'Arquivos estáticos',
    proxyPass: 'Proxy reverso',
    site: 'Site',
    target: 'Destino',
    enabled: 'Ativo',
    delSite: 'Excluir site',
    certQuick: 'Emitir — domínio + e-mail:',
    domain: 'Domínio',
    email: 'E-mail',
    issue: 'Emitir',
    certAdvanced: 'Avançado…',
    extraDomains: 'Domínios extras',
    forceHttps: 'Forçar HTTPS',
    no: 'Não',
    yes: 'Sim',
    renewAll: 'Renovar tudo',
    cert: 'Certificado',
    expiry: 'Validade',
    dbQuick: 'Novo banco:',
    dbName: 'Nome',
    dbAdvanced: 'Avançado…',
    engine: 'Motor',
    dbOwner: 'Dono',
    dropDb: 'Apagar banco',
    shareQuick: 'Compartilhar pasta:',
    shareName: 'Nome',
    path: 'Caminho',
    share: 'Compartilhar',
    shareAdvanced: 'Avançado…',
    readOnly: 'Somente leitura',
    guestOk: 'Acesso convidado',
    nfsHosts: 'Hosts permitidos',
    smbUsers: 'Usuários válidos',
    smbShares: 'Compartilhamentos Samba',
    nfsExports: 'Exports NFS',
    delShare: 'Excluir compartilhamento',
    sshd: 'Servidor SSH',
    fail2ban: 'fail2ban',
    secQuick: 'Jail + IP:',
    ipAddr: 'Endereço IP',
    ban: 'Banir',
    unban: 'Desbanir',
    jail: 'Jail',
    banned: 'Banidos',
    ips: 'IPs',
    device: 'Dispositivo',
    model: 'Modelo',
    health: 'Saúde',
    temp: 'Temp',
    hours: 'Horas ligado',
    iface: 'Interface',
    vpnUp: 'Subir',
    vpnDown: 'Descer',
    peerAdd: 'Novo peer',
    peerAdvanced: 'Avançado…',
    clientConf: 'Config do cliente — copie para o dispositivo',
    vpnNone: 'sem configs wireguard em /etc/wireguard',
    peers: 'Peers',
    pubkey: 'Chave pública',
    handshake: 'Último handshake',
    peerDel: 'Remover peer',
    alertQuick: 'Alertar quando',
    alertAdvanced: 'Avançado…',
    metric: 'Métrica',
    mountPoint: 'Ponto de montagem',
    note: 'Nota',
    disk: 'Disco',
    current: 'Atual'
  },
  pt_PT: {
    firewall: 'Firewall',
    network: 'Rede',
    packages: 'Pacotes',
    webSites: 'Sites web',
    certs: 'Certificados',
    databases: 'Bases de dados',
    shares: 'Partilhas',
    security: 'Segurança',
    smart: 'Saúde do disco',
    vpn: 'VPN',
    alerts: 'Alertas',
    notInstalled: 'ferramenta não instalada neste sistema',
    port: 'porta',
    fwQuick: 'Abertura rápida — porta:',
    allow: 'Permitir',
    fwAdvanced: 'Avançado…',
    action: 'Ação',
    direction: 'Direção',
    from: 'De',
    to: 'Para',
    comment: 'Comentário',
    fwEnable: 'Ativar firewall',
    fwDisable: 'Desativar firewall',
    fwTo: 'Para',
    delRule: 'Eliminar regra',
    rules: 'regras',
    hostname: 'Hostname',
    setHostname: 'Definir hostname…',
    interfaces: 'Interfaces',
    state: 'Estado',
    gateway: 'Gateway / DNS',
    listening: 'Portas abertas',
    filter: 'filtrar…',
    address: 'Endereço',
    process: 'Processo',
    ports: 'portas à escuta',
    pkgSearch: 'procurar ou nome do pacote…',
    search: 'Procurar',
    pkgUpdates: 'Atualizações',
    pkgAdvanced: 'Avançado…',
    pkgInstalled: 'Instalados',
    pkgFilter: 'filtro',
    pkgInfo: 'Info',
    install: 'Instalar',
    remove: 'Remover',
    pkgRemove: 'Remover pacote',
    pkgHint: 'procure um pacote, veja atualizações ou abra Avançado p/ apt',
    webQuick: 'Novo site — domínio:',
    create: 'Criar',
    webAdvanced: 'Avançado…',
    confName: 'Nome da config',
    domains: 'Domínios',
    type: 'Tipo',
    staticSite: 'Ficheiros estáticos',
    proxyPass: 'Proxy reverso',
    site: 'Site',
    target: 'Destino',
    enabled: 'Ativo',
    delSite: 'Eliminar site',
    certQuick: 'Emitir — domínio + e-mail:',
    domain: 'Domínio',
    email: 'E-mail',
    issue: 'Emitir',
    certAdvanced: 'Avançado…',
    extraDomains: 'Domínios extra',
    forceHttps: 'Forçar HTTPS',
    no: 'Não',
    yes: 'Sim',
    renewAll: 'Renovar tudo',
    cert: 'Certificado',
    expiry: 'Validade',
    dbQuick: 'Nova base de dados:',
    dbName: 'Nome',
    dbAdvanced: 'Avançado…',
    engine: 'Motor',
    dbOwner: 'Dono',
    dropDb: 'Eliminar base de dados',
    shareQuick: 'Partilhar pasta:',
    shareName: 'Nome',
    path: 'Caminho',
    share: 'Partilhar',
    shareAdvanced: 'Avançado…',
    readOnly: 'Só leitura',
    guestOk: 'Acesso convidado',
    nfsHosts: 'Hosts permitidos',
    smbUsers: 'Utilizadores válidos',
    smbShares: 'Partilhas Samba',
    nfsExports: 'Exports NFS',
    delShare: 'Eliminar partilha',
    sshd: 'Servidor SSH',
    fail2ban: 'fail2ban',
    secQuick: 'Jail + IP:',
    ipAddr: 'Endereço IP',
    ban: 'Banir',
    unban: 'Desbanir',
    jail: 'Jail',
    banned: 'Banidos',
    ips: 'IPs',
    device: 'Dispositivo',
    model: 'Modelo',
    health: 'Saúde',
    temp: 'Temp',
    hours: 'Horas ligado',
    iface: 'Interface',
    vpnUp: 'Ativar',
    vpnDown: 'Desativar',
    peerAdd: 'Novo peer',
    peerAdvanced: 'Avançado…',
    clientConf: 'Config do cliente — copie para o dispositivo',
    vpnNone: 'sem configs wireguard em /etc/wireguard',
    peers: 'Peers',
    pubkey: 'Chave pública',
    handshake: 'Último handshake',
    peerDel: 'Remover peer',
    alertQuick: 'Alertar quando',
    alertAdvanced: 'Avançado…',
    metric: 'Métrica',
    mountPoint: 'Ponto de montagem',
    note: 'Nota',
    disk: 'Disco',
    current: 'Atual'
  },
  es: {
    firewall: 'Firewall',
    network: 'Red',
    packages: 'Paquetes',
    webSites: 'Sitios web',
    certs: 'Certificados',
    databases: 'Bases de datos',
    shares: 'Recursos compartidos',
    security: 'Seguridad',
    smart: 'Salud del disco',
    vpn: 'VPN',
    alerts: 'Alertas',
    notInstalled: 'herramienta no instalada en este sistema',
    port: 'puerto',
    fwQuick: 'Permitir rápido — puerto:',
    allow: 'Permitir',
    fwAdvanced: 'Avanzado…',
    action: 'Acción',
    direction: 'Dirección',
    from: 'Desde',
    to: 'Hacia',
    comment: 'Comentario',
    fwEnable: 'Activar firewall',
    fwDisable: 'Desactivar firewall',
    fwTo: 'Hacia',
    delRule: 'Eliminar regla',
    rules: 'reglas',
    hostname: 'Hostname',
    setHostname: 'Definir hostname…',
    interfaces: 'Interfaces',
    state: 'Estado',
    gateway: 'Gateway / DNS',
    listening: 'Puertos abiertos',
    filter: 'filtrar…',
    address: 'Dirección',
    process: 'Proceso',
    ports: 'puertos escuchando',
    pkgSearch: 'buscar o nombre del paquete…',
    search: 'Buscar',
    pkgUpdates: 'Actualizaciones',
    pkgAdvanced: 'Avanzado…',
    pkgInstalled: 'Instalados',
    pkgFilter: 'filtro',
    pkgInfo: 'Info',
    install: 'Instalar',
    remove: 'Eliminar',
    pkgRemove: 'Eliminar paquete',
    pkgHint: 'busca un paquete, revisa actualizaciones o abre Avanzado p/ apt',
    webQuick: 'Nuevo sitio — dominio:',
    create: 'Crear',
    webAdvanced: 'Avanzado…',
    confName: 'Nombre de config',
    domains: 'Dominios',
    type: 'Tipo',
    staticSite: 'Archivos estáticos',
    proxyPass: 'Proxy inverso',
    site: 'Sitio',
    target: 'Destino',
    enabled: 'Activo',
    delSite: 'Eliminar sitio',
    certQuick: 'Emitir — dominio + e-mail:',
    domain: 'Dominio',
    email: 'E-mail',
    issue: 'Emitir',
    certAdvanced: 'Avanzado…',
    extraDomains: 'Dominios extra',
    forceHttps: 'Forzar HTTPS',
    no: 'No',
    yes: 'Sí',
    renewAll: 'Renovar todo',
    cert: 'Certificado',
    expiry: 'Vencimiento',
    dbQuick: 'Nueva base de datos:',
    dbName: 'Nombre',
    dbAdvanced: 'Avanzado…',
    engine: 'Motor',
    dbOwner: 'Dueño',
    dropDb: 'Eliminar base de datos',
    shareQuick: 'Compartir carpeta:',
    shareName: 'Nombre',
    path: 'Ruta',
    share: 'Compartir',
    shareAdvanced: 'Avanzado…',
    readOnly: 'Solo lectura',
    guestOk: 'Acceso invitado',
    nfsHosts: 'Hosts permitidos',
    smbUsers: 'Usuarios válidos',
    smbShares: 'Recursos Samba',
    nfsExports: 'Exports NFS',
    delShare: 'Eliminar recurso',
    sshd: 'Servidor SSH',
    fail2ban: 'fail2ban',
    secQuick: 'Jail + IP:',
    ipAddr: 'Dirección IP',
    ban: 'Banear',
    unban: 'Desbanear',
    jail: 'Jail',
    banned: 'Baneados',
    ips: 'IPs',
    device: 'Dispositivo',
    model: 'Modelo',
    health: 'Salud',
    temp: 'Temp',
    hours: 'Horas encendido',
    iface: 'Interfaz',
    vpnUp: 'Subir',
    vpnDown: 'Bajar',
    peerAdd: 'Nuevo peer',
    peerAdvanced: 'Avanzado…',
    clientConf: 'Config del cliente — copia al dispositivo',
    vpnNone: 'sin configs wireguard en /etc/wireguard',
    peers: 'Peers',
    pubkey: 'Clave pública',
    handshake: 'Último handshake',
    peerDel: 'Eliminar peer',
    alertQuick: 'Alertar cuando',
    alertAdvanced: 'Avanzado…',
    metric: 'Métrica',
    mountPoint: 'Punto de montaje',
    note: 'Nota',
    disk: 'Disco',
    current: 'Actual'
  },
  ja: {
    firewall: 'ファイアウォール',
    network: 'ネットワーク',
    packages: 'パッケージ',
    webSites: 'Webサイト',
    certs: '証明書',
    databases: 'データベース',
    shares: '共有',
    security: 'セキュリティ',
    smart: 'ディスク健全性',
    vpn: 'VPN',
    alerts: 'アラート',
    notInstalled: 'このシステムにツールがインストールされていません',
    port: 'ポート',
    fwQuick: 'クイック許可 — ポート:',
    allow: '許可',
    fwAdvanced: '詳細…',
    action: 'アクション',
    direction: '方向',
    from: '送信元',
    to: '送信先',
    comment: 'コメント',
    fwEnable: 'ファイアウォール有効化',
    fwDisable: 'ファイアウォール無効化',
    fwTo: '送信先',
    delRule: 'ルールを削除',
    rules: 'ルール',
    hostname: 'ホスト名',
    setHostname: 'ホスト名を設定…',
    interfaces: 'インターフェース',
    state: '状態',
    gateway: 'ゲートウェイ / DNS',
    listening: 'リスニングポート',
    filter: 'フィルタ…',
    address: 'アドレス',
    process: 'プロセス',
    ports: 'リスニングポート',
    pkgSearch: '検索またはパッケージ名…',
    search: '検索',
    pkgUpdates: '更新',
    pkgAdvanced: '詳細…',
    pkgInstalled: 'インストール済み',
    pkgFilter: 'フィルタ',
    pkgInfo: '情報',
    install: 'インストール',
    remove: '削除',
    pkgRemove: 'パッケージを削除',
    pkgHint: 'パッケージを検索・更新確認、または詳細から apt 操作',
    webQuick: '新規サイト — ドメイン:',
    create: '作成',
    webAdvanced: '詳細…',
    confName: '設定名',
    domains: 'ドメイン',
    type: 'タイプ',
    staticSite: '静的ファイル',
    proxyPass: 'リバースプロキシ',
    site: 'サイト',
    target: 'ターゲット',
    enabled: '有効',
    delSite: 'サイトを削除',
    certQuick: '発行 — ドメイン + メール:',
    domain: 'ドメイン',
    email: 'メール',
    issue: '発行',
    certAdvanced: '詳細…',
    extraDomains: '追加ドメイン',
    forceHttps: 'HTTPSを強制',
    no: 'いいえ',
    yes: 'はい',
    renewAll: 'すべて更新',
    cert: '証明書',
    expiry: '有効期限',
    dbQuick: '新規データベース:',
    dbName: '名前',
    dbAdvanced: '詳細…',
    engine: 'エンジン',
    dbOwner: '所有者',
    dropDb: 'データベースを削除',
    shareQuick: 'フォルダを共有:',
    shareName: '名前',
    path: 'パス',
    share: '共有',
    shareAdvanced: '詳細…',
    readOnly: '読み取り専用',
    guestOk: 'ゲストアクセス',
    nfsHosts: '許可ホスト',
    smbUsers: '有効ユーザー',
    smbShares: 'Samba共有',
    nfsExports: 'NFSエクスポート',
    delShare: '共有を削除',
    sshd: 'SSHサーバー',
    fail2ban: 'fail2ban',
    secQuick: 'Jail + IP:',
    ipAddr: 'IPアドレス',
    ban: 'バン',
    unban: 'バン解除',
    jail: 'Jail',
    banned: 'バン済み',
    ips: 'IP',
    device: 'デバイス',
    model: 'モデル',
    health: '健全性',
    temp: '温度',
    hours: '通電時間',
    iface: 'インターフェース',
    vpnUp: '起動',
    vpnDown: '停止',
    peerAdd: 'ピア追加',
    peerAdvanced: '詳細…',
    clientConf: 'クライアント設定 — デバイスにコピー',
    vpnNone: '/etc/wireguard に設定がありません',
    peers: 'ピア',
    pubkey: '公開鍵',
    handshake: '最終ハンドシェイク',
    peerDel: 'ピアを削除',
    alertQuick: 'アラート条件',
    alertAdvanced: '詳細…',
    metric: 'メトリクス',
    mountPoint: 'マウントポイント',
    note: 'メモ',
    disk: 'ディスク',
    current: '現在'
  },
  zh: {
    firewall: '防火墙',
    network: '网络',
    packages: '软件包',
    webSites: '网站',
    certs: '证书',
    databases: '数据库',
    shares: '共享',
    security: '安全',
    smart: '磁盘健康',
    vpn: 'VPN',
    alerts: '告警',
    notInstalled: '此系统未安装该工具',
    port: '端口',
    fwQuick: '快速放行 — 端口:',
    allow: '放行',
    fwAdvanced: '高级…',
    action: '操作',
    direction: '方向',
    from: '来源',
    to: '目标',
    comment: '备注',
    fwEnable: '启用防火墙',
    fwDisable: '禁用防火墙',
    fwTo: '目标',
    delRule: '删除规则',
    rules: '条规则',
    hostname: '主机名',
    setHostname: '设置主机名…',
    interfaces: '接口',
    state: '状态',
    gateway: '网关 / DNS',
    listening: '监听端口',
    filter: '过滤…',
    address: '地址',
    process: '进程',
    ports: '个监听端口',
    pkgSearch: '搜索或包名…',
    search: '搜索',
    pkgUpdates: '更新',
    pkgAdvanced: '高级…',
    pkgInstalled: '已安装',
    pkgFilter: '过滤',
    pkgInfo: '信息',
    install: '安装',
    remove: '移除',
    pkgRemove: '移除软件包',
    pkgHint: '搜索软件包、检查更新，或在“高级”中执行 apt 操作',
    webQuick: '新站点 — 域名:',
    create: '创建',
    webAdvanced: '高级…',
    confName: '配置名',
    domains: '域名',
    type: '类型',
    staticSite: '静态文件',
    proxyPass: '反向代理',
    site: '站点',
    target: '目标',
    enabled: '已启用',
    delSite: '删除站点',
    certQuick: '签发 — 域名 + 邮箱:',
    domain: '域名',
    email: '邮箱',
    issue: '签发',
    certAdvanced: '高级…',
    extraDomains: '附加域名',
    forceHttps: '强制 HTTPS',
    no: '否',
    yes: '是',
    renewAll: '全部续期',
    cert: '证书',
    expiry: '到期',
    dbQuick: '新建数据库:',
    dbName: '名称',
    dbAdvanced: '高级…',
    engine: '引擎',
    dbOwner: '所有者',
    dropDb: '删除数据库',
    shareQuick: '共享文件夹:',
    shareName: '名称',
    path: '路径',
    share: '共享',
    shareAdvanced: '高级…',
    readOnly: '只读',
    guestOk: '访客访问',
    nfsHosts: '允许的主机',
    smbUsers: '有效用户',
    smbShares: 'Samba 共享',
    nfsExports: 'NFS 导出',
    delShare: '删除共享',
    sshd: 'SSH 服务器',
    fail2ban: 'fail2ban',
    secQuick: 'Jail + IP:',
    ipAddr: 'IP 地址',
    ban: '封禁',
    unban: '解封',
    jail: 'Jail',
    banned: '已封禁',
    ips: 'IP',
    device: '设备',
    model: '型号',
    health: '健康',
    temp: '温度',
    hours: '通电小时',
    iface: '接口',
    vpnUp: '启用',
    vpnDown: '停用',
    peerAdd: '添加节点',
    peerAdvanced: '高级…',
    clientConf: '客户端配置 — 复制到设备',
    vpnNone: '/etc/wireguard 中没有配置',
    peers: '节点',
    pubkey: '公钥',
    handshake: '最近握手',
    peerDel: '删除节点',
    alertQuick: '告警条件',
    alertAdvanced: '高级…',
    metric: '指标',
    mountPoint: '挂载点',
    note: '备注',
    disk: '磁盘',
    current: '当前'
  }
});
registerDict('cust', {
  en: {
    customize: 'Customize…',
    manageDock: 'Manage dock…',
    addToDock: 'Add to dock',
    removeDock: 'Remove from dock',
    resetDock: 'Reset to defaults',
    addShortcut: 'Add app shortcut…',
    pickApp: 'Pick an application…',
    shortcutAdded: 'Shortcut created for {name}',
    wmTheme: 'Window theme',
    winBtns: 'Buttons size',
    dockSize: 'Dock size',
    dockPos: 'Dock position',
    magnify: 'Magnify on hover',
    desktopIcons: 'Desktop icons',
    posBottom: 'Bottom',
    posLeft: 'Left',
    posRight: 'Right'
  },
  pt_BR: {
    customize: 'Personalizar…',
    manageDock: 'Gerenciar dock…',
    addToDock: 'Adicionar à dock',
    removeDock: 'Remover da dock',
    resetDock: 'Restaurar padrões',
    addShortcut: 'Criar atalho no desktop…',
    pickApp: 'Escolha um aplicativo…',
    shortcutAdded: 'Atalho criado para {name}',
    wmTheme: 'Tema das janelas',
    winBtns: 'Tamanho dos botões',
    dockSize: 'Tamanho da dock',
    dockPos: 'Posição da dock',
    magnify: 'Ampliar ao passar o mouse',
    desktopIcons: 'Ícones no desktop',
    posBottom: 'Inferior',
    posLeft: 'Esquerda',
    posRight: 'Direita'
  },
  pt_PT: {
    customize: 'Personalizar…',
    manageDock: 'Gerir dock…',
    addToDock: 'Adicionar à dock',
    removeDock: 'Remover da dock',
    resetDock: 'Repor predefinições',
    addShortcut: 'Criar atalho no desktop…',
    pickApp: 'Escolha uma aplicação…',
    shortcutAdded: 'Atalho criado para {name}',
    wmTheme: 'Tema das janelas',
    winBtns: 'Tamanho dos botões',
    dockSize: 'Tamanho da dock',
    dockPos: 'Posição da dock',
    magnify: 'Ampliar ao passar o rato',
    desktopIcons: 'Ícones no desktop',
    posBottom: 'Inferior',
    posLeft: 'Esquerda',
    posRight: 'Direita'
  },
  es: {
    customize: 'Personalizar…',
    manageDock: 'Gestionar dock…',
    addToDock: 'Añadir al dock',
    removeDock: 'Quitar del dock',
    resetDock: 'Restablecer valores',
    addShortcut: 'Crear acceso directo…',
    pickApp: 'Elige una aplicación…',
    shortcutAdded: 'Acceso directo creado para {name}',
    wmTheme: 'Tema de ventanas',
    winBtns: 'Tamaño de botones',
    dockSize: 'Tamaño del dock',
    dockPos: 'Posición del dock',
    magnify: 'Ampliar al pasar el cursor',
    desktopIcons: 'Iconos en el escritorio',
    posBottom: 'Abajo',
    posLeft: 'Izquierda',
    posRight: 'Derecha'
  },
  ja: {
    customize: 'カスタマイズ…',
    manageDock: 'ドックを管理…',
    addToDock: 'ドックに追加',
    removeDock: 'ドックから削除',
    resetDock: '初期設定に戻す',
    addShortcut: 'アプリのショートカットを作成…',
    pickApp: 'アプリケーションを選択…',
    shortcutAdded: '{name} のショートカットを作成しました',
    wmTheme: 'ウィンドウテーマ',
    winBtns: 'ボタンサイズ',
    dockSize: 'ドックのサイズ',
    dockPos: 'ドックの位置',
    magnify: 'ホバー時に拡大',
    desktopIcons: 'デスクトップアイコン',
    posBottom: '下',
    posLeft: '左',
    posRight: '右'
  },
  zh: {
    customize: '自定义…',
    manageDock: '管理坞…',
    addToDock: '添加到坞',
    removeDock: '从坞中移除',
    resetDock: '恢复默认',
    addShortcut: '创建应用快捷方式…',
    pickApp: '选择一个应用…',
    shortcutAdded: '已为 {name} 创建快捷方式',
    wmTheme: '窗口主题',
    winBtns: '按钮大小',
    dockSize: '坞大小',
    dockPos: '坞位置',
    magnify: '悬停时放大',
    desktopIcons: '桌面图标',
    posBottom: '底部',
    posLeft: '左侧',
    posRight: '右侧'
  }
});
registerDict('ntf', {
  en: {
    title: 'Notifications',
    clear: 'All clear — nothing needs attention.',
    clearShort: 'All clear',
    count: '{count} need attention',
    dismiss: 'Dismiss',
    'k.alert': 'Threshold breached',
    'k.updates': 'Updates available',
    'k.unit': 'Service failed',
    'k.log': 'System error',
    'k.backup': 'Backup due',
    alert: '{metric} at {value}% (limit {threshold}%)',
    updates: '{count} package updates can be installed',
    backupLast: 'last run {days}d ago',
    backupNever: 'never ran'
  },
  pt_BR: {
    title: 'Notificações',
    clear: 'Tudo certo — nada precisa de atenção.',
    clearShort: 'Tudo certo',
    count: '{count} precisam de atenção',
    dismiss: 'Dispensar',
    'k.alert': 'Limite excedido',
    'k.updates': 'Atualizações disponíveis',
    'k.unit': 'Serviço falhou',
    'k.log': 'Erro do sistema',
    'k.backup': 'Backup pendente',
    alert: '{metric} em {value}% (limite {threshold}%)',
    updates: '{count} atualizações de pacotes disponíveis',
    backupLast: 'último há {days}d',
    backupNever: 'nunca executado'
  },
  pt_PT: {
    title: 'Notificações',
    clear: 'Tudo bem — nada precisa de atenção.',
    clearShort: 'Tudo bem',
    count: '{count} precisam de atenção',
    dismiss: 'Dispensar',
    'k.alert': 'Limite excedido',
    'k.updates': 'Atualizações disponíveis',
    'k.unit': 'Serviço falhou',
    'k.log': 'Erro do sistema',
    'k.backup': 'Backup pendente',
    alert: '{metric} em {value}% (limite {threshold}%)',
    updates: '{count} atualizações de pacotes disponíveis',
    backupLast: 'último há {days}d',
    backupNever: 'nunca executado'
  },
  es: {
    title: 'Notificaciones',
    clear: 'Todo bien — nada requiere atención.',
    clearShort: 'Todo bien',
    count: '{count} requieren atención',
    dismiss: 'Descartar',
    'k.alert': 'Límite superado',
    'k.updates': 'Actualizaciones disponibles',
    'k.unit': 'Servicio falló',
    'k.log': 'Error del sistema',
    'k.backup': 'Copia de seguridad pendiente',
    alert: '{metric} en {value}% (límite {threshold}%)',
    updates: '{count} actualizaciones de paquetes disponibles',
    backupLast: 'última hace {days}d',
    backupNever: 'nunca ejecutada'
  },
  ja: {
    title: '通知',
    clear: 'すべて正常 — 対応が必要な項目はありません。',
    clearShort: 'すべて正常',
    count: '{count} 件の対応が必要',
    dismiss: '閉じる',
    'k.alert': 'しきい値超過',
    'k.updates': '更新があります',
    'k.unit': 'サービスが失敗',
    'k.log': 'システムエラー',
    'k.backup': 'バックアップ期限',
    alert: '{metric} が {value}% (上限 {threshold}%)',
    updates: '{count} 件のパッケージ更新があります',
    backupLast: '最終実行 {days} 日前',
    backupNever: '未実行'
  },
  zh: {
    title: '通知',
    clear: '一切正常 — 无需处理。',
    clearShort: '一切正常',
    count: '{count} 项需要注意',
    dismiss: '忽略',
    'k.alert': '超过阈值',
    'k.updates': '有可用更新',
    'k.unit': '服务失败',
    'k.log': '系统错误',
    'k.backup': '备份到期',
    alert: '{metric} 达 {value}%（上限 {threshold}%）',
    updates: '有 {count} 个软件包更新可用',
    backupLast: '上次运行于 {days} 天前',
    backupNever: '从未运行'
  }
});

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
/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/defineProperty */ "./node_modules/@babel/runtime/helpers/defineProperty.js");
/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/typeof */ "./node_modules/@babel/runtime/helpers/typeof.js");
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ "./node_modules/@babel/runtime/helpers/slicedToArray.js");
/* harmony import */ var _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _i18n_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./i18n.js */ "./src/packages/_shared/i18n.js");





function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_1___default()(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/*
 * Minimal DOM helpers so apps don't need a framework.
 */
 // translate through the global OSjs api (window.OSjs.make) — available in
// every package bundle without threading `core` through el()

var tGlobal = function tGlobal() {
  try {
    return Object(_i18n_js__WEBPACK_IMPORTED_MODULE_4__["useI18n"])(window.OSjs).t;
  } catch (e) {
    return function (key) {
      return key;
    };
  }
}; // re-translate every element tagged with data-i18n* on locale change —
// this is what makes open windows follow the language live


if (typeof document !== 'undefined' && !document.__webosI18nBound) {
  document.__webosI18nBound = true;
  document.addEventListener('webos:locale', function () {
    var t = tGlobal();
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (n) {
      n.placeholder = t(n.dataset.i18nPh);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (n) {
      n.title = t(n.dataset.i18nTitle);
    });
  });
}

var el = function el(tag) {
  var attrs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var node = document.createElement(tag);
  var t = tGlobal();
  Object.entries(attrs).forEach(function (_ref) {
    var _ref2 = _babel_runtime_helpers_slicedToArray__WEBPACK_IMPORTED_MODULE_3___default()(_ref, 2),
        k = _ref2[0],
        v = _ref2[1];

    if (k === 'style' && _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_2___default()(v) === 'object') {
      Object.assign(node.style, v);
    } else if (k === 'i18n') {
      node.dataset.i18n = v;
      node.textContent = t(v);
    } else if (k === 'i18nPh') {
      node.dataset.i18nPh = v;
      node.placeholder = t(v);
    } else if (k === 'i18nTitle') {
      node.dataset.i18nTitle = v;
      node.title = t(v);
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
}; // label: string, or {i18n: 'ns.key'} for a live-translated caption.
// 3rd/4th arg: a tooltip string, or a known modifier class ('danger',
// 'primary') — callers historically passed 'danger' as the 3rd arg.

var button = function button(label, onclick, title, cls) {
  var i18n = label && label.i18n;

  var isCls = function isCls(v) {
    return v === 'danger' || v === 'primary';
  };

  var b = el('button', _objectSpread({
    "class": 'webos-btn',
    onclick: onclick,
    title: isCls(title) ? undefined : title
  }, i18n ? {
    i18n: i18n
  } : {}), i18n ? '' : label);
  [title, cls].forEach(function (c) {
    return isCls(c) && b.classList.add(c);
  });
  return b;
}; // columns: strings or {i18n: 'ns.key'} — headers also re-translate live

var table = function table(columns, rows, onRow) {
  var thead = el('thead', {}, el.apply(void 0, ['tr', {}].concat(_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_0___default()(columns.map(function (c) {
    return c && c.i18n ? el('th', {
      i18n: c.i18n
    }) : el('th', {}, c);
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

  var _useI18n = Object(_i18n_js__WEBPACK_IMPORTED_MODULE_4__["useI18n"])(proc.core),
      t = _useI18n.t;

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
    }, button(t('cancel'), function () {
      cb = function cb() {};

      win.close();
    }), button(t('ok'), function () {
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

/***/ "./src/packages/webos-files/index.js":
/*!*******************************************!*\
  !*** ./src/packages/webos-files/index.js ***!
  \*******************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var osjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! osjs */ "osjs");
/* harmony import */ var osjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(osjs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _metadata_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./metadata.json */ "./src/packages/webos-files/metadata.json");
var _metadata_json__WEBPACK_IMPORTED_MODULE_1___namespace = /*#__PURE__*/__webpack_require__.t(/*! ./metadata.json */ "./src/packages/webos-files/metadata.json", 1);
/* harmony import */ var _shared_api_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../_shared/api.js */ "./src/packages/_shared/api.js");
/* harmony import */ var _shared_ui_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../_shared/ui.js */ "./src/packages/_shared/ui.js");
/* harmony import */ var _shared_i18n_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../_shared/i18n.js */ "./src/packages/_shared/i18n.js");
/*
 * WebOS Files — Dolphin-like file manager: places sidebar with block
 * devices and favorites, breadcrumb navigation, list/icon views,
 * clipboard and context menu. Uses the OS.js VFS (host:/ = real fs).
 */





Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["css"])('webos-files', `
  .wf-wrap { display: flex; height: 100%; min-height: 0; }
  .wf-side { flex: 0 0 190px; overflow: auto; background: #23262e;
    border-right: 1px solid #17191f; padding: 8px 6px; font-size: 12px; }
  .wf-side h4 { margin: 10px 6px 4px; color: #8a93a8; font-size: 10px;
    text-transform: uppercase; letter-spacing: .06em; }
  .wf-side h4:first-child { margin-top: 2px; }
  .wf-place { display: flex; align-items: center; gap: 7px; padding: 5px 7px;
    border-radius: 4px; cursor: pointer; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; }
  .wf-place:hover { background: #2d3244; }
  .wf-place.active { background: #3a4160; }
  .wf-place .ic { flex: 0 0 16px; text-align: center; }
  .wf-place .nm { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; }
  .wf-place .sub { color: #8a93a8; font-size: 10px; }
  .wf-place .x { color: #8a93a8; padding: 0 2px; visibility: hidden; }
  .wf-place:hover .x { visibility: visible; }
  .wf-place .x:hover { color: #f88; }
  .wf-place.unmounted { opacity: .65; }
  .wf-main { flex: 1 1 auto; display: flex; flex-direction: column; min-width: 0; }
  .wf-crumbs { display: flex; align-items: center; gap: 2px; flex: 1 1 auto;
    min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .wf-crumb { padding: 3px 7px; border-radius: 4px; cursor: pointer;
    white-space: nowrap; }
  .wf-crumb:hover { background: #3a4150; }
  .wf-crumb.cur { background: #3a4160; }
  .wf-crumbsep { color: #5a6275; }
  .wf-pathedit { flex: 1 1 auto; min-width: 80px; }
  .wf-list { flex: 1 1 auto; overflow: auto; }
  .wf-grid { display: grid; grid-template-columns: repeat(auto-fill, 92px);
    gap: 4px; padding: 10px; align-content: start; }
  .wf-cell { display: flex; flex-direction: column; align-items: center;
    gap: 4px; padding: 8px 4px; border-radius: 5px; cursor: default;
    text-align: center; }
  .wf-cell:hover { background: #2d3244; }
  .wf-cell.sel { background: #3a4160; }
  .wf-cell .g { font-size: 34px; }
  .wf-cell .n { font-size: 11px; word-break: break-all; max-height: 30px;
    overflow: hidden; }
  .wf-row td { cursor: default; user-select: none; }
  .wf-th { cursor: pointer; user-select: none; }
  .wf-th:hover { color: #fff; }
  .wf-empty { padding: 40px; text-align: center; color: #8a93a8; }
  .wf-toolbarbtn.on { background: #4a5165; border-color: #6a7288; }
  .wf-star { color: #8a93a8; }
  .wf-star.faved { color: #e0aa3e; }
`);

const tbtn = (label, onclick, title, cls = '') => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('button', {
  class: 'webos-btn wf-toolbarbtn' + cls,
  onclick,
  title
}, label);

const join = (dir, name) => dir.replace(/\/?$/, '/') + name;

const parent = path => {
  const m = path.replace(/\/+$/, '');
  const i = m.lastIndexOf('/');
  return i <= m.indexOf(':') ? m.slice(0, m.indexOf(':') + 1) + '/' : m.slice(0, i);
};

const mountOf = path => path.slice(0, path.indexOf(':') + 1);

const innerOf = path => path.slice(path.indexOf(':') + 1);

const fmtDate = (it, core) => {
  const d = it.stat && (it.stat.mtime || it.stat.ctime);
  if (!d) return '';

  try {
    return new Date(d).toLocaleString(Object(_shared_i18n_js__WEBPACK_IMPORTED_MODULE_4__["intlLocale"])(Object(_shared_i18n_js__WEBPACK_IMPORTED_MODULE_4__["getLocale"])(core)));
  } catch (e) {
    return '';
  }
};

const glyph = it => {
  if (it.isDirectory) return '📁';
  const m = it.mime || '';
  if (m.startsWith('image/')) return '🖼️';
  if (m.startsWith('video/')) return '🎬';
  if (m.startsWith('audio/')) return '🎵';
  if (m === 'application/pdf') return '📕';
  if (/zip|tar|gzip|compress|archive/.test(m)) return '📦';
  return '📄';
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {
    args,
    options,
    metadata
  });
  const vfs = core.make('osjs/vfs');
  const {
    t
  } = Object(_shared_i18n_js__WEBPACK_IMPORTED_MODULE_4__["useI18n"])(core);
  const sb = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["statusbar"])();
  const sideBox = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
    class: 'wf-side'
  });
  const listBox = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
    class: 'wf-list'
  });
  const crumbsBox = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
    class: 'wf-crumbs'
  });
  const pathEdit = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('input', {
    class: 'webos-input wf-pathedit',
    type: 'text'
  });
  const fileInput = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('input', {
    type: 'file',
    multiple: true,
    style: {
      display: 'none'
    }
  });
  let cwd = args.path && (args.path.path || args.path) || 'home:/';
  if (!/^[a-z]+:/.test(cwd)) cwd = 'host:' + cwd;
  let items = [];
  let sel = null;
  let sort = {
    key: 'name',
    dir: 1
  };
  let showHidden = false;
  let view = proc.settings.view || 'list';
  let clipboard = {
    items: [],
    cut: false
  };
  let backStack = [];
  let fwdStack = [];
  let devices = [];
  let crumbsEdit = false;

  const favorites = () => proc.settings.favorites || [];

  const saveFavs = favs => {
    proc.settings.favorites = favs;
    proc.saveSettings();
  }; // ---------- navigation ----------


  const nav = (path, push = true) => {
    if (push && cwd !== path) {
      backStack.push(cwd);
      fwdStack = [];
    }

    cwd = path;
    sel = null;
    load();
  };

  const goBack = () => {
    if (backStack.length) {
      fwdStack.push(cwd);
      nav(backStack.pop(), false);
    }
  };

  const goFwd = () => {
    if (fwdStack.length) {
      backStack.push(cwd);
      nav(fwdStack.pop(), false);
    }
  };

  const load = () => {
    sb.set(t('loading') + ' ' + cwd);
    vfs.readdir(cwd, {
      showHiddenFiles: showHidden
    }).then(list => {
      items = (list || []).filter(i => i.filename !== '.' && i.filename !== '..');
      sortItems();
      renderAll();
      const dirs = items.filter(i => i.isDirectory).length;
      sb.set(t('files.items', {
        n: items.length
      }) + ' · ' + t('files.folders', {
        n: dirs
      }) + ' — ' + cwd);
    }).catch(e => {
      items = [];
      renderAll();
      sb.error(e.message || e);
    });
  };

  const sortItems = () => {
    const k = sort.key;
    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      const va = k === 'size' ? a.size || 0 : k === 'mtime' ? String(a.stat && a.stat.mtime || '') : a.filename.toLowerCase();
      const vb = k === 'size' ? b.size || 0 : k === 'mtime' ? String(b.stat && b.stat.mtime || '') : b.filename.toLowerCase();
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  };

  const sortBy = key => {
    sort = {
      key,
      dir: sort.key === key ? -sort.dir : 1
    };
    sortItems();
    renderList();
  }; // ---------- file ops ----------


  const open = it => {
    if (it.isDirectory) {
      nav(it.path);
      return;
    }

    const mime = it.mime || '';
    const app = /^(image|video)\//.test(mime) ? 'Preview' : 'WebOSEditor';
    core.run(app, {
      file: it
    }).catch(e => sb.error(e.message));
  };

  const doMkdir = () => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["promptText"])(core, t('files.newFolder'), t('files.newFolderMsg', {
    dir: innerOf(cwd)
  })).then(n => n && vfs.mkdir({
    path: join(cwd, n)
  }).then(load).catch(e => sb.error(e.message)));

  const doTouch = () => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["promptText"])(core, t('files.newFile'), t('files.newFileMsg', {
    dir: innerOf(cwd)
  })).then(n => n && vfs.touch({
    path: join(cwd, n)
  }).then(load).catch(e => sb.error(e.message)));

  const doRename = it => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["promptText"])(core, t('files.rename'), t('files.renameMsg', {
    name: it.filename
  }), it.filename).then(n => n && n !== it.filename && vfs.rename(it, {
    path: join(parent(it.path), n)
  }).then(load).catch(e => sb.error(e.message)));

  const doDelete = it => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["confirmDialog"])(core, t('files.deleteTitle'), t('files.deleteMsg', {
    name: it.filename
  })).then(ok => ok && vfs.unlink(it).then(load).catch(e => sb.error(e.message)));

  const doCopy = (it, cut) => {
    clipboard = {
      items: [it],
      cut
    };
    renderStatus();
  };

  const doPaste = () => {
    const {
      items: src,
      cut
    } = clipboard;
    if (!src.length) return;
    Promise.all(src.map(it => {
      const dest = {
        path: join(cwd, it.filename)
      };
      return (cut ? vfs.rename(it, dest) : vfs.copy(it, dest)).catch(e => sb.error(`${it.filename}: ${e.message}`));
    })).then(() => {
      if (cut) clipboard = {
        items: [],
        cut: false
      };
      load();
    });
  };

  const doDownload = it => vfs.download(it).catch(e => sb.error(e.message));

  const openWith = (pos, it) => {
    const run = name => core.run(name, {
      file: it
    }).catch(e => sb.error(e.message));

    const pkgs = core.make('osjs/packages').getCompatiblePackages(it.mime || 'application/octet-stream').filter(m => m.type === 'application' && m.name !== _metadata_json__WEBPACK_IMPORTED_MODULE_1__["name"]);
    const entries = pkgs.map(m => ({
      label: Object(_shared_i18n_js__WEBPACK_IMPORTED_MODULE_4__["metaTitle"])(core, m),
      onclick: () => run(m.name)
    }));

    if (!pkgs.some(m => m.name === 'WebOSEditor')) {
      entries.push({
        label: 'Code Editor',
        onclick: () => run('WebOSEditor')
      });
    } // defer: the click that opened this menu would close a menu shown now


    setTimeout(() => core.make('osjs/contextmenu').show({
      position: pos,
      menu: entries
    }), 0);
  };

  const doUpload = files => {
    [...files].forEach(f => {
      sb.set(t('files.uploading', {
        name: f.name
      }));
      vfs.writefile({
        path: join(cwd, f.name)
      }, f).then(() => {
        sb.set(t('files.uploaded', {
          name: f.name
        }));
        load();
      }).catch(e => sb.error(`${f.name}: ${e.message}`));
    });
  }; // ---------- favorites ----------


  const isFav = p => favorites().some(f => f.path === p);

  const toggleFav = (p, label) => {
    const favs = favorites().filter(f => f.path !== p);

    if (favs.length === favorites().length) {
      favs.push({
        name: label || innerOf(p).replace(/\/+$/, '').split('/').pop() || p,
        path: p
      });
    }

    saveFavs(favs);
    renderSidebar();
    renderFavBtn();
  }; // ---------- context menu ----------


  const menu = (pos, it) => {
    const entries = it ? [{
      label: t('files.open'),
      onclick: () => open(it)
    }, !it.isDirectory ? {
      label: t('files.openWith'),
      onclick: () => openWith(pos, it)
    } : null, it.isDirectory ? {
      label: t('files.favorite'),
      onclick: () => toggleFav(it.path, it.filename)
    } : null, !it.isDirectory ? {
      label: t('files.download'),
      onclick: () => doDownload(it)
    } : null, {
      label: t('files.cut'),
      onclick: () => doCopy(it, true)
    }, {
      label: t('files.copy'),
      onclick: () => doCopy(it, false)
    }, {
      label: t('files.rename') + '…',
      onclick: () => doRename(it)
    }, {
      label: t('del'),
      onclick: () => doDelete(it)
    }] : [{
      label: t('files.newFolder') + '…',
      onclick: doMkdir
    }, {
      label: t('files.newFile') + '…',
      onclick: doTouch
    }, {
      label: t('files.upload'),
      onclick: () => fileInput.click()
    }, {
      label: t('files.paste'),
      disabled: !clipboard.items.length,
      onclick: doPaste
    }, {
      label: isFav(cwd) ? t('files.unfavPlace') : t('files.favPlace'),
      onclick: () => toggleFav(cwd)
    }, {
      label: t('files.refresh'),
      onclick: load
    }];
    core.make('osjs/contextmenu').show({
      position: pos,
      menu: entries.filter(Boolean)
    });
  }; // ---------- rendering ----------


  const place = (icon, name, sub, path, extra = {}) => {
    const node = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
      class: 'wf-place' + (cwd === path ? ' active' : '') + (extra.dim ? ' unmounted' : ''),
      title: sub || path,
      onclick: () => extra.onclick ? extra.onclick() : nav(path)
    }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
      class: 'ic'
    }, icon), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
      class: 'nm'
    }, name), sub ? Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
      class: 'sub'
    }, sub) : null, extra.x ? Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
      class: 'x',
      title: t('files.removeFav'),
      onclick: ev => {
        ev.stopPropagation();
        extra.x();
      }
    }, '✕') : null);

    if (extra.menu) {
      node.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        extra.menu(ev);
      });
    }

    return node;
  };

  const renderSidebar = () => {
    sideBox.innerHTML = '';

    const sec = s => sideBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('h4', {}, s));

    sec(t('files.places'));
    const mounts = core.make('osjs/fs').mountpoints() || [];
    const order = {
      home: 0,
      host: 1
    };
    mounts.filter(m => m.attributes && m.attributes.visibility !== 'hidden').sort((a, b) => (a.name in order ? order[a.name] : 9) - (b.name in order ? order[b.name] : 9)).forEach(m => sideBox.appendChild(place(m.name === 'home' ? '🏠' : m.name === 'host' ? '💻' : '💾', m.label || m.name, '', m.name + ':/')));
    sec(t('files.devices'));

    if (!devices.length) {
      sideBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
        class: 'wf-place'
      }, '  ' + t('files.noVolumes')));
    }

    devices.forEach(p => {
      const mp = (p.mountpoints || []).filter(Boolean)[0];
      const label = p.label || p.name || p.path;
      sideBox.appendChild(place(mp ? '💽' : '⏏', label, `${p.fstype || '?'} · ${Object(_shared_api_js__WEBPACK_IMPORTED_MODULE_2__["formatBytes"])(p.size)}` + (mp ? ' · ' + mp : ' · ' + t('files.notMounted')), mp ? 'host:' + mp : null, {
        dim: !mp,
        onclick: mp ? null : () => {
          sb.set(t('files.mounting', {
            dev: p.path
          }));
          _shared_api_js__WEBPACK_IMPORTED_MODULE_2__["api"].post('disks/mount', {
            device: p.path
          }).then(r => {
            const m = / at (\S+)/.exec(r.output || '');
            loadDevices().then(() => m && nav('host:' + m[1]));
          }).catch(e => sb.error(e.message));
        },
        menu: mp ? ev => core.make('osjs/contextmenu').show({
          position: ev,
          menu: [{
            label: t('files.unmount', {
              dev: p.path
            }),
            onclick: () => _shared_api_js__WEBPACK_IMPORTED_MODULE_2__["api"].post('disks/unmount', {
              device: p.path
            }).then(() => loadDevices()).catch(e => sb.error(e.message))
          }]
        }) : null
      }));
    });
    sec(t('files.favorites'));

    if (!favorites().length) {
      sideBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
        class: 'wf-place',
        title: t('files.favTitle')
      }, '  ' + t('files.noFavorites')));
    }

    favorites().forEach(f => sideBox.appendChild(place('⭐', f.name, f.path, f.path, {
      x: () => toggleFav(f.path),
      menu: ev => core.make('osjs/contextmenu').show({
        position: ev,
        menu: [{
          label: t('files.removeFav'),
          onclick: () => toggleFav(f.path)
        }]
      })
    })));
  };

  const loadDevices = () => _shared_api_js__WEBPACK_IMPORTED_MODULE_2__["api"].get('disks').then(data => {
    const flat = [];

    const walk = n => (n.children || []).forEach(c => {
      flat.push(c);
      walk(c);
    });

    (data.blockdevices || []).forEach(d => walk(d));
    devices = flat.filter(n => n.type === 'part' || n.type === 'rom');
    renderSidebar();
  }).catch(() => {});

  const renderCrumbs = () => {
    crumbsBox.innerHTML = '';

    if (crumbsEdit) {
      pathEdit.value = cwd;
      crumbsBox.appendChild(pathEdit);
      pathEdit.focus();
      pathEdit.select();
      return;
    }

    const mount = mountOf(cwd);
    const mounts = core.make('osjs/fs').mountpoints() || [];
    const mlabel = (mounts.find(m => m.name + ':' === mount.slice(0, -1)) || {}).label || mount;
    crumbsBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
      class: 'wf-crumb',
      onclick: () => nav(mount)
    }, mlabel));
    const parts = innerOf(cwd).split('/').filter(Boolean);
    let acc = mount;
    parts.forEach((p, i) => {
      acc = join(acc, p);
      const target = acc;
      crumbsBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
        class: 'wf-crumbsep'
      }, '›'));
      crumbsBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
        class: 'wf-crumb' + (i === parts.length - 1 ? ' cur' : ''),
        onclick: () => nav(target)
      }, p));
    });
  };

  const nameCell = it => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('td', {
    class: 'wf-row'
  }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
    style: {
      marginRight: '6px'
    }
  }, glyph(it)), it.filename);

  const renderList = () => {
    listBox.innerHTML = '';

    if (!items.length) {
      listBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
        class: 'wf-empty'
      }, t('files.emptyFolder')));
      return;
    }

    if (view === 'grid') {
      const g = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
        class: 'wf-grid'
      });
      items.forEach(it => {
        const c = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
          class: 'wf-cell' + (sel === it ? ' sel' : ''),
          title: `${it.filename}\n${Object(_shared_api_js__WEBPACK_IMPORTED_MODULE_2__["formatBytes"])(it.size)}`,
          onclick: () => {
            sel = it;
            renderList();
            renderStatus();
          },
          ondblclick: () => open(it)
        }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
          class: 'g'
        }, glyph(it)), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('span', {
          class: 'n'
        }, it.filename));
        c.addEventListener('contextmenu', ev => {
          ev.preventDefault();
          sel = it;
          menu(ev, it);
        });
        g.appendChild(c);
      });
      listBox.appendChild(g);
      return;
    }

    const th = (label, key) => Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('th', {
      class: 'wf-th',
      onclick: () => sortBy(key)
    }, label + (sort.key === key ? sort.dir > 0 ? ' ▲' : ' ▼' : ''));

    const head = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('tr', {}, th(t('name'), 'name'), th(t('size'), 'size'), th(t('modified'), 'mtime'), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('th', {}, t('type')));
    const tbody = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('tbody', {}, items.map(it => {
      const tr = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('tr', {
        class: 'wf-row' + (sel === it ? ' selected' : '')
      }, nameCell(it), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('td', {}, it.isDirectory ? '' : Object(_shared_api_js__WEBPACK_IMPORTED_MODULE_2__["formatBytes"])(it.size)), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('td', {}, fmtDate(it, core)), Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('td', {}, it.isDirectory ? t('files.folder') : it.mime || t('files.file')));
      tr.addEventListener('click', () => {
        sel = it;
        renderList();
        renderStatus();
      });
      tr.addEventListener('dblclick', () => open(it));
      tr.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        sel = it;
        menu(ev, it);
      });
      return tr;
    }));
    listBox.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('table', {
      class: 'webos-table'
    }, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('thead', {}, head), tbody));
  };

  const renderStatus = () => {
    const clip = clipboard.items.length ? ' · ' + t('files.clip', {
      n: clipboard.items.length
    }) + (clipboard.cut ? t('files.clipCut') : '') : '';
    sb.set(sel ? t('files.selInfo', {
      name: sel.filename,
      info: sel.isDirectory ? t('files.folder') : Object(_shared_api_js__WEBPACK_IMPORTED_MODULE_2__["formatBytes"])(sel.size) + ' · ' + (sel.mime || '')
    }) + clip : t('files.items', {
      n: items.length
    }) + ' — ' + cwd + clip);
  };

  const favBtn = tbtn('☆', () => toggleFav(cwd), t('files.favTitle'));

  const renderFavBtn = () => {
    favBtn.textContent = isFav(cwd) ? '★' : '☆';
    favBtn.classList.toggle('faved', isFav(cwd));
    favBtn.classList.add('wf-star');
  };

  const viewBtn = tbtn(view === 'grid' ? '☰' : '⊞', () => {
    view = view === 'grid' ? 'list' : 'grid';
    proc.settings.view = view;
    proc.saveSettings();
    viewBtn.textContent = view === 'grid' ? '☰' : '⊞';
    renderList();
  }, t('files.viewToggle'));
  const hiddenBtn = tbtn('.', () => {
    showHidden = !showHidden;
    hiddenBtn.classList.toggle('on', showHidden);
    load();
  }, t('files.showHidden'));
  hiddenBtn.classList.toggle('on', showHidden);

  const renderAll = () => {
    renderCrumbs();
    renderSidebar();
    renderList();
    renderStatus();
    renderFavBtn();
    win && win.setTitle(`${innerOf(cwd) || '/'} — ${Object(_shared_i18n_js__WEBPACK_IMPORTED_MODULE_4__["metaTitle"])(core, metadata)}`);
  }; // ---------- toolbar & window ----------


  pathEdit.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      const v = pathEdit.value.trim();
      crumbsEdit = false;
      nav(/^[a-z]+:/.test(v) ? v : 'host:' + (v.startsWith('/') ? v : '/' + v));
    } else if (ev.key === 'Escape') {
      crumbsEdit = false;
      renderCrumbs();
    }
  });
  pathEdit.addEventListener('blur', () => {
    if (crumbsEdit) {
      crumbsEdit = false;
      renderCrumbs();
    }
  });
  fileInput.addEventListener('change', () => {
    doUpload(fileInput.files);
    fileInput.value = '';
  });
  listBox.addEventListener('contextmenu', ev => {
    if (ev.target === listBox || ev.target.classList.contains('wf-grid') || ev.target.classList.contains('wf-empty')) {
      ev.preventDefault();
      sel = null;
      menu(ev, null);
    }
  });
  const editBtn = tbtn('✎', () => {
    crumbsEdit = true;
    renderCrumbs();
  }, t('files.editPath'));
  const toolbar = Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
    class: 'webos-toolbar'
  }, tbtn('←', goBack, t('files.back')), tbtn('→', goFwd, t('files.forward')), tbtn('↑', () => nav(parent(cwd)), t('files.up')), tbtn('⟳', load, t('files.refresh')), crumbsBox, editBtn, tbtn('📁+', doMkdir, t('files.newFolder')), tbtn('⬆', () => fileInput.click(), t('files.upload')), favBtn, hiddenBtn, viewBtn);
  const win = proc.createWindow({
    id: 'WebOSFilesWindow',
    title: Object(_shared_i18n_js__WEBPACK_IMPORTED_MODULE_4__["metaTitle"])(core, metadata),
    dimension: {
      width: 860,
      height: 520
    }
  });
  win.on('destroy', () => proc.destroy());
  win.on('keydown', (ev, w) => {
    if (ev.target.tagName === 'INPUT') return;

    if (ev.key === 'Backspace') {
      ev.preventDefault();
      nav(parent(cwd));
    } else if (ev.key === 'Delete' && sel) {
      ev.preventDefault();
      doDelete(sel);
    } else if (ev.key === 'F2' && sel) {
      ev.preventDefault();
      doRename(sel);
    } else if (ev.key === 'Enter' && sel) {
      ev.preventDefault();
      open(sel);
    } else if (ev.ctrlKey && ev.key === 'l') {
      ev.preventDefault();
      crumbsEdit = true;
      renderCrumbs();
    } else if (ev.ctrlKey && ev.key === 'c' && sel) {
      doCopy(sel, false);
    } else if (ev.ctrlKey && ev.key === 'x' && sel) {
      doCopy(sel, true);
    } else if (ev.ctrlKey && ev.key === 'v') {
      doPaste();
    } else if (ev.ctrlKey && ev.key === 'h') {
      ev.preventDefault();
      hiddenBtn.click();
    }
  });
  win.render($content => {
    Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["baseStyles"])();
    $content.appendChild(Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
      class: 'webos-root'
    }, toolbar, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
      class: 'wf-wrap'
    }, sideBox, Object(_shared_ui_js__WEBPACK_IMPORTED_MODULE_3__["el"])('div', {
      class: 'wf-main'
    }, listBox)), sb, fileInput));
    loadDevices();
    load();
  });
  return proc;
};

osjs__WEBPACK_IMPORTED_MODULE_0___default.a.register(_metadata_json__WEBPACK_IMPORTED_MODULE_1__["name"], register);

/***/ }),

/***/ "./src/packages/webos-files/metadata.json":
/*!************************************************!*\
  !*** ./src/packages/webos-files/metadata.json ***!
  \************************************************/
/*! exports provided: type, name, category, title, description, files, mimes, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"type\":\"application\",\"name\":\"WebOSFiles\",\"category\":\"utilities\",\"title\":{\"en_EN\":\"Files\",\"pt_BR\":\"Arquivos\",\"pt_PT\":\"Ficheiros\",\"es_ES\":\"Archivos\",\"ja_JP\":\"ファイル\",\"zh_CN\":\"文件\"},\"description\":{\"en_EN\":\"Files\",\"pt_BR\":\"Arquivos\",\"pt_PT\":\"Ficheiros\",\"es_ES\":\"Archivos\",\"ja_JP\":\"ファイル\",\"zh_CN\":\"文件\"},\"files\":[\"main.js\"],\"mimes\":[\"inode/directory\"]}");

/***/ }),

/***/ 0:
/*!*************************************************!*\
  !*** multi ./src/packages/webos-files/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/tiagoiwamoto/shared-drive/workspace/01-development/20-python/linux-webos/web/src/packages/webos-files/index.js */"./src/packages/webos-files/index.js");


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