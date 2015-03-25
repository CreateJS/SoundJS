/*
 * CordovaAudioLoader
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
	 * Loader provides a mechanism to preload Cordova audio content via PreloadJS or internally. Instances are returned to
	 * the preloader, and the load method is called when the asset needs to be requested.
	 * Currently files are assumed to be local and no loading actually takes place.  This class exists to more easily support
	 * the existing architecture.
	 *
	 * @class CordovaAudioLoader
	 * @param {String} loadItem The item to be loaded
	 * @extends XHRRequest
	 * @protected
	 */
	function Loader(loadItem) {
		this.AbstractLoader_constructor(loadItem, true, createjs.AbstractLoader.SOUND);

		/**
		 * A Media object used to determine if src exists and to get duration
		 * @property _media
		 * @type {Media}
		 * @protected
		 */
		this._media = null;

		/**
		 * A time counter that triggers timeout if loading takes too long
		 * @property _loadTime
		 * @type {number}
		 * @protected
		 */
		this._loadTime = 0;

		/**
		 * The frequency to fire the loading timer until duration can be retrieved
		 * @property _TIMER_FREQUENCY
		 * @type {number}
		 * @protected
		 */
		this._TIMER_FREQUENCY = 100;
	};
	var p = createjs.extend(Loader, createjs.AbstractLoader);


// public methods
	p.load = function() {
		this._media = new Media(this._item.src, null, createjs.proxy(this._mediaErrorHandler,this));
		this._media.seekTo(0);	// needed to get duration

		this._getMediaDuration();
	};

	p.toString = function () {
		return "[CordovaAudioLoader]";
	};


// private methods
	/**
	 * Fires if audio cannot seek, indicating that src does not exist.
	 * @method _mediaErrorHandler
	 * @param error
	 * @protected
	 */
	p._mediaErrorHandler = function(error) {
		this._media.release();
		this._sendError();
	};

	/**
	 * will attempt to get duration of audio until successful or time passes this._item.loadTimeout
	 * @method _getMediaDuration
	 * @protected
	 */
	p._getMediaDuration = function() {
		this._result = this._media.getDuration() * 1000;
		if (this._result < 0) {
			this._loadTime += this._TIMER_FREQUENCY;
			if (this._loadTime > this._item.loadTimeout) {
				this.handleEvent({type:"timeout"});
			} else {
				setTimeout(createjs.proxy(this._getMediaDuration, this), this._TIMER_FREQUENCY);
			}
		} else {
			this._media.release();
			this._sendComplete();
		}
	};

	createjs.CordovaAudioLoader = createjs.promote(Loader, "AbstractLoader");
}());
