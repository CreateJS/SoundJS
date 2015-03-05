/*
 * ProgressEvent
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

(function (scope) {
	"use strict";

	// constructor
	/**
	 * A CreateJS {{#crossLink "Event"}}{{/crossLink}} that is dispatched when progress changes.
	 * @class ProgressEvent
	 * @param {Number} loaded The amount that has been loaded. This can be any number relative to the total.
	 * @param {Number} [total=1] The total amount that will load. This will default to 1, so if the `loaded` value is
	 * a percentage (between 0 and 1), it can be omitted.
	 * @todo Consider having this event be a "fileprogress" event as well
	 * @constructor
	 */
	function ProgressEvent(loaded, total) {
		this.Event_constructor("progress");

		/**
		 * The amount that has been loaded (out of a total amount)
		 * @property loaded
		 * @type {Number}
		 */
		this.loaded = loaded;

		/**
		 * The total "size" of the load.
		 * @property total
		 * @type {Number}
		 * @default 1
		 */
		this.total = (total == null) ? 1 : total;

		/**
		 * The percentage (out of 1) that the load has been completed. This is calculated using `loaded/total`.
		 * @property progress
		 * @type {Number}
		 * @default 0
		 */
		this.progress = (total == 0) ? 0 : this.loaded / this.total;
	};

	var p = createjs.extend(ProgressEvent, createjs.Event);

	/**
	 * Returns a clone of the ProgressEvent instance.
	 * @method clone
	 * @return {ProgressEvent} a clone of the Event instance.
	 **/
	p.clone = function() {
		return new createjs.ProgressEvent(this.loaded, this.total);
	};

	createjs.ProgressEvent = createjs.promote(ProgressEvent, "Event");

}(window));