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
	function AbstractMediaLoader(loadItem, useXHR, type) {
		this.AbstractLoader_constructor(loadItem, useXHR, type);

		// public properties

		// protected properties
		this._tagSrcAttribute = "src";

		/**
		 * Used to determine what type of tag to create, for example "audio"
		 * @property _tagType
		 * @type {string}
		 * @private
		 */
		this._tagType = "";	// needs to be defined in classes that extend this

		this._loadedHandler = createjs.proxy(this._handleTagComplete, this);

		this.resultFormatter = this._formatResult;
	};

	var p = createjs.extend(AbstractMediaLoader, createjs.AbstractLoader);
	// static properties

	// public methods

	// protected methods
	p._loadTag = function() {
		if(!this._tag) {
			this._tag = this._createTag(this._item.src);
		}
		this._tag.onstalled = createjs.proxy(this._handleStalled, this);
		// This will tell us when audio is buffered enough to play through, but not when its loaded.
		// The tag doesn't keep loading in Chrome once enough has buffered, and we have decided that behaviour is sufficient.
		this._tag.addEventListener && this._tag.addEventListener("canplaythrough", this._loadedHandler, false); // canplaythrough callback doesn't work in Chrome, so we use an event.

		this.AbstractLoader__loadTag();

		this._tag.preload = "auto";
		this._tag.load();
	}

	/**
	 * Create an HTML audio tag.
	 * @method _createTag
	 * @param {String} src The source file to set for the audio tag.
	 * @return {HTMLElement} Returns an HTML audio tag.
	 * @protected
	 */
	p._createTag = function (src) {
		var tag = document.createElement(this._tagType);
		tag.autoplay = false;
		tag.preload = "none";
		//LM: Firefox fails when this the preload="none" for other tags, but it needs to be "none" to ensure PreloadJS works.
		tag.src = src;
		return tag;
	};

	p._formatResult = function (loader) {
		this._tag.removeEventListener && this._tag.removeEventListener("canplaythrough", this._loadedHandler);
		this._tag.onstalled = null;
		if (this._useXHR) {
			loader.getTag().src = loader.getResult(true);
		}
		return loader.getTag();
	};

	/**
	 * Handle a stalled audio event. The main place we seem to get these is with HTMLAudio in Chrome when we try and
	 * playback audio that is already in a load, but not complete.
	 * @method _handleStalled
	 * @private
	 */
	p._handleStalled = function () {
		//Ignore, let the timeout take care of it. Sometimes its not really stopped.
	};

	createjs.AbstractMediaLoader = createjs.promote(AbstractMediaLoader, "AbstractLoader");

}());
