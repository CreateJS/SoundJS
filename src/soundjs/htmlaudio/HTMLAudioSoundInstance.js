/*
 * HTMLAudioSoundInstance
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
	 * HTMLAudioSoundInstance extends the base api of {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} and is used by
	 * {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}.
	 *
	 * @param {String} src The path to and file name of the sound.
	 * @param {Number} startTime Audio sprite property used to apply an offset, in milliseconds.
	 * @param {Number} duration Audio sprite property used to set the time the clip plays for, in milliseconds.
	 * @param {Object} playbackResource Any resource needed by plugin to support audio playback.
	 * @class HTMLAudioSoundInstance
	 * @extends AbstractSoundInstance
	 * @constructor
	 */
	function HTMLAudioSoundInstance(src, startTime, duration, playbackResource) {
		this.AbstractSoundInstance_constructor(src, startTime, duration, playbackResource);


// Private Properties
		this._audioSpriteStopTime = null;
		this._delayTimeoutId = null;

		// Proxies, make removing listeners easier.
		this._endedHandler = createjs.proxy(this._handleSoundComplete, this);
		this._readyHandler = createjs.proxy(this._handleTagReady, this);
		this._stalledHandler = createjs.proxy(this._playFailed, this);
		this._audioSpriteEndHandler = createjs.proxy(this._handleAudioSpriteLoop, this);
		this._loopHandler = createjs.proxy(this._handleSoundComplete, this);

		if (duration) {
			this._audioSpriteStopTime = (startTime + duration) * 0.001;
		} else {
			this._duration = createjs.HTMLAudioTagPool.getDuration(this.src);
		}
	}
	var p = createjs.extend(HTMLAudioSoundInstance, createjs.AbstractSoundInstance);

	// TODO: deprecated
	// p.initialize = function() {}; // searchable for devs wondering where it is. REMOVED. See docs for details.


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

	p.toString = function () {
		return "[HTMLAudioSoundInstance]";
	};

//Private Methods
	p._removeLooping = function() {
		if(this._playbackResource == null) {return;}
		this._playbackResource.loop = false;
		this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._loopHandler, false);
	};

	p._addLooping = function() {
		if(this._playbackResource == null  || this._audioSpriteStopTime) {return;}
		this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._loopHandler, false);
		this._playbackResource.loop = true;
	};

	p._handleCleanUp = function () {
		var tag = this._playbackResource;
		if (tag != null) {
			tag.pause();
			tag.loop = false;
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED, this._stalledHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._loopHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this._audioSpriteEndHandler, false);

			try {
				tag.currentTime = this._startTime;
			} catch (e) {
			} // Reset Position
			createjs.HTMLAudioTagPool.set(this.src, tag);
			this._playbackResource = null;
		}
	};

	p._beginPlaying = function (playProps) {
		this._playbackResource = createjs.HTMLAudioTagPool.get(this.src);
		return this.AbstractSoundInstance__beginPlaying(playProps);
	};

	p._handleSoundReady = function (event) {
		if (this._playbackResource.readyState !== 4) {
			var tag = this._playbackResource;
			tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
			tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED, this._stalledHandler, false);
			tag.preload = "auto"; // This is necessary for Firefox, as it won't ever "load" until this is set.
			tag.load();
			return;
		}

		this._updateVolume();
		this._playbackResource.currentTime = (this._startTime + this._position) * 0.001;
		if (this._audioSpriteStopTime) {
			this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this._audioSpriteEndHandler, false);
		} else {
			this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			if(this._loop != 0) {
				this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._loopHandler, false);
				this._playbackResource.loop = true;
			}
		}

		this._playbackResource.play();
	};

	/**
	 * Used to handle when a tag is not ready for immediate playback when it is returned from the HTMLAudioTagPool.
	 * @method _handleTagReady
	 * @param event
	 * @protected
	 */
	p._handleTagReady = function (event) {
		this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
		this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED, this._stalledHandler, false);

		this._handleSoundReady();
	};

	p._pause = function () {
		this._playbackResource.pause();
	};

	p._resume = function () {
		this._playbackResource.play();
	};

	p._updateVolume = function () {
		if (this._playbackResource != null) {
			var newVolume = (this._muted || createjs.Sound._masterMute) ? 0 : this._volume * createjs.Sound._masterVolume;
			if (newVolume != this._playbackResource.volume) {this._playbackResource.volume = newVolume;}
		}
	};

	p._calculateCurrentPosition = function() {
		return (this._playbackResource.currentTime * 1000) - this._startTime;
	};

	p._updatePosition = function() {
		this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._loopHandler, false);
		this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._handleSetPositionSeek, false);
		try {
			this._playbackResource.currentTime = (this._position + this._startTime) * 0.001;
		} catch (error) { // Out of range
			this._handleSetPositionSeek(null);
		}
	};

	/**
	 * Used to enable setting position, as we need to wait for that seek to be done before we add back our loop handling seek listener
	 * @method _handleSetPositionSeek
	 * @param event
	 * @protected
	 */
	p._handleSetPositionSeek = function(event) {
		if (this._playbackResource == null) { return; }
		this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._handleSetPositionSeek, false);
		this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._loopHandler, false);
	};

	/**
	 * Timer used to loop audio sprites.
	 * NOTE because of the inaccuracies in the timeupdate event (15 - 250ms) and in setting the tag to the desired timed
	 * (up to 300ms), it is strongly recommended not to loop audio sprites with HTML Audio if smooth looping is desired
	 *
	 * @method _handleAudioSpriteLoop
	 * @param event
	 * @private
	 */
	p._handleAudioSpriteLoop = function (event) {
		if(this._playbackResource.currentTime <= this._audioSpriteStopTime) {return;}
		this._playbackResource.pause();
		if(this._loop == 0) {
			this._handleSoundComplete(null);
		} else {
			this._position = 0;
			this._loop--;
			this._playbackResource.currentTime = this._startTime * 0.001;
			if(!this._paused) {this._playbackResource.play();}
			this._sendEvent("loop");
		}
	};

	// NOTE with this approach audio will loop as reliably as the browser allows
	// but we could end up sending the loop event after next loop playback begins
	p._handleLoop = function (event) {
		if(this._loop == 0) {
			this._playbackResource.loop = false;
			this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._loopHandler, false);
		}
	};

	p._updateStartTime = function () {
		this._audioSpriteStopTime = (this._startTime + this._duration) * 0.001;

		if(this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this._audioSpriteEndHandler, false);
		}
	};

	p._updateDuration = function () {
		this._audioSpriteStopTime = (this._startTime + this._duration) * 0.001;

		if(this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			this._playbackResource.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			this._playbackResource.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this._audioSpriteEndHandler, false);
		}
	};

	/*	This should never change
	p._setDurationFromSource = function () {
		this._duration = createjs.HTMLAudioTagPool.getDuration(this.src);
	};
	*/

	createjs.HTMLAudioSoundInstance = createjs.promote(HTMLAudioSoundInstance, "AbstractSoundInstance");
}());
