/*
 * HTMLAudioLoader
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
 * @module SoundJS
 */

// namespace:
this.createjs = this.createjs || {};

(function () {

	"use strict";

	/**
	 * An internal helper class that preloads html audio via HTMLAudioElement tags. Note that PreloadJS will NOT use
	 * this load class like it does Flash and WebAudio plugins.
	 * Note that this class and its methods are not documented properly to avoid generating HTML documentation.
	 * #class Loader
	 * @param {String} src The source of the sound to load.
	 * @param {HTMLAudioElement} tag The audio tag of the sound to load.
	 * @constructor
	 * @protected
	 * @since 0.4.0
	 */
	function Loader(src) {
		this.AbstractSoundLoader_contructor();


	// Public properties
		/**
		 * The tag to load the source with / into.
		 * #property tag
		 * @type {AudioTag}
		 * @default null
		 * @protected
		 */
		this.tag = null;

		/**
		 * An interval used to give us progress.
		 * #property preloadTimer
		 * @type {String}
		 * @default null
		 * @protected
		 */
		this.preloadTimer = null;


	// Private Properties
		// Proxies, make removing listeners easier.
		this._loadedHandler = createjs.proxy(this._canPlayThroughHandler, this);;
	};
	var p = createjs.extend(Loader, createjs.AbstractSoundLoader);


// Public methods
	p.load = function(src) {
		this.AbstractSoundLoader.load(src);

		this.preloadTimer = setInterval(createjs.proxy(this._preloadTick, this), 200);

		// The tag doesn't keep loading in Chrome once enough has buffered
		// TODO force loading in Chrome to properly enable audio sprites
		// Note that canplaythrough callback doesn't work in Chrome, we have to use the event.
		this.tag.addEventListener && this.tag.addEventListener("canplaythrough", this._loadedHandler);
		this.tag.onreadystatechange = this._loadedHandler;
		this.tag.onerror = this._handleError;
		this.tag.preload = "auto";
		//this.tag.src = src;  // already set
		this.tag.load();
	};

	p.destroy = function() {
		clearInterval(this.preloadTimer);
		this.tag.removeEventListener && this.tag.removeEventListener("canplaythrough", this._loadedHandler);
		this.tag.onreadystatechange = null;
		this.tag.onerror = null;

		this.tag = null;
		this.AbstractSoundLoader_destroy();
	};

	p.toString = function () {
		return "[HTMLAudioPlugin Loader]";
	};


// Private Methods
	/**
	 * handle when sound is ready
	 * #method _canPlayThroughHandler
	 * @param event
	 * @protected
	 */
	p._canPlayThroughHandler = function(event) {
		clearInterval(this.preloadTimer);
		this.tag.removeEventListener && this.tag.removeEventListener("canplaythrough", this._loadedHandler);
		this.tag.onreadystatechange = null;
		this.tag.onerror = null;

		this._handleCanPlayThrough(event);
		this._handleLoad(event);
	};

	/**
	 * Allows us to have preloading progress and tell when its done.
	 * #method _preloadTick
	 * @protected
	 */
	p._preloadTick = function () {
		var buffered = this.tag.buffered;
		var duration = this.tag.duration;

		if (buffered.length > 0) {
			if (buffered.end(0) >= duration - 1) {
				this._handleTagLoaded();
			}
		}

		this._handleProgress({loaded: bufferered, total: duration});
	};

	/**
	 * Internal handler for when a tag is loaded.
	 * #method _handleTagLoaded
	 * @protected
	 */
	p._handleTagLoaded = function () {
		clearInterval(this.preloadTimer);
	};

	createjs.HTMLAudioLoader = createjs.promote(Loader, "AbstractSoundLoader");
}());
