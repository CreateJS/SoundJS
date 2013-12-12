/*
 * FlashPlugin
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
	 * Play sounds using a Flash instance. This plugin is not used by default, and must be registered manually in
	 * {{#crossLink "Sound"}}{{/crossLink}} using the {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} method. This
	 * plugin is recommended to be included if sound support is required in older browsers such as IE8.
	 *
	 * This plugin requires FlashAudioPlugin.swf and swfObject.js, which is compiled
	 * into the minified FlashPlugin-X.X.X.min.js file. You must ensure that {{#crossLink "FlashPlugin/swfPath:property"}}{{/crossLink}}
	 * is set when using this plugin, so that the script can find the swf.
	 *
	 * <h4>Example</h4>
	 *      createjs.FlashPlugin.swfPath = "../src/SoundJS/";
	 *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);
	 *      // Adds FlashPlugin as a fallback if WebAudio and HTMLAudio do not work.
	 *
	 * Note that the SWF is embedded into a container DIV (with an id and classname of "SoundJSFlashContainer"), and
	 * will have an id of "flashAudioContainer". The container DIV is positioned 1 pixel off-screen to the left to avoid
	 * showing the 1x1 pixel white square.
	 *
	 * <h4>Known Browser and OS issues for Flash Audio</h4>
	 * <b>All browsers</b><br />
	 * <ul><li> There can be a delay in flash player starting playback of audio.  This has been most noticeable in Firefox.
	 * Unfortunely this is an issue with the flash player and the browser and therefore cannot be addressed by SoundJS.</li></ul>
	 *
	 * @class FlashPlugin
	 * @constructor
	 */
	function FlashPlugin() {
		this._init();
	}

	var s = FlashPlugin;

	/**
	 * The capabilities of the plugin. This is generated via the {{#crossLink "WebAudioPlugin/_generateCapabilities"}}{{/crossLink}}
	 * method. Please see the Sound {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} method for a list of available
	 * capabilities.
	 * @property _capabilities
	 * @type {Object}
	 * @protected
	 * @static
	 */
	s._capabilities = null;

	/**
	 * Deprecated in favor of {{#crossLink "FlashPlugin/swfPath:property"}}{{/crossLink}}
	 * <br />The path relative to the HTML page that the FlashAudioPlugin.swf resides. Note if this is not correct, this
	 * plugin will not work.
	 * @property BASE_PATH
	 * @type {String}
	 * @default null
	 * @static
	 * @deprecated
	 */
	s.BASE_PATH = null;

	/**
	 * The path relative to the HTML page that the FlashAudioPlugin.swf resides. Note if this is not correct, this
	 * plugin will not work.
	 * @property swfPath
	 * @type {String}
	 * @default src/SoundJS
	 * @static
	 * @since 0.5.2
	 */
	s.swfPath = "src/SoundJS/";

	/**
	 * Determine if the plugin can be used in the current browser/OS.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		// there is no flash player on mobile devices
		if (createjs.Sound.BrowserDetect.isIOS || createjs.Sound.BrowserDetect.isAndroid || createjs.Sound.BrowserDetect.isBlackberry) {
			return false;
		}
		s._generateCapabilities();
		if (swfobject == null) {
			return false;
		}
		return swfobject.hasFlashPlayerVersion("9.0.0");
		//TODO: Internal detection instead of SWFObject?
	};

	/**
	 * Determine the capabilities of the plugin. Used internally. Please see the Sound API {{#crossLink "Sound/getCapabilities"}}{{/crossLink}}
	 * method for an overview of plugin capabilities.
	 * @method _generateCapabilities
	 * @static
	 * @protected
	 */
	s._generateCapabilities = function () {
		if (s._capabilities != null) {
			return;
		}
		// TODO change to support file types using SUPPORTED_EXTENSIONS like other plugins if possible
		// see http://helpx.adobe.com/flash/kb/supported-codecs-flash-player.html
		var c = s._capabilities = {
			panning:true,
			volume:true,
			tracks:-1,
			mp3:true,
			ogg:false,
			mpeg:true,
			wav:true,
			// our current implementation cannot support mp4 http://forums.adobe.com/thread/825408
			m4a:false,
			mp4:false,
			aiff:false, // not listed in player but is Supported by Flash so this may be true
			wma:false,
			mid:false
		};
	};


	var p = s.prototype = {

		/**
		 * An object hash indexed by ID that indicates if each source is loaded or loading.
		 * @property _audioSources
		 * @type {Object}
		 * @protected
		 */
		_audioSources:null,

		/**
		 * The internal volume value of the plugin.
		 * @property _volume
		 * @type {Number}
		 * @default 1
		 * @protected
		 */
		_volume:1,

		/**
		 * The id name of the DIV that gets created for Flash content.
		 * @property _CONTAINER_ID
		 * @type {String}
		 * @default flashAudioContainer
		 * @protected
		 */
		_CONTAINER_ID:"flashAudioContainer",

		/**
		 * The id name of the DIV wrapper that contains the Flash content.
		 * @property _WRAPPER_ID
		 * @type {String}
		 * @default SoundJSFlashContainer
		 * @protected
		 * @since 0.4.1
		 */
		_WRAPPER_ID:"SoundJSFlashContainer",

		// doc'd above
		_capabilities:null,

// FlashPlugin Specifics
		/**
		 * A reference to the DIV container that gets created to hold the Flash instance.
		 * @property _container
		 * @type {HTMLDivElement}
		 * @protected
		 */
		_container:null,

		/**
		 * A reference to the Flash instance that gets created.
		 * @property flash
		 * @type {Object | Embed}
		 * @protected
		 */
		_flash:null,

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
		 * @property _flashInstances
		 * @type {Object}
		 * @protected
		 */
		_flashInstances:null,

		/**
		 * A hash of Sound Preload instances indexed by the related ID in Flash. This lookup is required to connect
		 * a preloading sound in Flash with its respective instance in JavaScript.
		 * @property _flashPreloadInstances
		 * @type {Object}
		 * @protected
		 */
		_flashPreloadInstances:null,

		/**
		 * A hash of Sound Preload instances indexed by the src. This lookup is required to load sounds if internal
		 * preloading is tried when flash is not ready.
		 * @property _preloadInstances
		 * @type {Object}
		 * @protected
		 * @since 0.4.0
		 */
		_preloadInstances:null,

		/**
		 * An array of Sound Preload instances that are waiting to preload. Once Flash is initialized, the queued
		 * instances are preloaded.
		 * @property _queuedInstances
		 * @type {Object}
		 * @protected
		 */
		_queuedInstances:null,

		/**
		 * A developer flag to output all flash events to the console (if it exists).  Used for debugging.
		 *
		 *      createjs.Sound.activePlugin.showOutput = true;
		 *
		 * @property showOutput
		 * @type {Boolean}
		 * @default false
		 */
		showOutput:false,

		/**
		 * An initialization function run by the constructor
		 * @method _init
		 * @protected
		 */
		_init:function () {
			this._capabilities = s._capabilities;
			this._audioSources = {};

			this._flashInstances = {};
			this._flashPreloadInstances = {};
			this._preloadInstances = {};
			this._queuedInstances = [];

			// Create DIV
			var w = this.wrapper = document.createElement("div");
			w.id = this._WRAPPER_ID;
			w.style.position = "absolute";
			w.style.marginLeft = "-1px";
			w.className = this._WRAPPER_ID;
			document.body.appendChild(w);

			// Create Placeholder
			var c = this._container = document.createElement("div");
			c.id = this._CONTAINER_ID;
			c.appendChild(document.createTextNode("SoundJS Flash Container"));
			w.appendChild(c);

			// Embed SWF
			if (s.BASE_PATH) {
				try {
					console.log("createjs.FlashPlugin.BASE_PATH has been deprecated, please use swfPath");
				} catch (err) {
					// you are in IE with the console closed, you monster
				}
			}
			var path = s.BASE_PATH || s.swfPath;	// BASE_PATH defaults to null, so it will only give value if set by user
			var val = swfobject.embedSWF(path + "FlashAudioPlugin.swf", this._CONTAINER_ID, "1", "1",
					"9.0.0", null, null, {"AllowScriptAccess" : "always"}, null,
					createjs.proxy(this._handleSWFReady, this)
			);

			//TODO: Internal detection instead of swfobject
		},

		/**
		 * The SWF used for sound preloading and playback has been initialized.
		 * @method _handleSWFReady
		 * @param {Object} event Contains a reference to the swf.
		 * @protected
		 */
		_handleSWFReady:function (event) {
			this._flash = event.ref;
		},

		/**
		 * The Flash application that handles preloading and playback is ready. We wait for a callback from Flash to
		 * ensure that everything is in place before playback begins.
		 * @method _handleFlashReady
		 * @protected
		 */
		_handleFlashReady:function () {
			this.flashReady = true;

			// Anything that needed to be preloaded, can now do so.
			for (var i = 0, l = this._queuedInstances.length; i < l; i++) {
				this._flash.register(this._queuedInstances[i]);  // NOTE this flash function currently does nothing
			}
			this._queuedInstances.length = 0;

			// Associate flash instance with any preloadInstance that already exists.
			for (var n in this._flashPreloadInstances) {
				this._flashPreloadInstances[n].initialize(this._flash);
			}

			// load sounds that tried to preload before flash was ready
			for (var n in this._preloadInstances) {
				this._preloadInstances[n].initialize(this._flash);
			}
			this._preloadInstances = {};

			// Associate flash instance with any sound instance that has already been played.
			for (var n in this._flashInstances) {
				this._flashInstances[n].initialize(this._flash);
			}
		},

		/**
		 * Pre-register a sound instance when preloading/setup. Note that the FlashPlugin will return a Loader
		 * instance for preloading since Flash can not access the browser cache consistently.
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * @return {Object} A result object, containing a tag for preloading purposes.
		 */
		register:function (src, instances) {
			//Note that currently, registering with the flash instance does nothing.
			this._audioSources[src] = true;  // NOTE this does not mean preloading has started
			if (!this.flashReady) {
				this._queuedInstances.push(src);
			} else {
				this._flash.register(src);  // NOTE this flash function currently does nothing  // OJR remove this entire thing, as it does nothing?
			}
			var tag = new createjs.FlashPlugin.Loader(src, this, this._flash);
			return {
				tag:tag
			};
		},


		/**
		 * Remove a sound added using {{#crossLink "FlashPlugin/register"}}{{/crossLink}}. Note this does not cancel a
		 * preload.
		 * @method removeSound
		 * @param {String} src The sound URI to unload.
		 * @since 0.4.1
		 */
		removeSound:function (src) {
			delete(this._audioSources[src]);
			var i = createjs.indexOf(this._queuedInstances, src);
			if(i != -1) {
				this._queuedInstances.splice(i,1);
			}
			// NOTE sound cannot be removed from a swf
		},

		/**
		 * Remove all sounds added using {{#crossLink "FlashPlugin/register"}}{{/crossLink}}. Note this does not cancel a preload.
		 * @method removeAllSounds
		 * @param {String} src The sound URI to unload.
		 * @since 0.4.1
		 */
		removeAllSounds:function () {
			this._audioSources = {};	// this drops all references, in theory freeing them for garbage collection
			this._queuedInstances.length = 0;

			// OJR these may not be necessary, but are included for cleanup clarity.
			this._flashInstances = {};
			this._flashPreloadInstances = {};
			this._preloadInstances = {};
			// NOTE sound cannot be removed from a swf
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
				var instance = new createjs.FlashPlugin.SoundInstance(src, this, this._flash, this._audioSources[src]);
				return instance;
			} catch (err) {
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
			return (this._audioSources[src] != null);
		},

		/**
		 * Preload a sound instance. This plugin uses Flash to preload and play all sounds.
		 * @method preload
		 * @param {String} src The path to the Sound
		 * @param {Object} instance Not used in this plugin.
		 */
		preload:function (src, instance) {
			this._audioSources[src] = true;  // NOTE this does not mean preloading has started, just that it will
			var loader = new createjs.FlashPlugin.Loader(src, this, this._flash);
			loader.load();  // this will handle if flash is not ready
		},

		/**
		 * Registers loaded source files to handle src being changed before loading.
		 * This occurs when there is a basePath added (by PreloadJS or internal Preloading.
		 * @method _registerLoadedSrc
		 * @param loadSrc
		 * @param src
		 * @protected
		 */
		_registerLoadedSrc: function(loadSrc, src) {
			this._audioSources[src] = loadSrc;
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
			this._volume = value;
			return this._updateVolume();
		},

		/**
		 * Internal function used to set the gain value for master audio.  Should not be called externally.
		 * @method _updateVolume
		 * @return {Boolean}
		 * @protected
		 * @since 0.4.0
		 */
		_updateVolume:function () {
			var newVolume = createjs.Sound._masterMute ? 0 : this._volume;
			return this._flash.setMasterVolume(newVolume);
		},

		/**
		 * Get the master volume of the plugin, which affects all SoundInstances.
		 * @method getVolume
		 * @return The volume level, between 0 and 1.
		 * @since 0.4.0
		 */
		getVolume:function () {
			return this._volume;
		},

		/**
		 * Mute all sounds via the plugin.
		 * @method setMute
		 * @param {Boolean} value If all sound should be muted or not. Note that plugin-level muting just looks up
		 * the mute value of Sound {{#crossLink "Sound/getMute"}}{{/crossLink}}, so this property is not used here.
		 * @return {Boolean} If the mute call succeeds.
		 * @since 0.4.0
		 */
		setMute:function (isMuted) {
			return this._updateVolume();
		},

// Flash Communication
// Note we have decided not to include these in the docs
		/*
		 * Used to couple a Flash loader instance with a <code>Loader</code> instance
		 * @method registerPreloadInstance
		 * @param {String} flashId Used to identify the Loader.
		 * @param {Loader} instance The actual instance.
		 */
		registerPreloadInstance:function (flashId, instance) {
			this._flashPreloadInstances[flashId] = instance;
		},

		/*
		 * Used to decouple a <code>Loader</code> instance from Flash.
		 * @method unregisterPreloadInstance
		 * @param {String} flashId Used to identify the Loader.
		 */
		unregisterPreloadInstance:function (flashId) {
			delete this._flashPreloadInstances[flashId];
		},

		/*
		 * Used to couple a Flash sound instance with a {{#crossLink "SoundInstance"}}{{/crossLink}}.
		 * @method registerSoundInstance
		 * @param {String} flashId Used to identify the SoundInstance.
		 * @param {Loader} instance The actual instance.
		 */
		registerSoundInstance:function (flashId, instance) {
			this._flashInstances[flashId] = instance;
		},

		/*
		 * Used to decouple a {{#crossLink "SoundInstance"}}{{/crossLink}} from Flash.
		 * instance.
		 * @method unregisterSoundInstance
		 * @param {String} flashId Used to identify the SoundInstance.
		 * @param {Loader} instance The actual instance.
		 */
		unregisterSoundInstance:function (flashId) {
			delete this._flashInstances[flashId];
		},

		/*
		 * Used to output traces from Flash to the console, if {{#crossLink "FlashPlugin/showOutput"}}{{/crossLink}} is
		 * <code>true</code>.
		 * @method flashLog
		 * @param {String} data The information to be output.
		 */
		flashLog:function (data) {
			try {
				this.showOutput && console.log(data);
			} catch (error) {
			}
		},

		/*
		 * Handles events from Flash, and routes communication to a {{#crossLink "SoundInstance"}}{{/crossLink}} via
		 * the Flash ID. The method and arguments from Flash are run directly on the sound instance.
		 * @method handleSoundEvent
		 * @param {String} flashId Used to identify the SoundInstance.
		 * @param {String} method Indicates the method to run.
		 */
		handleSoundEvent:function (flashId, method) {
			var instance = this._flashInstances[flashId];
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

		/*
		 * Handles events from Flash and routes communication to a <code>Loader</code> via the Flash ID. The method
		 * and arguments from Flash are run directly on the sound loader.
		 * @method handlePreloadEvent
		 * @param {String} flashId Used to identify the loader instance.
		 * @param {String} method Indicates the method to run.
		 */
		handlePreloadEvent:function (flashId, method) {
			var instance = this._flashPreloadInstances[flashId];
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

		/*
		 * Handles events from Flash intended for the FlashPlugin class. Currently only a "ready" event is processed.
		 * @method handleEvent
		 * @param {String} method Indicates the method to run.
		 */
		handleEvent:function (method) {
			//Sound.log("Handle Event", method);
			switch (method) {
				case "ready":
					clearTimeout(this.loadTimeout);
					this._handleFlashReady();
					break;
			}
		},

		/*
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

}());


(function () {

	"use strict";

	// NOTE documentation for this class can be found online or in WebAudioPlugin.SoundInstance
	// NOTE audio control is shuttled to a flash player instance via the flash reference.
	function SoundInstance(src, owner, flash, flashSrc) {
		this._init(src, owner, flash, flashSrc);
	}

	var p = SoundInstance.prototype = new createjs.EventDispatcher();

	p.src = null;
	p.flashSrc = null;	// because loaded src in flash can be different due to basePath appending
	p.uniqueId = -1;
	p._owner = null;
	p._capabilities = null;
	p._flash = null;
	p.flashId = null; // To communicate with Flash
	p.loop = 0;
	p._volume =  1;
	p._pan =  0;
	p._offset = 0; // used for setPosition on a stopped instance
	p._delay = 0;
	p._duration = 0;
	p._delayTimeoutId = null;
	p._muted = false;
	p._paused = false;

	// IE8 has Object.defineProperty, but only for DOM objects, so check if fails to suppress errors
	try {
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
	} catch (e) {
		// dispatch message or error?
	};

// Constructor
	p._init = function (src, owner, flash, flashSrc) {
		this.src = src;
		this.flashSrc = flashSrc;
		this._owner = owner;
		this._flash = flash;
	};

	p.initialize = function (flash) {
		this._flash = flash;
	};

// Public API

	p._interrupt = function () {
		this.playState = createjs.Sound.PLAY_INTERRUPTED;
		this._flash.interrupt(this.flashId);
		this._cleanUp();
		this._paused = false;
		this._sendEvent("interrupted");
	};

	p._cleanUp = function () {
		clearTimeout(this._delayTimeoutId);
		this._owner.unregisterSoundInstance(this.flashId);
		createjs.Sound._playFinished(this);
	};

	p.play = function (interrupt, delay, offset, loop, volume, pan) {
		createjs.Sound._playInstance(this, interrupt, delay, offset, loop, volume, pan);
	};

	p._beginPlaying = function (offset, loop, volume, pan) {
		this.loop = loop;
		this._paused = false;

		if (!this._owner.flashReady) {
			return false;
		}

		this._offset = offset;

		this.flashId = this._flash.playSound(this.flashSrc, offset, loop, volume, pan);
		if (this.flashId == null) {
			this._cleanUp();
			return false;
		}

		//this._duration = this._flash.getDuration(this.flashId);  // this is 0 at this point
		if (this._muted) {
			this.setMute(true);
		}
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
		if (!this._paused && this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			this._paused = true;
			clearTimeout(this._delayTimeoutId);
			return this._flash.pauseSound(this.flashId);
		}
		return false;
	};

	p.resume = function () {
		if (!this._paused) {
			return false;
		}
		this._paused = false;
		return this._flash.resumeSound(this.flashId);
	};

	p.stop = function () {
		this.playState = createjs.Sound.PLAY_FINISHED;
		this._paused = false;
		this._offset = 0;  // flash destroys the wrapper, so we need to track offset on our own
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
		value = Math.max(-1, Math.min(1, value));	// force pan to stay in the -1 to 1 range
		this._pan = value;
		return this._flash.setPan(this.flashId, value);
	};

	p.getPosition = function () {
		var value = -1;
		if (this._flash && this.flashId) {
			value = this._flash.getPosition(this.flashId); // this returns -1 on stopped instance
		}
		if (value != -1) {
			this._offset = value;
		}
		return this._offset;
	};

	p.setPosition = function (value) {
		this._offset = value;
		this._flash && this.flashId && this._flash.setPosition(this.flashId, value);
		return true;
	};

	p.getDuration = function () {
		var value = -1;
		if (this._flash && this.flashId) {
			value = this._flash.getDuration(this.flashId);
		}
		if (value != -1) {
			this._duration = value;
		}
		return this._duration;
	};

// Flash callbacks, only exist in FlashPlugin
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
		return "[FlashPlugin SoundInstance]"
	};

	createjs.FlashPlugin.SoundInstance = SoundInstance;
}());


(function () {

	"use strict";

	/**
	 * Loader provides a mechanism to preload Flash content via PreloadJS or internally. Instances are returned to
	 * the preloader, and the load method is called when the asset needs to be requested.
	 *
	 * Loader has the same APIs as an &lt;audio&gt; tag. The instance calls the <code>onload</code>, <code>onprogress</code>,
	 * and <code>onerror</code> callbacks when necessary.
	 *
	 * #class Loader
	 * @param {String} src The path to the sound
	 * @param {Object} flash The flash instance that will do the preloading.
	 * @protected
	 */
	function Loader(src, owner, flash) {
		this._init(src, owner, flash);
	}

	var p = Loader.prototype;

	/**
	 * A reference to the Flash instance that gets created.
	 * #property flash
	 * @type {Object | Embed}
	 */
	p._flash = null;

	/**
	 * The source file to be loaded.
	 * #property src
	 * @type {String}
	 */
	p.src = null;

	/**
	 * The original src, before being altered with basePath possibly by PreloadJS
	 * #property src
	 * @type {String}
	 */
	p.originalSrc = null;

	/**
	 * ID used to facilitate communication with flash.
	 * #property flashId
	 * @type {String}
	 */
	p.flashId = null;

	/**
	 * The percentage of progress.
	 * #property progress
	 * @type {Number}
	 * @default -1
	 */
	p.progress = -1;

	/**
	 * Used to report if audio is ready.  Value of 4 indicates ready.
	 * #property readyState
	 * @type {Number}
	 * @default 0
	 */
	p.readyState = 0;

	/**
	 * Indicates if <code>load</code> has been called on this.
	 * #property loading
	 * @type {Boolean}
	 * @default false
	 */
	p.loading = false;

	/**
	 * Plugin that created this.  This will be an instance of <code>FlashPlugin</code>.
	 * #property owner
	 * @type {Object}
	 */
	p.owner = null;

// Calbacks
	/**
	 * The callback that fires when the load completes. This follows HTML tag name conventions.
	 * #property onload
	 * @type {Method}
	 */
	p.onload = null;

	/**
	 * The callback that fires as the load progresses. This follows HTML tag name conventions.
	 * #property onprogress
	 * @type {Method}
	 */
	p.onprogress = null;

	/**
	 * The callback that fires if the load hits an error. This follows HTML tag name conventions.
	 * #property onerror
	 * @type {Method}
	 */
	p.onerror = null;

	// constructor
	p._init = function (src, owner, flash) {
		this.src = src;
		this.originalSrc = src;
		this.owner = owner;
		this._flash = flash;
	};

	/**
	 * Called when Flash has been initialized. If a load call was made before this, call it now.
	 * #method initialize
	 * @param {Object | Embed} flash A reference to the Flash instance.
	 */
	p.initialize = function (flash) {
		this._flash = flash;
		if (this.loading) {
			this.loading = false;
			this.load(this.src);
		}
	};

	/**
	 * Start loading.
	 * #method load
	 * @param {String} src The path to the sound.
	 * @return {Boolean} If the load was started. If Flash has not been initialized, the load will fail.
	 */
	p.load = function (src) {
		if (src != null) {
			this.src = src;
		}
		if (this._flash == null || !this.owner.flashReady) {
			this.loading = true;
			// register for future preloading
			this.owner._preloadInstances[this.src] = this; // OJR this would be better as an API call
			return false;
		}

		this.flashId = this._flash.preload(this.src);
		// Associate this preload instance with the FlashID, so callbacks can route here.
		this.owner.registerPreloadInstance(this.flashId, this);
		return true;
	};

	/**
	 * Receive progress from Flash and pass it to callback.
	 *
	 * <strong>Note</strong>: this is not a public API, but is used to allow preloaders to subscribe to load
	 * progress as if this is an HTML audio tag. This reason is why this still uses a callback instead of an event.
	 * #method handleProgress
	 * @param {Number} loaded Amount loaded
	 * @param {Number} total Total amount to be loaded.
	 */
	p.handleProgress = function (loaded, total) {
		this.progress = loaded / total;
		this.onprogress && this.onprogress({loaded:loaded, total:total, progress:this.progress});
	};

	/**
	 * Called from Flash when sound is loaded.  Set our ready state and fire callbacks / events
	 * #method handleComplete
	 */
	p.handleComplete = function () {
		this.progress = 1;
		this.readyState = 4;
		this.owner._registerLoadedSrc(this.src, this.originalSrc);
		//this.src = this.originalSrc;
		createjs.Sound._sendFileLoadEvent(this.originalSrc);  // fire event or callback on Sound // can't use onload callback because we need to pass the source
		this.onload && this.onload();
	};

	/**
	 * Receive error event from flash and pass it to callback.
	 * @param {Event} error
	 */
	p.handleError = function (error) {
		this.onerror && this.onerror(error);
	};

	p.toString = function () {
		return "[FlashPlugin Loader]";
	};

	createjs.FlashPlugin.Loader = Loader;

}());