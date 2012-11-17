/*
* WebAudioPlugin for SoundJS
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2012 Christoph Martens (@martensms)
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
(function(global) {

	function WebAudioPlugin() {
		this.init();
	}

	WebAudioPlugin.isSupported = function() {

		WebAudioPlugin.generateCapabilities();
		var context = WebAudioPlugin.context;
		if (context == null) { return false; }

		return true;

	};

	WebAudioPlugin.generateCapabilities = function() {

		if (WebAudioPlugin.capabilities != null) { return; }

		var audio = null;

		if (global.Audio) {
			audio = new Audio();
		}

		if (global.webkitAudioContext) {
			WebAudioPlugin.context = new webkitAudioContext();
		}

		if (audio && WebAudioPlugin.context) {

			WebAudioPlugin.capabilities = {
				panning: false,
				volume: true,
				mp3: audio.canPlayType("audio/mp3") != "no" && audio.canPlayType("audio/mp3") != "",
				ogg: audio.canPlayType("audio/ogg") != "no" && audio.canPlayType("audio/ogg") != "",
				mpeg: audio.canPlayType("audio/mpeg") != "no" && audio.canPlayType("audio/mpeg") != "",
				wav: audio.canPlayType("audio/wav") != "no" && audio.canPlayType("audio/wav") != "",
				channels: 20
			};

		}

	};

	var _buffers = {};

	var p = WebAudioPlugin.prototype = {

		capabilities: null,

		init: function() {
			this.capabilities = WebAudioPlugin.capabilities;
			this.channels = {};
		},

		// TODO: PreloadJS should load arraybuffers, hugh?
		// https://github.com/CreateJS/PreloadJS/issues/14
		register: function(src, instances) {

			var xhr = new XMLHttpRequest();
			xhr.open('GET', src);
			xhr.responseType = 'arraybuffer';

			xhr.onload = function() {
				WebAudioPlugin.context.decodeAudioData(xhr.response, function(buffer) {
					_buffers[src] = buffer;
				});
			};

			xhr.send(null);

		},

		create: function(src) {

			var instance = new SoundInstance(src);
			instance.owner = this;
			return instance;

		}

	}

	createjs.SoundJS.WebAudioPlugin = WebAudioPlugin;



	function SoundInstance(src) {
		this.init(src);
	}

	var p = SoundInstance.prototype = {

		init: function(src) {
			this.src = src;
			this.muted = false;
			this.volume = 1;
			this.playState = null;
			this.onComplete = null;
			this.lastPlaybackCurrentTime = null;

			this.gain = WebAudioPlugin.context.createGainNode();
			this.gain.gain.value = this.volume;

		},

		interrupt: function () {
		},


		// WTF is this?
		play: function(interrupt, delay, offset, loop, volume, pan) {
			createjs.SoundJS.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		beginPlaying: function(offset, loop, volume, pan) {

			if (volume !== this.volume) {
				this.volume = volume;
				this.updateVolume()
			}

			var source = WebAudioPlugin.context.createBufferSource();
			source.buffer = _buffers[this.src];
			source.connect(this.gain);
			source.connect(WebAudioPlugin.context.destination);

			source.noteOn(WebAudioPlugin.context.currentTime);

			this.lastPlaybackCurrentTime = WebAudioPlugin.context.currentTime;

			// Why isn't it automatically done via SoundJS?
			var that = this;
			global.setTimeout(function() {
				that.playState = createjs.SoundJS.PLAY_FINISHED;
				that.lastPlayback = null;
				if (that.onComplete != null) that.onComplete(that);
			}, source.buffer.duration * 1000);


			if (loop === true) {
				source.loop = true;
			}

			return 1;

		},

		pause: function() {},

		resume: function() {},

		stop: function() {
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			return true;
		},

		// Called by SoundJS
		setMasterVolume: function(value) {
			this.updateVolume();
			return true;
		},

		setVolume: function(value) {
			this.volume = value;
			this.updateVolume();
			return true;
		},

		getVolume: function(value) {
			return this.volume;
		},

		mute: function(isMuted) {
			this.muted = isMuted;
			this.updateVolume();
			return true;
		},

		updateVolume: function() {

			if (this.gain !== null) {
				this.gain.gain.value = this.muted ? 0 : this.volume * createjs.SoundJS.masterVolume;
				return true;
			} else {
				return false;
			}

		},

		setPan: function(value) { return false; },

		getPan: function() { return 0; },

		getPosition: function() {
			if (this.lastPlaybackCurrentTime !== null) {
				return WebAudioPlugin.context.currentTime - this.lastPlaybackCurrentTime;
			} else {
				return 0;
			}
		},

		// One simply doesn't make it possible.
		setPosition: function(value) { return false; },

        getDuration: function() {
			if (_buffers[this.src]) {
				return _buffers[this.src].duration;
			} else {
				return 0;
			}
        },

		toString: function() {
			return "[WebAudio SoundInstance]";
		}

	};

}(window));
