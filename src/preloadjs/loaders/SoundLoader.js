/*
 * SoundLoader
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
	 * The SoundLoader class description goes here.
	 *
	 */
	function SoundLoader(loadItem, preferXHR) {
		this.AbstractMediaLoader_constructor(loadItem, preferXHR, createjs.AbstractLoader.SOUND);

		this._tagType = "audio";

		if (createjs.RequestUtils.isAudioTag(loadItem) || createjs.RequestUtils.isAudioTag(loadItem.src)) {
			this._preferXHR = false;
			this._tag =createjs.RequestUtils.isAudioTag(loadItem)?loadItem:loadItem.src;
		}
	};

	var p = createjs.extend(SoundLoader, createjs.AbstractMediaLoader);
	var s = SoundLoader;
	/**
	 * LoadQueue calls this when it creates loaders.
	 * Each loader has the option to say either yes (true) or no (false).
	 *
	 * @private
	 * @param item The LoadItem LoadQueue is trying to load.
	 * @returns {boolean}
	 */
	s.canLoadItem = function (item) {
		return item.type == createjs.AbstractLoader.SOUND;
	};

	p._createRequest = function() {
		if (!this._preferXHR) {
			this._request = new createjs.MediaTagRequest(this._item, false, this._tag || this._createTag(), this._tagSrcAttribute);
		} else {
			this._request = new createjs.XHRRequest(this._item, false);
		}
	};

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

	createjs.SoundLoader = createjs.promote(SoundLoader, "AbstractMediaLoader");

}());
