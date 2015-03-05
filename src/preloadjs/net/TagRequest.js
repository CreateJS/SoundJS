/*
 * TagRequest
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
	 * An {{#crossLink "AbstractRequest"}}{{/crossLink}} that loads HTML tags, such as images and scripts.
	 * @class TagRequest
	 * @param {LoadItem} loadItem
	 * @param {HTMLElement} tag
	 * @param {String} srcAttribute The tag attribute that specifies the source, such as "src", "href", etc.
	 */
	function TagRequest(loadItem, tag, srcAttribute) {
		this.AbstractRequest_constructor(loadItem);

		// protected properties
		/**
		 * The HTML tag instance that is used to load.
		 * @property _tag
		 * @type {HTMLElement}
		 * @protected
		 */
		this._tag = tag;

		/**
		 * The tag attribute that specifies the source, such as "src", "href", etc.
		 * @property _tagSrcAttribute
		 * @type {String}
		 * @protected
		 */
		this._tagSrcAttribute = srcAttribute;

		/**
		 * A method closure used for handling the tag load event.
		 * @property _loadedHandler
		 * @type {Function}
		 * @private
		 */
		this._loadedHandler = createjs.proxy(this._handleTagComplete, this);

		/**
		 * Determines if the element was added to the DOM automatically by PreloadJS, so it can be cleaned up after.
		 * @property _addedToDOM
		 * @type {Boolean}
		 * @private
		 */
		this._addedToDOM = false;

		/**
		 * Determines what the tags initial style.visibility was, so we can set it correctly after a load.
		 *
		 * @type {null}
		 * @private
		 */
		this._startTagVisibility = null;
	};

	var p = createjs.extend(TagRequest, createjs.AbstractRequest);

	// public methods
	p.load = function () {
		this._tag.onload = createjs.proxy(this._handleTagComplete, this);
		this._tag.onreadystatechange = createjs.proxy(this._handleReadyStateChange, this);
		this._tag.onerror = createjs.proxy(this._handleError, this);

		var evt = new createjs.Event("initialize");
		evt.loader = this._tag;

		this.dispatchEvent(evt);

		this._hideTag();

		this._loadTimeout = setTimeout(createjs.proxy(this._handleTimeout, this), this._item.loadTimeout);

		this._tag[this._tagSrcAttribute] = this._item.src;

		// wdg:: Append the tag AFTER setting the src, or SVG loading on iOS will fail.
		if (this._tag.parentNode == null) {
			window.document.body.appendChild(this._tag);
			this._addedToDOM = true;
		}
	};

	p.destroy = function() {
		this._clean();
		this._tag = null;

		this.AbstractRequest_destroy();
	};

	// private methods
	/**
	 * Handle the readyStateChange event from a tag. We need this in place of the `onload` callback (mainly SCRIPT
	 * and LINK tags), but other cases may exist.
	 * @method _handleReadyStateChange
	 * @private
	 */
	p._handleReadyStateChange = function () {
		clearTimeout(this._loadTimeout);
		// This is strictly for tags in browsers that do not support onload.
		var tag = this._tag;

		// Complete is for old IE support.
		if (tag.readyState == "loaded" || tag.readyState == "complete") {
			this._handleTagComplete();
		}
	};

	/**
	 * Handle any error events from the tag.
	 * @method _handleError
	 * @protected
	 */
	p._handleError = function() {
		this._clean();
		this.dispatchEvent("error");
	};

	/**
	 * Handle the tag's onload callback.
	 * @method _handleTagComplete
	 * @private
	 */
	p._handleTagComplete = function () {
		this._rawResult = this._tag;
		this._result = this.resultFormatter && this.resultFormatter(this) || this._rawResult;

		this._clean();
		this._showTag();

		this.dispatchEvent("complete");
	};

	/**
	 * The tag request has not loaded within the time specified in loadTimeout.
	 * @method _handleError
	 * @param {Object} event The XHR error event.
	 * @private
	 */
	p._handleTimeout = function () {
		this._clean();
		this.dispatchEvent(new createjs.Event("timeout"));
	};

	/**
	 * Remove event listeners, but don't destroy the request object
	 * @method _clean
	 * @private
	 */
	p._clean = function() {
		this._tag.onload = null;
		this._tag.onreadystatechange = null;
		this._tag.onerror = null;
		if (this._addedToDOM && this._tag.parentNode != null) {
			this._tag.parentNode.removeChild(this._tag);
		}
		clearTimeout(this._loadTimeout);
	};

	p._hideTag = function() {
		this._startTagVisibility = this._tag.style.visibility;
		this._tag.style.visibility = "hidden";
	};

	p._showTag = function() {
		this._tag.style.visibility = this._startTagVisibility;
	};

	/**
	 * Handle a stalled audio event. The main place this happens is with HTMLAudio in Chrome when playing back audio
	 * that is already in a load, but not complete.
	 * @method _handleStalled
	 * @private
	 */
	p._handleStalled = function () {
		//Ignore, let the timeout take care of it. Sometimes its not really stopped.
	};

	createjs.TagRequest = createjs.promote(TagRequest, "AbstractRequest");

}());
