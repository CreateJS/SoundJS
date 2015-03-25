/*
 * CordovaAudioSoundInstance
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
	 * CordovaAudioSoundInstance extends the base api of {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} and is used by
	 * {{#crossLink "CordovaAudioPlugin"}}{{/crossLink}}.
	 *
	 * @param {String} src The path to and file name of the sound.
	 * @param {Number} startTime Audio sprite property used to apply an offset, in milliseconds.
	 * @param {Number} duration Audio sprite property used to set the time the clip plays for, in milliseconds.
	 * @param {Object} playbackResource Any resource needed by plugin to support audio playback.
	 * @class CordovaAudioSoundInstance
	 * @extends AbstractSoundInstance
	 * @constructor
	 */
	function CordovaAudioSoundInstance(src, startTime, duration, playbackResource) {
		this.AbstractSoundInstance_constructor(src, startTime, duration, playbackResource);

// Public Properties
		/**
		 * Sets the playAudioWhenScreenIsLocked property for play calls on iOS devices.
		 * @property playWhenScreenLocked
		 * @type {boolean}
		 */
		this.playWhenScreenLocked = null;

// Private Properties
		/**
		 * Used to approximate the playback position by storing the number of milliseconds elapsed since
		 * 1 January 1970 00:00:00 UTC when playing
		 * Note that if js clock is out of sync with Media playback, this will become increasingly inaccurate.
		 * @property _playStartTime
		 * @type {Number}
		 * @protected
		 */
		this._playStartTime = null;

		/**
		 * A TimeOut used to trigger the end and possible loop of audio sprites.
		 * @property _audioSpriteTimeout
		 * @type {null}
		 * @protected
		 */
		this._audioSpriteTimeout = null;

		/**
		 * Boolean value that indicates if we are using an audioSprite
		 * @property _audioSprite
		 * @type {boolean}
		 * @protected
		 */
		this._audioSprite = false;

		// Proxies, make removing listeners easier.
		this._audioSpriteEndHandler = createjs.proxy(this._handleAudioSpriteComplete, this);
		this._mediaPlayFinishedHandler = createjs.proxy(this._handleSoundComplete, this);
		this._mediaErrorHandler = createjs.proxy(this._handleMediaError, this);
		this._mediaProgressHandler = createjs.proxy(this._handleMediaProgress, this);

		this._playbackResource = new Media(src, this._mediaPlayFinishedHandler, this._mediaErrorHandler, this._mediaProgressHandler);

		if (duration) {
			this._audioSprite = true;
		} else {
			this._setDurationFromSource();
		}
	}
	var p = createjs.extend(CordovaAudioSoundInstance, createjs.AbstractSoundInstance);


// Public Methods
	/**
	 * Called by {{#crossLink "Sound"}}{{/crossLink}} when plugin does not handle master volume.
	 * undoc'd because it is not meant to be used outside of Sound
	 * #method setMasterVolume
	 * @param value
	 */
	p.setMasterVolume = function (value) {
		this._updateVolume();
	};

	/**
	 * Called by {{#crossLink "Sound"}}{{/crossLink}} when plugin does not handle master mute.
	 * undoc'd because it is not meant to be used outside of Sound
	 * #method setMasterMute
	 * @param value
	 */
	p.setMasterMute = function (isMuted) {
		this._updateVolume();
	};

	p.destroy = function() {
		// call parent function, then release
		this.AbstractSoundInstance_destroy();
		this._playbackResource.release();
	};

	/**
	 * Maps to <a href="http://plugins.cordova.io/#/package/org.apache.cordova.media" target="_blank">Media.getCurrentPosition</a>,
	 * which is curiously asynchronus and requires a callback.
	 * @method getCurrentPosition
	 * @param {Method} mediaSuccess The callback that is passed the current position in seconds.
	 * @param {Method} [mediaError=null] (Optional) The callback to execute if an error occurs.
	 */
	p.getCurrentPosition = function (mediaSuccess, mediaError) {
		this._playbackResource.getCurrentPosition(mediaSuccess, mediaError);
	};

	p.toString = function () {
		return "[CordovaAudioSoundInstance]";
	};

//Private Methods
	/**
	 * media object has failed and likely will never work
	 * @method _handleMediaError
	 * @param error
	 * @private
	 */
	p._handleMediaError = function(error) {
		clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound

		this.playState = createjs.Sound.PLAY_FAILED;
		this._sendEvent("failed");
	};

	p._handleMediaProgress = function(state) {
		// do nothing
	};

	p._handleAudioSpriteComplete = function() {
		this._playbackResource.pause();
		this._handleSoundComplete();
	};
	/* don't need these for current looping approach
	p._removeLooping = function() {
	};

	p._addLooping = function() {
	};
	*/

	p._handleCleanUp = function () {
		clearTimeout(this._audioSpriteTimeout);
		this._playbackResource.pause(); // OJR cannot use .stop as it prevents .seekTo from working
		// todo consider media.release
	};

	p._handleSoundReady = function (event) {
		this._playbackResource.seekTo(this._startTime + this._position);

		if (this._audioSprite) {
			this._audioSpriteTimeout = setTimeout(this._audioSpriteEndHandler, this._duration - this._position)
		}

		this._playbackResource.play({playAudioWhenScreenIsLocked: this.playWhenScreenLocked});
		this._playStartTime = Date.now();
	};

	p._pause = function () {
		clearTimeout(this._audioSpriteTimeout);
		this._playbackResource.pause();
		if (this._playStartTime) {
			this._position = Date.now() - this._playStartTime;
			this._playStartTime = null;
		}
		this._playbackResource.getCurrentPosition(createjs.proxy(this._updatePausePos, this));
	};

	/**
	 * Synchronizes the best guess position with the actual current position.
	 * @method _updatePausePos
	 * @param {Number} pos The current position in seconds
	 * @private
	 */
	p._updatePausePos = function (pos) {
		this._position = pos * 1000 - this._startTime;
		if(this._playStartTime) {
			this._playStartTime = Date.now();
		}
	};

	p._resume = function () {
		if (this._audioSprite) {
			this._audioSpriteTimeout = setTimeout(this._audioSpriteEndHandler, this._duration - this._position)
		}

		this._playbackResource.play({playAudioWhenScreenIsLocked: this.playWhenScreenLocked});
		this._playStartTime = Date.now();
	};

	p._handleStop = function() {
		clearTimeout(this._audioSpriteTimeout);
		this._playbackResource.pause(); // cannot use .stop because it prevents .seekTo from working
		this._playbackResource.seekTo(this._startTime);
		if (this._playStartTime) {
			this._position = 0;
			this._playStartTime = null;
		}
	};

	p._updateVolume = function () {
		var newVolume = (this._muted || createjs.Sound._masterMute) ? 0 : this._volume * createjs.Sound._masterVolume;
		this._playbackResource.setVolume(newVolume);
	};

	p._calculateCurrentPosition = function() {
		// return best guess position.
		// Note if Media and js clock are out of sync, this value will become increasingly inaccurate over time
		if (this._playStartTime) {
			this._position = Date.now() - this._playStartTime + this._position;
			this._playStartTime = Date.now();
		}
		return this._position;
	};

	p._updatePosition = function() {
		this._playbackResource.seekTo(this._startTime + this._position);
		this._playStartTime = Date.now();
		if (this._audioSprite) {
			clearTimeout(this._audioSpriteTimeout);
			this._audioSpriteTimeout = setTimeout(this._audioSpriteEndHandler, this._duration - this._position)
		}
	};

	p._handleLoop = function (event) {
		this._handleSoundReady();
	};

	p._updateStartTime = function () {
		this._audioSprite = true;

		if(this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			// do nothing
		}
	};

	p._updateDuration = function () {
		this._audioSprite

		if(this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			clearTimeout(this._audioSpriteTimeout);
			this._audioSpriteTimeout = setTimeout(this._audioSpriteEndHandler, this._duration - this.position)
		}
	};

	p._setDurationFromSource = function () {
		this._duration = createjs.Sound.activePlugin.getSrcDuration(this.src);	// TODO find a better way to do this that does not break flow
	};

	createjs.CordovaAudioSoundInstance = createjs.promote(CordovaAudioSoundInstance, "AbstractSoundInstance");
}());
