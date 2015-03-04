/*
 * FlashSoundInstance
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
	 * FlashAudioSoundInstance extends the base api of {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} and is used by
	 * {{#crossLink "FlashAudioPlugin"}}{{/crossLink}}.
	 *
	 * NOTE audio control is shuttled to a flash player instance via the flash reference.
	 *
	 * @param {String} src The path to and file name of the sound.
	 * @param {Number} startTime Audio sprite property used to apply an offset, in milliseconds.
	 * @param {Number} duration Audio sprite property used to set the time the clip plays for, in milliseconds.
	 * @param {Object} playbackResource Any resource needed by plugin to support audio playback.
	 * @class FlashAudioSoundInstance
	 * @extends AbstractSoundInstance
	 * @constructor
	 */
	function FlashAudioSoundInstance(src, startTime, duration, playbackResource) {
		this.AbstractSoundInstance_constructor(src, startTime, duration, playbackResource);


// Public Properties
		/**
		 * ID used to facilitate communication with flash.
		 * Not doc'd because this should not be altered externally
		 * #property flashId
		 * @type {String}
		 */
		this.flashId = null; // To communicate with Flash

		if(s._flash == null) { s._instances.push(this); }
	};
	var p = createjs.extend(FlashAudioSoundInstance, createjs.AbstractSoundInstance);

	// TODO: deprecated
	// p.initialize = function() {}; // searchable for devs wondering where it is. REMOVED. See docs for details.


// Static Propeties
	var s = FlashAudioSoundInstance;
	/**
	 * A reference to the Flash instance that gets created.
	 * #property flash
	 * @type {Object | Embed}
	 */
	s._flash = null;

	/**
	 * A list of loader instances that tried to load before _flash was set
	 * #property _preloadInstances
	 * @type {Array}
	 * @private
	 */
	s._instances = [];

	/**
	 * Set the Flash instance on the class, and start loading on any instances that had load called
	 * before flash was ready
	 * #method setFlash
	 * @param flash Flash instance that handles loading and playback
	 */
	s.setFlash = function(flash) {
		s._flash = flash;
		for(var i = s._instances.length; i--; ) {
			var o = s._instances.pop();
			o._setDurationFromSource();
		}
	};


// Public Methods
	// TODO change flash.setLoop to mimic remove and add??
	p.setLoop = function (value) {
		if(this.flashId!= null) {
			s._flash.setLoop(this.flashId, value);
		}
		this._loop = value;
	};

	p.toString = function () {
		return "[FlashAudioSoundInstance]"
	};


// Private Methods
	p._updateVolume = function() {
		if (this.flashId == null) { return; }
		s._flash.setVolume(this.flashId, this._volume)
	};

	p._updatePan = function () {
		if (this.flashId == null) { return; }
		s._flash.setPan(this.flashId, this._pan);
	};

	p._setDurationFromSource = function() {
		this._duration = s._flash.getDurationBySrc(this.src);
	};

	p._interrupt = function () {
		if(this.flashId == null) { return; }
		s._flash.interrupt(this.flashId);	// OJR this is redundant, cleanup calls stop that does the same thing anyway
		this.AbstractSoundInstance__interrupt();
	};

	p._handleCleanUp = function () {
		s._flash.stopSound(this.flashId);

		this._sendEvent(createjs.FlashAudioPlugin._UNREG_FLASHID);
		this.flashId = null;
	};

	p._beginPlaying = function (playProps) {
		if (s._flash == null) { return false; }

		this.setPosition(playProps.offset);
		this.setLoop(playProps.loop);
		this.setVolume(playProps.volume);
		this.setPan(playProps.pan);
		if (playProps.startTime != null) {
			this.setStartTime(playProps.startTime);
			this.setDuration(playProps.duration);
		}
		this._paused = false;

		this.flashId = s._flash.playSound(this.src, this._position, this._loop, this._volume, this._pan, this._startTime, this._duration);
		if (this.flashId == null) {
			this._playFailed();
			return false;
		}

		if (this._muted) {this.setMute(true);}
		this._sendEvent(createjs.FlashAudioPlugin._REG_FLASHID);

		this.playState = createjs.Sound.PLAY_SUCCEEDED;
		this._sendEvent("succeeded");
		return true;
	};

	p._pause = function () {
		if(this.flashId == null) { return; }
		this._position = this._calculateCurrentPosition();
		s._flash.pauseSound(this.flashId);
	};

	p._resume = function () {
		if(this.flashId == null) { return; }
		s._flash.resumeSound(this.flashId);
	};

	p._handleStop = function () {
		if(this.flashId == null) { return; }
		s._flash.stopSound(this.flashId);
	};

	p._updateVolume = function () {
		var newVolume = this._muted ? 0 : this._volume;
		s._flash.setVolume(this.flashId, newVolume);
	};
	// TODO remove unused .muteSound and .unmuteSound from Flash

	p._calculateCurrentPosition = function() {
		return s._flash.getPosition(this.flashId);
	};

	p._updatePosition = function() {
		if(this.flashId == null) { return; }
		s._flash.setPosition(this.flashId, this._position);
	};

// Flash callbacks, only exist in FlashAudioPlugin
	/**
	 * Called from Flash.  Lets us know flash has finished playing a sound.
	 * #method handleSoundFinished
	 * @protected
	 */
	p.handleSoundFinished = function () {
		this._loop = 0;
		this._handleSoundComplete();
	};

	/**
	 * Called from Flash.  Lets us know that flash has played a sound to completion and is looping it.
	 * #method handleSoundLoop
	 * @protected
	 */
	p.handleSoundLoop = function () {
		this._loop--;
		this._sendEvent("loop");
	};

	createjs.FlashAudioSoundInstance = createjs.promote(FlashAudioSoundInstance, "AbstractSoundInstance");
}());
