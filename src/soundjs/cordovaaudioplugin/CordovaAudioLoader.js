/*
 * CordovaAudioLoader
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
 * @module SoundJS
 */

// namespace:
this.createjs = this.createjs || {};

(function () {
	"use strict";

	/**
	 * Loader provides a mechanism to preload Cordova audio content via PreloadJS or internally. Instances are returned to
	 * the preloader, and the load method is called when the asset needs to be requested.
	 * Currently files are assumed to be local and no loading actually takes place.  This class exists to more easily support
	 * the existing architecture.
	 *
	 * @class CordovaAudioLoader
	 * @param {String} loadItem The item to be loaded
	 * @param {Object} flash The flash instance that will do the preloading.
	 * @extends XHRRequest
	 * @protected
	 */
	function Loader(loadItem) {
		this.AbstractLoader_constructor(loadItem, true, createjs.AbstractLoader.SOUND);

	};
	var p = createjs.extend(Loader, createjs.AbstractLoader);


// public methods
	p.load = function() {
		this._sendComplete();
	};

	p.toString = function () {
		return "[CordovaAudioLoader]";
	};


// private methods


	createjs.CordovaAudioLoader = createjs.promote(Loader, "AbstractLoader");
}());
