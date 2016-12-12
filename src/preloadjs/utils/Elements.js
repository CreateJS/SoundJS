/*
 * Elements
 *
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

(function () {

	/**
	 * Convenience methods for creating various elements used by PrelaodJS.
	 *
	 * @class DomUtils
	 */
	var s = {};

	s.a = function() {
		return s.el("a");
	}

	s.svg = function() {
		return s.el("svg");
	}

	s.object = function() {
		return s.el("object");
	}

	s.image = function() {
		return s.el("image");
	}

	s.img = function() {
		return s.el("img");
	}

	s.style = function() {
		return s.el("style");
	}

	s.link = function() {
		return s.el("link");
	}

	s.script = function() {
		return s.el("script");
	}

	s.audio = function() {
		return s.el("audio");
	}

	s.video = function() {
		return s.el("video");
	}

	s.text = function(value) {
		return document.createTextNode(value);
	}

	s.el = function(name) {
		return document.createElement(name);
	}

	createjs.Elements = s;

}());
