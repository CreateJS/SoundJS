/*
 * Methods
 * Visit http://createjs.com/ for documentation, updates and examples.
 *
 *
 * Copyright (c) 2012 gskinner.com, inc.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @module PreloadJS
 */

// namespace:
this.createjs = this.createjs || {};

(function() {

	"use strict";

	/**
	 * Defines the method types for XHR requests. Currently, PreloadJS only supports "POST" and "GET", however
	 * any HTML method can be used with PreloadJS utilities.
	 *
	 * @class Methods
	 * @static
	 */
	var s = {};

	/**
	 * Defines a POST request, use for a method value when loading data.
	 * @property POST
	 * @type {string}
	 * @default post
	 * @static
	 */
	s.POST = "POST";

	/**
	 * Defines a GET request, use for a method value when loading data.
	 * @property GET
	 * @type {string}
	 * @default get
	 * @static
	 */
	s.GET = "GET";

	createjs.Methods = s;
}());
