/*
 * FlashAudioPlugin
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
	 * into the minified FlashAudioPlugin-X.X.X.min.js file. You must ensure that {{#crossLink "FlashAudioPlugin/swfPath:property"}}{{/crossLink}}
	 * is set when using this plugin, so that the script can find the swf.
	 *
	 * <h4>Example</h4>
	 *      createjs.FlashAudioPlugin.swfPath = "../src/SoundJS/";
	 *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin]);
	 *      // Adds FlashAudioPlugin as a fallback if WebAudio and HTMLAudio do not work.
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
	 * @class FlashAudioPlugin
	 * @constructor
	 */
	function FlashAudioPlugin() {
		this.AbstractPlugin_constructor();

		this._init();
	};
	var p = createjs.extend(FlashAudioPlugin, createjs.AbstractPlugin);
	var s = FlashAudioPlugin;

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

	// TODO DEPRECATED
	/**
	 * REMOVED in favor of {{#crossLink "FlashAudioPlugin/swfPath:property"}}{{/crossLink}}
	 * @property BASE_PATH
	 * @type {String}
	 * @default null
	 * @static
	 * @deprecated
	 */

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
		if (createjs.Sound.BrowserDetect.isIOS || createjs.Sound.BrowserDetect.isAndroid || createjs.Sound.BrowserDetect.isBlackberry || createjs.Sound.BrowserDetect.isWindowsPhone) {return false;}
		s._generateCapabilities();
		if (swfobject == null) {return false;}
		return swfobject.hasFlashPlayerVersion("9.0.0");
	};

	/**
	 * Determine the capabilities of the plugin. Used internally. Please see the Sound API {{#crossLink "Sound/getCapabilities"}}{{/crossLink}}
	 * method for an overview of plugin capabilities.
	 * @method _generateCapabilities
	 * @static
	 * @protected
	 */
	s._generateCapabilities = function () {
		if (s._capabilities != null) {return;}
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

// FlashAudioPlugin Specifics
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

			var path = s.swfPath;
			var val = swfobject.embedSWF(path + "FlashAudioPlugin.swf", this._CONTAINER_ID, "1", "1",
					"9.0.0", null, null, {"AllowScriptAccess" : "always"}, null,
					createjs.proxy(this._handleSWFReady, this)
			);
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
		 * Pre-register a sound instance when preloading/setup. Note that the FlashAudioPlugin will return a Loader
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
			var loader = {tag: new createjs.FlashAudioPlugin.Loader(src, this, this._flash)};
			return loader;
		},


		/**
		 * Remove a sound added using {{#crossLink "FlashAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel a
		 * preload.
		 * @method removeSound
		 * @param {String} src The sound URI to unload.
		 * @since 0.4.1
		 */
		removeSound:function (src) {
			delete(this._audioSources[src]);
			var i = createjs.indexOf(this._queuedInstances, src);
			if(i != -1) {this._queuedInstances.splice(i,1);}
			// NOTE sound cannot be removed from a swf
		},

		/**
		 * Remove all sounds added using {{#crossLink "FlashAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel a preload.
		 * @method removeAllSounds
		 * @param {String} src The sound URI to unload.
		 * @since 0.4.1
		 */
		removeAllSounds:function () {
			this._audioSources = {};
			this._queuedInstances.length = 0;

			this._flashInstances = {};
			this._flashPreloadInstances = {};
			this._preloadInstances = {};
			// NOTE sound cannot be removed from a swf
		},

		/**
		 * Create a sound instance. If the sound has not been preloaded, it is internally preloaded here.
		 * @method create
		 * @param {String} src The sound source to use.
		 * @param {Number} startTime Audio sprite property used to apply an offset, in milliseconds.
		 * @param {Number} duration Audio sprite property used to set the time the clip plays for, in milliseconds.
		 * @return {SoundInstance} A sound instance for playback and control.
		 */
		create:function (src, startTime, duration) {
			if (!this.isPreloadStarted(src)) {this.preload(src);}

			try {
				var instance = new createjs.FlashAudioPlugin.SoundInstance(src, startTime, duration, this, this._flash);
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
		 * @param {Object} tag Not used in this plugin.
		 */
		preload:function (src, tag) {
			this._audioSources[src] = true;  // NOTE this does not mean preloading has started, just that it will
			var loader = new createjs.FlashAudioPlugin.Loader(src, this, this._flash);
			loader.load();
		},

		/**
		 * Registers loaded source files.
		 * @method _registerLoadedSrc
		 * @param src
		 * @protected
		 */
		_registerLoadedSrc: function(src) {
			this._audioSources[src] = src;
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
		 * Used to output traces from Flash to the console, if {{#crossLink "FlashAudioPlugin/showOutput"}}{{/crossLink}} is
		 * <code>true</code>.
		 * @method flashLog
		 * @param {String} data The information to be output.
		 */
		flashLog:function (data) {
			try {
				this.showOutput && console.log(data);
			} catch (error) {
				// older IE will cause error if console is not open
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
			if (instance == null) {return;}
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
		 * Handles events from Flash intended for the FlashAudioPlugin class. Currently only a "ready" event is processed.
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
			return "[FlashAudioPlugin]";
		}
	}
	p.constructor = FlashAudioPlugin;

	createjs.FlashAudioPlugin = FlashAudioPlugin;

}());
