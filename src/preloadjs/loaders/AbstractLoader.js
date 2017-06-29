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
	 * The base loader, which defines all the generic methods, properties, and events. All loaders extend this class,
	 * including the {{#crossLink "LoadQueue"}}{{/crossLink}}.
	 * @class AbstractLoader
	 * @param {LoadItem|object|string} loadItem The item to be loaded.
	 * @param {Boolean} [preferXHR] Determines if the LoadItem should <em>try</em> and load using XHR, or take a
	 * tag-based approach, which can be better in cross-domain situations. Not all loaders can load using one or the
	 * other, so this is a suggested directive.
	 * @param {String} [type] The type of loader. Loader types are defined as constants on the AbstractLoader class,
	 * such as {{#crossLink "IMAGE:property"}}{{/crossLink}}, {{#crossLink "CSS:property"}}{{/crossLink}}, etc.
	 * @extends EventDispatcher
	 */
	function AbstractLoader(loadItem, preferXHR, type) {
		this.EventDispatcher_constructor();

		// public properties
		/**
		 * If the loader has completed loading. This provides a quick check, but also ensures that the different approaches
		 * used for loading do not pile up resulting in more than one `complete` {{#crossLink "Event"}}{{/crossLink}}.
		 * @property loaded
		 * @type {Boolean}
		 * @default false
		 */
		this.loaded = false;

		/**
		 * Determine if the loader was canceled. Canceled loads will not fire complete events. Note that this property
		 * is readonly, so {{#crossLink "LoadQueue"}}{{/crossLink}} queues should be closed using {{#crossLink "LoadQueue/close"}}{{/crossLink}}
		 * instead.
		 * @property canceled
		 * @type {Boolean}
		 * @default false
		 * @readonly
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
		 * The type of item this loader will load. See {{#crossLink "AbstractLoader"}}{{/crossLink}} for a full list of
		 * supported types.
		 * @property type
		 * @type {String}
		 */
		this.type = type;

		/**
		 * A formatter function that converts the loaded raw result into the final result. For example, the JSONLoader
		 * converts a string of text into a JavaScript object. Not all loaders have a resultFormatter, and this property
		 * can be overridden to provide custom formatting.
		 *
		 * Optionally, a resultFormatter can return a callback function in cases where the formatting needs to be
		 * asynchronous, such as creating a new image. The callback function is passed 2 parameters, which are callbacks
		 * to handle success and error conditions in the resultFormatter. Note that the resultFormatter method is
		 * called in the current scope, as well as the success and error callbacks.
		 *
		 * <h4>Example asynchronous resultFormatter</h4>
		 *
		 * 	function _formatResult(loader) {
		 * 		return function(success, error) {
		 * 			if (errorCondition) { error(errorDetailEvent); }
		 * 			success(result);
		 * 		}
		 * 	}
		 * @property resultFormatter
		 * @type {Function}
		 * @default null
		 */
		this.resultFormatter = null;

		// protected properties
		/**
		 * The {{#crossLink "LoadItem"}}{{/crossLink}} this loader represents. Note that this is null in a {{#crossLink "LoadQueue"}}{{/crossLink}},
		 * but will be available on loaders such as {{#crossLink "XMLLoader"}}{{/crossLink}} and {{#crossLink "ImageLoader"}}{{/crossLink}}.
		 * @property _item
		 * @type {LoadItem|Object}
		 * @private
		 */
		if (loadItem) {
			this._item = createjs.LoadItem.create(loadItem);
		} else {
			this._item = null;
		}

		/**
		 * Whether the loader will try and load content using XHR (true) or HTML tags (false).
		 * @property _preferXHR
		 * @type {Boolean}
		 * @private
		 */
		this._preferXHR = preferXHR;

		/**
		 * The loaded result after it is formatted by an optional {{#crossLink "resultFormatter"}}{{/crossLink}}. For
		 * items that are not formatted, this will be the same as the {{#crossLink "_rawResult:property"}}{{/crossLink}}.
		 * The result is accessed using the {{#crossLink "getResult"}}{{/crossLink}} method.
		 * @property _result
		 * @type {Object|String}
		 * @private
		 */
		this._result = null;

		/**
		 * The loaded result before it is formatted. The rawResult is accessed using the {{#crossLink "getResult"}}{{/crossLink}}
		 * method, and passing `true`.
		 * @property _rawResult
		 * @type {Object|String}
		 * @private
		 */
		this._rawResult = null;

		/**
		 * A list of items that loaders load behind the scenes. This does not include the main item the loader is
		 * responsible for loading. Examples of loaders that have sub-items include the {{#crossLink "SpriteSheetLoader"}}{{/crossLink}} and
		 * {{#crossLink "ManifestLoader"}}{{/crossLink}}.
		 * @property _loadItems
		 * @type {null}
		 * @protected
		 */
		this._loadedItems = null;

		/**
		 * The attribute the items loaded using tags use for the source.
		 * @type {string}
		 * @default null
		 * @private
		 */
		this._tagSrcAttribute = null;

		/**
		 * An HTML tag (or similar) that a loader may use to load HTML content, such as images, scripts, etc.
		 * @property _tag
		 * @type {Object}
		 * @private
		 */
		this._tag = null;
	};

	var p = createjs.extend(AbstractLoader, createjs.EventDispatcher);
	var s = AbstractLoader;

	// Remove these @deprecated properties after 1.0
	try {
		Object.defineProperties(s, {
			POST: { get: createjs.deprecate(function() { return createjs.Methods.POST; }, "AbstractLoader.POST") },
			GET: { get: createjs.deprecate(function() { return createjs.Methods.GET; }, "AbstractLoader.GET") },

			BINARY: { get: createjs.deprecate(function() { return createjs.Types.BINARY; }, "AbstractLoader.BINARY") },
			CSS: { get: createjs.deprecate(function() { return createjs.Types.CSS; }, "AbstractLoader.CSS") },
			FONT: { get: createjs.deprecate(function() { return createjs.Types.FONT; }, "AbstractLoader.FONT") },
			FONTCSS: { get: createjs.deprecate(function() { return createjs.Types.FONTCSS; }, "AbstractLoader.FONTCSS") },
			IMAGE: { get: createjs.deprecate(function() { return createjs.Types.IMAGE; }, "AbstractLoader.IMAGE") },
			JAVASCRIPT: { get: createjs.deprecate(function() { return createjs.Types.JAVASCRIPT; }, "AbstractLoader.JAVASCRIPT") },
			JSON: { get: createjs.deprecate(function() { return createjs.Types.JSON; }, "AbstractLoader.JSON") },
			JSONP: { get: createjs.deprecate(function() { return createjs.Types.JSONP; }, "AbstractLoader.JSONP") },
			MANIFEST: { get: createjs.deprecate(function() { return createjs.Types.MANIFEST; }, "AbstractLoader.MANIFEST") },
			SOUND: { get: createjs.deprecate(function() { return createjs.Types.SOUND; }, "AbstractLoader.SOUND") },
			VIDEO: { get: createjs.deprecate(function() { return createjs.Types.VIDEO; }, "AbstractLoader.VIDEO") },
			SPRITESHEET: { get: createjs.deprecate(function() { return createjs.Types.SPRITESHEET; }, "AbstractLoader.SPRITESHEET") },
			SVG: { get: createjs.deprecate(function() { return createjs.Types.SVG; }, "AbstractLoader.SVG") },
			TEXT: { get: createjs.deprecate(function() { return createjs.Types.TEXT; }, "AbstractLoader.TEXT") },
			XML: { get: createjs.deprecate(function() { return createjs.Types.XML; }, "AbstractLoader.XML") }
		});
	} catch (e) {}

// Events
	/**
	 * The {{#crossLink "ProgressEvent"}}{{/crossLink}} that is fired when the overall progress changes. Prior to
	 * version 0.6.0, this was just a regular {{#crossLink "Event"}}{{/crossLink}}.
	 * @event progress
	 * @since 0.3.0
	 */

	/**
	 * The {{#crossLink "Event"}}{{/crossLink}} that is fired when a load starts.
	 * @event loadstart
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @since 0.3.1
	 */

	/**
	 * The {{#crossLink "Event"}}{{/crossLink}} that is fired when the entire queue has been loaded.
	 * @event complete
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @since 0.3.0
	 */

	/**
	 * The {{#crossLink "ErrorEvent"}}{{/crossLink}} that is fired when the loader encounters an error. If the error was
	 * encountered by a file, the event will contain the item that caused the error. Prior to version 0.6.0, this was
	 * just a regular {{#crossLink "Event"}}{{/crossLink}}.
	 * @event error
	 * @since 0.3.0
	 */

	/**
	 * The {{#crossLink "Event"}}{{/crossLink}} that is fired when the loader encounters an internal file load error.
	 * This enables loaders to maintain internal queues, and surface file load errors.
	 * @event fileerror
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type ("fileerror")
	 * @param {LoadItem|object} The item that encountered the error
	 * @since 0.6.0
	 */

	/**
	 * The {{#crossLink "Event"}}{{/crossLink}} that is fired when a loader internally loads a file. This enables
	 * loaders such as {{#crossLink "ManifestLoader"}}{{/crossLink}} to maintain internal {{#crossLink "LoadQueue"}}{{/crossLink}}s
	 * and notify when they have loaded a file. The {{#crossLink "LoadQueue"}}{{/crossLink}} class dispatches a
	 * slightly different {{#crossLink "LoadQueue/fileload:event"}}{{/crossLink}} event.
	 * @event fileload
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type ("fileload")
	 * @param {Object} item The file item which was specified in the {{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}
	 * or {{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}} call. If only a string path or tag was specified, the
	 * object will contain that value as a `src` property.
	 * @param {Object} result The HTML tag or parsed result of the loaded item.
	 * @param {Object} rawResult The unprocessed result, usually the raw text or binary data before it is converted
	 * to a usable object.
	 * @since 0.6.0
	 */

	/**
	 * The {{#crossLink "Event"}}{{/crossLink}} that is fired after the internal request is created, but before a load.
	 * This allows updates to the loader for specific loading needs, such as binary or XHR image loading.
	 * @event initialize
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type ("initialize")
	 * @param {AbstractLoader} loader The loader that has been initialized.
	 */


	/**
	 * Get a reference to the manifest item that is loaded by this loader. In some cases this will be the value that was
	 * passed into {{#crossLink "LoadQueue"}}{{/crossLink}} using {{#crossLink "LoadQueue/loadFile"}}{{/crossLink}} or
	 * {{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}. However if only a String path was passed in, then it will
	 * be a {{#crossLink "LoadItem"}}{{/crossLink}}.
	 * @method getItem
	 * @return {Object} The manifest item that this loader is responsible for loading.
	 * @since 0.6.0
	 */
	p.getItem = function () {
		return this._item;
	};

	/**
	 * Get a reference to the content that was loaded by the loader (only available after the {{#crossLink "complete:event"}}{{/crossLink}}
	 * event is dispatched.
	 * @method getResult
	 * @param {Boolean} [raw=false] Determines if the returned result will be the formatted content, or the raw loaded
	 * data (if it exists).
	 * @return {Object}
	 * @since 0.6.0
	 */
	p.getResult = function (raw) {
		return raw ? this._rawResult : this._result;
	};

	/**
	 * Return the `tag` this object creates or uses for loading.
	 * @method getTag
	 * @return {Object} The tag instance
	 * @since 0.6.0
	 */
	p.getTag = function () {
		return this._tag;
	};

	/**
	 * Set the `tag` this item uses for loading.
	 * @method setTag
	 * @param {Object} tag The tag instance
	 * @since 0.6.0
	 */
	p.setTag = function(tag) {
	  this._tag = tag;
	};

	/**
	 * Begin loading the item. This method is required when using a loader by itself.
	 *
	 * <h4>Example</h4>
	 *
	 *      var queue = new createjs.LoadQueue();
	 *      queue.on("complete", handleComplete);
	 *      queue.loadManifest(fileArray, false); // Note the 2nd argument that tells the queue not to start loading yet
	 *      queue.load();
	 *
	 * @method load
	 */
	p.load = function () {
		this._createRequest();

		this._request.on("complete", this, this);
		this._request.on("progress", this, this);
		this._request.on("loadStart", this, this);
		this._request.on("abort", this, this);
		this._request.on("timeout", this, this);
		this._request.on("error", this, this);

		var evt = new createjs.Event("initialize");
		evt.loader = this._request;
		this.dispatchEvent(evt);

		this._request.load();
	};

	/**
	 * Close the the item. This will stop any open requests (although downloads using HTML tags may still continue in
	 * the background), but events will not longer be dispatched.
	 * @method cancel
	 */
	p.cancel = function () {
		this.canceled = true;
		this.destroy();
	};

	/**
	 * Clean up the loader.
	 * @method destroy
	 */
	p.destroy = function() {
		if (this._request) {
			this._request.removeAllEventListeners();
			this._request.destroy();
		}

		this._request = null;

		this._item = null;
		this._rawResult = null;
		this._result = null;

		this._loadItems = null;

		this.removeAllEventListeners();
	};

	/**
	 * Get any items loaded internally by the loader. The enables loaders such as {{#crossLink "ManifestLoader"}}{{/crossLink}}
	 * to expose items it loads internally.
	 * @method getLoadedItems
	 * @return {Array} A list of the items loaded by the loader.
	 * @since 0.6.0
	 */
	p.getLoadedItems = function () {
		return this._loadedItems;
	};


	// Private methods
	/**
	 * Create an internal request used for loading. By default, an {{#crossLink "XHRRequest"}}{{/crossLink}} or
	 * {{#crossLink "TagRequest"}}{{/crossLink}} is created, depending on the value of {{#crossLink "preferXHR:property"}}{{/crossLink}}.
	 * Other loaders may override this to use different request types, such as {{#crossLink "ManifestLoader"}}{{/crossLink}},
	 * which uses {{#crossLink "JSONLoader"}}{{/crossLink}} or {{#crossLink "JSONPLoader"}}{{/crossLink}} under the hood.
	 * @method _createRequest
	 * @protected
	 */
	p._createRequest = function() {
		if (!this._preferXHR) {
			this._request = new createjs.TagRequest(this._item, this._tag || this._createTag(), this._tagSrcAttribute);
		} else {
			this._request = new createjs.XHRRequest(this._item);
		}
	};

	/**
	 * Create the HTML tag used for loading. This method does nothing by default, and needs to be implemented
	 * by loaders that require tag loading.
	 * @method _createTag
	 * @param {String} src The tag source
	 * @return {HTMLElement} The tag that was created
	 * @protected
	 */
	p._createTag = function(src) { return null; };

	/**
	 * Dispatch a loadstart {{#crossLink "Event"}}{{/crossLink}}. Please see the {{#crossLink "AbstractLoader/loadstart:event"}}{{/crossLink}}
	 * event for details on the event payload.
	 * @method _sendLoadStart
	 * @protected
	 */
	p._sendLoadStart = function () {
		if (this._isCanceled()) { return; }
		this.dispatchEvent("loadstart");
	};

	/**
	 * Dispatch a {{#crossLink "ProgressEvent"}}{{/crossLink}}.
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
			event = new createjs.ProgressEvent(this.progress);
		} else {
			event = value;
			this.progress = value.loaded / value.total;
			event.progress = this.progress;
			if (isNaN(this.progress) || this.progress == Infinity) { this.progress = 0; }
		}
		this.hasEventListener("progress") && this.dispatchEvent(event);
	};

	/**
	 * Dispatch a complete {{#crossLink "Event"}}{{/crossLink}}. Please see the {{#crossLink "AbstractLoader/complete:event"}}{{/crossLink}} event
	 * @method _sendComplete
	 * @protected
	 */
	p._sendComplete = function () {
		if (this._isCanceled()) { return; }

		this.loaded = true;

		var event = new createjs.Event("complete");
		event.rawResult = this._rawResult;

		if (this._result != null) {
			event.result = this._result;
		}

		this.dispatchEvent(event);
	};

	/**
	 * Dispatch an error {{#crossLink "Event"}}{{/crossLink}}. Please see the {{#crossLink "AbstractLoader/error:event"}}{{/crossLink}}
	 * event for details on the event payload.
	 * @method _sendError
	 * @param {ErrorEvent} event The event object containing specific error properties.
	 * @protected
	 */
	p._sendError = function (event) {
		if (this._isCanceled() || !this.hasEventListener("error")) { return; }
		if (event == null) {
			event = new createjs.ErrorEvent("PRELOAD_ERROR_EMPTY"); // TODO: Populate error
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

	/**
	 * A custom result formatter function, which is called just before a request dispatches its complete event. Most
	 * loader types already have an internal formatter, but this can be user-overridden for custom formatting. The
	 * formatted result will be available on Loaders using {{#crossLink "getResult"}}{{/crossLink}}, and passing `true`.
	 * @property resultFormatter
	 * @type Function
	 * @return {Object} The formatted result
	 * @since 0.6.0
	 */
	p.resultFormatter = null;

	/**
	 * Handle events from internal requests. By default, loaders will handle, and redispatch the necessary events, but
	 * this method can be overridden for custom behaviours.
	 * @method handleEvent
	 * @param {Event} event The event that the internal request dispatches.
	 * @protected
	 * @since 0.6.0
	 */
	p.handleEvent = function (event) {
		switch (event.type) {
			case "complete":
				this._rawResult = event.target._response;
				var result = this.resultFormatter && this.resultFormatter(this);
				// The resultFormatter is asynchronous
				if (result instanceof Function) {
					result.call(this,
							createjs.proxy(this._resultFormatSuccess, this),
							createjs.proxy(this._resultFormatFailed, this)
					);
				// The result formatter is synchronous
				} else {
					this._result =  result || this._rawResult;
					this._sendComplete();
				}
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
					this.dispatchEvent(new createjs.ErrorEvent("PRELOAD_" + event.type.toUpperCase() + "_ERROR"));
				}
				break;
		}
	};

	/**
	 * The "success" callback passed to {{#crossLink "AbstractLoader/resultFormatter"}}{{/crossLink}} asynchronous
	 * functions.
	 * @method _resultFormatSuccess
	 * @param {Object} result The formatted result
	 * @private
	 */
	p._resultFormatSuccess = function (result) {
		this._result = result;
		this._sendComplete();
	};

	/**
	 * The "error" callback passed to {{#crossLink "AbstractLoader/resultFormatter"}}{{/crossLink}} asynchronous
	 * functions.
	 * @method _resultFormatSuccess
	 * @param {Object} error The error event
	 * @private
	 */
	p._resultFormatFailed = function (event) {
		this._sendError(event);
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
