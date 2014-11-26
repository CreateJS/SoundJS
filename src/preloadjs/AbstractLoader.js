/*
 * AbstractLoader
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
	 * The base loader, which defines all the generic callbacks and events. All loaders extend this class, including the
	 * {{#crossLink "LoadQueue"}}{{/crossLink}}.
	 * @class AbstractLoader
	 * @extends EventDispatcher
	 */
	function AbstractLoader(loadItem, useXHR, type) {
		this.EventDispatcher_constructor();

		// public properties
		/**
		 * If the loader has completed loading. This provides a quick check, but also ensures that the different approaches
		 * used for loading do not pile up resulting in more than one <code>complete</code> event.
		 * @property loaded
		 * @type {Boolean}
		 * @default false
		 */
		this.loaded = false;

		/**
		 * Determine if the loader was canceled. Canceled loads will not fire complete events. Note that
		 * {{#crossLink "LoadQueue"}}{{/crossLink}} queues should be closed using {{#crossLink "AbstractLoader/close"}}{{/crossLink}}
		 * instead of setting this property.
		 * @property canceled
		 * @type {Boolean}
		 * @default false
		 */
		this.canceled = false;

		/**
		 * The current load progress (percentage) for this item. This will be a number between 0 and 1.
		 *
		 * <h4>Example</h4>
		 *
		 *     var queue = new createjs.LoadQueue();
		 *     queue.loadFile("largeImage.png");
		 *     queue.on("progress", function() {
		 *         console.log("Progress:", queue.progress, event.progress);
		 *     });
		 *
		 * @property progress
		 * @type {Number}
		 * @default 0
		 */
		this.progress = 0;

		/**
		 * The type of this item.
		 * See {{#crossLink}}DataTypes{{/crossLink}} for a full list of supported types.
		 *
		 * @type {null}
		 */
		this.type = type;

		// protected properties
		/**
		 * The item this loader represents. Note that this is null in a {{#crossLink "LoadQueue"}}{{/crossLink}}, but will
		 * be available on loaders such as {{#crossLink "XHRLoader"}}{{/crossLink}} and {{#crossLink "TagLoader"}}{{/crossLink}}.
		 * @property _item
		 * @type {Object}
		 * @private
		 */
		if (loadItem) {
			this._item = createjs.LoadItem.create(loadItem);
		} else {
			this._item = null;
		}

		this._useXHR = useXHR;

		this._rawResult = null;

	};

	var p = createjs.extend(AbstractLoader, createjs.EventDispatcher);

// Events
	/**
	 * The event that is fired when the overall progress changes.
	 * @event progress
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {Number} loaded The amount that has been loaded so far. Note that this is may just be a percentage of 1,
	 * since file sizes can not be determined before a load is kicked off, if at all.
	 * @param {Number} total The total number of bytes. Note that this may just be 1.
	 * @param {Number} progress The ratio that has been loaded between 0 and 1.
	 * @since 0.3.0
	 */

	/**
	 * The event that is fired when a load starts.
	 * @event loadstart
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @since 0.3.1
	 */

	/**
	 * The event that is fired when the entire queue has been loaded.
	 * @event complete
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @since 0.3.0
	 */

	/**
	 * The event that is fired when the loader encounters an error. If the error was encountered by a file, the event will
	 * contain the item that caused the error. There may be additional properties such as the error reason on event
	 * objects.
	 * @event error
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {Object} [item] The item that was being loaded that caused the error. The item was specified in
	 * the {{#crossLink "LoadQueue/loadFile"}}{{/crossLink}} or {{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}
	 * call. If only a string path or tag was specified, the object will contain that value as a `src` property.
	 * @param {String} [error] The error object or text.
	 * @since 0.3.0
	 */

	/**
	 * Dispatched after our XHRRequest is created, but before a load.
	 * Allows updates to the loader for specific loading needs (ex, Binary loading, or XHR image loading.)
	 *
	 * @event initialize
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {AbstractLoader} loader The loader that has been initialized.
	 */

	//TODO: Deprecated
	/**
	 * REMOVED. Use {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}} and the {{#crossLink "AbstractLoader/progress:event"}}{{/crossLink}}
	 * event.
	 * @property onProgress
	 * @type {Function}
	 * @deprecated Use addEventListener and the "progress" event.
	 */
	/**
	 * REMOVED. Use {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}} and the {{#crossLink "AbstractLoader/loadstart:event"}}{{/crossLink}}
	 * event.
	 * @property onLoadStart
	 * @type {Function}
	 * @deprecated Use addEventListener and the "loadstart" event.
	 */
	/**
	 * REMOVED. Use {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}} and the {{#crossLink "AbstractLoader/complete:event"}}{{/crossLink}}
	 * event.
	 * @property onComplete
	 * @type {Function}
	 * @deprecated Use addEventListener and the "complete" event.
	 */
	/**
	 * REMOVED. Use {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}} and the {{#crossLink "AbstractLoader/error:event"}}{{/crossLink}}
	 * event.
	 * @property onError
	 * @type {Function}
	 * @deprecated Use addEventListener and the "error" event.
	 */

	/**
	 * Get a reference to the manifest item that is loaded by this loader. In most cases this will be the value that was
	 * passed into {{#crossLink "LoadQueue"}}{{/crossLink}} using {{#crossLink "LoadQueue/loadFile"}}{{/crossLink}} or
	 * {{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}. However if only a String path was passed in, then it will
	 * be an Object created by the LoadQueue.
	 * @return {Object} The manifest item that this loader is responsible for loading.
	 */
	p.getItem = function () {
		return this._item;
	};

	p.getResult = function (raw) {
		return raw ? this._rawResult : this._result;
	};

	p.getTag = function () {
		return this._tag;
	};

	/**
	 * Begin loading the queued items. This method can be called when a {{#crossLink "LoadQueue"}}{{/crossLink}} is set
	 * up but not started immediately.
	 * @example
	 *      var queue = new createjs.LoadQueue();
	 *      queue.addEventListener("complete", handleComplete);
	 *      queue.loadManifest(fileArray, false); // Note the 2nd argument that tells the queue not to start loading yet
	 *      queue.load();
	 * @method load
	 */
	p.load = function () {
		if (!this._useXHR) {
			this._loadTag()
		} else {
			this._loadWithXHR();
		}
	};

	/**
	 * Close the active queue. Closing a queue completely empties the queue, and prevents any remaining items from
	 * starting to download. Note that currently any active loads will remain open, and events may be processed.
	 *
	 * To stop and restart a queue, use the {{#crossLink "LoadQueue/setPaused"}}{{/crossLink}} method instead.
	 * @method close
	 */
	p.close = function () {
	};

	/**
	 *
	 */
	p.cancel = function () {
		this.canceled = true;

		if (this._xhr != null) {
			this._xhr.off("complete", this, this);
			this._xhr.off("progress", this, this);
		}
	};

// Callback proxies
	/**
	 * Dispatch a loadstart event. Please see the {{#crossLink "AbstractLoader/loadstart:event"}}{{/crossLink}} event
	 * for details on the event payload.
	 * @method _sendLoadStart
	 * @protected
	 */
	p._sendLoadStart = function () {
		if (this._isCanceled()) { return; }
		this.dispatchEvent("loadstart");
	};

	/**
	 * Dispatch a progress event. Please see the {{#crossLink "AbstractLoader/progress:event"}}{{/crossLink}} event for
	 * details on the event payload.
	 * @method _sendProgress
	 * @param {Number | Object} value The progress of the loaded item, or an object containing <code>loaded</code>
	 * and <code>total</code> properties.
	 * @protected
	 */
	p._sendProgress = function (value) {
		if (this._isCanceled()) { return; }
		var event = null;
		if (typeof(value) == "number") {
			this.progress = value;
			event = new createjs.Event("progress");
			event.loaded = this.progress;
			event.total = 1;
		} else {
			event = value;
			this.progress = value.loaded / value.total;
			if (isNaN(this.progress) || this.progress == Infinity) { this.progress = 0; }
		}
		event.progress = this.progress;
		this.hasEventListener("progress") && this.dispatchEvent(event);
	};

	/**
	 * Dispatch a complete event. Please see the {{#crossLink "AbstractLoader/complete:event"}}{{/crossLink}} event
	 * for details on the event payload.
	 * @method _sendComplete
	 * @protected
	 */
	p._sendComplete = function () {
		if (this._isCanceled()) { return; }

		var event = new createjs.Event("complete");
		event.rawResult = this._rawResult;

		if (this._result != null) {
			event.result = this._result;
		}

		this.dispatchEvent(event);
	};

	/**
	 * Dispatch an error event. Please see the {{#crossLink "AbstractLoader/error:event"}}{{/crossLink}} event for
	 * details on the event payload.
	 * @method _sendError
	 * @param {Object} event The event object containing specific error properties.
	 * @protected
	 */
	p._sendError = function (event) {
		if (this._isCanceled() || !this.hasEventListener("error")) { return; }
		if (event == null) {
			event = new createjs.Event("error");
		}
		this.dispatchEvent(event);
	};

	/**
	 * Determine if the load has been canceled. This is important to ensure that method calls or asynchronous events
	 * do not cause issues after the queue has been cleaned up.
	 * @method _isCanceled
	 * @return {Boolean} If the loader has been canceled.
	 * @protected
	 */
	p._isCanceled = function () {
		if (window.createjs == null || this.canceled) {
			return true;
		}
		return false;
	};

	p._loadWithXHR = function () {
		this._xhr = new createjs.XHRRequest(this._item, false);
		this._xhr.on("complete", this, this);
		this._xhr.on("progress", this, this);
		this._xhr.on("loadStart", this, this);
		this._xhr.on("abort", this, this);
		this._xhr.on("timeout", this, this);
		this._xhr.on("error", this, this);

		var evt = new createjs.Event("initialize");
		evt.loader = this._xhr;
		this.dispatchEvent(evt);

		this._xhr.load();
	};

	/**
	 * Optional; Called just before a request dispatches its complete event.
	 * Allows plugins to set a custom result value.
	 * Will be passed a single loader parameter, which is the current loader in use.
	 *
	 * @type Function
	 * @returns {Object}
	 * @private
	 */
	p.resultFormatter = null;

	p.handleEvent = function (event) {
		switch (event.type) {
			case "complete":
				this._rawResult = event.target._response;
				this._result = this.resultFormatter && this.resultFormatter(this) || this._rawResult;
				this._sendComplete();
				break;
			case "progress":
				this._sendProgress(event);
				break;
			case "error":
				this._sendError(event);
				break;
			case "loadstart":
				this._sendLoadStart();
				break;
			case "abort":
			case "timeout":
				if (!this._isCanceled()) {
					this.dispatchEvent(event.type);
				}
				break;
		}
	};

	p._loadTag = function () {
		window.document.body.appendChild(this._tag);

		this._tag.onload = createjs.proxy(this._handleTagComplete, this);
		this._tag.onreadystatechange = createjs.proxy(this._handleReadyStateChange, this);

		var evt = new createjs.Event("initialize");
		evt.loader = this._tag;
		this.dispatchEvent(evt);

		this._tag[this._tagSrcAttribute] = this._item.src;
	};

	/**
	 * Handle the readyStateChange event from a tag. We sometimes need this in place of the onload event (mainly SCRIPT
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

	p._handleTagComplete = function () {
		this._rawResult = this._tag;
		this._result = this.resultFormatter && this.resultFormatter(this) || this._rawResult;
		this._sendComplete();
	};

	/**
	 * @deprecated Prefer RequestUtils.buildPath instead of this method.
	 */
	p.buildPath = function (src, data) {
		return createjs.RequestUtils.buildPath(src, data);
	};

	/**
	 * @method toString
	 * @return {String} a string representation of the instance.
	 */
	p.toString = function () {
		return "[PreloadJS AbstractLoader]";
	};

	createjs.AbstractLoader = createjs.promote(AbstractLoader, "EventDispatcher");

}());
