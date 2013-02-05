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
this.createjs = this.createjs || {};

(function () {

	/**
	 * Play sounds using a Flash instance. This plugin is not used by default, and must be registered manually in
	 * {{#crossLink "Sound"}}{{/crossLink}} using the {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} method. This
	 * plugin is recommended to be included if sound support is required in older browsers such as IE8.
	 *
	 * This plugin requires FlashAudioPlugin.swf and swfObject.js (which is compiled
	 * into the minified FlashPlugin-X.X.X.min.js file. You must ensure that <code>FlashPlugin.BASE_PATH</code> is
	 * set when using this plugin, so that the script can find the swf.
	 *
	 * <h4>Example</h4>
	 *      createjs.FlashPlugin.BASE_PATH = "../src/SoundJS/";
	 *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);
	 *      // Adds FlashPlugin as a fallback if WebAudio and HTMLAudio do not work.
	 *
	 * @class FlashPlugin
	 * @constructor
	 */
	function FlashPlugin() {
		this.init();
	}

	var s = FlashPlugin;

	/**
	 * The capabilities of the plugin. This is generated via the {{#crossLink "WebAudioPlugin/generateCapabilities"}}{{/crossLink}}
	 * method. Please see the Sound {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} method for a list of available
	 * capabilities.
	 * @property capabilities
	 * @type {Object}
	 * @static
	 */
	s.capabilities = null;

	/**
	 * The path relative to the HTML page that the FlashAudioPlugin.swf resides. Note if this is not correct, this
	 * plugin will not work.
	 * @property BASE_PATH
	 * @type {String}
	 * @default src/SoundJS
	 * @static
	 */
	s.BASE_PATH = "src/SoundJS/";

	/**
	 * Determine if the plugin can be used in the current browser/OS.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		if (createjs.Sound.BrowserDetect.isIOS) {
			return false;
		}
		s.generateCapabilities();
		if (swfobject == null) {
			return false;
		}
		return swfobject.hasFlashPlayerVersion("9.0.0");
		//TODO: Internal detection instead of SWFObject?
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
		// TODO change to support file types using SUPPORTED_EXTENSIONS like other plugins if possible
		// see http://helpx.adobe.com/flash/kb/supported-codecs-flash-player.html
		var c = s.capabilities = {
			panning:true,
			volume:true,
			tracks:-1,
			mp3:true,
			ogg:false,
			mpeg:true,
			wav:true,
			m4a:true,
			mp4:true,
			aiff:false, // not listed in player but is Supported by Flash so this may be true
			wma:false,
			mid:false
		};
	};


	var p = s.prototype = {

		/**
		 * An object hash indexed by ID that indicates if each source is loaded or loading.
		 * @property audioSources
		 * @type {Object}
		 * @protected
		 */
		audioSources:null, // object hash that tells us if an audioSource has started loading

		/**
		 * The internal volume value of the plugin.
		 * @property volume
		 * @type {Number}
		 * @default 1
		 * @protected
		 */
		volume:1,

		/**
		 * The id name of the DIV that gets created for Flash content.
		 * @property CONTAINER_ID
		 * @type {String}
		 * @default flashAudioContainer
		 * @protected
		 */
		CONTAINER_ID:"flashAudioContainer",

		/**
		 * An object that defines the capabilities of the plugin. Please see {{#crossLink "Sound/getCapabilities"}}{{/crossLink}}
		 * for more information on plugin capabilities.
		 * @property capabilities
		 * @type {Object}
		 * @protected
		 */
		capabilities:null,

// FlashPlugin Specifics
		/**
		 * A reference to the DIV container that gets created to hold the Flash instance.
		 * @property container
		 * @type {HTMLDivElement}
		 * @protected
		 */
		container:null,

		/**
		 * A reference to the Flash instance that gets created.
		 * @property flash
		 * @type {Object | Embed}
		 * @protected
		 */
		flash:null,

		/**
		 * Determines if the Flash object has been created and initialized. This is required to make <code>ExternalInterface</code>
		 * calls from JavaScript to Flash.
		 * @property flashReady
		 * @type {Boolean}
		 * @default false
		 */
		flashReady:false,

		/**
		 * A hash of SoundInstances indexed by the related ID in Flash. This lookup is required to connect sounds in
		 * JavaScript to their respective instances in Flash.
		 * @property flashInstances
		 * @type {Object}
		 * @protected
		 */
		flashInstances:null,

		/**
		 * A hash of Sound Preload instances indexed by the related ID in Flash. This lookup is required to connect
		 * a preloading sound in Flash with its respective instance in JavaScript.
		 * @property flashPreloadInstances
		 * @type {Object}
		 * @protected
		 */
		flashPreloadInstances:null,

		/**
		 * A hash of Sound Preload instances indexed by the src. This lookup is required to load sounds if internal
		 * preloading is tried when flash is not ready.
		 * @property preloadInstances
		 * @type {Object}
		 * @protected
		 * @since 0.4.0
		 */
		preloadInstances:null,

		/**
		 * An array of Sound Preload instances that are waiting to preload. Once Flash is initialized, the queued
		 * instances are preloaded.
		 * @property queuedInstances
		 * @type {Object}
		 * @protected
		 */
		queuedInstances:null,

		/**
		 * A developer flag to output all flash events to the console (if it exists).  Used for debugging.
		 *
		 *      Sound.activePlugin.showOutput = true;
		 *
		 * @property showOutput
		 * @type {Boolean}
		 * @default false
		 */
		showOutput:false,

		/**
		 * An initialization function run by the constructor
		 * @method init
		 * @protected
		 */
		init:function () {
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
			var val = swfobject.embedSWF(s.BASE_PATH + "FlashAudioPlugin.swf", this.CONTAINER_ID, "1", "1", //550", "400",
					"9.0.0", null, null, null, null,
					createjs.proxy(this.handleSWFReady, this)
			);

			//TODO: Internal detection instead of swfobject
		},

		/**
		 * The SWF used for sound preloading and playback has been initialized.
		 * @method handleSWFReady
		 * @param {Object} event Contains a reference to the swf.
		 * @protected
		 */
		handleSWFReady:function (event) {
			this.flash = event.ref;
			this.loadTimeout = setTimeout(createjs.proxy(this.handleTimeout, this), 2000);  // OJR note this function doesn't do anything right now
		},

		/**
		 * The Flash application that handles preloading and playback is ready. We wait for a callback from Flash to
		 * ensure that everything is in place before playback begins.
		 * @method handleFlashReady
		 * @protected
		 */
		handleFlashReady:function () {
			this.flashReady = true;

			// Anything that needed to be preloaded, can now do so.
			for (var i = 0, l = this.queuedInstances.length; i < l; i++) {
				this.flash.register(this.queuedInstances[i]);  // NOTE this flash function currently does nothing
			}
			this.queuedInstances = null;

			// Associate flash instance with any preloadInstance that already exists.
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
		handleTimeout:function () {
			//LM: Surface to user? AUDIO_FLASH_FAILED
			// OJR we could dispatch an error event
		},

		/**
		 * Pre-register a sound instance when preloading/setup. Note that the FlashPlugin will return a SoundLoader
		 * instance for preloading since Flash can not access the browser cache consistently.
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * @return {Object} A result object, containing a tag for preloading purposes.
		 */
		register:function (src, instances) {
			//Note that currently, registering with the flash instance does nothing.
			this.audioSources[src] = true;  // NOTE this does not mean preloading has started
			if (!this.flashReady) {
				this.queuedInstances.push(src);
			} else {
				this.flash.register(src);  // NOTE this flash function currently does nothing  // OJR remove this entire thing, as it does nothing?
			}
			var tag = new SoundLoader(src, this, this.flash);
			return {
				tag:tag
			};
		},

		/**
		 * Create a sound instance. If the sound has not been preloaded, it is internally preloaded here.
		 * @method create
		 * @param {String} src The sound source to use.
		 * @return {SoundInstance} A sound instance for playback and control.
		 */
		create:function (src) {
			if (!this.isPreloadStarted(src)) {
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
		 * Checks if preloading has started for a specific source. If the source is found, we can assume it is loading,
		 * or has already finished loading.
		 * @method isPreloadStarted
		 * @param {String} src The sound URI to check.
		 * @return {Boolean}
		 */
		isPreloadStarted:function (src) {
			return (this.audioSources[src] != null);
		},

		/**
		 * Preload a sound instance. This plugin uses Flash to preload and play all sounds.
		 * @method preload
		 * @param {String} src The path to the Sound
		 * @param {Object} instance Not used in this plugin.
		 */
		preload:function (src, instance) {
			this.audioSources[src] = true;  // NOTE this does not mean preloading has started, just that it will
			var loader = new SoundLoader(src, this, this.flash);
			loader.load();  // this will handle if flash is not ready
			/*if (!loader.load(src)) {  // NOTE this returns false if flash is not ready
			 this.preloadInstances[src] = loader;
			 }*/
		},

		/**
		 * Set the master volume of the plugin, which affects all SoundInstances.
		 * @method setVolume
		 * @param {Number} value The volume to set, between 0 and 1.
		 * @return {Boolean} If the plugin processes the setVolume call (true). The Sound class will affect all the
		 * instances manually otherwise.
		 * @since 0.4.0
		 */
		setVolume:function (value) {
			this.volume = value;
			return this.updateVolume();
		},

		/**
		 * Internal function used to set the gain value for master audio.  Should not be called externally.
		 * @method updateVolume
		 * @return {Boolean}
		 * @protected
		 * @since 0.4.0
		 */
		updateVolume:function () {
			var newVolume = createjs.Sound.masterMute ? 0 : this.volume;
			return this.flash.setMasterVolume(newVolume);
		},

		/**
		 * Get the master volume of the plugin, which affects all SoundInstances.
		 * @method getVolume
		 * @return The volume level, between 0 and 1.
		 * @since 0.4.0
		 */
		getVolume:function () {
			return this.volume;
		},

		/**
		 * Mute all sounds via the plugin.
		 * @method setMute
		 * @param {Boolean} value If all sound should be muted or not. Note that plugin-level muting just looks up
		 * the mute value of Sound {{#crossLink "Sound/masterMute"}}{{/crossLink}}, so this property is not used here.
		 * @return {Boolean} If the mute call succeeds.
		 * @since 0.4.0
		 */
		setMute:function (isMuted) {
			return this.updateVolume();
		},

// Flash Communication
		/**
		 * Used to couple a Flash loader instance with a <code>SoundLoader</code> instance
		 * @method registerPreloadInstance
		 * @param {String} flashId Used to identify the SoundLoader.
		 * @param {SoundLoader} instance The actual instance.
		 */
		registerPreloadInstance:function (flashId, instance) {
			this.flashPreloadInstances[flashId] = instance;
		},

		/**
		 * Used to decouple a <code>SoundLoader</code> instance from Flash.
		 * @method unregisterPreloadInstance
		 * @param {String} flashId Used to identify the SoundLoader.
		 */
		unregisterPreloadInstance:function (flashId) {
			delete this.flashPreloadInstances[flashId];
		},

		/**
		 * Used to couple a Flash sound instance with a {{#crossLink "SoundInstance"}}{{/crossLink}}.
		 * @method registerSoundInstance
		 * @param {String} flashId Used to identify the SoundInstance.
		 * @param {SoundLoader} instance The actual instance.
		 */
		registerSoundInstance:function (flashId, instance) {
			this.flashInstances[flashId] = instance;
		},

		/**
		 * Used to decouple a {{#crossLink "SoundInstance"}}{{/crossLink}} from Flash.
		 * instance.
		 * @method unregisterSoundInstance
		 * @param {String} flashId Used to identify the SoundInstance.
		 * @param {SoundLoader} instance The actual instance.
		 */
		unregisterSoundInstance:function (flashId) {
			delete this.flashInstances[flashId];
		},

		/**
		 * Used to output trace from Flash to the console.
		 * @method flashLog
		 * @param {String} data The information to be output.
		 */
		flashLog:function (data) {
			try {
				this.showOutput && console.log(data);
			} catch (error) {
			}
		},

		/**
		 * Handles events from Flash, and routes communication to a {{#crossLink "SoundInstance"}}{{/crossLink}} via
		 * the Flash ID. The method and arguments from Flash are run directly on the sound instance.
		 * @method handleSoundEvent
		 * @param {String} flashId Used to identify the SoundInstance.
		 * @param {String} method Indicates the method to run.
		 */
		handleSoundEvent:function (flashId, method) {
			var instance = this.flashInstances[flashId];
			if (instance == null) {
				return;
			}
			var args = [];
			for (var i = 2, l = arguments.length; i < l; i++) {
				args.push(arguments[i]);
			}
			try {
				if (args.length == 0) {
					instance[method]();
				} else {
					instance[method].apply(instance, args);
				}
			} catch (error) {
			}
		},

		/**
		 * Handles events from Flash and routes communication to a <code>SoundLoader</code> via the Flash ID. The method
		 * and arguments and arguments from Flash are run directly on the sound loader.
		 * @method handlePreloadEvent
		 * @param {String} flashId Used to identify the loader instance.
		 * @param {String} method Indicates the method to run.
		 */
		handlePreloadEvent:function (flashId, method) {
			var instance = this.flashPreloadInstances[flashId];
			if (instance == null) {
				return;
			}
			var args = [];
			for (var i = 2, l = arguments.length; i < l; i++) {
				args.push(arguments[i]);
			}
			try {
				if (args.length == 0) {
					instance[method]();
				} else {
					instance[method].apply(instance, args);
				}
			} catch (error) {
			}
		},

		/**
		 * Handles events from Flash intended for the FlashPlugin class. Currently only a "ready" event is processed.
		 * @method handleEvent
		 * @param {String} method Indicates the method to run.
		 */
		handleEvent:function (method) {
			//Sound.log("Handle Event", method);
			switch (method) {
				case "ready":
					clearTimeout(this.loadTimeout);
					this.handleFlashReady();
					break;
			}
		},

		/**
		 * Handles error events from Flash. Note this function currently does not process any events.
		 * @method handleErrorEvent
		 * @param {String} error Indicates the error.
		 */
		handleErrorEvent:function (error) {
		},

		toString:function () {
			return "[FlashPlugin]";
		}

	}

	createjs.FlashPlugin = FlashPlugin;


// NOTE documentation for this class can be found online or in WebAudioPlugin.SoundInstance
// NOTE audio control is shuttled to a flash player instance via the flash reference.
	function SoundInstance(src, owner, flash) {
		this.init(src, owner, flash);
	}

	var p = SoundInstance.prototype = {

		src:null,
		uniqueId:-1,
		owner:null,
		capabilities:null,
		flash:null,
		flashId:null, // To communicate with Flash
		loop:0,
		volume:1,
		pan:0,
		offset:0, // used for setPosition on a stopped instance
		duration:0,
		delayTimeoutId:null,
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

// Constructor
		init:function (src, owner, flash) {
			this.src = src;
			this.owner = owner;
			this.flash = flash;
		},

		initialize:function (flash) {
			this.flash = flash;
		},

// Public API

		interrupt:function () {
			this.playState = createjs.Sound.PLAY_INTERRUPTED;
			if (this.onPlayInterrupted != null) {
				this.onPlayInterrupted(this);
			}
			this.flash.interrupt(this.flashId);
			this.sendEvent("interrupted");
			this.cleanUp();
			this.paused = false;
		},

		cleanUp:function () {
			clearTimeout(this.delayTimeoutId);
			this.owner.unregisterSoundInstance(this.flashId);
			createjs.Sound.playFinished(this);
		},

		play:function (interrupt, delay, offset, loop, volume, pan) {
			createjs.Sound.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		beginPlaying:function (offset, loop, volume, pan) {
			this.loop = loop;
			this.paused = false;

			if (!this.owner.flashReady) {
				return false;
			}

			this.offset = offset;

			this.flashId = this.flash.playSound(this.src, offset, loop, volume, pan);
			if (this.flashId == null) {
				if (this.onPlayFailed != null) {
					this.onPlayFailed(this);
				}
				this.cleanUp();
				return false;
			}

			//this.duration = this.flash.getDuration(this.flashId);  // this is 0 at this point
			if (this.muted) {
				this.setMute(true);
			}
			this.playState = createjs.Sound.PLAY_SUCCEEDED;
			this.owner.registerSoundInstance(this.flashId, this);
			this.onPlaySucceeded && this.onPlaySucceeded(this);
			this.sendEvent("succeeded");
			return true;
		},

		playFailed:function () {
			this.playState = createjs.Sound.PLAY_FAILED;
			if (this.onPlayFailed != null) {
				this.onPlayFailed(this);
			}
			this.sendEvent("failed");
			this.cleanUp();
		},

		pause:function () {
			if (!this.paused && this.playState == createjs.Sound.PLAY_SUCCEEDED) {
				this.paused = true;
				clearTimeout(this.delayTimeoutId);
				return this.flash.pauseSound(this.flashId);
			}
			return false;
		},

		resume:function () {
			if (!this.paused) {
				return false;
			}
			this.paused = false;
			return this.flash.resumeSound(this.flashId);
		},

		stop:function () {
			this.playState = createjs.Sound.PLAY_FINISHED;
			this.paused = false;
			this.offset = 0;  // flash destroys the wrapper, so we need to track offset on our own
			var ok = this.flash.stopSound(this.flashId);
			this.cleanUp();
			return ok;
		},

		setVolume:function (value) {
			if (Number(value) == null) {
				return false;
			}
			value = Math.max(0, Math.min(1, value));
			this.volume = value;
			return this.flash.setVolume(this.flashId, value)
		},

		getVolume:function () {
			return this.volume;
		},

		mute:function (value) {
			this.muted = value;
			return value ? this.flash.muteSound(this.flashId) : this.flash.unmuteSound(this.flashId);
		},

		setMute:function (value) {
			this.muted = value;
			return value ? this.flash.muteSound(this.flashId) : this.flash.unmuteSound(this.flashId);
		},

		getMute:function () {
			return this.muted;
		},

		getPan:function () {
			return this.pan;
		},

		setPan:function (value) {
			this.pan = value;
			return this.flash.setPan(this.flashId, value);
		},

		getPosition:function () {
			var value = -1;
			if (this.flash && this.flashId) {
				value = this.flash.getPosition(this.flashId); // this returns -1 on stopped instance
			}
			if (value != -1) {
				this.offset = value;
			}
			return this.offset;
		},

		setPosition:function (value) {
			this.offset = value;  //
			this.flash && this.flashId && this.flash.setPosition(this.flashId, value);
			return true;  // this is always true now, we either hold value internally to set later or set immediately
		},

		getDuration:function () {
			var value = -1;
			if (this.flash && this.flashId) {
				value = this.flash.getDuration(this.flashId);
			}
			if (value != -1) {
				this.duration = value;
			}
			return this.duration;
		},

// Flash callbacks, only exist in FlashPlugin
		sendEvent:function (eventString) {
			var event = {
				target:this,
				type:eventString
			};
			this.dispatchEvent(event);
		},

		/**
		 * Called from Flash.  Lets us know flash has finished playing a sound.
		 * #method handleSoundFinished
		 * @protected
		 */
		handleSoundFinished:function () {
			this.playState = createjs.Sound.PLAY_FINISHED;
			if (this.onComplete != null) {
				this.onComplete(this);
			}
			this.sendEvent("complete");
			this.cleanUp();
		},

		/**
		 * Called from Flash.  Lets us know that flash has played a sound to completion and is looping it.
		 * #method handleSoundLoop
		 * @protected
		 */
		handleSoundLoop:function () {
			if (this.onLoop != null) {
				this.onLoop(this);
			}
			this.sendEvent("loop");
		},

		toString:function () {
			return "[FlashPlugin SoundInstance]"
		}

	}

	// Note this is for SoundInstance above.
	createjs.EventDispatcher.initialize(SoundInstance.prototype);

	// do not add SoundInstance to namespace


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

		/**
		 * A reference to the Flash instance that gets created.
		 * #property flash
		 * @type {Object | Embed}
		 */
		flash:null,

		/**
		 * The source file to be loaded.
		 * #property src
		 * @type {String}
		 */
		src:null,

		/**
		 * ID used to facilitate communication with flash.
		 * #property flashId
		 * @type {String}
		 */
		flashId:null,

		/**
		 * The percentage of progress.
		 * #property progress
		 * @type {Number}
		 * @default -1
		 */
		progress:-1,

		/**
		 * Used to report if audio is ready.  Value of 4 indicates ready.
		 * #property readyState
		 * @type {Number}
		 * @default 0
		 */
		readyState:0,

		/**
		 * Indicates if <code>load</code> has been called on this.
		 * #property loading
		 * @type {Boolean}
		 * @default false
		 */
		loading:false,

		/**
		 * Plugin that created this.  This will be an instance of <code>FlashPlugin</code>.
		 * #property owner
		 * @type {Object}
		 */
		owner:null,

// Calbacks
		/**
		 * The callback that fires when the load completes. This follows HTML tag name conventions.
		 * #property onload
		 * @type {Method}
		 */
		onload:null,

		/**
		 * The callback that fires as the load progresses. This follows HTML tag name conventions.
		 * #property onprogress
		 * @type {Method}
		 */
		onprogress:null,

		/**
		 * The callback that fires if the load hits an error. This follows HTML tag name conventions.
		 * #property onerror
		 * @type {Method}
		 */
		onerror:null,

		// constructor
		init:function (src, owner, flash) {
			this.src = src;
			this.owner = owner;
			this.flash = flash;
		},

		/**
		 * Called when Flash has been initialized. If a load call was made before this, call it now.
		 * #method initialize
		 * @param {Object | Embed} flash A reference to the Flash instance.
		 */
		initialize:function (flash) {
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
		load:function (src) {
			if (src != null) {
				this.src = src;
			}
			if (this.flash == null || !this.owner.flashReady) {
				this.loading = true;
				// register for future preloading
				this.owner.preloadInstances[this.src] = this; // OJR this would be better as an API call
				return false;
			}

			this.flashId = this.flash.preload(this.src);
			// Associate this preload instance with the FlashID, so callbacks can route here.
			this.owner.registerPreloadInstance(this.flashId, this);
			return true;
		},

		/**
		 * Receive progress from Flash and pass it to callback.
		 * #method handleProgress
		 * @param {Number} loaded Amount loaded
		 * @param {Number} total Total amount to be loaded.
		 */
		handleProgress:function (loaded, total) {
			this.progress = loaded / total;
			this.onprogress && this.onprogress({loaded:loaded, total:total, progress:this.progress});
		},

		/**
		 * Called from Flash when sound is loaded.  Set our ready state and fire callbacks / events
		 * #method handleComplete
		 */
		handleComplete:function () {
			this.progress = 1;
			this.readyState = 4;
			createjs.Sound.sendLoadComplete(this.src);  // fire event or callback on Sound // can't use onload callback because we need to pass the source
			this.onload && this.onload();
		},

		/**
		 * Receive error event from flash and pass it to callback.
		 * @param {Event} error
		 */
		handleError:function (error) {
			this.onerror && this.onerror(error);
		},

		toString:function () {
			return "[FlashPlugin SoundLoader]";
		}

	}

	// do not add SoundLoader to namespace

}());