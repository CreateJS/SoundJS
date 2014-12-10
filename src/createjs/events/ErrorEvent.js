/*
* Event
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
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
 * @module CreateJS
 */

// namespace:
this.createjs = this.createjs||{};

(function() {
	"use strict";

	/**
	 * A general error {{#crossLink "Event"}}{{/crossLink}}, that describes an error that occurred, as well as any details.
	 * @class ErrorEvent
	 * @param {String} [title] The error title
	 * @param {String} [message] The error description
	 * @param {Object} [data] Additional error data
	 * @constructor
	 */
	function ErrorEvent(title, message, data) {
		this.Event_constructor("error");

		/**
		 * The short error title, which indicates the type of error that occurred.
		 * @property title
		 * @type String
		 */
		this.title = title;

		/**
		 * The verbose error message, containing details about the error.
		 * @property message
		 * @type String
		 */
		this.message = message;

		/**
		 * Additional data attached to an error.
		 * @property data
		 * @type {Object}
		 */
		this.data = data;
	}

	var p = createjs.extend(ErrorEvent, createjs.Event);

	p.clone = function() {
		return new createjs.ErrorEvent(this.title, this.message, this.data);
	};

	createjs.ErrorEvent = createjs.promote(ErrorEvent, "Event");

}());