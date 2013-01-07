/*
* FlashPlugin for SoundJS
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
	 * Play sounds using a Flash instance. This plugin requires swfObject.as
	 * as well as the FlashAudioPlugin.swf. Ensure that FlashPlugin.BASE_PATH
	 * is set when using this plugin, so that the script can find the swf.
	 * @class FlashPlugin
	 * @uses EventDispatcher
	 * @constructor
	 */
	function FlashPlugin() {
		this.init();
	}

	var s = FlashPlugin;

	/**
	 * The capabilities of the plugin.
	 * @property capabilities
	 * @type Object
	 * @default null
	 * @static
	 */
	s.capabilities = null;

	/**
	 * The path relative to the HTML page that the FlashAudioPlugin.swf resides.
	 * If this is not correct, this plugin will not work.
	 * @property BASE_PATH
	 * @type String
	 * @default src/soundjs
	 * @static
	 */
	s.BASE_PATH = "src/soundjs/";

	/**
	 * Determine if the plugin can be used.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function() {
		if (createjs.SoundJS.BrowserDetect.isIOS) { return false; }
		s.generateCapabilities();
		if (swfobject == null) {
			return false;
		}
		return swfobject.hasFlashPlayerVersion("9.0.0");
		//TODO: Internal detection instead of SWFObject
	};

	/**
	 * Determine the capabilities of the plugin.
	 * @method generateCapabiities
	 * @static
	 */
	s.generateCapabilities = function() {
		if (s.capabilities != null) { return; }
        // TODO change to support file types like other plugins if possible
        // if not possible add default types "m4a", "mp4", "aiff", "wma", "mid"
		var c = s.capabilities = {
			panning: true,
			volume: true,
            tracks: -1,
			mp3: true,
			ogg: false,
			mpeg: true,
			wav: true
		};
    };


	var p = s.prototype = {

        audioSources: null,  // object hash that tells us if an audioSource has started loading
        volume:1,

		/**
		 * The id name of the DIV that gets created for Flash content.
		 * @property CONTAINER_ID
		 * @type String
		 * @default flashAudioContainer
		 * @protected
		 */
		CONTAINER_ID: "flashAudioContainer",

		/**
		 * An object that defines the capabilities of the plugin. Please see SoundJS.getCapabilities for more
		 * information on plugin capabilities.
		 * @property capabilities
		 * @type Object
		 * @protected
		 */
		capabilities: null,

		// FlashPlugin Specifics
		/**
		 * A reference to the DIV container that gets created to hold the Flash instance.
		 * @property container
		 * @type HTMLDivElement
		 * @protected
		 */
		container: null, // Reference to the DIV containing the Flash Player

		/**
		 * A reference to the Flash instance that gets created.
		 * @property flash
		 * @type Object | Embed
		 * @protected
		 */
		flash: null, // Reference to the flash player instance

		/**
		 * Determines if the Flash object has been created and initialized. This is required to make ExternalInterface
		 * calls from JavaScript to Flash.
		 * @property flashReady
		 * @type Boolean
		 * @default false
		 */
		flashReady: false,

		/**
		 * A hash of SoundInstances indexed by the related ID in Flash. This lookup is required to connect sounds in
		 * JavaScript to their respective instances in Flash.
		 * @property flashInstances
		 * @type Object
		 * @protected
		 */
		flashInstances: null,

		/**
		 * A hash of Sound Preload instances indexed by the related ID in Flash. This lookup is required to connect
		 * a preloading sound in Flash with its respective instance in JavaScript.
		 * @property flashPreloadInstances
		 * @type Object
		 * @protected
		 */
		flashPreloadInstances: null, // Hash of preload instances, by Flash ID

        /**
         * A hash of Sound Preload instances indexed by the src. This lookup is required to load sounds if preloading
         * is tried when flash is not ready.
         * @property preloadInstances
         * @type Object
         * @protected
         */
        preloadInstances: null, // Hash of preload instances, by src

        /**
		 * An array of Sound Preload instances that is waiting for preload before the Flash instance is ready. Once
		 * Flash is initialized, the queued instances are preloaded.
		 * @property queuedInstances
		 * @type Object
		 * @protected
		 */
		queuedInstances: null,

		/**
		 * A developer flag to output all flash events to the console.
		 * @property showOutput
		 * @type Boolean
		 * @default false
		 */
		showOutput: false,

		init: function() {
			this.capabilities = s.capabilities;
            this.audioSources = {};

			this.flashInstances = {};
			this.flashPreloadInstances = {};
            this.preloadInstances = {};
			this.queuedInstances = [];

			// Create DIV
			var c = this.container = document.createElement("div");
			c.id = this.CONTAINER_ID;
			c.appendChild(document.createTextNode("Default Content Here"));
			document.body.appendChild(c);

			// Embed SWF
			var val = swfobject.embedSWF(s.BASE_PATH + "FlashAudioPlugin.swf", this.CONTAINER_ID, "1", "1",//550", "400",
					"9.0.0",null,null,null,null,
					createjs.SoundJS.proxy(this.handleSWFReady, this)
			);

			//TODO: Internal detection instead of swfobject
		},

		/**
		 * The SWF used for sound preloading and playback has been initialized.
		 * @method handleSWFReady
		 * @param {Object} event
		 * @protected
		 */
		handleSWFReady: function(event) {
			this.flash = event.ref;
			this.loadTimeout = setTimeout(function() {
				createjs.SoundJS.proxy(this.handleTimeout, this);
			}, 2000);
		},

		/**
		 * The Flash application that handles preloading and playback is ready. We wait for a callback from Flash
		 * to ensure that everything is in place before playback begins.
		 * @method handleFlashReady
		 * @protected
		 */
		handleFlashReady: function() {
			this.flashReady = true;

			// Anything that needed to be preloaded, can now do so.
			for (var i=0, l=this.queuedInstances.length; i<l; i++) {
				this.flash.register(this.queuedInstances[i]);
			}
			this.queuedInstances = null;

			// Associate flash instance with any preloadInstance that already exists.
            // OJR this might not be needed anymore, need to further investigate how PreloadJS interacts when it's ready
			for (var n in this.flashPreloadInstances) {
				this.flashPreloadInstances[n].initialize(this.flash);
			}

            // load sounds that tried to preload before flash was ready
            for (var n in this.preloadInstances) {
                this.preloadInstances[n].initialize(this.flash);
            }
            this.preloadInstances = null;

			// Associate flash instance with any sound instance that has already been played.
			for (var n in this.flashInstances) {
				this.flashInstances[n].initialize(this.flash);
			}
		},

		/**
		 * The callback when Flash does not initialize. This usually means the SWF is missing or incorrectly pathed.
		 * @method handleTimeout
		 * @protected
		 */
		handleTimeout: function() {
			//TODO: Surface to user? AUDIO_FLASH_FAILED
			//LM: Maybe SoundJS.handleError(error); ???
		},

		/**
		 * Pre-register a sound instance when preloading/setup.
		 * Note that the FlashPlugin will return a SoundLoader instance for preloading
		 * since Flash can not access the browser cache consistently.
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * @return {Object} A result object, containing a tag for preloading purposes.
		 */
		register: function(src, instances) {
			//Note that currently, registering with the flash instance does nothing.
            this.audioSources[src] = true;  // OJR this does not mean preloading has started
			if (!this.flashReady) {
				this.queuedInstances.push(src);
			} else {
				this.flash.register(src);
			}
			var tag = new SoundLoader(src, this, this.flash);
			tag.owner = this;
			return {
				tag: tag
			};
		},

		/**
		 * Create a sound instance.
		 * @method create
		 * @param {String} src The source to use.
		 * @return {SoundInstance} A sound instance for playback and control.
		 */
		create: function(src) {
            if (!this.preloadStarted(src)) {
                this.preload(src);
            }

            try {
                var instance = new SoundInstance(src, this, this.flash);
                return instance;
            } catch (err) {  // OJR why would this ever fail?
                //console.log("Error: Please ensure you have permission to play audio from this location.", err);
            }
            return null;
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
		 * Preload a sound instance. This plugin uses Flash to preload and play all sounds.
		 * @method preload
		 * @param {String} src The path to the Sound
		 * @param {Object} instance Additional details to use when loading.
		 */
		preload: function(src, instance) {
            this.audioSources[src] = true;  // OJR this does not mean preloading has started
			var loader = new SoundLoader(src, this, this.flash);
			if (!loader.load(src)) {  // NOTE this returns false if flash is not ready
                this.preloadInstances[src] = loader;
            }
		},

	// Flash Communication
		registerPreloadInstance: function(flashId, instance) {
			this.flashPreloadInstances[flashId] = instance;
		},
		unregisterPreloadInstance: function(flashId) {
			delete this.flashPreloadInstances[flashId];
		},

		registerSoundInstance: function(flashId, instance) {
			this.flashInstances[flashId] = instance;
		},
		unregisterSoundInstance: function(flashId) {
			delete this.flashInstances[flashId];
		},
		flashLog: function(data) {
			this.showOutput && console.log(data);
		},

		// Events from Flash pertaining to a specific SoundInstance
		handleSoundEvent: function(flashId, method) {
			var instance = this.flashInstances[flashId];
			if (instance == null) { return; }
			var args = [];
			for (var i=2, l=arguments.length; i<l; i++) { args.push(arguments[i]); }
			try {
				if (args.length == 0) {
					instance[method]();
				} else {
					instance[method].apply(instance, args);
				}
			} catch(error) {}
		},

		// Events for Flash pertaining to a specific SoundLoader
		handlePreloadEvent: function(flashId, method) {
			var instance = this.flashPreloadInstances[flashId];
			if (instance == null) { return; }
			var args = [];
			for (var i=2, l=arguments.length; i<l; i++) { args.push(arguments[i]); }
			try {
				if (args.length == 0) {
					instance[method]();
				} else {
					instance[method].apply(instance, args);
				}
			} catch(error) {}
		},

		// Events from Flash pertaining to general functions
		handleEvent: function(method) {
			//SoundJS.log("Handle Event", method);
			switch (method) {
				case "ready":
					clearTimeout(this.loadTimeout);
					this.handleFlashReady();
					break;
			}
		},

		// Events from Flash when an error occurs.
        handleErrorEvent: function(error) {},

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
            return this.flash.setMasterVolume(newVolume);
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
			return "[FlashPlugin]";
		}

	}

	createjs.FlashPlugin = FlashPlugin;


	/**
	 * Flash Sound Instance
	 * Instances are created by the FlashPlugin, and returned to the user.
	 * The user can control the audio directly.
	 * Note that audio control is shuttled to a flash player instance via the flash reference.
	 * #class SoundInstance
	 * @param {String} src The path to the sound source
	 * @param {Object} flash A reference to the Flash Player instance that controls the audio.
	 * @private
	 */
	function SoundInstance(src, owner, flash) {
		this.init(src, owner, flash);
	}

	var p = SoundInstance.prototype = {

		/**
		 * The source of the sound.
		 * #property src
		 * @private
		 */
		src: null,

		/**
		 * The unique ID of the instance
		 * @private
		 */
		uniqueId: -1,

		owner: null,
		capabilities: null,
		flash: null,
		flashId: null, // To communicate with Flash

		loop:0,
		volume:1,
		pan:0,
        offset: 0,  // used for setPosition on a stopped instance
        duration:0,

        // is created by SoundJS when this instance is played with a delay, so we can remove the delay if stop or pause or cleanup are called
        delayTimeoutId: null,


        /**
		 * Determines if the audio is currently muted.
		 * @private
		 */
		muted: false,

		/**
		 * Determines if the audio is currently paused. If the audio has not yet started playing,
		 * it will be true, unless the user pauses it.
		 * @private
		 */
		paused: false,

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

        // mix-ins:
        // EventDispatcher methods:
        addEventListener: null,
        removeEventListener: null,
        removeAllEventListeners: null,
        dispatchEvent: null,
        hasEventListener: null,
        _listeners: null,

        // Constructor
        init: function(src, owner, flash) {
			this.src = src;
			this.owner = owner;
			this.flash = flash;
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

        initialize: function(flash) {
			this.flash = flash;
		},

	// Public API

		interrupt: function() {
			this.playState = createjs.SoundJS.PLAY_INTERRUPTED;
			if (this.onPlayInterrupted != null) { this.onPlayInterrupted(this); }
			this.flash.interrupt(this.flashId);
            this.sendLoadComplete("playInterrupted");
			this.cleanUp();
            this.paused = false;
        },

		cleanUp: function() {
            clearTimeout(this.delayTimeoutId);
			this.owner.unregisterSoundInstance(this.flashId);
			createjs.SoundJS.playFinished(this);
		},

		/**
		 * Play an instance. This API is only used to play an instance after it has been stopped
		 * or interrupted.
		 * @private
		 */
		play: function(interrupt, delay, offset, loop, volume, pan) {
			createjs.SoundJS.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		beginPlaying: function(offset, loop, volume, pan) {
			this.loop = loop;
			this.paused = false;

			if (!this.owner.flashReady) { return false; }

            this.offset = offset;

            this.flashId = this.flash.playSound(this.src, offset, loop, volume, pan);
			if (this.flashId == null) {
				if (this.onPlayFailed != null) { this.onPlayFailed(this); }
				this.cleanUp();
				return false;
			}

            //this.duration = this.flash.getDuration(this.flashId);  // this is 0 at this point
			if (this.muted) { this.setMute(true); }
			this.playState = createjs.SoundJS.PLAY_SUCCEEDED;
			this.owner.registerSoundInstance(this.flashId, this);
            this.sendLoadComplete("playSucceeded");  // OJR may not need this
			return true;
		},

		playFailed: function() {
			this.playState = createjs.SoundJS.PLAY_FAILED;
			if (this.onPlayFailed != null) { this.onPlayFailed(this); }
            this.sendLoadComplete("playFailed");
			this.cleanUp();
		},

		/**
		 * Pause the instance.
		 * @private
		 */
		pause: function() {
			this.paused = true;
            clearTimeout(this.delayTimeoutId);
			return this.flash.pauseSound(this.flashId);
		},

		/**
		 * Resume a sound instance that has been paused.
		 * @private
		 */
		resume: function() {
			this.paused = false;
			return this.flash.resumeSound(this.flashId);
		},

		/**
		 * Stop a sound instance.
		 * @private
		 */
		stop: function() {
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			this.paused = false;
            this.offset = 0;  // flash destroys the wrapper, so we need to track offset on our own
			var ok = this.flash.stopSound(this.flashId);
			this.cleanUp();
			return ok;
		},

		/**
		 * Set the volume of the sound instance.
		 * @private
		 */
		setVolume: function(value) {
			this.volume = value;
			return this.flash.setVolume(this.flashId, value)
		},

		/**
		 * Get the volume of the sound, not including how the master volume has affected it.
		 * @private
		 */
		getVolume: function() {
			return this.volume;
		},

		/**
		 * Mute the sound.
         * @deprecated
		 * @private
		 */
		mute: function(value) {
			this.muted = value;
			return value ? this.flash.muteSound(this.flashId) : this.flash.unmuteSound(this.flashId);
		},

        /**
         * Mute the sound.
         * @private
         */
        setMute: function(value) {
            this.muted = value;
            return value ? this.flash.muteSound(this.flashId) : this.flash.unmuteSound(this.flashId);
        },

        /**
         * Mute value of the sound.
         * @private
         */
        getMute: function() {
            return this.muted;
        },

        /**
		 * Get the pan of a sound instance.
		 * @private
		 */
		getPan: function() {
			return this.pan;
		},

		/**
		 * Set the pan of a sound instance.
		 * @private
		 */
		setPan: function(value) {
			this.pan = value;
			return this.flash.setPan(this.flashId, value);
		},

		/**
		 * Get the position of the playhead in the sound instance.
		 * @private
		 */
		getPosition: function() {
            var value = -1;
            if(this.flash && this.flashId) {
			    value = this.flash.getPosition(this.flashId); // this returns -1 on stopped instance
            }
            if (value != -1) {this.offset = value;}
            return this.offset;
		},

		/**
		 * Set the position of the playhead in the sound instance.
		 * @private
		 */
		setPosition: function(value) {
            this.offset = value;  //
			this.flash && this.flashId && this.flash.setPosition(this.flashId, value);
            return true;  // this is always true now, we either hold value internally to set later or set immediately
		},

		/**
		 * Set the position of the playhead in the sound instance.
		 * @private
		 */
		getDuration: function() {
            var value = -1;
            if(this.flash && this.flashId) {
                value = this.flash.getDuration(this.flashId);
            }
            if (value != -1) {this.duration = value;}
			return this.duration;
		},

	    // Flash callbacks, only exist in FlashPlugin
		handleSoundFinished: function() {
			this.playState = createjs.SoundJS.PLAY_FINISHED;
			if (this.onComplete != null) { this.onComplete(this); }
            this.sendLoadComplete("playComplete");
			this.cleanUp();
		},

		handleSoundLoop: function() {
			if (this.onLoop != null) { this.onLoop(this); }
		},

		toString: function() {
			return "[FlashPlugin SoundInstance]"
		}

	}

    // we only use EventDispatcher if it's available:
    createjs.EventDispatcher && createjs.EventDispatcher.initialize(SoundInstance.prototype); // inject EventDispatcher methods.

    // do not add to namespace


	/**
	 * SoundLoader provides a mechanism to preload Flash content via PreloadJS or internally. Instances are returned to
	 * the preloader, and the load method is called when the asset needs to be requested.
	 *
	 * SoundLoader has the same APIs as an &lt;audio&gt; tag. The instance calls the <code>onload</code>, <code>onprogress</code>,
	 * and <code>onerror</code> callbacks when necessary.
	 *
	 * #class SoundLoader
	 * @param {String} src The path to the sound
	 * @param {Object} flash The flash instance that will do the preloading.
	 * @private
	 */
	function SoundLoader(src, owner, flash) {
		this.init(src, owner, flash);
	}

	var p = SoundLoader.prototype = {

		flash:null,
		src: null,

		flashId: null,
		progress: -1,
		readyState: 0,
		loading: false,
		owner: null,

		// Calbacks
		/**
		 * The callback that fires when the load completes. This follows HTML tag name conventions.
		 * #event onload
		 */
		onload: null,

		/**
		 * The callback that fires as the load progresses. This follows HTML tag name conventions.
		 * #event onprogress
		 */
		onprogress: null,

		/**
		 * The callback that fires if the load hits an error. This follows HTML tag name conventions.
		 * #event onerror
		 */
		onerror: null,

		// The loader has been created.
		init: function(src, owner, flash) {
			this.src = src;
            this.owner = owner;
			this.flash = flash;
		},

		// Flash has been initialized. If a load call was made before this, call it now.
		initialize: function(flash) {
			this.flash = flash;
			if (this.loading) {
                this.loading = false;
				this.load(this.src);
			}
		},

		/**
		 * Start loading.
		 * #method load
		 * @param {String} src The path to the sound.
		 * @return {Boolean} If the load was started. If Flash has not been initialized, the load will fail.
		 */
		load: function(src) {
			if (src != null) { this.src = src; }
			if (this.flash == null || !this.owner.flashReady) {
				this.loading = true;
				return false;
			}

			this.flashId = this.flash.preload(this.src);
			// Associate this preload instance with the FlashID, so callbacks can route here.
			this.owner.registerPreloadInstance(this.flashId, this);
			return true;
		},

		handleProgress: function(loaded, total) {
			this.progress = loaded / total;
			this.onprogress && this.onprogress({loaded:loaded, total:total, progress:this.progress});
		},


		handleComplete: function() {
			this.progress = 1;
			this.readyState = 4;
            createjs.SoundJS.sendLoadComplete(this.src);  // fire event or callback on SoundJS // can't use onload callback because we need to pass the source
            this.onload && this.onload();
		},

		handleError: function(error) {
			this.onerror && this.onerror(error);
		},

		toString: function() {
			return "[FlashPlugin SoundLoader]";
		}

	}

	// do not add SoundLoader to namespace

}());