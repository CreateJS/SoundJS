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
	 *
	 *      createjs.FlashAudioPlugin.swfPath = "../src/soundjs/flashaudio";
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
	 * @extends AbstractPlugin
	 * @constructor
	 */
	function FlashAudioPlugin() {
		this.AbstractPlugin_constructor();


// Public Properties
		/**
		 * A developer flag to output all flash events to the console (if it exists).  Used for debugging.
		 *
		 *      createjs.Sound.activePlugin.showOutput = true;
		 *
		 * @property showOutput
		 * @type {Boolean}
		 * @default false
		 */
		this.showOutput = false;


//Private Properties
		/**
		 * The id name of the DIV that gets created for Flash content.
		 * @property _CONTAINER_ID
		 * @type {String}
		 * @default flashAudioContainer
		 * @protected
		 */
		this._CONTAINER_ID = "flashAudioContainer";

		/**
		 * The id name of the DIV wrapper that contains the Flash content.
		 * @property _WRAPPER_ID
		 * @type {String}
		 * @default SoundJSFlashContainer
		 * @protected
		 * @since 0.4.1
		 */
		this._WRAPPER_ID = "SoundJSFlashContainer";

		/**
		 * A reference to the DIV container that gets created to hold the Flash instance.
		 * @property _container
		 * @type {HTMLDivElement}
		 * @protected
		 */
		this._container = null,

		/**
		 * A reference to the Flash instance that gets created.
		 * @property flash
		 * @type {Object | Embed}
		 * @protected
		 */
		this._flash = null;

		/**
		 * Determines if the Flash object has been created and initialized. This is required to make <code>ExternalInterface</code>
		 * calls from JavaScript to Flash.
		 * @property flashReady
		 * @type {Boolean}
		 * @default false
		 */
		this.flashReady = false;

		/**
		 * A hash of SoundInstances indexed by the related ID in Flash. This lookup is required to connect sounds in
		 * JavaScript to their respective instances in Flash.
		 * @property _flashInstances
		 * @type {Object}
		 * @protected
		 */
		this._flashInstances = {};

		/**
		 * A hash of Sound Preload instances indexed by the related ID in Flash. This lookup is required to connect
		 * a preloading sound in Flash with its respective instance in JavaScript.
		 * @property _flashPreloadInstances
		 * @type {Object}
		 * @protected
		 */
		this._flashPreloadInstances = {};
		//TODO consider combining _flashInstances and _flashPreloadInstances into a single hash

		this._capabilities = s._capabilities;

		this._loaderClass = createjs.FlashAudioLoader;
		this._soundInstanceClass = createjs.FlashAudioSoundInstance;

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
	};

	var p = createjs.extend(FlashAudioPlugin, createjs.AbstractPlugin);
	var s = FlashAudioPlugin;

	// TODO: deprecated
	// p.initialize = function() {}; // searchable for devs wondering where it is. REMOVED. See docs for details.


// Static properties
	/**
	 * Event constant for the "registerFlashID" event for cleaner code.
	 * @property _REG_FLASHID
	 * @type {String}
	 * @default registerflashid
	 * @static
	 * @protected
	 */
	s._REG_FLASHID = "registerflashid";

	/**
	 * Event constant for the "unregisterFlashID" event for cleaner code.
	 * @property _UNREG_FLASHID
	 * @type {String}
	 * @default unregisterflashid
	 * @static
	 * @protected
	 */
	s._UNREG_FLASHID = "unregisterflashid";

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
	 * The path relative to the HTML page that the FlashAudioPlugin.swf resides. Note if this is not correct, this
	 * plugin will not work.
	 * @property swfPath
	 * @type {String}
	 * @default src/SoundJS
	 * @static
	 * @since 0.5.2
	 */
	s.swfPath = "src/soundjs/flashaudio/";


// Static Methods
	/**
	 * Determine if the plugin can be used in the current browser/OS.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		// there is no flash player on mobile devices
		if (createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry || createjs.BrowserDetect.isWindowsPhone) {return false;}
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


//public methods
	p.register = function (src, instances) {
		var loader = this.AbstractPlugin_register(src, instances);
		loader.addEventListener(s._REG_FLASHID, createjs.proxy(this.registerPreloadInstance, this));
		loader.addEventListener(s._UNREG_FLASHID, createjs.proxy(this.unregisterPreloadInstance, this));
		return loader;
	};

	p.removeAllSounds = function () {
		this._flashInstances = {};
		this._flashPreloadInstances = {};
		// NOTE sound cannot be removed from a swf

		this.AbstractPlugin_removeAllSounds();
	};

	p.create = function (src, startTime, duration) {
		var si = this.AbstractPlugin_create(src, startTime, duration);
		si.on(s._REG_FLASHID, this.registerSoundInstance, this);
		si.on(s._UNREG_FLASHID, this.unregisterSoundInstance, this);
		return si;
	};

	p.toString = function () {
		return "[FlashAudioPlugin]";
	};


// private methods
	/**
	 * The SWF used for sound preloading and playback has been initialized.
	 * @method _handleSWFReady
	 * @param {Object} event Contains a reference to the swf.
	 * @protected
	 */
	p._handleSWFReady = function (event) {
		this._flash = event.ref;
	};

	/**
	 * The Flash application that handles preloading and playback is ready. We wait for a callback from Flash to
	 * ensure that everything is in place before playback begins.
	 * @method _handleFlashReady
	 * @protected
	 */
	p._handleFlashReady = function () {
		this.flashReady = true;

		this._loaderClass.setFlash(this._flash);
		this._soundInstanceClass.setFlash(this._flash);
	};

	/**
	 * Internal function used to set the gain value for master audio.  Should not be called externally.
	 * @method _updateVolume
	 * @return {Boolean}
	 * @protected
	 * @since 0.4.0
	 */
	p._updateVolume = function () {
		var newVolume = createjs.Sound._masterMute ? 0 : this._volume;
		return this._flash.setMasterVolume(newVolume);
	};


// Flash Communication
// Note we have decided not to include these in the docs
	/*
	 * Used to couple a Flash loader instance with a <code>Loader</code> instance
	 * @method registerPreloadInstance
	 * @param {String} flashId Used to identify the Loader.
	 * @param {Loader} instance The actual instance.
	 */
	p.registerPreloadInstance = function (event) {
		this._flashPreloadInstances[event.target.flashId] = event.target;
	};

	/*
	 * Used to decouple a <code>Loader</code> instance from Flash.
	 * @method unregisterPreloadInstance
	 * @param {String} flashId Used to identify the Loader.
	 */
	p.unregisterPreloadInstance = function (event) {
		delete this._flashPreloadInstances[event.target.flashId];
	};

	/*
	 * Used to couple a Flash sound instance with a {{#crossLink "FlashAudioSoundInstance"}}{{/crossLink}}.
	 * @method registerSoundInstance
	 * @param {String} flashId Used to identify the FlashAudioSoundInstance.
	 * @param {Loader} instance The actual instance.
	 */
	p.registerSoundInstance = function (event) {
		this._flashInstances[event.target.flashId] = event.target;
	};

	/*
	 * Used to decouple a {{#crossLink "FlashAudioSoundInstance"}}{{/crossLink}} from Flash.
	 * instance.
	 * @method unregisterSoundInstance
	 * @param {String} flashId Used to identify the FlashAudioSoundInstance.
	 * @param {Loader} instance The actual instance.
	 */
	p.unregisterSoundInstance = function (event) {
		delete this._flashInstances[event.target.flashId];
	};

	/*
	 * Used to output traces from Flash to the console, if {{#crossLink "FlashAudioPlugin/showOutput"}}{{/crossLink}} is
	 * <code>true</code>.
	 * @method flashLog
	 * @param {String} data The information to be output.
	 */
	p.flashLog = function (data) {
		try {
			this.showOutput && console.log(data);
		} catch (error) {
			// older IE will cause error if console is not open
		}
	};

	/*
	 * Handles events from Flash, and routes communication to a {{#crossLink "FlashAudioSoundInstance"}}{{/crossLink}} via
	 * the Flash ID. The method and arguments from Flash are run directly on the loader or sound instance.
	 * @method handleSoundEvent
	 * @param {String} flashId Used to identify the FlashAudioSoundInstance.
	 * @param {String} method Indicates the method to run.
	 */
	p.handleSoundEvent = function (flashId, method) {
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
	};

	/*
	 * Handles events from Flash and routes communication to a <code>Loader</code> via the Flash ID. The method
	 * and arguments from Flash are run directly on the sound loader.
	 * @method handlePreloadEvent
	 * @param {String} flashId Used to identify the loader instance.
	 * @param {String} method Indicates the method to run.
	 */
	p.handlePreloadEvent = function (flashId, method) {
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
	};

	/*
	 * Handles events from Flash intended for the FlashAudioPlugin class. Currently only a "ready" event is processed.
	 * @method handleEvent
	 * @param {String} method Indicates the method to run.
	 */
	p.handleEvent = function (method) {
		switch (method) {
			case "ready":
				this._handleFlashReady();
				break;
		}
	};

	/*
	 * Handles error events from Flash. Note this function currently does not process any events.
	 * @method handleErrorEvent
	 * @param {String} error Indicates the error.
	 */
	p.handleErrorEvent = function (error) {

	};

	createjs.FlashAudioPlugin = createjs.promote(FlashAudioPlugin, "AbstractPlugin");
}());
