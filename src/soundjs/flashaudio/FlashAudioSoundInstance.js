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

	// NOTE documentation for this class can be found online or in WebAudioPlugin.SoundInstance
	// NOTE audio control is shuttled to a flash player instance via the flash reference.
	function SoundInstance(src, startTime, duration, owner, flash) {
		this._init(src, startTime, duration, owner, flash);
	}

	var p = SoundInstance.prototype = new createjs.EventDispatcher();
	p.constructor = SoundInstance;

	p.src = null;
	p.uniqueId = -1;
	p._owner = null;
	p._capabilities = null;
	p._flash = null;
	p.flashId = null; // To communicate with Flash
	p._remainingLoops = 0;
	if (createjs.definePropertySupported) {
		Object.defineProperty(p, "loop", {
			get: function() {
				return this._remainingLoops;
			},
			set: function(value) {
				this._remainingLoops = value;
				return this._flash.setLoop(this.flashId, value);
			}
		});
	}
	p._volume =  1;
	p._pan =  0;
	p._offset = 0; // used for setPosition on a stopped instance
	p._startTime = 0;
	p._duration = 0;
	p._delayTimeoutId = null;
	p._muted = false;
	p.paused = false;
	p._paused = false;

	if (createjs.definePropertySupported) {
		Object.defineProperty(p, "volume", {
			get: function() {
				return this._volume;
			},
			set: function(value) {
				if (Number(value) == null) {return;}
				value = Math.max(0, Math.min(1, value));
				this._volume = value;
				return this._flash.setVolume(this.flashId, value)
			}
		});
		Object.defineProperty(p, "pan", {
			get: function() {
				return this._pan;
			},
			set: function(value) {
				if (Number(value)==null) {return;}
				value = Math.max(-1, Math.min(1, value));	// force pan to stay in the -1 to 1 range
				this._pan = value;
				return this._flash.setPan(this.flashId, value);
			}
		});
	}
// Constructor
	p._init = function (src, startTime, duration, owner, flash) {
		this.src = src;
		this._startTime = startTime || 0;
		this._duration = duration || flash.getDurationBySrc(src);
		this._owner = owner;
		this._flash = flash;
	};

	p.initialize = function (flash) {
		this._flash = flash;
	};

// Public API

	p._interrupt = function () {
		this.playState = createjs.Sound.PLAY_INTERRUPTED;
		this._flash.interrupt(this.flashId);	// OJR this is redundant, cleanup calls stop that does the same thing anyway
		this._cleanUp();
		this._sendEvent("interrupted");
	};

	p._cleanUp = function () {
		this.paused = this._paused = false;
		this._flash.stopSound(this.flashId);

		clearTimeout(this._delayTimeoutId);
		this._owner.unregisterSoundInstance(this.flashId);
		createjs.Sound._playFinished(this);
	};

	p.play = function (interrupt, delay, offset, loop, volume, pan) {
		if (this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			if (interrupt instanceof Object) {
				offset = interrupt.offset;
				loop = interrupt.loop;
				volume = interrupt.volume;
				pan = interrupt.pan;
			}
			if (offset != null) { this.setPosition(offset) }
			if (loop != null) { this.loop = loop; }
			if (volume != null) { this.setVolume(volume); }
			if (pan != null) { this.setPan(pan); }
			if (this._paused) {	this.resume(); }
			return;
		}
		this._cleanUp();
		createjs.Sound._playInstance(this, interrupt, delay, offset, loop, volume, pan);
	};

	p._beginPlaying = function (offset, loop, volume, pan) {
		this._remainingLoops = loop;
		this.paused = this._paused = false;
		if (!this._owner.flashReady) {return false;}
		this._offset = offset;

		this.flashId = this._flash.playSound(this.src, offset, loop, volume, pan, this._startTime, this._duration);
		if (this.flashId == null) {
			this._cleanUp();
			return false;
		}

		//this._duration = this._flash.getDuration(this.flashId);  // this is 0 at this point
		if (this._muted) {this.setMute(true);}
		this.playState = createjs.Sound.PLAY_SUCCEEDED;
		this._owner.registerSoundInstance(this.flashId, this);
		this._sendEvent("succeeded");
		return true;
	};

	p.playFailed = function () {
		this.playState = createjs.Sound.PLAY_FAILED;
		this._cleanUp();
		this._sendEvent("failed");
	};

	p.pause = function () {
		if (this._paused || this.playState != createjs.Sound.PLAY_SUCCEEDED) {return false;}
		this.paused = this._paused = true;
		clearTimeout(this._delayTimeoutId);
		return this._flash.pauseSound(this.flashId);
	};

	p.resume = function () {
		if (!this._paused) {return false;}
		this.paused = this._paused = false;
		return this._flash.resumeSound(this.flashId);
	};

	p.stop = function () {
		this.playState = createjs.Sound.PLAY_FINISHED;
		this.paused = this._paused = false;
		this._offset = 0;
		var ok = this._flash.stopSound(this.flashId);
		this._cleanUp();
		return ok;
	};

	// leaving functionality in so IE8 will work
	p.setVolume = function (value) {
		if (Number(value) == null) {return;}
		value = Math.max(0, Math.min(1, value));
		this._volume = value;
		return this._flash.setVolume(this.flashId, value)
	};

	p.getVolume = function () {
		return this._volume;
	};

	p.setMute = function (value) {
		this._muted = value;
		return value ? this._flash.muteSound(this.flashId) : this._flash.unmuteSound(this.flashId);
	};

	p.getMute = function () {
		return this._muted;
	};

	p.getPan = function () {
		return this._pan;
	};

	// duplicating functionality to support IE8
	p.setPan = function (value) {
		if (Number(value)==null) {return;}
		value = Math.max(-1, Math.min(1, value));
		this._pan = value;
		return this._flash.setPan(this.flashId, value);
	};

	p.getPosition = function () {
		var value = -1;
		if (this._flash && this.flashId) {
			value = this._flash.getPosition(this.flashId);	// this returns -1 on stopped instance
		}
		if (value != -1) {this._offset = value;}
		return this._offset;
	};

	p.setPosition = function (value) {
		this._offset = value;
		this._flash && this.flashId && this._flash.setPosition(this.flashId, value);
		return true;
	};

	p.getDuration = function () {
		/* no longer needed, as we grab duration on init now
		if (!this._duration && this._flash && this.flashId) {
			this._duration = this._flash.getDuration(this.flashId);	// this returns -1 on stopped instance
		}
		*/
		return this._duration;
	};

// Flash callbacks, only exist in FlashAudioPlugin
	p._sendEvent = function (type) {
		var event = new createjs.Event(type);
		this.dispatchEvent(event);
	};

	/**
	 * Called from Flash.  Lets us know flash has finished playing a sound.
	 * #method handleSoundFinished
	 * @protected
	 */
	p.handleSoundFinished = function () {
		this.playState = createjs.Sound.PLAY_FINISHED;
		this._offset = 0;
		this._cleanUp();
		this._sendEvent("complete");
	};

	/**
	 * Called from Flash.  Lets us know that flash has played a sound to completion and is looping it.
	 * #method handleSoundLoop
	 * @protected
	 */
	p.handleSoundLoop = function () {
		this._sendEvent("loop");
	};

	p.toString = function () {
		return "[FlashAudioSoundInstance]"
	};

	createjs.FlashAudioSoundInstance = SoundInstance;
}());
