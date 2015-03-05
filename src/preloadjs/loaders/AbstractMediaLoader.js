/*
 * AbstractMediaLoader
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

(function () {
	"use strict";

	// constructor
	/**
	 * The AbstractMediaLoader is a base class that handles some of the shared methods and properties of loaders that
	 * handle HTML media elements, such as Video and Audio.
	 * @class AbstractMediaLoader
	 * @param {LoadItem|Object} loadItem
	 * @param {Boolean} preferXHR
	 * @param {String} type The type of media to load. Usually "video" or "audio".
	 * @extends AbstractLoader
	 * @constructor
	 */
	function AbstractMediaLoader(loadItem, preferXHR, type) {
		this.AbstractLoader_constructor(loadItem, preferXHR, type);

		// public properties
		this.resultFormatter = this._formatResult;

		// protected properties
		this._tagSrcAttribute = "src";
	};

	var p = createjs.extend(AbstractMediaLoader, createjs.AbstractLoader);

	// static properties
	// public methods
	p.load = function () {
		// TagRequest will handle most of this, but Sound / Video need a few custom properties, so just handle them here.
		if (!this._tag) {
			this._tag = this._createTag(this._item.src);
		}

		this._tag.preload = "auto";
		this._tag.load();

		this.AbstractLoader_load();
	};

	// protected methods
	/**
	 * Creates a new tag for loading if it doesn't exist yet.
	 * @method _createTag
	 * @private
	 */
	p._createTag = function () {};


	p._createRequest = function() {
		if (!this._preferXHR) {
			this._request = new createjs.MediaTagRequest(this._item, this._tag || this._createTag(), this._tagSrcAttribute);
		} else {
			this._request = new createjs.XHRRequest(this._item);
		}
	};

	/**
	 * The result formatter for media files.
	 * @method _formatResult
	 * @param {AbstractLoader} loader
	 * @returns {HTMLVideoElement|HTMLAudioElement}
	 * @private
	 */
	p._formatResult = function (loader) {
		this._tag.removeEventListener && this._tag.removeEventListener("canplaythrough", this._loadedHandler);
		this._tag.onstalled = null;
		if (this._preferXHR) {
			loader.getTag().src = loader.getResult(true);
		}
		return loader.getTag();
	};

	createjs.AbstractMediaLoader = createjs.promote(AbstractMediaLoader, "AbstractLoader");

}());
