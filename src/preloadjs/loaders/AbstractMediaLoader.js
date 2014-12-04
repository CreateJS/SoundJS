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

// namespace:
this.createjs = this.createjs || {};

(function () {
	"use strict";

	// constructor
	/**
	 * The AbstractMediaLoader class description goes here.
	 *
	 */
	function AbstractMediaLoader(loadItem, preferXHR, type) {
		this.AbstractLoader_constructor(loadItem, preferXHR, type);

		// public properties

		// protected properties
		this._tagSrcAttribute = "src";

		/**
		 * Used to determine what type of tag to create, for example "audio"
		 * @property _tagType
		 * @type {string}
		 * @private
		 */
		this._tagType = type;

		this.resultFormatter = this._formatResult;
	};

	var p = createjs.extend(AbstractMediaLoader, createjs.AbstractLoader);
	// static properties

	// public methods

	// protected methods
	p.load = function () {
		// TagRequest will handle most of this, but Sound / Video need a few custom properties, so just handle them here.
		if (!this._tag) {
			this._tag = this._createTag(this._item.src);
		}

		this._tag.preload = "auto";
		this._tag.load();

		this.AbstractLoader_load();
	};

	/**
	 * Abstract, create a new tag if none exist.
	 *
	 * @private
	 */
	p._createTag = function () {

	};

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
