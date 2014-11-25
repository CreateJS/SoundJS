/*
* SoundLoader
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
this.createjs = this.createjs||{};

(function () {
	"use strict";

	// constructor
	/**
	 * The SoundLoader class description goes here.
	 *
	 */
	function SoundLoader(loadItem, useXHR) {
		this.AbstractLoader_constructor(loadItem, useXHR, createjs.DataTypes.SOUND);

		// public properties

		// protected properties
		this._tagSrcAttribute = "src";

		this._tag = document.createElement("audio");
		this._tag.preload = "auto";

		// this._tag.autoplay = false;
		// Note: The type property doesn't seem necessary.

		this.resultFormatter = this._formatResult;

		this._tag.onstalled = createjs.proxy(this._handleStalled, this);
		// This will tell us when audio is buffered enough to play through, but not when its loaded.
		// The tag doesn't keep loading in Chrome once enough has buffered, and we have decided that behaviour is sufficient.
		this._tag.addEventListener("canplaythrough", createjs.proxy(this._handleTagComplete, this), false); // canplaythrough callback doesn't work in Chrome, so we use an event.
	};

	var p = createjs.extend(SoundLoader, createjs.AbstractLoader);
	var s = SoundLoader;
	/**
	 * LoadQueue calls this when it creates loaders.
	 * Each loader has the option to say either yes (true) or no (false).
	 *
	 * @private
	 * @param item The LoadItem LoadQueue is trying to load.
	 * @returns {boolean}
	 */
	s.canLoadItem = function(item) {
		return item.type == createjs.DataTypes.SOUND;
	};

	// static properties

	// public methods

	// protected methods
	p._formatResult = function(loader) {
		if (this._useXHR) {
			loader.getTag().src = loader.getResult(true);
		}
		return loader.getTag();
	};

	/**
	 * Handle a stalled audio event. The main place we seem to get these is with HTMLAudio in Chrome when we try and
	 * playback audio that is already in a load, but not complete.
	 * @method _handleStalled
	 * @private
	 */
	p._handleStalled = function () {
		//Ignore, let the timeout take care of it. Sometimes its not really stopped.
	};

	createjs.SoundLoader = createjs.promote(SoundLoader, "AbstractLoader");

}());
