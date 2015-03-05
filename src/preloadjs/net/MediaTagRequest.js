/*
 * MediaTagRequest
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
	 * An {{#crossLink "TagRequest"}}{{/crossLink}} that loads HTML tags for video and audio.
	 * @class MediaTagRequest
	 * @param {LoadItem} loadItem
	 * @param {HTMLAudioElement|HTMLVideoElement} tag
	 * @param {String} srcAttribute The tag attribute that specifies the source, such as "src", "href", etc.
	 * @constructor
	 */
	function MediaTagRequest(loadItem, tag, srcAttribute) {
		this.AbstractRequest_constructor(loadItem);

		// protected properties
		this._tag = tag;
		this._tagSrcAttribute = srcAttribute;
		this._loadedHandler = createjs.proxy(this._handleTagComplete, this);
	};

	var p = createjs.extend(MediaTagRequest, createjs.TagRequest);
	var s = MediaTagRequest;

	// public methods
	p.load = function () {
		var sc = createjs.proxy(this._handleStalled, this);
		this._stalledCallback = sc;

		var pc = createjs.proxy(this._handleProgress, this);
		this._handleProgress = pc;

		this._tag.addEventListener("stalled", sc);
		this._tag.addEventListener("progress", pc);

		// This will tell us when audio is buffered enough to play through, but not when its loaded.
		// The tag doesn't keep loading in Chrome once enough has buffered, and we have decided that behaviour is sufficient.
		this._tag.addEventListener && this._tag.addEventListener("canplaythrough", this._loadedHandler, false); // canplaythrough callback doesn't work in Chrome, so we use an event.

		this.TagRequest_load();
	};

	// private methods
	p._handleReadyStateChange = function () {
		clearTimeout(this._loadTimeout);
		// This is strictly for tags in browsers that do not support onload.
		var tag = this._tag;

		// Complete is for old IE support.
		if (tag.readyState == "loaded" || tag.readyState == "complete") {
			this._handleTagComplete();
		}
	};

	p._handleStalled = function () {
		//Ignore, let the timeout take care of it. Sometimes its not really stopped.
	};

	/**
	 * An XHR request has reported progress.
	 * @method _handleProgress
	 * @param {Object} event The XHR progress event.
	 * @private
	 */
	p._handleProgress = function (event) {
		if (!event || event.loaded > 0 && event.total == 0) {
			return; // Sometimes we get no "total", so just ignore the progress event.
		}

		var newEvent = new createjs.ProgressEvent(event.loaded, event.total);
		this.dispatchEvent(newEvent);
	};

	// protected methods
	p._clean = function () {
		this._tag.removeEventListener && this._tag.removeEventListener("canplaythrough", this._loadedHandler);
		this._tag.removeEventListener("stalled", this._stalledCallback);
		this._tag.removeEventListener("progress", this._progressCallback);

		this.TagRequest__clean();
	};

	createjs.MediaTagRequest = createjs.promote(MediaTagRequest, "TagRequest");

}());
