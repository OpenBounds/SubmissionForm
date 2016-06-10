/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _github = __webpack_require__(1);

	var github = _interopRequireWildcard(_github);

	var _utils = __webpack_require__(3);

	var utils = _interopRequireWildcard(_utils);

	var _dropdown = __webpack_require__(4);

	var _dropdown2 = _interopRequireDefault(_dropdown);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	var BASE_REPO = 'OpenBounds/OpenHuntingData';
	var REPO_NAME = 'OpenHuntingData';
	var TIMEOUT_SECS = 15;

	var params = utils.getParams(),
	    form = window.document.forms['submission'],
	    pr = window.document.getElementById('pr'),
	    alert = window.document.getElementById('alert'),
	    manual = window.document.getElementById('manual');

	/**
	 * Sign in user, when loading the page or after authentication.
	 * 
	 * @param  {object} user Github user object.
	 */
	var signinUser = function signinUser(err, user) {
	    var button = window.document.getElementById('signin'),
	        signout = window.document.getElementById('signout'),
	        blank = window.document.getElementById('unauthenticated');

	    button.setAttribute('href', '#');
	    button.innerHTML = '<img class="avatar" src="' + (user.avatar_url + '&s=40') + '" /> ' + user.login;

	    blank.style.display = 'none';
	    form.style.display = 'block';

	    signout.addEventListener('click', signoutUser);

	    new _dropdown2.default(button);
	};

	var signoutUser = function signoutUser() {
	    github.clearToken();

	    window.location.href = window.location.pathname;
	};

	/*
	 * Handle UI changes for start, done and error submitting events.
	 */
	var startSubmitting = function startSubmitting() {
	    pr.setAttribute('disabled', 'disabled');
	    pr.textContent = 'Submitting...';
	};

	var doneSubmitting = function doneSubmitting() {
	    pr.removeAttribute('disabled');
	    pr.textContent = 'Submit Pull Request';
	};

	var errorSubmitting = function errorSubmitting(msg, content) {
	    alert.innerHTML = msg;
	    manual.getElementsByTagName('textarea')[0].textContent = content;

	    alert.style.display = 'block';
	    manual.style.display = 'block';
	};

	var doneError = function doneError() {
	    alert.innerHTML = '';
	    manual.getElementsByTagName('textarea')[0].textContent = '';

	    alert.style.display = 'none';
	    manual.style.display = 'none';

	    doneSubmitting();
	};

	/**
	 * Create a pull request to add a source file.
	 *
	 * Get the head sha of the master branch. Create a feature branch at that sha
	 * named after the file being submitted. In the branch, create the source file
	 * with Base64 encoded JSON pretty-printed content. Then submit a pull request
	 * of the feature branch to the base repo.
	 * 
	 * @param  {string} username Github user's username.
	 * @param  {string} repo     Repo to create the file in, ie. user/OpenHuntingData
	 * @param  {object} source   Source object.
	 */
	var addSource = function addSource(username, repo, source) {
	    var filename = source.species.join('-').replace(/[\s]/g, '').toLowerCase(),
	        path = 'sources/' + source.country + '/' + source.state + '/' + filename + '.json',
	        branch = 'add-' + source.country + '-' + source.state + '-' + filename,
	        msg = 'add ' + source.country + '/' + source.state + '/' + filename + '.json',
	        errMsg = 'Error submitting pull request. Create the file <strong>' + path + '</strong> with the JSON below.',
	        raw = JSON.stringify(source, null, 3),
	        content = window.btoa(raw);

	    github.getHead(repo, function (err, sha) {
	        if (err) return errorSubmitting(errMsg, raw);

	        github.branchRepo(repo, branch, sha, function (err) {
	            if (err) return errorSubmitting(errMsg, raw);

	            github.createFile(repo, branch, path, content, msg, function (err) {
	                if (err) return errorSubmitting(errMsg, raw);

	                github.pullRequest(BASE_REPO, username + ':' + branch, msg, function (err) {
	                    if (err) return errorSubmitting(errMsg, raw);

	                    doneSubmitting();
	                });
	            });
	        });
	    });
	};

	/*
	 * Submit source form to Github pull request.
	 *
	 * Create a source object from the source form. Get the authenticated user and
	 * username from Github, then check if the user has already forked the repo.
	 *
	 * If the repo is found, add the source to the repo. Otherwise, create a fork
	 * of the repo, and wait until it becomes available (async call). If fork
	 * does not become available within TIMEOUT_SEC, fail.
	 */
	var submit = function submit(e) {
	    var source = void 0,
	        filename = void 0,
	        path = void 0,
	        errMsg = void 0,
	        raw = void 0,
	        datasetSpecificFields = void 0;

	    e.preventDefault();

	    if (!github.getToken()) return;

	    startSubmitting();

	    source = {
	        url: form.url.value,
	        attribution: form.attribution.value,
	        properties: {},
	        filetype: form.filetype.value,
	        name: form.datasetname.value
	    };

	    datasetSpecificFields = getDatasetSpecificFields();
	    for (var property in datasetSpecificFields) {
	        if (datasetSpecificFields.hasOwnProperty(property)) {
	            source[property] = datasetSpecificFields[property];
	        }
	    }

	    var _arr = ['id', 'name'];
	    for (var _i = 0; _i < _arr.length; _i++) {
	        var _property = _arr[_i];
	        source.properties[_property] = form[_property].value;
	    }

	    filename = source.species.join('-').replace(/[\s]/g, '').toLowerCase();
	    path = 'sources/' + source.country + '/' + source.state + '/' + filename + '.json';
	    errMsg = 'Error submitting pull request. Create the file <strong>' + path + '</strong> with the JSON below.';
	    raw = JSON.stringify(source, null, 3);

	    github.getUser(function (err, user) {
	        if (err) return errorSubmitting(errMsg, raw);

	        var username = user.login,
	            repo = username + '/' + REPO_NAME;

	        github.getRepo(repo, function (err, response) {
	            if (err) return errorSubmitting(errMsg, raw);

	            if (response) {
	                addSource(username, repo, source);
	            } else {
	                github.forkRepo(BASE_REPO, function (err) {
	                    if (err) return errorSubmitting(errMsg, raw);

	                    github.getRepo(repo, function (err) {
	                        if (err) return errorSubmitting(errMsg, raw);

	                        var count = 0,
	                            ping = window.setInterval(function () {
	                            github.getHead(repo, function (err, sha) {
	                                if (sha) {
	                                    window.clearInterval(ping);
	                                    addSource(username, repo, source);
	                                } else {
	                                    count += 1;

	                                    if (count > TIMEOUT_SECS * 2) {
	                                        window.clearInterval(ping);

	                                        errorSubmitting(errMsg, raw);
	                                    }
	                                }
	                            });
	                        }, 500);
	                    });
	                });
	            }
	        });
	    });
	};

	/*
	 * Handle user authentication and OAuth response. If the user token is present
	 * when the page loads, retrieve the user object from Github and update the
	 * UI. Otherwise, if the URL parameter `code` is set (a resposne from Github's
	 * OAuth API), exchange it for a token with Gatekeeper.
	 *
	 * Replace the window history state to prevent multiple tokens being created,
	 * then update the UI.
	 */
	if (github.getToken()) {
	    github.getUser(signinUser);
	} else {
	    if (params.code) {
	        github.accessToken(params.code, function () {
	            window.history.replaceState({}, window.document.title, window.location.pathname);
	            github.getUser(signinUser);
	        });
	    }
	}

	/*
	 * Listen for the form submit event, and submit a pull request of the new source.
	 */
	form.addEventListener('submit', submit, false);

	/*
	 * Clear error message when done button is clicked.
	 */
	window.document.getElementById('doneerror').addEventListener('click', doneError, false);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.pullRequest = exports.createFile = exports.branchRepo = exports.forkRepo = exports.getHead = exports.getRepo = exports.getUser = exports.ajax = exports.accessToken = exports.clearToken = exports.getToken = undefined;

	var _nanoajax = __webpack_require__(2);

	var _nanoajax2 = _interopRequireDefault(_nanoajax);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var API_BASE = 'https://api.github.com';

	/*
	 * Github is restrictive on cookie usage on Github Pages. Use localStorage
	 * to store the OAuth token.
	 */
	var token = window.localStorage.getItem('token');

	var getToken = exports.getToken = function getToken() {
	    return token;
	};

	var clearToken = exports.clearToken = function clearToken() {
	    window.localStorage.removeItem('token');
	};

	/**
	 * Get access token from Github OAuth code.
	 * 
	 * @param  {string} code OAuth code from Github API
	 */
	var accessToken = exports.accessToken = function accessToken(code, cb) {
	    _nanoajax2.default.ajax({
	        url: 'http://github-gatekeeper.aws.gaiagps.com/authenticate/' + code
	    }, function (code, response) {
	        token = JSON.parse(response).token;
	        window.localStorage.setItem('token', token);

	        cb(token);
	    });
	};

	/**
	 * AJAX call with Github Authorization header.
	 * 
	 * @param  {object}   options nanoajax options
	 * @param  {function} cb      callback(err, data)
	 */
	var ajax = exports.ajax = function ajax(options, cb) {
	    options.headers = { 'Authorization': 'token ' + token };

	    _nanoajax2.default.ajax(options, function (code, response) {
	        var parsed = void 0;

	        try {
	            parsed = JSON.parse(response);
	        } catch (e) {
	            return cb(e);
	        }

	        return cb(null, parsed);
	    });
	};

	/**
	 * Get user.
	 * 
	 * @param  {function} cb callback(err, data)
	 */
	var getUser = exports.getUser = function getUser(cb) {
	    ajax({ url: API_BASE + '/user' }, cb);
	};

	/**
	 * Get repo if exists.
	 *
	 * @param  {string}   repo repo to check.
	 * @param  {function} cb   callback(err, data)
	 */
	var getRepo = exports.getRepo = function getRepo(repo, cb) {
	    ajax({ url: API_BASE + '/repos/' + repo }, function (err, response) {
	        if (err) return cb(err);

	        if (response.message && response.message === 'Not Found') {
	            return cb(null, null);
	        }

	        cb(null, response);
	    });
	};

	/**
	 * Get latest commit SHA on master branch.
	 * 
	 * @param  {string}   repo repo to get commit from.
	 * @param  {function} cb   callback(err, data)
	 */
	var getHead = exports.getHead = function getHead(repo, cb) {
	    ajax({ url: API_BASE + '/repos/' + repo + '/git/refs/heads/master' }, function (err, response) {
	        if (err) return cb(err);

	        if (response.message && response.message === 'Git Repository is empty.') {
	            return cb(null, null);
	        }

	        cb(null, response.object.sha);
	    });
	};

	/**
	 * Fork repo.
	 *
	 * @param  {string}   repo repo to fork, ie. 'OpenBounds/OpenHuntingData'
	 * @param  {function} cb   callback(err, data)
	 */
	var forkRepo = exports.forkRepo = function forkRepo(repo, cb) {
	    ajax({
	        url: API_BASE + '/repos/' + repo + '/forks',
	        method: 'POST'
	    }, cb);
	};

	/**
	 * Create branch in repo.
	 * 
	 * @param  {string}   repo   repo to create the branch in.
	 * @param  {string}   branch branch name.
	 * @param  {string}   sha    SHA1 to set the branch to.
	 * @param  {function} cb     callback(err, data)
	 */
	var branchRepo = exports.branchRepo = function branchRepo(repo, branch, sha, cb) {
	    ajax({
	        url: API_BASE + '/repos/' + repo + '/git/refs',
	        body: JSON.stringify({
	            ref: 'refs/heads/' + branch,
	            sha: sha
	        })
	    }, cb);
	};

	/**
	 * Create file in repo.
	 * 
	 * @param  {string}   repo    repo to create the file in.
	 * @param  {string}   branch  branch to create the file in.
	 * @param  {string}   path    file path.
	 * @param  {base64}   content base64 encoded file content.
	 * @param  {string}   message commit message.
	 * @param  {function} cb      callback(err, data)
	 */
	var createFile = exports.createFile = function createFile(repo, branch, path, content, message, cb) {
	    ajax({
	        url: API_BASE + '/repos/' + repo + '/contents/' + path,
	        method: 'PUT',
	        body: JSON.stringify({
	            message: message,
	            content: content,
	            branch: branch
	        })
	    }, cb);
	};

	/**
	 * Create a pull request
	 * 
	 * @param  {string}   repo    repo to create the pull request in.
	 * @param  {string}   head    branch to pull request, ie. user:add-source
	 * @param  {string}   message pull request title.
	 * @param  {function} cb      callback(err, data)
	 */
	var pullRequest = exports.pullRequest = function pullRequest(repo, head, message, cb) {
	    ajax({
	        url: API_BASE + '/repos/' + repo + '/pulls',
	        body: JSON.stringify({
	            title: message,
	            head: head,
	            base: 'master'
	        })
	    }, cb);
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {// Best place to find information on XHR features is:
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest

	var reqfields = [
	  'responseType', 'withCredentials', 'timeout', 'onprogress'
	]

	// Simple and small ajax function
	// Takes a parameters object and a callback function
	// Parameters:
	//  - url: string, required
	//  - headers: object of `{header_name: header_value, ...}`
	//  - body:
	//      + string (sets content type to 'application/x-www-form-urlencoded' if not set in headers)
	//      + FormData (doesn't set content type so that browser will set as appropriate)
	//  - method: 'GET', 'POST', etc. Defaults to 'GET' or 'POST' based on body
	//  - cors: If your using cross-origin, you will need this true for IE8-9
	//
	// The following parameters are passed onto the xhr object.
	// IMPORTANT NOTE: The caller is responsible for compatibility checking.
	//  - responseType: string, various compatability, see xhr docs for enum options
	//  - withCredentials: boolean, IE10+, CORS only
	//  - timeout: long, ms timeout, IE8+
	//  - onprogress: callback, IE10+
	//
	// Callback function prototype:
	//  - statusCode from request
	//  - response
	//    + if responseType set and supported by browser, this is an object of some type (see docs)
	//    + otherwise if request completed, this is the string text of the response
	//    + if request is aborted, this is "Abort"
	//    + if request times out, this is "Timeout"
	//    + if request errors before completing (probably a CORS issue), this is "Error"
	//  - request object
	//
	// Returns the request object. So you can call .abort() or other methods
	//
	// DEPRECATIONS:
	//  - Passing a string instead of the params object has been removed!
	//
	exports.ajax = function (params, callback) {
	  // Any variable used more than once is var'd here because
	  // minification will munge the variables whereas it can't munge
	  // the object access.
	  var headers = params.headers || {}
	    , body = params.body
	    , method = params.method || (body ? 'POST' : 'GET')
	    , called = false

	  var req = getRequest(params.cors)

	  function cb(statusCode, responseText) {
	    return function () {
	      if (!called) {
	        callback(req.status === undefined ? statusCode : req.status,
	                 req.status === 0 ? "Error" : (req.response || req.responseText || responseText),
	                 req)
	        called = true
	      }
	    }
	  }

	  req.open(method, params.url, true)

	  var success = req.onload = cb(200)
	  req.onreadystatechange = function () {
	    if (req.readyState === 4) success()
	  }
	  req.onerror = cb(null, 'Error')
	  req.ontimeout = cb(null, 'Timeout')
	  req.onabort = cb(null, 'Abort')

	  if (body) {
	    setDefault(headers, 'X-Requested-With', 'XMLHttpRequest')

	    if (!global.FormData || !(body instanceof global.FormData)) {
	      setDefault(headers, 'Content-Type', 'application/x-www-form-urlencoded')
	    }
	  }

	  for (var i = 0, len = reqfields.length, field; i < len; i++) {
	    field = reqfields[i]
	    if (params[field] !== undefined)
	      req[field] = params[field]
	  }

	  for (var field in headers)
	    req.setRequestHeader(field, headers[field])

	  req.send(body)

	  return req
	}

	function getRequest(cors) {
	  // XDomainRequest is only way to do CORS in IE 8 and 9
	  // But XDomainRequest isn't standards-compatible
	  // Notably, it doesn't allow cookies to be sent or set by servers
	  // IE 10+ is standards-compatible in its XMLHttpRequest
	  // but IE 10 can still have an XDomainRequest object, so we don't want to use it
	  if (cors && global.XDomainRequest && !/MSIE 1/.test(navigator.userAgent))
	    return new XDomainRequest
	  if (global.XMLHttpRequest)
	    return new XMLHttpRequest
	}

	function setDefault(obj, key, value) {
	  obj[key] = obj[key] || value
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	/**
	 * Get params from URL.
	 * 
	 * Modified from http://stackoverflow.com/a/979996/1377021
	 */
	var getParams = exports.getParams = function getParams() {
	    var params = {};

	    var _iteratorNormalCompletion = true;
	    var _didIteratorError = false;
	    var _iteratorError = undefined;

	    try {
	        for (var _iterator = window.location.search.substring(1).split('&')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	            var param = _step.value;

	            var nv = param.split('=');

	            if (!nv[0]) continue;

	            params[nv[0]] = nv[1] || true;
	        }
	    } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	    } finally {
	        try {
	            if (!_iteratorNormalCompletion && _iterator.return) {
	                _iterator.return();
	            }
	        } finally {
	            if (_didIteratorError) {
	                throw _iteratorError;
	            }
	        }
	    }

	    return params;
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Create dropdown with button
	 * 
	 */

	var Dropdown = function Dropdown(button) {
	    var _this = this;

	    _classCallCheck(this, Dropdown);

	    this.open = function (e) {
	        e.preventDefault();

	        if (_this.closed) {
	            _this.closed = false;
	            _this.button.nextElementSibling.style.display = 'block';
	            _this.button.classList.add('selected');

	            window.setTimeout(function () {
	                window.document.addEventListener('click', _this.close);
	            }, 50);
	        } else {
	            _this.close();
	        }
	    };

	    this.close = function (e) {
	        e.preventDefault();

	        window.document.removeEventListener('click', _this.close);

	        _this.button.classList.remove('selected');
	        _this.button.nextElementSibling.style.display = 'none';
	        _this.closed = true;
	    };

	    this.closed = true;
	    this.button = button;
	    this.button.classList.add('dropdown-btn');
	    this.button.addEventListener('click', this.open, true);
	};

	exports.default = Dropdown;

/***/ }
/******/ ]);