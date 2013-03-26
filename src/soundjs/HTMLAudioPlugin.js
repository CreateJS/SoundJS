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
this.createjs = this.createjs || {};

(function () {

	/**
	 * Play sounds using HTML &lt;audio&gt; tags in the browser. This plugin is the second priority plugin installed
	 * by default, after the {{#crossLink "WebAudioPlugin"}}{{/crossLink}}, which is supported on Chrome, Safari, and
	 * iOS. This handles audio in all other modern browsers. For non-supported browsers, include and install the
	 * {{#crossLink "FlashPlugin"}}{{/crossLink}}.
	 *
	 * <h4>Known Browser and OS issues for HTML Audio</h4>
	 * <b>All browsers</b><br />
	 * Testing has shown in all browsers there is a limit to how many audio tag instances you are allowed.  If you exceed
	 * this limit, you can expect to see unpredictable results.  This will be seen as soon as you register sounds, as
	 * tags are precreated to all Chrome to load them.  Please use {{#crossLink "Sound.MAX_INSTANCES"}}{{/crossLink}} as
	 * a guide to how many total audio tags you can safely use in all browsers.
	 *
     * <b>IE 9 html limitations</b><br />
     * <ul><li>There is a delay in applying volume changes to tags that occurs once playback is started. So if you have
     * muted all sounds, they will all play during this delay until the mute applies internally. This happens regardless of
     * when or how you apply the volume change, as the tag seems to need to play to apply it.</li>
     * <li>MP3 encoding will not always work for audio tags if it's not default.  We've found default encoding with
     * 64kbps works.</li>
	 * <li>There is a limit to how many audio tags you can load and play at once, which appears to be determined by
	 * hardware and browser settings.  See {{#crossLink "HTMLAudioPlugin.MAX_INSTANCES"}}{{/crossLink}} for a safe estimate.</li></ul>
	 *
	 * <b>iOS 6 limitations</b><br />
	 * Note it is recommended to use {{#crossLink "WebAudioPlugin"}}{{/crossLink}} for iOS (6+). HTML Audio can only
	 * have one &lt;audio&gt; tag, can not preload or autoplay the audio, can not cache the audio, and can not play the
	 * audio except inside a user initiated event.
	 *
	 * <b>Android limitations</b><br />
	 *      <li>We have no control over audio volume. Only the user can set volume on their device.</li>
	 *      <li>We can only play audio inside a user event (touch).  This currently means you cannot loop sound.</li></ul>
	 *
	 * See {{#crossLink "Sound"}}{{/crossLink}} for general notes on known issues.
	 *
	 * @class HTMLAudioPlugin
	 * @constructor
	 */
	function HTMLAudioPlugin() {
		this.init();
	}

	var s = HTMLAudioPlugin;

	/**
	 * The maximum number of instances that can be loaded and played. This is a browser limitation, primarily limited to IE9.
	 * The actual number varies from browser to browser (and is largely hardware dependant), but this is a safe estimate.
	 * @property MAX_INSTANCES
	 * @type {Number}
	 * @default 30
	 * @static
	 */
	s.MAX_INSTANCES = 30;

	/**
	 * The capabilities of the plugin. This is generated via the the SoundInstance {{#crossLink "TMLAudioPlugin/generateCapabilities"}}{{/crossLink}}
	 * method. Please see the Sound {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} method for an overview of all
	 * of the available properties.
	 * @property capabilities
	 * @type {Object}
	 * @static
	 */
	s.capabilities = null;

	/**
	 * Event constant for the "canPlayThrough" event for cleaner code.
	 * @property AUDIO_READY
	 * @type {String}
	 * @default canplaythrough
	 * @static
	 */
	s.AUDIO_READY = "canplaythrough";

	/**
	 * Event constant for the "ended" event for cleaner code.
	 * @property AUDIO_ENDED
	 * @type {String}
	 * @default ended
	 * @static
	 */
	s.AUDIO_ENDED = "ended";

	/**
	 * Event constant for the "error" event for cleaner code.
	 * @property AUDIO_ERROR
	 * @type {String}
	 * @default error
	 * @static
	 */
	s.AUDIO_ERROR = "error"; //TODO: Handle error cases

	/**
	 * Event constant for the "stalled" event for cleaner code.
	 * @property AUDIO_STALLED
	 * @type {String}
	 * @default stalled
	 * @static
	 */
	s.AUDIO_STALLED = "stalled";


	/**
	 * Determine if the plugin can be used in the current browser/OS. Note that HTML audio is available in most modern
	 * browsers except iOS, where it is limited.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		if (createjs.Sound.BrowserDetect.isIOS) {
			return false;
		}
		// You can enable this plugin on iOS by removing this line, but it is not recommended due to the limitations:
		// iOS can only have a single <audio> instance, cannot preload or autoplay, cannot cache sound, and can only be
		// played in response to a user event (click)
		s.generateCapabilities();
		var t = s.tag;  // OJR do we still need this check, when cap will already be null if this is the case
		if (t == null || s.capabilities == null) {
			return false;
		}
		return true;
	};

	/**
	 * Determine the capabilities of the plugin. Used internally. Please see the Sound API {{#crossLink "Sound/getCapabilities"}}{{/crossLink}}
	 * method for an overview of plugin capabilities.
	 * @method generateCapabiities
	 * @static
	 * @protected
	 */
	s.generateCapabilities = function () {
		if (s.capabilities != null) {
			return;
		}
		var t = s.tag = document.createElement("audio");
		if (t.canPlayType == null) {
			return null;
		}

		s.capabilities = {
			panning:true,
			volume:true,
			tracks:-1
		};

		// determine which extensions our browser supports for this plugin by iterating through Sound.SUPPORTED_EXTENSIONS
		var supportedExtensions = createjs.Sound.SUPPORTED_EXTENSIONS;
		var extensionMap = createjs.Sound.EXTENSION_MAP;
		for (var i = 0, l = supportedExtensions.length; i < l; i++) {
			var ext = supportedExtensions[i];
			var playType = extensionMap[ext] || ext;
			s.capabilities[ext] = (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
		}  // OJR another way to do this might be canPlayType:"m4a", codex: mp4
	}

	var p = s.prototype = {

		/**
		 * The capabilities of the plugin, created by the {{#crossLink "HTMLAudioPlugin/generateCapabilities"}}{{/crossLink}}
		 * method.
		 */
		capabilities:null,

		/**
		 * Object hash indexed by the source of each file to indicate if an audio source is loaded, or loading.
		 * @property audioSources
		 * @type {Object}
		 * @protected
		 * @since 0.4.0
		 */
		audioSources:null,

		/**
		 * The default number of instances to allow.  Passed back to {{#crossLink "Sound"}}{{/crossLink}} when a source
		 * is registered using the {{#crossLink "Sound/register"}}{{/crossLink}} method.  This is only used if
		 * a value is not provided.
		 *
		 * <b>NOTE this only exists as a limitation of HTML audio.</b>
		 * @property defaultNumChannels
		 * @type {Number}
		 * @default 2
		 * @since 0.4.0
		 */
		defaultNumChannels:2,

		/**
		 * An initialization function run by the constructor
		 * @method init
		 * @private
		 */
		init:function () {
			this.capabilities = s.capabilities;
			this.audioSources = {};
		},

		/**
		 * Pre-register a sound instance when preloading/setup. This is called by {{#crossLink "Sound"}}{{/crossLink}}.
		 * Note that this provides an object containing a tag used for preloading purposes, which
		 * <a href="http://preloadjs.com">PreloadJS</a> can use to assist with preloading.
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * @return {Object} A result object, containing a tag for preloading purposes and a numChannels value for internally
		 * controlling how many instances of a source can be played by default.
		 */
		register:function (src, instances) {
			this.audioSources[src] = true;  // Note this does not mean preloading has started
			var channel = TagPool.get(src);
			var tag = null;
			var l = instances || this.defaultNumChannels;
			for (var i = 0; i < l; i++) {  // OJR should we be enforcing s.MAX_INSTANCES here?  Does the chrome bug still exist, or can we change this code?
				tag = this.createTag(src);
				channel.add(tag);
			}
			return {
				tag:tag, // Return one instance for preloading purposes
				numChannels:l  // The default number of channels to make for this Sound or the passed in value
			};
		},

		/**
		 * Create an HTML audio tag.
		 * @method createTag
		 * @param {String} src The source file to set for the audio tag.
		 * @return {HTMLElement} Returns an HTML audio tag.
		 * @protected
		 */
		createTag:function (src) {
			var tag = document.createElement("audio");
			tag.autoplay = false;
			tag.preload = "none";
			//LM: Firefox fails when this the preload="none" for other tags, but it needs to be "none" to ensure PreloadJS works.
			tag.src = src;
			return tag;
		},

		/**
		 * Create a sound instance. If the sound has not been preloaded, it is internally preloaded here.
		 * @method create
		 * @param {String} src The sound source to use.
		 * @return {SoundInstance} A sound instance for playback and control.
		 */
		create:function (src) {
			// if this sound has not be registered, create a tag and preload it
			if (!this.isPreloadStarted(src)) {
				var channel = TagPool.get(src);
				var tag = this.createTag(src);
				channel.add(tag);
				this.preload(src, {tag:tag});
			}

			return new SoundInstance(src, this);
		},

		/**
		 * Checks if preloading has started for a specific source.
		 * @method isPreloadStarted
		 * @param {String} src The sound URI to check.
		 * @return {Boolean} If the preload has started.
		 * @since 0.4.0
		 */
		isPreloadStarted:function (src) {
			return (this.audioSources[src] != null);
		},

		/**
		 * Internally preload a sound.
		 * @method preload
		 * @param {String} src The sound URI to load.
		 * @param {Object} instance An object containing a tag property that is an HTML audio tag used to load src.
		 * @since 0.4.0
		 */
		preload:function (src, instance) {
			this.audioSources[src] = true;
			new HTMLAudioLoader(src, instance.tag);
		},

		toString:function () {
			return "[HTMLAudioPlugin]";
		}

	}

	createjs.HTMLAudioPlugin = HTMLAudioPlugin;


// NOTE Documentation for the SoundInstance class in WebAudioPlugin file. Each plugin generates a SoundInstance that
// follows the same interface.
	function SoundInstance(src, owner) {
		this.init(src, owner);
	}

	var p = SoundInstance.prototype = {

		src:null,
		uniqueId:-1,
		playState:null,
		owner:null,
		loaded:false,
		offset:0,
		delay:0,
		volume:1,
		pan:0,
		duration:0,
		remainingLoops:0,
		delayTimeoutId:null,
		tag:null,
		muted:false,
		paused:false,

// mix-ins:
		// EventDispatcher methods:
		addEventListener:null,
		removeEventListener:null,
		removeAllEventListeners:null,
		dispatchEvent:null,
		hasEventListener:null,
		_listeners:null,

// Callbacks
		onComplete:null,
		onLoop:null,
		onReady:null,
		onPlayFailed:null,
		onPlayInterrupted:null,
		onPlaySucceeded:null,

		// Proxies, make removing listeners easier.
		endedHandler:null,
		readyHandler:null,
		stalledHandler:null,

// Constructor
		init:function (src, owner) {
			this.src = src;
			this.owner = owner;

			this.endedHandler = createjs.proxy(this.handleSoundComplete, this);
			this.readyHandler = createjs.proxy(this.handleSoundReady, this);
			this.stalledHandler = createjs.proxy(this.handleSoundStalled, this);
		},

		sendEvent:function (eventString) {
			var event = {
				target:this,
				type:eventString
			};
			this.dispatchEvent(event);
		},

		cleanUp:function () {
			var tag = this.tag;
			if (tag != null) {
				tag.pause();
				try {
					tag.currentTime = 0;
				} catch (e) {
				} // Reset Position
				tag.removeEventListener(createjs.HTMLAudioPlugin.AUDIO_ENDED, this.endedHandler, false);
				tag.removeEventListener(createjs.HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);
				TagPool.setInstance(this.src, tag);
				this.tag = null;
			}

			clearTimeout(this.delayTimeoutId);
			if (window.createjs == null) {
				return;
			}
			createjs.Sound.playFinished(this);
		},

		interrupt:function () {
			if (this.tag == null) {
				return;
			}
			this.playState = createjs.Sound.PLAY_INTERRUPTED;
			if (this.onPlayInterrupted) {
				this.onPlayInterrupted(this);
			}
			this.cleanUp();
			this.paused = false;
			this.sendEvent("interrupted");
		},

// Public API
		play:function (interrupt, delay, offset, loop, volume, pan) {
			this.cleanUp(); //LM: Is this redundant?
			createjs.Sound.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		beginPlaying:function (offset, loop, volume, pan) {
			if (window.createjs == null) {
				return -1;
			}
			var tag = this.tag = TagPool.getInstance(this.src);
			if (tag == null) {
				this.playFailed();
				return -1;
			}

			tag.addEventListener(createjs.HTMLAudioPlugin.AUDIO_ENDED, this.endedHandler, false);

			// Reset this instance.
			this.offset = offset;
			this.volume = volume;
			this.updateVolume();  // note this will set for mute and masterMute
			this.remainingLoops = loop;

			if (tag.readyState !== 4) {
				tag.addEventListener(createjs.HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);
				tag.addEventListener(createjs.HTMLAudioPlugin.AUDIO_STALLED, this.stalledHandler, false);
				tag.preload = "auto"; // This is necessary for Firefox, as it won't ever "load" until this is set.
				tag.load();
			} else {
				this.handleSoundReady(null);
			}

			this.onPlaySucceeded && this.onPlaySucceeded(this);
			this.sendEvent("succeeded");
			return 1;
		},

		// Note: Sounds stall when trying to begin playback of a new audio instance when the existing instances
		//  has not loaded yet. This doesn't mean the sound will not play.
		handleSoundStalled:function (event) {
			if (this.onPlayFailed != null) {
				this.onPlayFailed(this);
			}
			this.cleanUp();  // OJR NOTE this will stop playback, and I think we should remove this and let the developer decide how to handle stalled instances
			this.sendEvent("failed");
		},

		handleSoundReady:function (event) {
			if (window.createjs == null) {
				return;
			}

            // OJR would like a cleaner way to do this in init, discuss with LM
            this.duration = this.tag.duration * 1000;  // need this for setPosition on stopped sounds

			this.playState = createjs.Sound.PLAY_SUCCEEDED;
			this.paused = false;
			this.tag.removeEventListener(createjs.HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);

			if (this.offset >= this.getDuration()) {
				this.playFailed();  // OJR: throw error?
				return;
			} else if (this.offset > 0) {
				this.tag.currentTime = this.offset * 0.001;
			}
			if (this.remainingLoops == -1) {
				this.tag.loop = true;
			}
			this.tag.play();
		},

		pause:function () {
			if (!this.paused && this.playState == createjs.Sound.PLAY_SUCCEEDED && this.tag != null) {
				this.paused = true;
				// Note: when paused by user, we hold a reference to our tag. We do not release it until stopped.
				this.tag.pause();

				clearTimeout(this.delayTimeoutId);

				return true;
			}
			return false;
		},

		resume:function () {
			if (!this.paused || this.tag == null) {
				return false;
			}
			this.paused = false;
			this.tag.play();
			return true;
		},

		stop:function () {
			this.offset = 0;
			this.pause();
			this.playState = createjs.Sound.PLAY_FINISHED;
			this.cleanUp();
			return true;
		},

		setMasterVolume:function (value) {
			this.updateVolume();
			return true;
		},

		setVolume:function (value) {
			if (Number(value) == null) {
				return false;
			}
			value = Math.max(0, Math.min(1, value));
			this.volume = value;
			this.updateVolume();
			return true;
		},

		updateVolume:function () {
			if (this.tag != null) {
				var newVolume = (this.muted || createjs.Sound.masterMute) ? 0 : this.volume * createjs.Sound.masterVolume;
				if (newVolume != this.tag.volume) {
					this.tag.volume = newVolume;
				}
				return true;
			} else {
				return false;
			}
		},

		getVolume:function (value) {
			return this.volume;
		},

		mute:function (isMuted) {
			this.muted = isMuted;
			this.updateVolume();
			return true;
		},

		setMasterMute:function (isMuted) {
			this.updateVolume();
			return true;
		},

		setMute:function (isMuted) {
			if (isMuted == null || isMuted == undefined) {
				return false
			}
			;

			this.muted = isMuted;
			this.updateVolume();
			return true;
		},

		getMute:function () {
			return this.muted;
		},

		setPan:function (value) {
			return false;
		}, // Can not set pan in HTML

		getPan:function () {
			return 0;
		},

		getPosition:function () {
			if (this.tag == null) {
				return this.offset;
			}
			return this.tag.currentTime * 1000;
		},

		setPosition:function (value) {
			if (this.tag == null) {
				this.offset = value
			} else try {
				this.tag.currentTime = value * 0.001;
			} catch (error) { // Out of range
				return false;
			}
			return true;
		},

		getDuration:function () {  // NOTE this will always return 0 until sound has been played.
			return this.duration;
		},

		handleSoundComplete:function (event) {
			this.offset = 0;

			if (this.remainingLoops != 0) {
				this.remainingLoops--;

				//try { this.tag.currentTime = 0; } catch(error) {}
				this.tag.play();
				if (this.onLoop != null) {
					this.onLoop(this);
				}
				this.sendEvent("loop");
				return;
			}

			if (window.createjs == null) {
				return;
			}
			this.playState = createjs.Sound.PLAY_FINISHED;
			this.cleanUp();
			if (this.onComplete != null) {
				this.onComplete(this);
			}
			this.sendEvent("complete");
		},

		playFailed:function () {
			if (window.createjs == null) {
				return;
			}
			this.playState = createjs.Sound.PLAY_FAILED;
			if (this.onPlayFailed != null) {
				this.onPlayFailed(this);
			}
			this.cleanUp();
			this.sendEvent("failed");
		},

		toString:function () {
			return "[HTMLAudioPlugin SoundInstance]";
		}

	}

	createjs.EventDispatcher.initialize(SoundInstance.prototype);

	// Do not add SoundInstance to namespace.


	/**
	 * An internal helper class that preloads html audio via HTMLAudioElement tags. Note that PreloadJS will NOT use
	 * this load class like it does Flash and WebAudio plugins.
	 * Note that this class and its methods are not documented properly to avoid generating HTML documentation.
	 * #class HTMLAudioLoader
	 * @param {String} src The source of the sound to load.
	 * @param {HTMLAudioElement} tag The audio tag of the sound to load.
	 * @constructor
	 * @private
	 * @since 0.4.0
	 */
	function HTMLAudioLoader(src, tag) {
		this.init(src, tag);
	}

	HTMLAudioLoader.prototype = {

		/**
		 * The source to be loaded.
		 * #property src
		 * @type {String}
		 * @default null
		 * @protected
		 */
		src:null,

		/**
		 * The tag to load the source with / into.
		 * #property tag
		 * @type {AudioTag}
		 * @default null
		 * @protected
		 */
		tag:null,

		/**
		 * An intervale used to give us progress.
		 * #property preloadTimer
		 * @type {String}
		 * @default null
		 * @protected
		 */
		preloadTimer:null,

		// Proxies, make removing listeners easier.
		loadedHandler:null,

		// constructor
		init:function (src, tag) {
			this.src = src;
			this.tag = tag;

			this.preloadTimer = setInterval(createjs.proxy(this.preloadTick, this), 200);


			// This will tell us when audio is buffered enough to play through, but not when its loaded.
			// The tag doesn't keep loading in Chrome once enough has buffered, and we have decided that behaviour is sufficient.
			// Note that canplaythrough callback doesn't work in Chrome, we have to use the event.
			this.loadedHandler = createjs.proxy(this.sendLoadedEvent, this);  // we need this bind to be able to remove event listeners
			this.tag.addEventListener && this.tag.addEventListener("canplaythrough", this.loadedHandler);
			this.tag.onreadystatechange = createjs.proxy(this.sendLoadedEvent, this);  // OJR not 100% sure we need this, just copied from PreloadJS

			this.tag.preload = "auto";
			this.tag.src = src;
			this.tag.load();

		},

		/**
		 * Allows us to have preloading progress and tell when its done.
		 * #method preloadTick
		 * @protected
		 */
		preloadTick:function () {
			var buffered = this.tag.buffered;
			var duration = this.tag.duration;

			if (buffered.length > 0) {
				if (buffered.end(0) >= duration - 1) {
					this.handleTagLoaded();
				}
			}
		},

		/**
		 * Internal handler for when a tag is loaded.
		 * #method handleTagLoaded
		 * @protected
		 */
		handleTagLoaded:function () {
			clearInterval(this.preloadTimer);
		},

		/**
		 * Communicates back to Sound that a load is complete.
		 * #method sendLoadedEvent
		 * @param {Object} evt The load Event
		 */
		sendLoadedEvent:function (evt) {
			this.tag.removeEventListener && this.tag.removeEventListener("canplaythrough", this.loadedHandler);  // cleanup and so we don't send the event more than once
			this.tag.onreadystatechange = null;  // cleanup and so we don't send the event more than once
			createjs.Sound.sendFileLoadEvent(this.src);  // fire event or callback on Sound
		},

		// used for debugging
		toString:function () {
			return "[HTMLAudioPlugin HTMLAudioLoader]";
		}
	}

	// Do not add HTMLAudioLoader to namespace


	/**
	 * The TagPool is an object pool for HTMLAudio tag instances. In Chrome, we have to pre-create the number of HTML
	 * audio tag instances that we are going to play before we load the data, otherwise the audio stalls.
	 * (Note: This seems to be a bug in Chrome)
	 * #class TagPool
	 * @param {String} src The source of the channel.
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
	 * @param {String} src The source file used by the audio tag.
	 * @static
	 * @private
	 */
	TagPool.get = function (src) {
		var channel = TagPool.tags[src];
		if (channel == null) {
			channel = TagPool.tags[src] = new TagPool(src);
		}
		return channel;
	}

	/**
	 * Get a tag instance. This is a shortcut method.
	 * #method getInstance
	 * @param {String} src The source file used by the audio tag.
	 * @static
	 * @private
	 */
	TagPool.getInstance = function (src) {
		var channel = TagPool.tags[src];
		if (channel == null) {
			return null;
		}
		return channel.get();
	}

	/**
	 * Return a tag instance. This is a shortcut method.
	 * #method setInstance
	 * @param {String} src The source file used by the audio tag.
	 * @param {HTMLElement} tag Audio tag to set.
	 * @static
	 * @private
	 */
	TagPool.setInstance = function (src, tag) {
		var channel = TagPool.tags[src];
		if (channel == null) {
			return null;
		}
		return channel.set(tag);
	}

	TagPool.prototype = {

		/**
		 * The source of the tag pool.
		 * #property src
		 * @type {String}
		 * @private
		 */
		src:null,

		/**
		 * The total number of HTMLAudio tags in this pool. This is the maximum number of instance of a certain sound
		 * that can play at one time.
		 * #property length
		 * @type {Number}
		 * @default 0
		 * @private
		 */
		length:0,

		/**
		 * The number of unused HTMLAudio tags.
		 * #property available
		 * @type {Number}
		 * @default 0
		 * @private
		 */
		available:0,

		/**
		 * A list of all available tags in the pool.
		 * #property tags
		 * @type {Array}
		 * @private
		 */
		tags:null,

		// constructor
		init:function (src) {
			this.src = src;
			this.tags = [];
		},

		/**
		 * Add an HTMLAudio tag into the pool.
		 * #method add
		 * @param {HTMLAudioElement} tag A tag to be used for playback.
		 */
		add:function (tag) {
			this.tags.push(tag);
			this.length++;
			this.available++;
		},

		/**
		 * Get an HTMLAudioElement for immediate playback. This takes it out of the pool.
		 * #method get
		 * @return {HTMLAudioElement} An HTML audio tag.
		 */
		get:function () {
			if (this.tags.length == 0) {
				return null;
			}
			this.available = this.tags.length;
			var tag = this.tags.pop();
			if (tag.parentNode == null) {
				document.body.appendChild(tag);
			}
			return tag;
		},

		/**
		 * Put an HTMLAudioElement back in the pool for use.
		 * #method set
		 * @param {HTMLAudioElement} tag HTML audio tag
		 */
		set:function (tag) {
			var index = this.tags.indexOf(tag);
			if (index == -1) {
				this.tags.push(tag);
			}
			this.available = this.tags.length;
		},

		toString:function () {
			return "[HTMLAudioPlugin TagPool]";
		}

	}

	// do not add TagPool to namespace

}());
