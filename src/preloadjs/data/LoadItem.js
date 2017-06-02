/*
 * LoadItem
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

	/**
	 * All loaders accept an item containing the properties defined in this class. If a raw object is passed instead,
	 * it will not be affected, but it must contain at least a {{#crossLink "src:property"}}{{/crossLink}} property. A
	 * string path or HTML tag is also acceptable, but it will be automatically converted to a LoadItem using the
	 * {{#crossLink "create"}}{{/crossLink}} method by {{#crossLink "AbstractLoader"}}{{/crossLink}}
	 * @class LoadItem
	 * @constructor
	 * @since 0.6.0
	 */
	function LoadItem() {
		/**
		 * The source of the file that is being loaded. This property is <b>required</b>. The source can either be a
		 * string (recommended), or an HTML tag.
		 * This can also be an object, but in that case it has to include a type and be handled by a plugin.
		 * @property src
		 * @type {String}
		 * @default null
		 */
		this.src = null;

		/**
		 * The type file that is being loaded. The type of the file is usually inferred by the extension, but can also
		 * be set manually. This is helpful in cases where a file does not have an extension.
		 * @property type
		 * @type {String}
		 * @default null
		 */
		this.type = null;

		/**
		 * A string identifier which can be used to reference the loaded object. If none is provided, this will be
		 * automatically set to the {{#crossLink "src:property"}}{{/crossLink}}.
		 * @property id
		 * @type {String}
		 * @default null
		 */
		this.id = null;

		/**
		 * Determines if a manifest will maintain the order of this item, in relation to other items in the manifest
		 * that have also set the `maintainOrder` property to `true`. This only applies when the max connections has
		 * been set above 1 (using {{#crossLink "LoadQueue/setMaxConnections"}}{{/crossLink}}). Everything with this
		 * property set to `false` will finish as it is loaded. Ordered items are combined with script tags loading in
		 * order when {{#crossLink "LoadQueue/maintainScriptOrder:property"}}{{/crossLink}} is set to `true`.
		 * @property maintainOrder
		 * @type {Boolean}
		 * @default false
		 */
		this.maintainOrder = false;

		/**
		 * A callback used by JSONP requests that defines what global method to call when the JSONP content is loaded.
		 * @property callback
		 * @type {String}
		 * @default null
		 */
		this.callback = null;

		/**
		 * An arbitrary data object, which is included with the loaded object.
		 * @property data
		 * @type {Object}
		 * @default null
		 */
		this.data = null;

		/**
		 * The request method used for HTTP calls. Both {{#crossLink "Methods/GET:property"}}{{/crossLink}} or
		 * {{#crossLink "Methods/POST:property"}}{{/crossLink}} request types are supported, and are defined as
		 * constants on {{#crossLink "AbstractLoader"}}{{/crossLink}}.
		 * @property method
		 * @type {String}
		 * @default GET
		 */
		this.method = createjs.Methods.GET;

		/**
		 * An object hash of name/value pairs to send to the server.
		 * @property values
		 * @type {Object}
		 * @default null
		 */
		this.values = null;

		/**
		 * An object hash of headers to attach to an XHR request. PreloadJS will automatically attach some default
		 * headers when required, including "Origin", "Content-Type", and "X-Requested-With". You may override the
		 * default headers by including them in your headers object.
		 * @property headers
		 * @type {Object}
		 * @default null
		 */
		this.headers = null;

		/**
		 * Enable credentials for XHR requests.
		 * @property withCredentials
		 * @type {Boolean}
		 * @default false
		 */
		this.withCredentials = false;

		/**
		 * Set the mime type of XHR-based requests. This is automatically set to "text/plain; charset=utf-8" for text
		 * based files (json, xml, text, css, js).
		 * @property mimeType
		 * @type {String}
		 * @default null
		 */
		this.mimeType = null;

		/**
		 * Sets the crossOrigin attribute for CORS-enabled images loading cross-domain.
		 * @property crossOrigin
		 * @type {boolean}
		 * @default Anonymous
		 */
		this.crossOrigin = null;

		/**
		 * The duration in milliseconds to wait before a request times out. This only applies to tag-based and and XHR
		 * (level one) loading, as XHR (level 2) provides its own timeout event.
		 * @property loadTimeout
		 * @type {Number}
		 * @default 8000 (8 seconds)
		 */
		this.loadTimeout = s.LOAD_TIMEOUT_DEFAULT;
	};

	var p = LoadItem.prototype = {};
	var s = LoadItem;

	/**
	 * Default duration in milliseconds to wait before a request times out. This only applies to tag-based and and XHR
	 * (level one) loading, as XHR (level 2) provides its own timeout event.
	 * @property LOAD_TIMEOUT_DEFAULT
	 * @type {number}
	 * @static
	 */
	s.LOAD_TIMEOUT_DEFAULT = 8000;

	/**
	 * Create a LoadItem.
	 * <ul>
	 *     <li>String-based items are converted to a LoadItem with a populated {{#crossLink "src:property"}}{{/crossLink}}.</li>
	 *     <li>LoadItem instances are returned as-is</li>
	 *     <li>Objects are returned with any needed properties added</li>
	 * </ul>
	 * @method create
	 * @param {LoadItem|String|Object} value The load item value
	 * @returns {LoadItem|Object}
	 * @static
	 */
	s.create = function (value) {
		if (typeof value == "string") {
			var item = new LoadItem();
			item.src = value;
			return item;
		} else if (value instanceof s) {
			return value;
		} else if (value instanceof Object && value.src) {
			if (value.loadTimeout == null) {
				value.loadTimeout = s.LOAD_TIMEOUT_DEFAULT;
			}
			return value;
		} else {
			throw new Error("Type not recognized.");
		}
	};

	/**
	 * Provides a chainable shortcut method for setting a number of properties on the instance.
	 *
	 * <h4>Example</h4>
	 *
	 *      var loadItem = new createjs.LoadItem().set({src:"image.png", maintainOrder:true});
	 *
	 * @method set
	 * @param {Object} props A generic object containing properties to copy to the LoadItem instance.
	 * @return {LoadItem} Returns the instance the method is called on (useful for chaining calls.)
	*/
	p.set = function(props) {
		for (var n in props) { this[n] = props[n]; }
		return this;
	};

	createjs.LoadItem = s;

}());
