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
	 * @class FlashAudioLoader
	 * @param {String} loadItem The item to be loaded
	 * @param {Object} flash The flash instance that will do the preloading.
	 * @extends AbstractLoader
	 * @protected
	 */
	function Loader(loadItem) {
		this.AbstractLoader_constructor(loadItem, false, createjs.AbstractLoader.SOUND);


// Public properties
		/**
		 * ID used to facilitate communication with flash.
		 * Not doc'd because this should not be altered externally
		 * @property flashId
		 * @type {String}
		 */
		this.flashId = null;

	}
	var p = createjs.extend(Loader, createjs.AbstractLoader);

	// TODO: deprecated
	// p.initialize = function() {}; // searchable for devs wondering where it is. REMOVED. See docs for details.


// Static Properties
	var s = Loader;
	/**
	 * A reference to the Flash instance that gets created.
	 * @property flash
	 * @type {Object | Embed}
	 * @protected
	 */
	s._flash = null;

	/**
	 * A list of loader instances that tried to load before _flash was set
	 * @property _preloadInstances
	 * @type {Array}
	 * @protected
	 */
	s._preloadInstances = [];

	/**
	 * Set the Flash instance on the class, and start loading on any instances that had load called
	 * before flash was ready
	 * @method setFlash
	 * @param flash Flash instance that handles loading and playback
	 */
	s.setFlash = function(flash) {
		s._flash = flash;
		for(var i = s._preloadInstances.length; i--; ) {
			var loader = s._preloadInstances.pop();
			loader.load();
		}
	};

// public methods
	p.load = function () {
		if (s._flash == null) {
			// register for future preloading
			s._preloadInstances.push(this);
			return;
		}

		this.flashId = s._flash.preload(this._item.src);
		// Associate this preload instance with the FlashID, so callbacks can route here.
		var e = new createjs.Event(createjs.FlashAudioPlugin._REG_FLASHID);
		this.dispatchEvent(e);
	};

	/**
	 * called from flash when loading has progress
	 * @method handleProgress
	 * @param loaded
	 * @param total
	 * @protected
	 */
	p.handleProgress = function (loaded, total) {
		this._sendProgress(loaded/total);
	};

	/**
	 * Called from Flash when sound is loaded.  Set our ready state and fire callbacks / events
	 * @method handleComplete
	 * @protected
	 */
	p.handleComplete = function () {
		this._result = this._item.src;
		this._sendComplete();
	};

	/**
	 * Receive error event from flash and pass it to callback.
	 * @method handleError
	 * @param {Event} error
	 * @protected
	 */
	p.handleError = function (error) {
		this._handleError(error);
	};

	p.destroy = function () {
		var e = new createjs.Event(createjs.FlashAudioPlugin._UNREG_FLASHID);
		this.dispatchEvent(e);
		this.AbstractLoader_destroy();
	};

	p.toString = function () {
		return "[FlashAudioLoader]";
	};

	createjs.FlashAudioLoader = createjs.promote(Loader, "AbstractLoader");

}());
