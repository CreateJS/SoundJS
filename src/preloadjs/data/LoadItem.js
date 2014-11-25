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
this.createjs = this.createjs||{};

(function() {
	"use strict";

	/**
	 * @class LoadItem
	 *
	 * @constructor
	 */
	function LoadItem() {
		/**
		 * The source of the file that is being loaded. This property is <b>required</b>. The source can
		 * either be a string (recommended), or an HTML tag.</li>
		 *
		 * @type {null}
		 */
		this.src = null;

		/**
		 * The source of the file that is being loaded. This property is <b>required</b>. The source can
		 * either be a string (recommended), or an HTML tag.
		 *
		 * Check {{#crossLink "DataTypes"}}DataTypes{{/crossLink}} for the full list of supported types.
		 *
		 * @type {String|HTMLMediaElement|HTMLImageElement|HTMLLinkElement}
		 */
		this.type = createjs.DataTypes.TEXT;

		/**
		 * A string identifier which can be used to reference the loaded object.
		 *
		 * @type {String|Number}
		 */
		this.id = null;

		/**
		 * Set to `true` to ensure this asset loads in the order defined in the manifest. This
		 * will happen when the max connections has been set above 1 (using {{#crossLink "LoadQueue/setMaxConnections"}}{{/crossLink}}),
		 * and will only affect other assets also defined as `maintainOrder`. Everything else will finish as it is
		 * loaded. Ordered items are combined with script tags loading in order when {{#crossLink "LoadQueue/maintainScriptOrder:property"}}{{/crossLink}}
		 * is set to `true`.
		 *
		 * @type {boolean}
		 */
		this.maintainOrder = false;

		/**
		 * Optional, used for JSONP requests, to define what method to call when the JSONP is loaded.
		 *
		 * @type {String}
		 */
		this.callback = null;

		/**
		 * An arbitrary data object, which is included with the loaded object
		 *
		 * @type {Object}
		 */
		this.data = null;

		/**
		 * uUsed to define if this request uses GET or POST when sending data to the server. The default value is "GET"
		 *
		 * @type {String}
		 */
		this.method = createjs.LoadItem.GET;

		/**
		 * Optional object of name/value pairs to send to the server.
		 *
		 * @type {Object}
		 */
		this.values = null;

		/**
		 * Optional object hash of headers to attach to an XHR request. PreloadJS will automatically
		 * attach some default headers when required, including Origin, Content-Type, and X-Requested-With. You may
		 * override the default headers if needed.
		 *
		 * @type {Object}
		 */
		this.headers = null;

		/**
		 * Default false; Set to true if you need to enable credentials for XHR requests.
		 *
		 * @type {boolean}
		 */
		this.withCredentials = false;

		/**
		 * String, Default for text bases files (json, xml, text, css, js) "text/plain; charset=utf-8"; Sets the mime type of XHR.
		 *
		 * @type {String}
		 */
		this.mimeType = null;
	};

	var p = LoadItem.prototype = {};
	var s = LoadItem;

	s.create = function(value) {
		if (typeof value == "string") {
			var item = new LoadItem();
			item.src = value;
			return item;
		} else if (value instanceof s) {
			return value;
		} else if (value instanceof Object) { // Don't modify object, allows users to attach random data to the item.
			return value;
		} else {
			throw new Error("Type not recognized.");
		}
	};

	createjs.LoadItem = s;

}());
