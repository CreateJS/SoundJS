/*
 * FlashLoader
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
	 * Loader provides a mechanism to preload Flash content via PreloadJS or internally. Instances are returned to
	 * the preloader, and the load method is called when the asset needs to be requested.
	 *
	 * Loader has the same APIs as an &lt;audio&gt; tag. The instance calls the <code>onload</code>, <code>onprogress</code>,
	 * and <code>onerror</code> callbacks when necessary.
	 *
	 * #class Loader
	 * @param {String} src The path to the sound
	 * @param {Object} flash The flash instance that will do the preloading.
	 * @protected
	 */
	function Loader(src, owner, flash) {
		this._init(src, owner, flash);
	}

	var p = Loader.prototype;
	p.constructor = Loader;

	/**
	 * A reference to the Flash instance that gets created.
	 * #property flash
	 * @type {Object | Embed}
	 */
	p._flash = null;

	/**
	 * The source file to be loaded.
	 * #property src
	 * @type {String}
	 */
	p.src = null;

	/**
	 * ID used to facilitate communication with flash.
	 * #property flashId
	 * @type {String}
	 */
	p.flashId = null;

	/**
	 * The percentage of progress.
	 * #property progress
	 * @type {Number}
	 * @default -1
	 */
	p.progress = -1;

	/**
	 * Used to report if audio is ready.  Value of 4 indicates ready.
	 * #property readyState
	 * @type {Number}
	 * @default 0
	 */
	p.readyState = 0;

	/**
	 * Indicates if <code>load</code> has been called on this.
	 * #property loading
	 * @type {Boolean}
	 * @default false
	 */
	p.loading = false;

	/**
	 * Plugin that created this.  This will be an instance of <code>FlashAudioPlugin</code>.
	 * #property owner
	 * @type {Object}
	 */
	p.owner = null;

// Calbacks
	/**
	 * The callback that fires when the load completes. This follows HTML tag name conventions.
	 * #property onload
	 * @type {Method}
	 */
	p.onload = null;

	/**
	 * The callback that fires as the load progresses. This follows HTML tag name conventions.
	 * #property onprogress
	 * @type {Method}
	 */
	p.onprogress = null;

	/**
	 * The callback that fires if the load hits an error. This follows HTML tag name conventions.
	 * #property onerror
	 * @type {Method}
	 */
	p.onerror = null;

	// constructor
	p._init = function (src, owner, flash) {
		this.src = src;
		this.owner = owner;
		this._flash = flash;
	};

	/**
	 * Called when Flash has been initialized. If a load call was made before this, call it now.
	 * #method initialize
	 * @param {Object | Embed} flash A reference to the Flash instance.
	 */
	p.initialize = function (flash) {
		this._flash = flash;
		if (this.loading) {
			this.loading = false;
			this.load(this.src);
		}
	};

	/**
	 * Start loading.
	 * #method load
	 * @param {String} src The path to the sound.
	 * @return {Boolean} If the load was started. If Flash has not been initialized, the load will fail.
	 */
	p.load = function (src) {
		if (src != null) {
			this.src = src;
		}
		if (this._flash == null || !this.owner.flashReady) {
			this.loading = true;
			// register for future preloading
			this.owner._preloadInstances[this.src] = this;
			return false;
		}

		this.flashId = this._flash.preload(this.src);
		// Associate this preload instance with the FlashID, so callbacks can route here.
		this.owner.registerPreloadInstance(this.flashId, this);
		return true;
	};

	/**
	 * Receive progress from Flash and pass it to callback.
	 *
	 * <strong>Note</strong>: this is not a public API, but is used to allow preloaders to subscribe to load
	 * progress as if this is an HTML audio tag. This reason is why this still uses a callback instead of an event.
	 * #method handleProgress
	 * @param {Number} loaded Amount loaded
	 * @param {Number} total Total amount to be loaded.
	 */
	p.handleProgress = function (loaded, total) {
		this.progress = loaded / total;
		this.onprogress && this.onprogress({loaded:loaded, total:total, progress:this.progress});
	};

	/**
	 * Called from Flash when sound is loaded.  Set our ready state and fire callbacks / events
	 * #method handleComplete
	 */
	p.handleComplete = function () {
		this.progress = 1;
		this.readyState = 4;
		this.owner._registerLoadedSrc(this.src);
		createjs.Sound._sendFileLoadEvent(this.src);
		this.onload && this.onload();
	};

	/**
	 * Receive error event from flash and pass it to callback.
	 * @param {Event} error
	 */
	p.handleError = function (error) {
		this.onerror && this.onerror(error);
	};

	p.toString = function () {
		return "[FlashAudioLoader]";
	};

	createjs.FlashAudioLoader = Loader;

}());
