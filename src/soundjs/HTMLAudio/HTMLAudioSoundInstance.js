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

	// NOTE Documentation for the SoundInstance class in WebAudioPlugin file. Each plugin generates a SoundInstance that
	// follows the same interface.
	function SoundInstance(src, startTime, duration, owner) {
		this._init(src, startTime, duration, owner);
	}

	var p = SoundInstance.prototype = new createjs.EventDispatcher();
	p.constructor = SoundInstance;

	p.src = null;
	p.uniqueId = -1;
	p.playState = null;
	p._owner = null;
	p.loaded = false;
	p._offset = 0;
	p._startTime = 0;
	p._volume =  1;
	if (createjs.definePropertySupported) {
		Object.defineProperty(p, "volume", {
			get: function() {
				return this._volume;
			},
			set: function(value) {
				if (Number(value) == null) {return;}
				value = Math.max(0, Math.min(1, value));
				this._volume = value;
				this._updateVolume();
			}
		});
	}
	p.pan = 0;
	p._duration = 0;
	p._audioSpriteStopTime = null;	// HTMLAudioPlugin only
	p._remainingLoops = 0;
	if (createjs.definePropertySupported) {
		Object.defineProperty(p, "loop", {
			get: function() {
				return this._remainingLoops;
			},
			set: function(value) {
				if (this.tag != null) {
					// remove looping
					if (this._remainingLoops != 0 && value == 0) {
						this.tag.loop = false;
						this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);
					}
					// add looping
					if (this._remainingLoops == 0 && value != 0) {
						this.tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);
						this.tag.loop = true;
					}
				}
				this._remainingLoops = value;
			}
		});
	}
	p._delayTimeoutId = null;
	p.tag = null;
	p._muted = false;
	p.paused = false;
	p._paused = false;

	// Proxies, make removing listeners easier.
	p._endedHandler = null;
	p._readyHandler = null;
	p._stalledHandler = null;
	p._audioSpriteEndHandler = null;
	p.loopHandler = null;

// Constructor
	p._init = function (src, startTime, duration, owner) {
		this.src = src;
		this._startTime = startTime || 0;	// convert ms to s as web audio handles everything in seconds
		if (duration) {
			this._duration = duration;
			this._audioSpriteStopTime = (startTime + duration) * 0.001;
		} else {
			this._duration = createjs.HTMLAudioPlugin.TagPool.getDuration(this.src);
		}
		this._owner = owner;

		this._endedHandler = createjs.proxy(this._handleSoundComplete, this);
		this._readyHandler = createjs.proxy(this._handleSoundReady, this);
		this._stalledHandler = createjs.proxy(this._handleSoundStalled, this);
		this.__audioSpriteEndHandler = createjs.proxy(this._handleAudioSpriteLoop, this);
		this.loopHandler = createjs.proxy(this.handleSoundLoop, this);
	};

	p._sendEvent = function (type) {
		var event = new createjs.Event(type);
		this.dispatchEvent(event);
	};

	p._cleanUp = function () {
		var tag = this.tag;
		if (tag != null) {
			tag.pause();
			this.tag.loop = false;
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this.__audioSpriteEndHandler, false);

			try {
				tag.currentTime = this._startTime;
			} catch (e) {
			} // Reset Position
			createjs.HTMLAudioPlugin.TagPool.setInstance(this.src, tag);
			this.tag = null;
		}

		clearTimeout(this._delayTimeoutId);
		createjs.Sound._playFinished(this);
	};

	p._interrupt = function () {
		if (this.tag == null) {return;}
		this.playState = createjs.Sound.PLAY_INTERRUPTED;
		this._cleanUp();
		this.paused = this._paused = false;
		this._sendEvent("interrupted");
	};

// Public API
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
		var tag = this.tag = createjs.HTMLAudioPlugin.TagPool.getInstance(this.src);
		if (tag == null) {
			this.playFailed();
			return -1;
		}

		tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);

		// Reset this instance.
		this._offset = offset;
		this.volume = volume;
		this._updateVolume();
		this._remainingLoops = loop;

		if (tag.readyState !== 4) {
			tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
			tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED, this._stalledHandler, false);
			tag.preload = "auto"; // This is necessary for Firefox, as it won't ever "load" until this is set.
			tag.load();
		} else {
			this._handleSoundReady(null);
		}

		this._sendEvent("succeeded");
		return 1;
	};

	// Note: Sounds stall when trying to begin playback of a new audio instance when the existing instances
	//  has not loaded yet. This doesn't mean the sound will not play.
	p._handleSoundStalled = function (event) {
		this._cleanUp();  // OJR this will stop playback, we could remove this and let the developer decide how to handle stalled instances
		this._sendEvent("failed");
	};

	p._handleSoundReady = function (event) {
		this.playState = createjs.Sound.PLAY_SUCCEEDED;
		this.paused = this._paused = false;
		this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
		this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);

		if (this._offset >= this.getDuration()) {
			this.playFailed();
			return;
		}
		this.tag.currentTime = (this._startTime + this._offset) * 0.001;

		if (this._audioSpriteStopTime) {
			this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			this.tag.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this.__audioSpriteEndHandler, false);
		} else {
			if(this._remainingLoops != 0) {
				this.tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);
				this.tag.loop = true;
			}
		}

		this.tag.play();
	};

	p.pause = function () {
		if (!this._paused && this.playState == createjs.Sound.PLAY_SUCCEEDED && this.tag != null) {
			this.paused = this._paused = true;
			this.tag.pause();
			clearTimeout(this._delayTimeoutId);
			return true;
		}
		return false;
	};

	p.resume = function () {
		if (!this._paused || this.tag == null) {return false;}
		this.paused = this._paused = false;
		this.tag.play();
		return true;
	};

	p.stop = function () {
		this._offset = 0;
		this.pause();
		this.playState = createjs.Sound.PLAY_FINISHED;
		this._cleanUp();
		return true;
	};

	p.setMasterVolume = function (value) {
		this._updateVolume();
	};

	p.setVolume = function (value) {
		this.volume = value;
		return true;
	};

	p._updateVolume = function () {
		if (this.tag != null) {
			var newVolume = (this._muted || createjs.Sound._masterMute) ? 0 : this._volume * createjs.Sound._masterVolume;
			if (newVolume != this.tag.volume) {this.tag.volume = newVolume;}
		}
	};

	p.getVolume = function (value) {
		return this.volume;
	};

	p.setMasterMute = function (isMuted) {
		this._updateVolume();
	};

	p.setMute = function (isMuted) {
		if (isMuted == null) {return false;}
		this._muted = isMuted;
		this._updateVolume();
		return true;
	};

	p.getMute = function () {
		return this._muted;
	};

	// Can not set pan in HTML audio
	p.setPan = function (value) {
		return false;
	};

	p.getPan = function () {
		return 0;
	};

	p.getPosition = function () {
		if (this.tag == null) {return this._offset;}
		return (this.tag.currentTime * 1000) - this._startTime;
	};

	p.setPosition = function (value) {
		if (this.tag == null) {
			this._offset = value
		} else {
			this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);
			this.tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._handleSetPositionSeek, false);
			try {
				value = value + this._startTime;
				this.tag.currentTime = value * 0.001;
			} catch (error) { // Out of range
				this._handleSetPositionSeek(null);
				return false;
			}
		}
		return true;
	};

	p._handleSetPositionSeek = function(event) {
		if (this.tag == null) { return; }
		this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this._handleSetPositionSeek, false);
		this.tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);
	};

	p.getDuration = function () {  // NOTE this will always return 0 until sound has been played unless it is set
		return this._duration;
	};

	p._handleSoundComplete = function (event) {
		this._offset = 0;
		this.playState = createjs.Sound.PLAY_FINISHED;
		this._cleanUp();
		this._sendEvent("complete");
	};

	// NOTE because of the inaccuracies in the timeupdate event (15 - 250ms) and in setting the tag to the desired timed
	// (up to 300ms), it is strongly recommended not to loop audio sprites with HTML Audio if smooth looping is desired
	p._handleAudioSpriteLoop = function (event) {
		if(this.tag.currentTime <= this._audioSpriteStopTime) {return;}
		this.tag.pause();
		if(this._remainingLoops == 0) {
			this._handleSoundComplete(null);
		} else {
			this._offset = 0;
			this._remainingLoops--;
			this.tag.currentTime = this._startTime * 0.001;
			if(!this._paused) {this.tag.play();}
			this._sendEvent("loop");
		}
	};

	// NOTE with this approach audio will loop as reliably as the browser allows
	// but we could end up sending the loop event after next loop playback begins
	p.handleSoundLoop = function (event) {
		this._offset = 0;
		this._remainingLoops--;
		if(this._remainingLoops == 0) {
			this.tag.loop = false;
			this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_SEEKED, this.loopHandler, false);
		}
		this._sendEvent("loop");
	};

	p.playFailed = function () {
		this.playState = createjs.Sound.PLAY_FAILED;
		this._cleanUp();
		this._sendEvent("failed");
	};

	p.toString = function () {
		return "[HTMLAudioPlugin SoundInstance]";
	};

	createjs.HTMLAudioPlugin.SoundInstance = SoundInstance;

}());
