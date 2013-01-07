/*
* WebAudioPlugin for SoundJS
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
this.createjs = this.createjs||{};

(function() {

	/**
	 * Play sounds using Web Audio in the browser.
	 * @class WebAudioPlugin
	 * @constructor
	 */
	function WebAudioPlugin() {
		this.init();
	}

	var s = WebAudioPlugin;

	/**
	 * The capabilities of the plugin.
	 * @property capabilities
	 * @type Object
	 * @default null
	 * @static
	 */
	s.capabilities = null;

	/**
	 * Determine if the plugin can be used.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function() {
		s.generateCapabilities();
		if (s.context == null) { return false; }
		return true;
	};

	/**
	 * Determine the capabilities of the plugin.  Used internally.
	 * @method generateCapabiities
	 * @static
     * @private
	 */
	s.generateCapabilities = function() {
		if (s.capabilities != null) { return; }
        // Web Audio can be in any formats supported by the audio element, from http://www.w3.org/TR/webaudio/#AudioContext-section,
        // therefore tag is still required for the capabilities check
		var t = document.createElement("audio");

        if (t.canPlayType == null) { return null; }

		// This check is first because it's what is currently used, but the spec calls for it to be AudioContext so this
		//  will probably change in time
        if(window.webkitAudioContext) {
            s.context = new webkitAudioContext();
        } else if (window.AudioContext) {
            s.context = new AudioContext();
        } else {
            return null;
        }

        s.capabilities = {
			panning: true,
			volume: true,
            tracks: -1
		};

        // determine which extensions our browser supports for this plugin by iterating through SoundJS.SUPPORTED_EXTENSIONS
        for(var i= 0, l = createjs.SoundJS.SUPPORTED_EXTENSIONS.length; i < l; i++) {
            var ext = createjs.SoundJS.SUPPORTED_EXTENSIONS[i];
            var playType = createjs.SoundJS.EXTENSION_MAP[ext] || ext;
            s.capabilities[ext] = (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
        }  // OJR another way to do this might be canPlayType:"m4a", codex: mp4

        // 0=no output, 1=mono, 2=stereo, 4=surround, 6=5.1 surround.
        // See http://www.w3.org/TR/webaudio/#AudioChannelSplitter for more details on channels.
        if(s.context.destination.numberOfChannels < 2) {
            s.capabilities.panning = false;
        }

        // set up AudioNodes that all of our source audio will connect to
        s.dynamicsCompressorNode = s.context.createDynamicsCompressor();
        s.dynamicsCompressorNode.connect(s.context.destination);
        s.gainNode = s.context.createGainNode();
        s.gainNode.connect(s.dynamicsCompressorNode);
    }

	var p = s.prototype = {

		capabilities: null,
		FT: 0.001,

        volume:1,

        /**
         * The web audio context.  There will only ever be one of these.
         * @property context
         * @type AudioContext
         * @default null
         * @static
         */
        context: null,

        /**
         * DynamicsCompressorNode used to improve sound and prevent audio distortion according to
         * http://www.w3.org/TR/webaudio/#DynamicsCompressorNode
         * Connected to context.destination.
         * @property dynamicsCompressorNode
         * @type AudioNode
         * @default null
         */
        dynamicsCompressorNode:null,

        /**
         * GainNode for controlling master volume.
         * Connected to dynamicsCompressorNode.
         * @property gainNode
         * @type AudioGainNode
         * @default null
         */
        gainNode: null,

        /**
         * arrayBuffers is used internally to store an ArrayBuffer that is referenced by the source file used to load it.
         * This is used so we do not have to continually load and decode audio files.  If a load has been started on a
         * file, arrayBuffers[src] will be set to true.  Once load is complete, it is set the the loaded ArrayBuffer.
         * @property arrayBuffers
         * @type {Object}
         * @default null
         * @private
         */
        arrayBuffers: null,

		init: function() {
			this.capabilities = s.capabilities;
			this.arrayBuffers = {};

            this.context = s.context;
            this.gainNode = s.gainNode;
            this.dynamicsCompressorNode = s.dynamicsCompressorNode;
		},

		/**
		 * Pre-register a sound instance for preloading and setup. This is called by SoundJS.  Note that WebAudio
         * returns a <code>BINARY</code> type property, which ensures that PreloadJS will use XHR to load the audio.
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * @return {Object} A result object, containing a tag for preloading purposes.
		 */
		register: function(src, instances) {
			this.arrayBuffers[src] = true;  // OJR this seems incorrect, need to review
            var tag = new WebAudioLoader(src, this);
            return {
                tag: tag
            };
        },

		/**
		 * Checks if preloading has started for a src
		 * @param src The sound URI to load.
		 * @return {Boolean}
		 */
		isPreloadStarted: function(src) {
			return (this.arrayBuffers[src] != null);
		},

        /**
         * Checks if preloading has finished for a src
         * @param src The sound URI to load.
         * @return {Boolean}
         */
        isPreloadComplete: function(src) {
            return (!(this.arrayBuffers[src] == null || this.arrayBuffers[src] == true)); // NOTE this.owner.arrayBuffers[this.src] is true when loading has begun but not finished
        },

        /**
         * Remove a src from our preload list.
         * Note this does not cancel a preload.
         * @param src The sound URI to unload.
         * @return {Boolean}
         */
        removeFromPreload: function(src) {
            delete(this.owner.arrayBuffers[src]);
        },

        /**
         * Add results to our preload list.
         * @param src The sound URI to unload.
         * @return {Boolean}
         */
        addPreloadResults: function(src, result) {
            this.arrayBuffers[src] = result;
        },

        /**
         * Handles internal preloader completing
         */
        handlePreloadComplete: function() {
            createjs.SoundJS.sendLoadComplete(this.src);  // fire event or callback on SoundJS
            // note "this" will reference WebAudioLoader object
        },

        /**
         * Internally preload a sound. Loading uses XHR2 in order to get back an array buffer for use with Web Audio.
         * @method preload
         * @param {String} src The sound URI to load.
         * @param {Object} instance  Not used in this plugin.
         * @protected
         */
        preload: function(src, instance) {
            this.arrayBuffers[src] = true;
	        var loader = new WebAudioLoader(src, this);
            loader.onload = this.handlePreloadComplete;
            loader.load();
        },

		/**
		 * Create a sound instance.
		 * @method create
		 * @param {String} src The source to use.
		 * @return {SoundInstance} A sound instance for playback and control.
		 */
		create: function(src) {
            if (!this.isPreloadStarted(src)) {
                this.preload(src);
            }
			return new SoundInstance(src, this);
		},

        /**
         * Set the master volume, which affects all SoundInstances.
         * @method setVolume
         * @param value
         * @return {Boolean} If the setVolume call succeeds.
         */
        setVolume: function(value) {
            this.volume = value;
            return this.updateVolume();
        },

		/**
		 * Internal function used to set the gain value for master audio.  Should not be called externally.
         * @method updateVolume
		 * @return {Boolean}
         * @private
		 */
        updateVolume: function() {
            var newVolume = createjs.SoundJS.masterMute ? 0 : this.volume;
            if (newVolume != this.gainNode.gain.value) {
                this.gainNode.gain.value = newVolume;
            }
            return true;
        },

        /**
         * Get the master volume, which affects all SoundInstances.
         * @method getVolume
         * @param value
         * @return The master volume.
         */
        getVolume: function(value) {
            return this.volume;
        },

        /**
         * Mute all sound.
         * @method setMute
         * @param {Boolean} isMuted If all sound should be muted or not.
         * @return {Boolean} If the mute call succeeds.
         */
        setMute: function(isMuted) {
            return this.updateVolume();
        },

        toString: function() {
			return "[WebAudioPlugin]";
		}

	}

	createjs.WebAudioPlugin = WebAudioPlugin;


	/**
	 * Sound Instances are created when any calls to SoundJS.play() or SoundJS.createInstance are made.
	 * The instances are returned by the active plugin for control by the user.
	 * Users can control audio directly through the instance.
	 * @class SoundInstance
	 * @param {String} src The path to the sound
	 * @param {Object} owner The plugin instance that created this SoundInstance.
	 * @constructor
	 */
	function SoundInstance(src, owner) {
        this.init(src, owner);
	}

	var p = SoundInstance.prototype = {

		/**
		 * The source of the sound.
		 * @property src
		 * @type String
		 * @default null
         * @private
		 */
		src: null,

		/**
		 * The unique ID of the instance
		 * @property uniqueId
		 * @type String | Number
		 * @default -1
         * @private
		 */
		uniqueId:-1,

		/**
		 * The play state of the sound. Play states are defined as constants on SoundJS
		 * @property playState
		 * @type String
		 * @default null
         * @private
		 */
		playState: null,

		preloadState: null,

		/**
		 * The plugin that created the instance
		 * @property owner
		 * @type WebAudioPlugin
		 * @default null
         * @private
		 */
		owner: null,

		loaded: false,
		lastInterrupt: createjs.SoundJS.INTERRUPT_NONE,
		offset: 0,  // will convert this seconds for consistency with WebAudio API
		delay: 0,
		volume: 1,
		pan: 0,
        duration: 0,

        // used to handle looping
		remainingLoops: 0,
        // is created by SoundJS when this instance is played with a delay, so we can remove the delay if stop or pause or cleanup are called
		delayTimeoutId: null,
        // created internally to handle sound playing to completion, used to remove this when stop, pause, or cleanup is called
        soundCompleteTimeout: null,

        /**
         * panNode for panning left and right audio channels only.  Connected to our WebAudioPlugin DynamicCompressor that sequences to context.destination.   Only exists in WebAudioPlugin.
         * @property panNode
         * @type AudioPannerNode
         * @default null
         * // OJR expose the Nodes for more advanced users, test with LM how it will impact docs
         */
        panNode: null,

        /**
         * GainNode for controlling instance volume.  Connected to panNode.   Only exists in WebAudioPlugin.
         * @property gainNode
         * @type AudioGainNode
         * @default null
         *
         */
        gainNode: null,

        /**
         * sourceNode is our audio source. Connected to GainNode. Only exists in WebAudioPlugin.
         * @property sourceNode
         * @type AudioSourceNode
         * @default null
         *
         */
        sourceNode: null,

        /**
		 * Determines if the audio is currently muted.
		 * @property muted
		 * @type Boolean
		 * @default false
         * @private
		 */
		muted: false,

		/**
		 * Determines if the audio is currently paused. If the audio has not yet started playing,
		 * it will be true, unless the user pauses it.
		 * @property paused
		 * @type Boolean
		 * @default false
         * @private
		 */
		paused: false,

        /** Time audio started playing in seconds.  Used to handle set position, get postion, and resuming from paused
         * @property startTime
         * @type Float
         * @default 0
         * @private
         */
        startTime: 0,

		/**
		 * The callback that is fired when a sound has completed playback
		 * @event onComplete
         * @private
		 */
		onComplete: null,

		/**
		 * The callback that is fired when a sound has completed playback, but has loops remaining.
		 * @event onLoop
         * @private
		 */
		onLoop: null,

		/**
		 * The callback that is fired when a sound is ready to play.
		 * @event onReady
         * @private
		 */
		onReady: null,

		/**
		 * The callback that is fired when a sound has failed to start.
		 * @event onPlayFailed
         * @private
		 */
		onPlayFailed: null,

		/**
		 * The callback that is fired when a sound has been interrupted.
		 * @event onPlayInterrupted
         * @private
		 */
		onPlayInterrupted: null,

		// Proxies, make removing listeners easier.
		endedHandler: null,
		readyHandler: null,
		stalledHandler:null,

        // mix-ins:
        // EventDispatcher methods:
        addEventListener: null,
        removeEventListener: null,
        removeAllEventListeners: null,
        dispatchEvent: null,
        hasEventListener: null,
        _listeners: null,

        // Constructor
		init: function(src, owner) {
            this.owner = owner;
            this.src = src;

            if(this.owner.capabilities.panning) {
                this.panNode = this.owner.context.createPanner();  // allows us to manipulate left and right audio
                this.panNode.connect(this.owner.gainNode);
            } else {
                this.panNode = this.owner.gainNode;  // to prevent errors when trying to connect to panNode
            }

            this.gainNode = WebAudioPlugin.context.createGainNode();  // allows us to manipulate instance volume
            this.gainNode.connect(this.panNode);  // connect us to our sequence that leads to context.destination

            if (this.owner.isPreloadComplete(this.src)) {
                this.duration = this.owner.arrayBuffers[this.src].duration * 1000;
            }

            this.endedHandler = createjs.SoundJS.proxy(this.handleSoundComplete, this);
			this.readyHandler = createjs.SoundJS.proxy(this.handleSoundReady, this);
			this.stalledHandler = createjs.SoundJS.proxy(this.handleSoundStalled, this);
		},

        /**
         * Dispatch a generic event of type eventString. The dispatched event contains:
         * <ul><li>target: A reference to the dispatching instance</li>
         *      <li>type: The string used to identify the type of event.</li>
         * @method sendLoadComplete
         * @param {String} eventString The string to send as the event type.
         * @private
         */
        sendLoadComplete: function(eventString) {
            var event = {
                target: this,
                type: eventString
            };
            this._listeners && this.dispatchEvent(event);
        },

        // used to remove references and clean up instance
		cleanUp: function() {
            // if playbackState is UNSCHEDULED_STATE, then noteON or noteGrainOn has not been called so calling noteOff would throw an error
            if(this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) {
                this.sourceNode.noteOff(0);
                this.sourceNode = null; // release reference so Web Audio can handle removing references and garbage collection
            }

            clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
            clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete

            if (window.createjs == null) { return; }
            createjs.SoundJS.playFinished(this);  // OJR change to onPlayFinished for consistency?
		},

        // handle sound being interrupted
		interrupt: function () {
			this.playState = createjs.SoundJS.PLAY_INTERRUPTED;
			if (this.onPlayInterrupted) { this.onPlayInterrupted(this); }
            this.sendLoadComplete("playInterrupted");
            this.cleanUp();
			this.paused = false;
		},

	// Public API
		/**
		 * Play an instance. This API is only used to play an instance after it has been stopped
		 * or interrupted.`
		 * @method play
		 * @param {String} interrupt How this sound interrupts other instances with the same source. Interrupt values are defined as constants on SoundJS.
		 * @param {Number} delay The delay in milliseconds before the sound starts
		 * @param {Number} offset How far into the sound to begin playback in milliseconds.
		 * @param {Number} loop The number of times to loop the audio. Use -1 for infinite loops.
		 * @param {Number} volume The volume of the sound between 0 and 1.
		 * @param {Number} pan The pan of the sound between -1 and 1. Note that pan does not work for HTML Audio.
         * @private
		 */
		play: function(interrupt, delay, offset, loop, volume, pan) {
			this.cleanUp();
			createjs.SoundJS.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		// Called by SoundJS when ready
		beginPlaying: function(offset, loop, volume, pan) {
			if (window.createjs == null) { return; }

            if(!this.src) {return;}

			this.offset = offset/1000;  //convert ms to sec
			this.remainingLoops = loop;
            this.setVolume(volume);
            this.setPan(pan);

            if(this.owner.isPreloadComplete(this.src)) {
                this.handleSoundReady(null);
                this.sendLoadComplete("playSucceeded");  // OJR may not need this
                return 1;
            } else {
                this.playFailed();
                return;
            }
		},

		handleSoundStalled: function(event) {
			if (this.onPlayFailed != null) { this.onPlayFailed(this); }
            this.sendLoadComplete("playFailed");
        },

        // called to play a sound that is ready
		handleSoundReady: function(event) {
			if (window.createjs == null) { return; }

			if(this.offset > this.getDuration()) {
				this.playFailed();
				return;
			} else if (this.offset < 0) {  // may not need this check if noteGrainOn ignores negative values, this is not specified in the API http://www.w3.org/TR/webaudio/#AudioBufferSourceNode
                this.offset = 0;
			}

            this.playState = createjs.SoundJS.PLAY_SUCCEEDED;
            this.paused = false;

            // WebAudio supports BufferSource, MediaElementSource, and MediaStreamSource.
            // NOTE MediaElementSource requires different commands to play, pause, and stop because it uses audio tags.
            // The same is assumed for MediaStreamSource, although it may share the same commands as MediaElementSource.
            this.sourceNode = this.owner.context.createBufferSource();
            this.sourceNode.buffer = this.owner.arrayBuffers[this.src];
            this.duration = this.owner.arrayBuffers[this.src].duration * 1000;
            this.sourceNode.connect(this.gainNode);

            this.soundCompleteTimeout = setTimeout(this.endedHandler, (this.sourceNode.buffer.duration-this.offset)*1000);  // NOTE *1000 because WebAudio reports everything in seconds but js uses milliseconds

            this.startTime = this.owner.context.currentTime - this.offset;
            this.sourceNode.noteGrainOn(0, this.offset, this.sourceNode.buffer.duration-this.offset);
        },

		/**
		 * Pause the instance.
		 * @method pause
		 * @return {Boolean} If the pause call succeeds.
         * @private
		 */
		pause: function() {
			this.paused = true;

            this.offset = this.owner.context.currentTime - this.startTime;  // this allows us to restart the sound at the same point in playback
            this.sourceNode.noteOff(0);  // note this means the sourceNode cannot be reused and must be recreated

            clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
            clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete
            return true;
		},

		/**
		 * Resume a sound instance that has been paused.
		 * @method resume
		 * @return {Boolean} If the resume call succeeds.
         * @private
		 */
		resume: function() {
            this.handleSoundReady(null);
            return true;
		},

		/**
		 * Stop a sound instance.
		 * @method stop
		 * @return {Boolean} If the stop call succeeds.
         * @private
		 */
		stop: function() {
			//this.pause();
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			this.cleanUp();
            this.offset = 0;  // set audio to start at the beginning
			return true;
		},

		/**
		 * Set the volume of the sound instance.
		 * @method setVolume
		 * @param value
		 * @return {Boolean} If the setVolume call succeeds.
         * @private
		 */
		setVolume: function(value) {
			this.volume = value;
			this.updateVolume();
			return true;
		},

        /**
         * Internal function used to set the gain value for instance audio.  Should not be called externally.
         * @method updateVolume
         * @return {Boolean}
         * @private
         */
		updateVolume: function() {
            var newVolume = this.muted ? 0 : this.volume;
            if (newVolume != this.gainNode.gain.value) {
                this.gainNode.gain.value = newVolume;
            }
            return true;
		},

		/**
		 * Get the volume of the sound, not including how the master volume has affected it.
		 * @method getVolume
		 * @param value
		 * @return The volume of the sound.
         * @private
		 */
		getVolume: function(value) {
			return this.volume;
		},

		/**
         * This method has been deprecated.  Please use setMute.
		 * Mute the sound.
		 * @method mute
		 * @param {Boolean} isMuted If the sound should be muted or not.
		 * @return {Boolean} If the mute call succeeds.
         * @private
         * @deprecated
		 */
		mute: function(isMuted) {
			this.muted = isMuted;
			this.updateVolume();
			return true;
		},

        /**
         * Mute the sound.
         * @method mute
         * @param {Boolean} isMuted If the sound should be muted or not.
         * @return {Boolean} If the mute call succeeds.
         * @private
         */
        setMute: function(isMuted) {
            if(isMuted == null || isMuted == undefined) { return false};

            this.muted = isMuted;
            this.updateVolume();
            return true;
        },

        /**
         * Returns the mute value.
         * @method getMute
         * @return {Boolean} If the mute is set.
         * @private
         */
        getMute: function() {
            return this.muted;
        },

    /**
		 * Set the pan of a sound instance. Note that panning in WebAudioPlugin can support 3D audio, but we are not doing so here.
		 * @method setPan
		 * @param {Number} value The pan value between -1 (left) and 1 (right).
		 * @return {Number} If the setPan call succeeds.
         * @private
		 */
		setPan: function(value) {
            if(this.owner.capabilities.panning) {
                this.panNode.setPosition(value, 0, -0.5);  // z need to be -0.5 otherwise the sound only plays in left, right, or center
                this.pan = value;  // Unfortunately panner does not give us a way to access this after it is set http://www.w3.org/TR/webaudio/#AudioPannerNode
            } else {
                return false;
            }
        },

		/**
		 * Get the pan of a sound instance.  Note in WebAudioPlugin this only gives us the x value of what is actually 3D audio.
		 * @method getPan
		 * @return {Number} The value of the pan between -1 (left) and 1 (right).
         * @private
		 */
		getPan: function() {
            return this.pan;
        },

		/**
		 * Get the position of the playhead in the sound instance.
		 * @method getPosition
		 * @return {Number} The position of the playhead in milliseconds.
         * @private
		 */
		getPosition: function() {

            if(this.paused || this.sourceNode == null) {
                var pos = this.offset;
            } else {
                var pos = this.owner.context.currentTime - this.startTime;
            }

			return pos * 1000; // pos in seconds * 1000 to give milliseconds
		},

		/**
		 * Set the position of the playhead in the sound instance.
		 * @method setPosition
		 * @param {Number} value The position of the playhead in milliseconds.
         * @private
		 */
		setPosition: function(value) {
			//if (this.sourceNode == null) { return false; }

            this.offset = value/1000; // convert milliseconds to seconds

            if(this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) {  // if playbackState is UNSCHEDULED_STATE, then noteON or noteGrainOn has not been called so calling noteOff would throw an error
                this.sourceNode.noteOff(0);  // we need to stop this sound from continuing to play, as we need to recreate the sourceNode to change position
                clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete
            }  // NOTE we cannot just call cleanup because it also calls the soundjs function playFinished which releases this instance in SoundChannel

            if(!this.paused && this.playState == createjs.SoundJS.PLAY_SUCCEEDED) {
                this.handleSoundReady(null);
            }

			return true;
		},

		/**
		 * Get the duration of the sound instance.
		 * @method getDuration
		 * @return {Number} The duration of the sound instance in milliseconds.
         * @private
		 */
        getDuration: function() {
            return this.duration;
        },

        // called internally by soundCompleteTimeout
		handleSoundComplete: function(event) {
			if (this.remainingLoops != 0) {
				this.remainingLoops--;  // NOTE this introduces a theoretical limit on loops = float max size x 2 - 1

                this.offset = 0;  // have to set this as it can be set by pause during playback
                this.handleSoundReady(null);

				if (this.onLoop != null) { this.onLoop(this); }
				return;
			}

			if (window.createjs == null) { return; }
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			if (this.onComplete != null) { this.onComplete(this); }
            this.sendLoadComplete("playComplete");
            this.cleanUp();
		},

		// Play has failed
		playFailed: function() {
			if (window.createjs == null) { return; }
			this.playState = createjs.SoundJS.PLAY_FAILED;
			if (this.onPlayFailed != null) { this.onPlayFailed(this); }
            this.sendLoadComplete("playFailed");
            this.cleanUp();
		},

		toString: function() {
			return "[WebAudioPlugin SoundInstance]";
		}

	}

    // we only use EventDispatcher if it's available:
    createjs.EventDispatcher && createjs.EventDispatcher.initialize(SoundInstance.prototype); // inject EventDispatcher methods.


    /**
	 * An internal helper class that preloads web audio via XHR.
     * #class WebAudioLoader
	 * @param {String} src The source of the sound to load.
     * @param {method} completeHandler The callback that is fired when src is loaded, taking this as a parameter.
     * @param {method} errorHandler The callback that is fired  if there is an error during loading, taking this
     * as a parameter.
	 * @constructor
	 * @protected
	 */
	function WebAudioLoader(src, owner) {
		this.init(src, owner);
	}

	var p = WebAudioLoader.prototype = {

        // the request object for or XHR2 request
		request: null,

        owner: null,
        progress: -1,

        /**
         * The source of the sound to load.  Used by callback functions when we return this class.
         * #property
         * @type String
         * @default null
         * @protected
         */
		src: null,

        /**
         * The decoded AudioBuffer array that is returned when loading is complete.
         * #property
         * @type AudioBuffer
         * @protected
         */
        result:null,

        // Calbacks
        /**
         * The callback that fires when the load completes. This follows HTML tag naming.
         * #event onload
         * @private
         */
        onload: null,

        /**
         * The callback that fires as the load progresses. This follows HTML tag naming.
         * #event onprogress
         * @private
         */
        onprogress: null,

        /**
         * The callback that fires if the load hits an error.
         * #event onerror
         * @private
         */
        onError: null,

        // constructor
		init: function(src, owner) {
			this.src = src;
            this.owner = owner;
        },

        /**
         * Start loading.
         * #method
         * @param {String} src The path to the sound.
         * @return {Boolean} If the load was started.
         * @private
         */
        load: function(src) {
            if (src != null) { this.src = src; }

			this.request = new XMLHttpRequest();
			this.request.open("GET", this.src, true);
			this.request.responseType = "arraybuffer";
			this.request.onload = createjs.SoundJS.proxy(this.handleLoad, this);
            this.request.onError = createjs.SoundJS.proxy(this.handleError, this);
            this.request.onprogress = createjs.SoundJS.proxy(this.handleProgress, this);

            this.request.send();
        },

        /**
         * Handler for loading progress
         * #method
         * @param loaded
         * @param total
         */
        handleProgress: function(loaded, total) {
            this.progress = loaded / total;
            if (this.onprogress == null) { return; }
            this.onprogress({loaded:loaded, total:total, progress:this.progress});
        },

        /**
         * Handler for loading src.  Takes the loaded ArrayBuffer and decodes it for use with Web Audio.
         * #method
         * @protected
         */
        handleLoad: function() {
            s.context.decodeAudioData(this.request.response,
                createjs.SoundJS.proxy(this.handleAudioDecoded, this),
                createjs.SoundJS.proxy(this.handleError, this));
		},

        /**
         * Handler for decoding audio.  Sets result to the decodedAudio and fires the onComplete callback.
         * #method
         * @protected
         */
		handleAudioDecoded: function(decodedAudio) {
            this.progress = 1;
            this.result = decodedAudio;
            this.owner.addPreloadResults(this.src, this.result);
            this.onload && this.onload();
		},

        /**
         *  Handler for errors when loading or decoding.  Fires the onError callback.
         *  #method
         * @protected
         */
        handleError: function(evt) {
            this.owner.removeFromPreload(this.src);
            this.onerror && this.onerror(evt);
        },

		toString: function() {
			return "[WebAudioPlugin WebAudioLoader]";
		}
	}

}());
