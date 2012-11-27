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

/*
 * WebAudio Plugin provided by Zynga developer Sascha Goebel
 * https://github.com/CreateJS/SoundJS/pull/15
 *
 * This plugin only provides simple play/complete functionality, as well as internally
 * loading all required sounds.
 *
 * A fully functional WebAudio plugin will be included in the next release of SoundJS.
 */

(function(window) {

	function WebAudioPlugin() {
		this.init();
	}

    var s = WebAudioPlugin;

    s.isSupported = function() {

		s.generateCapabilities();
		var context = s.context;
		if (context == null) { return false; }

		return true;

	};

	s.generateCapabilities = function() {

		if (s.capabilities != null) { return; }

		var audio = null;

		if (typeof Audio == "function") {
			audio = new Audio();  // could use instead -> document.createElement("audio");
		}

        if(typeof AudioContext == "function") {
            s.context = new AudioContext();
        } else if (typeof webkitAudioContext == "function") {
			s.context = new webkitAudioContext();
		}

		if (audio && s.context) {
			s.capabilities = {
				panning: false,
				volume: true,
				mp3: audio.canPlayType("audio/mp3") != "no" && audio.canPlayType("audio/mp3") != "",
				ogg: audio.canPlayType("audio/ogg") != "no" && audio.canPlayType("audio/ogg") != "",
                mpeg: audio.canPlayType("audio/mpeg") != "no" && audio.canPlayType("audio/mpeg") != "",
                wav:audio.canPlayType("audio/wav") != "no" && audio.canPlayType("audio/wav") != "",
                mp4: audio.canPlayType("audio/mp4") != "no" && audio.canPlayType("audio/mp4") != "",
				channels: 20
			};
		}

	}

	var _buffers = {};  // TODO: change this to reside in the prototype or class scope

	var p = WebAudioPlugin.prototype = {

		capabilities: null,

		init: function() {
			this.capabilities = WebAudioPlugin.capabilities;
			this.channels = {};
		},

		register: function(src, instances) {
            // https://github.com/CreateJS/PreloadJS/issues/14
			var xhr = new XMLHttpRequest();
			xhr.open('GET', src);
			xhr.responseType = 'arraybuffer';

			xhr.onload = function(event) {
				// Note: We need to lookup buffers by their source, so we need a better way to reference them
				//      then the nested anonymous functions.
				WebAudioPlugin.context.decodeAudioData(event.target.response,
					function(buffer) {
						_buffers[src] = buffer;
					});
			}



			xhr.send(null);
        },


		create: function(src) {
			var instance = new SoundInstance(src);
			instance.owner = this;
			return instance;

		}

	}

	window.WebAudioPlugin = WebAudioPlugin;

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

			this.gainNode = WebAudioPlugin.context.createGainNode();
			this.gainNode.gain.value = this.volume;

		},

		interrupt: function () {
			//TODO: This should stop the audio. See HTMLAudioPlugin for usage.
		},


        // Public API
		play: function(interrupt, delay, offset, loop, volume, pan) {
			createjs.SoundJS.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

        // Called by SoundJS when ready
		beginPlaying: function(offset, loop, volume, pan) {
			if (volume !== this.volume) {
				this.volume = volume;
				this.updateVolume()
			}

			var source = WebAudioPlugin.context.createBufferSource();
			source.buffer = _buffers[this.src];
			source.connect(this.gainNode);
			source.connect(WebAudioPlugin.context.destination);

			source.noteOn(WebAudioPlugin.context.currentTime);

			this.lastPlaybackCurrentTime = WebAudioPlugin.context.currentTime;

			setTimeout(createjs.SoundJS.proxy(this.handlePlaybackComplete, this), source.buffer.duration*1000);

			//LM: Should we do this?
			if (loop === true) {
				source.loop = true;
			}

			return 1;

		},

		handlePlaybackComplete: function() {
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			this.lastPlayback = null;
			if (this.onComplete != null) { this.onComplete(this); }
		},

		pause: function() {
	        //TODO
        },

		resume: function() {
	        //TODO
        },

		stop: function() {
	        //TODO
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			return true;
		},

		// Called by SoundJS
		setMasterVolume: function(value) {
			//TODO
			this.updateVolume();
			return true;
		},

		setVolume: function(value) {
			this.volume = value;
			this.updateVolume();
			return true;
		},

        updateVolume: function() {
            if (this.gainNode !== null) {
                this.gainNode.gain.value = this.muted ? 0 : this.volume * createjs.SoundJS.masterVolume;
                return true;
            } else {
                return false;
            }

        },

		getVolume: function(value) {
			return this.volume;
		},

		mute: function(isMuted) {
			this.muted = isMuted;
			this.updateVolume();
			return true;
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

		setPosition: function(value) { return false; },

        getDuration: function() {
			if (_buffers[this.src]) {
				return _buffers[this.src].duration;
			} else {
				return 0;
			}
        },

        // Play has failed
        playFailed: function() {
            if (window.createjs == null) { return; }
            this.playState = createjs.SoundJS.PLAY_FAILED;
            if (this.onPlayFailed != null) { this.onPlayFailed(this); }
        },

		toString: function() {
			return "[WebAudio SoundInstance]";
		}

	}

}(window));
