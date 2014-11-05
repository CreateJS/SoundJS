/*
 * DefaultSoundLoader
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


// constructor:
	/**
	 * An internal helper class that preloads audio. Note that this class and its methods are not documented
	 * properly to avoid generating HTML documentation.
	 * #class DefaultSoundLoader
	 * @param {String} src The source of the sound to load.
	 * @param {Object} owner A reference to the class that created this instance.
	 * @constructor
	 */
	function DefaultSoundLoader(src) {
		this.EventDispatcher_constructor();


// public properties:
		/**
		 * The result of the loading operation
		 * #property result
		 * @type {Object}
		 */
		this.result = null;

		/**
		 * Indicates the thisercentage of loading progress, between 0 and 1.
		 * #property progress
		 * @type {number}
		 */
		this.progress = -1;

		/**
		 * The source of the sound to load. Used by callback functions when we return this class.
		 * #property src
		 * @type {String}
		 */
		this.src = src;

	// TODO: See if callbacks are still required for PreloadJS
	// Callbacks / Events
		/**
		 * The callback that fires when the load completes.
		 * #property onload
		 * #event load
		 * @type {Method}
		 */
		this.onload = null;

		/**
		 * The callback that fires when data is being fetched at a rate that would allow playback without interruption. This follows HTML tag naming.
		 * #property oncanplaythrough
		 * #event canplaythrough
		 * @type {Method}
		 */
		this.oncanplaythrough = null;

		/**
		 * The callback that fires as the load progresses. This follows HTML tag naming.
		 * #property onprogress
		 * #event progress
		 * @type {Method}
		 */
		this.onprogress = null;

		/**
		 * The callback that fires if the load hits an error.  This follows HTML tag naming.
		 * #property onerror
		 * #event error
		 * @type {Method}
		 * @protected
		 */
		this.onerror = null;
	}

	var p = createjs.extend(DefaultSoundLoader, createjs.EventDispatcher);


// public methods:
	/**
	 * Begin loading the content.
	 * #method load
	 * @param {String} src The path to the sound.
	 */
	p.load = function (src) {
		if (src != null) {this.src = src;}
		// plugin specific code
	};

	/**
	 * Remove all external references from DefaultSoundLoader
	 * #method cleanUp
	 */
	p.cleanUp = function () {
		this.src = null;
		this.onload = null;
		this.onprogress = null;
		this.onerror = null;
		this.removeAllEventListeners();
	};

	p.toString = function () {
		return "[DefaultSoundLoader]";
	};


// private methods:
	/**
	 * The DefaultSoundLoader has reported progress.
	 *
	 * <strong>Note</strong>: this is not a public API, but is used to allow preloaders to subscribe to load
	 * progress as if this is an HTML audio tag. This reason is why this still uses a callback instead of an event.
	 * #method handleProgress
	 * @param {event} event Progress event that gives event.loaded and event.total if server is configured correctly
	 * @protected
	 */
	p._handleProgress = function (event) {
		this.progress = event.loaded / event.total;
		var e = new createjs.Event("progress");
		e.loaded = event.loaded;
		e.total = event.total;
		e.progress = this.progress;

		this.dispatchEvent(e);
		this.onprogress && this.onprogress(e);
	};

	/**
	 * The sound has loading enough to play through without interruption at the current download rate.
	 * #method handleLoad
	 * @protected
	 */
	p._handleCanPlayThrough = function (event) {
		// TODO double check params of canplaythrough event
		var e = new createjs.Event("canplaythrough");
		e.target = this;
		this.dispatchEvent(e)
		this.oncanplaythrough && this.oncanplaythrough(e)
	}

	/**
	 * The sound has completed loading.
	 * #method handleLoad
	 * @protected
	 */
	p._handleLoad = function (event) {
		// TODO consider params of event
		this.progress = 1;
		var e = new createjs.Event("load");
		e.target = this;
		this.dispatchEvent(e);
		this.onload && this.onload(e);
	};

	/**
	 * Errors have been caused by the DefaultSoundLoader.
	 * #method handleError
	 * @protected
	 */
	p._handleError = function (event) {
		this.dispatchEvent (event);
		this.onerror && this.onerror(event);
	};

	createjs.DefaultSoundLoader = createjs.promote(DefaultSoundLoader, "EventDispatcher");
}());
