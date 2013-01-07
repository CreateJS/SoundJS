/*
* HTMLAudioPlugin for SoundJS
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

/*
Note in IE 9 there is a delay in applying volume changes to tags that occurs once playback is started.
So if you have muted all sounds, they will all play during this delay until the mute applies internally.
This happens regardless of when or how you apply the volume change, as the tag seems to need to play to apply it.
*/

(function() {

	/**
	 * Play sounds using HTML &lt;audio&gt; tags in the browser.
     * Note it is recommended to use {{#crossLink "WebAudioPlugin"}}{{/crossLink}} for iOS. HTML Audio can only have one
	 * &lt;audio&gt; tag, can not preload or autoplay the audio, can not cache the audio, and can not play the audio
	 * except inside a user initiated event.
	 * @class HTMLAudioPlugin
	 * @uses EventDispatcher
	 * @constructor
	 */
	function HTMLAudioPlugin() {
		this.init();
	}

	var s = HTMLAudioPlugin;

	/**
	 * The maximum number of instances that can be played. This is a browser limitation.
	 * @property MAX_INSTANCES
	 * @type Number
	 * @default 30
	 * @static
	 */
	s.MAX_INSTANCES = 30;

	/**
	 * The capabilities of the plugin.
	 * @property capabilities
	 * @type Object
	 * @default null
	 * @static
	 */
	s.capabilities = null;

	/**
	 * The current value of the audio tag.
	 *
	 * @property tagVolume
	 * @type Number
	 * @default null
	 */
	s.tagVolume = null;

	// Event constants
	s.AUDIO_READY = "canplaythrough";
	s.AUDIO_ENDED = "ended";
	s.AUDIO_ERROR = "error"; //TODO: Handle error cases
	s.AUDIO_STALLED = "stalled";

	//TODO: Not used. Chrome can not do this when loading audio from a server.  // OJR can we remove this?
	s.fillChannels = false;

	/**
	 * Determine if the plugin can be used.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function() {
		if (createjs.SoundJS.BrowserDetect.isIOS) { return false; }
        // OJR alternately let the developer decide, inform them of limits in iOS.
        // iOS can only have a single <audio> instance, cannot preload or autoplay, cannot cache sound, and can only be played in response to a user event (click)
		s.generateCapabilities();
		var t = s.tag;  // OJR do we still need this check, when cap will already be null if this is the case
		if (t == null || s.capabilities == null) { return false; }
		return true;
	};

	/**
	 * Determine the capabilities of the plugin.
	 * @method generateCapabiities
	 * @static
	 */
	s.generateCapabilities = function() {
		if (s.capabilities != null) { return; }
		var t = s.tag = document.createElement("audio");
		if (t.canPlayType == null) { return null; }

        s.capabilities = {
            panning: true,
            volume: true,
            tracks: -1
        };
        // TODO: Other props?

        // determine which extensions our browser supports for this plugin by iterating through SoundJS.SUPPORTED_EXTENSIONS
        for(var i= 0, l = createjs.SoundJS.SUPPORTED_EXTENSIONS.length; i < l; i++) {
            var ext = createjs.SoundJS.SUPPORTED_EXTENSIONS[i];
            var playType = createjs.SoundJS.EXTENSION_MAP[ext] || ext;
            s.capabilities[ext] = (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
        }  // OJR another way to do this might be canPlayType:"m4a", codex: mp4
	}

	var p = s.prototype = {

		capabilities: null,
		FT: 0.001,

		audioSources: null,  // object hash that tells us if an audioSource has started loading

		init: function() {
			this.capabilities = s.capabilities;
			this.audioSources = {};
		},

		/**
		 * Pre-register a sound instance when preloading/setup. This plugin
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * @return {Object} A result object, containing a tag for preloading purposes.
		 */
		register: function(src, instances) {
			this.audioSources[src] = true;  // OJR this does not mean preloading has started
			var channel = TagPool.get(src);
			var tag;
			for (var i=0, l=instances||1; i<l; i++) {
				tag = this.createTag(src);
				channel.add(tag);
			}
			return {
				tag: tag       // Return one instance for preloading purposes
			};
		},

		createTag: function(src) {
			var tag = document.createElement("audio");
			tag.preload = false;
			tag.src = src;
			//tag.type = "audio/ogg"; //LM: Need to set properly
			return tag;
		},

		/**
		 * Create a sound instance. All SoundInstances implement this method.
		 * @method create
		 * @param {String} src The source to use.
		 * @return {SoundInstance} A sound instance for playback and control.
		 */
		create: function(src) {
            // if this sound has not be registered, create a tag and preload it
            //OJR LM might want to review this and see if there is a better way.
            if (!this.preloadStarted(src)) {
                var channel = TagPool.get(src);
                var tag = this.createTag(src);
                channel.add(tag);
                this.preload(src, {tag: tag});
            }

            return new SoundInstance(src, this);
		},

        /**
         * Checks if preloading has started for a src
         * @param src The sound URI to load.
         * @return {Boolean}
		 */
		preloadStarted: function(src) {
			return (this.audioSources[src] != null);
		},

        /**
         * Internally preload a sound. Loading uses XHR2 in order to get back an array buffer for use with Web Audio.
         * @method preload
         * @param {String} src The sound URI to load.
		 * @param instance
		 */
		preload: function(src, instance) {  // OJR each call to this wraps tag in an object just so this can pull it out, why don't we just pass a tag or create it here?
            this.audioSources[src] = true;  // OJR should we check for this value before beginning preload?
			new HTMLAudioLoader(src, instance.tag);
		},

		toString: function() {
			return "[HTMLAudioPlugin]";
		}

	}

	createjs.HTMLAudioPlugin = HTMLAudioPlugin;


	/**
	 * Sound Instances are created when any calls to SoundJS.play() or SoundJS.createInstance are made.
	 * The instances are returned by the active plugin for control by the user.
	 * Users can control audio directly through the instance.
	 * @class SoundInstance
	 * @param {String} src The path to the sound
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
		 */
		src: null,

		/**
		 * The unique ID of the instance
		 * @property uniqueId
		 * @type String | Number
		 * @default -1
		 */
		uniqueId:-1,

		/**
		 * The play state of the sound. Play states are defined as constants on SoundJS
		 * @property playState
		 * @type String
		 * @default null
		 */
		playState: null,

		/**
		 * The plugin that created the instance
		 * @property owner
		 * @type HTMLAudioPlugin
		 * @default null
		 */
		owner: null,

		// Private undocumented props.
		loaded: false,
		lastInterrupt: createjs.SoundJS.INTERRUPT_NONE,
		offset: 0,
		delay: 0,
		volume: 1,
		pan: 0,
        duration: 0,

		remainingLoops: 0,
		delayTimeoutId: null,
		tag: null,

		/**
		 * Determines if the audio is currently muted.
		 * @property muted
		 * @type Boolean
		 * @default false
		 */
		muted: false,

		/**
		 * Determines if the audio is currently paused. If the audio has not yet started playing,
		 * it will be true, unless the user pauses it.
		 * @property paused
		 * @type Boolean
		 * @default false
		 */
		paused: false,

		/**
		 * The callback that is fired when a sound has completed playback.
		 * @event onComplete
		 */
		onComplete: null,

		/**
		 * The callback that is fired when a sound has completed playback, but has loops remaining.
		 * @event onLoop
		 */
		onLoop: null,

		/**
		 * The callback that is fired when a sound is ready to play.
		 * @event onReady
		 */
		onReady: null,

		/**
		 * The callback that is fired when a sound has failed to start.
		 * @event onPlayFailed
		 */
		onPlayFailed: null,

		/**
		 * The callback that is fired when a sound has been interrupted.
		 * @event onPlayInterrupted
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
			this.src = src;
			this.owner = owner;

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

        /**
		 * The sound instance has finished playing. Clean up any parts of the instance that have to be GC'd, and
		 * notify SoundJS that the instance finished.
		 * @method cleanUp
		 * @protected
		 */
		cleanUp: function() {
			var tag = this.tag;
			if (tag != null) {
				tag.pause();
				try { tag.currentTime = 0; } catch (e) {} // Reset Position
				tag.removeEventListener(createjs.HTMLAudioPlugin.AUDIO_ENDED, this.endedHandler, false);
				tag.removeEventListener(createjs.HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);
				TagPool.setInstance(this.src, tag);
				this.tag = null;
			}

            clearTimeout(this.delayTimeoutId);
			if (window.createjs == null) { return; }
			createjs.SoundJS.playFinished(this);
		},

		/**
		 * Interrupt a currently playing instance, usually to make room for a new one.
		 * @method interrupt
		 * @protected
		 */
		interrupt: function () {
			if (this.tag == null) { return; }
			this.playState = createjs.SoundJS.PLAY_INTERRUPTED;
			if (this.onPlayInterrupted) { this.onPlayInterrupted(this); }
            this.sendLoadComplete("playInterrupted");
			this.cleanUp();
			this.paused = false;
		},

	// Public API
		/**
		 * Play an instance. This method is only used to play an instance after it has been stopped or interrupted.
		 * @method play
		 * @param {String} interrupt How this sound interrupts other instances with the same source. Interrupt values
		 *      are defined as constants on SoundJS.
		 * @param {Number} delay The delay in milliseconds before the sound starts
		 * @param {Number} offset How far into the sound to begin playback.
		 * @param {Number} loop The number of times to loop the audio. Use -1 for infinite loops.
		 * @param {Number} volume The volume of the sound between 0 and 1.
		 * @param {Number} pan The pan of the sound between -1 and 1. Note that pan does not work for HTML Audio.
		 */
		play: function(interrupt, delay, offset, loop, volume, pan) {
			this.cleanUp(); //LM: Is this redundant?
			createjs.SoundJS.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		/**
		 * When a sound is ready to play, SoundJS will call beginPlaying. This is the call to action to actually
		 * begin playback.
		 * @method beginPlaying
		 * @param {Number} offset The number of milliseconds to offset playback.
		 * @param {Number} loop The number of loops. The default is 0 (plays once). Use -1 for infinite loops.
		 * @param {Number} volume The volume of the sound between 0 and 1.
		 * @param {Number} pan The pan of the sound between -1 and 1. Note that pan does not work for HTML Audio.
		 * @return {Number} If the sound started (1) or failed (-1).
 		 */
		beginPlaying: function(offset, loop, volume, pan) {
			if (window.createjs == null) { return -1; }
			var tag = this.tag = TagPool.getInstance(this.src);
			if (tag == null) { this.playFailed(); return -1; }

            this.duration = this.tag.duration * 1000;
            // OJR would like a cleaner way to do this in init, discuss with LM
            // need this for setPosition on stopped sounds

			tag.addEventListener(createjs.HTMLAudioPlugin.AUDIO_ENDED, this.endedHandler, false);

			// Reset this instance.
			this.offset = offset;
			this.volume = volume;
			this.updateVolume();  // note this will set for mute and masterMute
			this.remainingLoops = loop;

			if (tag.readyState !== 4) {
				tag.addEventListener(createjs.HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);
				tag.addEventListener(createjs.HTMLAudioPlugin.AUDIO_STALLED, this.stalledHandler, false);
				tag.load();
			} else {
				this.handleSoundReady(null);
			}

            this.sendLoadComplete("playSucceeded");  // OJR may not need this
            return 1;
		},

		// Note: Sounds stall when trying to begin playback of a new audio instance when the existing instances
		//  has not loaded yet. This doesn't mean the sound will not play.
		handleSoundStalled: function(event) {
			if (this.onPlayFailed != null) { this.onPlayFailed(this); }
            this.sendLoadComplete("playFailed");
            this.cleanUp();  // OJR NOTE this will stop playback, and I think we should remove this and let the developer decide how to handle stalled instances
		},

		handleSoundReady: function(event) {
			if (window.createjs == null) { return; }
			this.playState = createjs.SoundJS.PLAY_SUCCEEDED;
			this.paused = false;
			this.tag.removeEventListener(createjs.HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);

			if(this.offset >= this.getDuration()) {
				this.playFailed();  // OJR: throw error?
				return;
			} else if (this.offset > 0) {
				this.tag.currentTime = this.offset * 0.001;
			}
			if (this.remainingLoops == -1) { this.tag.loop = true; }
			this.tag.play();
		},

		/**
		 * Pause the instance.
		 * @method pause
		 * @return {Boolean} If the pause call succeeds.
		 */
		pause: function() {
			this.paused = true;
			clearTimeout(this.delayTimeoutId);
			// Note: when paused by user, we hold a reference to our tag. We do not release it until stopped.
			if (this.tag != null) {
				this.tag.pause();
				return false;
			}
			return true;
		},

		/**
		 * Resume a sound instance that has been paused.
		 * @method resume
		 * @return {Boolean} If the resume call succeeds.
		 */
		resume: function() {
			this.paused = false;
			if (this.tag != null) {
				this.tag.play();
				return false;
			}
			return true;
		},

		/**
		 * Stop a sound instance. Stopped instances can be started over using the instance.play() method.
		 * @method stop
		 * @return {Boolean} If the stop call succeeds.
		 */
		stop: function() {
            this.offset = 0;
			this.pause();
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			this.cleanUp();
			return true;
		},

		// Called by SoundJS
		setMasterVolume: function(value) {
			this.updateVolume();
			return true;
		},

		/**
		 * Set the volume of the sound instance.
		 * @method setVolume
		 * @param value
		 * @return {Boolean} If the setVolume call succeeds.
		 */
		setVolume: function(value) {
			this.volume = value;
			this.updateVolume();
			return true;
		},

		// When any volume properties change, this method updates the actual playback volume.
		updateVolume: function() {
			if (this.tag != null) {
				var newVolume = (this.muted || createjs.SoundJS.masterMute) ? 0 : this.volume * createjs.SoundJS.masterVolume;
				if (newVolume != this.tagVolume) {
					this.tag.volume = newVolume;
					this.tagVolume = newVolume;
				}
				return true;
			} else {
				return false;
			}
		},

		/**
		 * Get the volume of the sound, not including how the master volume has affected it.
		 * @method getVolume
		 * @param value
		 * @return The volume of the sound.
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
         * @deprecated
		 */
		mute: function(isMuted) {
			this.muted = isMuted;
			this.updateVolume();
			return true;
		},

		setMasterMute: function(isMuted) {
			this.updateVolume();
			return true;
		},

        /**
         * Mute the sound.
         * @method mute
         * @param {Boolean} isMuted If the sound should be muted or not.
         * @return {Boolean} If the mute call succeeds.
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
         */
        getMute: function() {
            return this.muted;
        },

		/**
		 * Set the pan of a sound instance. Note that this does not work in HTML audio.
		 * @method setPan
		 * @param {Number} value The pan value between -1 (left) and 1 (right).
		 * @return {Number} If the setPan call succeeds.
		 */
		setPan: function(value) { return false; }, // Can not set pan in HTML

		/**
		 * Get the pan of a sound instance. Note that this does not work in HTML audio.
		 * @method getPan
		 * @return {Number} The value of the pan between -1 (left) and 1 (right).
		 */
		getPan: function() { return 0; },

		/**
		 * Get the position of the playhead in the sound instance.
		 * @method getPosition
		 * @return {Number} The position of the playhead in milliseconds.
		 */
		getPosition: function() {
			if (this.tag == null) { return this.offset; }
			return this.tag.currentTime * 1000;
		},

		/**
		 * Set the position of the playhead in the sound instance.
		 * @method setPosition
		 * @param {Number} value The position of the playhead in milliseconds.
		 */
		setPosition: function(value) {
			if (this.tag == null) {
                this.offset = value
            } else try {
				this.tag.currentTime = value * 0.001;
                } catch(error) { // Out of range
                    return false;  //OJR: throw error?
                }
			return true;
		},

		/**
		 * Get the duration of the sound instance.
		 * @method getDuration
		 * @return {Number} The duration of the sound instance in milliseconds.
		 */
        getDuration: function() {  // OJR this will always return 0 until sound has been played.
            return this.duration;
        },

		// Audio has finished playing. Manually loop it if required.
		handleSoundComplete: function(event) {
			if (this.remainingLoops != 0) {
				this.remainingLoops--;

                this.offset = 0;
				//try { this.tag.currentTime = 0; } catch(error) {}
				this.tag.play();
				if (this.onLoop != null) { this.onLoop(this); }
				return;
			}

			if (window.createjs == null) { return; }
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			if (this.onComplete != null) { this.onComplete(this); }
            this.sendLoadComplete("playComplete");
			this.cleanUp();
		},

		// Playback has failed
		playFailed: function() {
			if (window.createjs == null) { return; }
			this.playState = createjs.SoundJS.PLAY_FAILED;
			if (this.onPlayFailed != null) { this.onPlayFailed(this); }
            this.sendLoadComplete("playFailed");
			this.cleanUp();
		},

		toString: function() {
			return "[HTMLAudioPlugin SoundInstance]";
		}

	}

    // we only use EventDispatcher if it's available:
    createjs.EventDispatcher && createjs.EventDispatcher.initialize(SoundInstance.prototype); // inject EventDispatcher methods.

    // Do not add SoundInstance to namespace.


	/**
	 * An internal helper class that preloads html audio via HTMLAudioElement tags. Note that PreloadJS will NOT use
	 * this load class like it does Flash and WebAudio plugins.
	 * #class HTMLAudioLoader
	 * @param {String} src The source of the sound to load.
	 * @param {HTMLAudioElement} tag The tag of the sound to load.
	 * @constructor
	 * @private
	 */
	function HTMLAudioLoader(src, tag) {
		this.init(src, tag);
	}

	HTMLAudioLoader.prototype = {
		src: null,
		tag: null,
		preloadTimer: null,

        // Proxies, make removing listeners easier.
        loadedHandler: null,

		init: function(src, tag) {
			this.src = src;
			this.tag = tag;

			this.preloadTimer = setInterval(createjs.SoundJS.proxy(this.preloadTick, this), 200);


            // This will tell us when audio is buffered enough to play through, but not when its loaded.
            // The tag doesn't keep loading in Chrome once enough has buffered, and we have decided that behaviour is sufficient.
            // Note that canplaythrough callback doesn't work in Chrome, we have to use the event.
            this.loadedHandler = createjs.SoundJS.proxy(this.sendLoadedEvent, this);  // we need this proxy to be able to remove event listeners
            this.tag.addEventListener && this.tag.addEventListener("canplaythrough", this.loadedHandler);
            this.tag.onreadystatechange = createjs.SoundJS.proxy(this.sendLoadedEvent, this);  // OJR not 100% sure we need this, just copied from PreloadJS

            this.tag.preload = "auto";
            this.tag.src = src;
            this.tag.load();

		},

		preloadTick: function() {
			var buffered = this.tag.buffered;
		    var duration = this.tag.duration;

            if (buffered.length > 0) {
                if (buffered.end(0) >= duration-1) {
                    this.handleTagLoaded();
                }
            }
		},

		handleTagLoaded: function() {  // OJR is this the same as canplaythrough?
			clearInterval(this.preloadTimer);
		},

        sendLoadedEvent: function(evt) {
            this.tag.removeEventListener && this.tag.removeEventListener("canplaythrough", this.loadedHandler);  // cleanup and so we don't send the event more than once
            this.tag.onreadystatechange = null;  // cleanup and so we don't send the event more than once
            createjs.SoundJS.sendLoadComplete(this.src);  // fire event or callback on SoundJS
        },

		toString: function() {
			return "[HTMLAudioPlugin HTMLAudioLoader]";
		}
	}

	// Do not add HTMLAudioLoader to namespace


	/**
	 * The TagPool is an object pool for HTMLAudio tag instances. In Chrome, we have to pre-create the number of HTML
	 * audio tag instances that we are going to play before we load the data, otherwise the audio stalls.
	 * (Note: This seems to be a bug in Chrome)
	 * #class TagPool
	 * @param src The source of the channel.
	 * @private
	 */
	function TagPool(src) {
		this.init(src);
	}

	/**
	 * A hash lookup of each sound channel, indexed by the audio source.
	 * #property tags
	 * @static
	 * @private
	 */
	TagPool.tags = {};

	/**
	 * Get a tag pool. If the pool doesn't exist, create it.
	 * #method get
	 * @static
	 * @private
	 */
	TagPool.get = function(src) {
		var channel = TagPool.tags[src];
		if (channel == null) {
			channel = TagPool.tags[src] = new TagPool(src);
		}
		return channel;
	}

	/**
	 * Get a tag instance. This is a shortcut method.
	 * #method getInstance
	 * @static
	 * @private
	 */
	TagPool.getInstance = function(src) {
		var channel = TagPool.tags[src];
		if (channel == null) { return null; }
		return channel.get();
	}

	/** Return a tag instance. This is a shortcut method.
	 * #method setInstance
	 * @static
	 * @private
	 */
	TagPool.setInstance = function(src, tag) {
		var channel = TagPool.tags[src];
		if (channel == null) { return null; }
		return channel.set(tag);
	}

	TagPool.prototype = {

		/**
		 * The source of the tag pool.
		 * #property src
		 * @type String
		 * @private
		 */
		src: null,

		/**
		 * The total number of HTMLAudio tags in this pool. This is the maximum number of instance of a certain sound
		 * that can play at one time.
		 * #property length
		 * @type Number
		 * @default 0
		 * @private
		 */
		length: 0,

		/**
		 * The number of unused HTMLAudio tags.
		 * #property available
		 * @type Number
		 * @default 0
		 * @private
		 */
		available: 0,

		/**
		 * A list of all available tags in the pool.
		 * #property tags
		 * @type Array
		 * @private
		 */
		tags: null,

		init: function(src) {
			this.src = src;
			this.tags = [];
		},

		/**
		 * Add an HTMLAudio tag into the pool.
		 * #method add
		 * @param HTMLAudioElement tag A tag to be used for playback.
		 * @private
		 */
		add: function(tag) {
			this.tags.push(tag);
			this.length++;
			this.available++;
		},

		/**
		 * Get an HTMLAudioElement for immediate playback. This takes it out of the pool.
		 * #methdo get
		 * @return {HTMLAudioElement}
		 */
		get: function() {
			if (this.tags.length == 0) { return null; }
			this.available = this.tags.length;
			var tag = this.tags.pop();
			if (tag.parentNode == null) { document.body.appendChild(tag); }
			return tag;
		},

		/**
		 * Put an HTMLAudioElement back in the pool for use.
		 * #method set
		 * @param {HTMLAudioElement} tag
		 */
		set: function(tag) {
			var index = this.tags.indexOf(tag);
			if (index == -1) {
				this.tags.push(tag);
			}
			this.available = this.tags.length;
		},

		toString: function() {
			return "[HTMLAudioPlugin TagPool]";
		}

	}

	// do not add TagPool to namespace

}());
