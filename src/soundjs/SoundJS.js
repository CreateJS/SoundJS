/*
* SoundJS
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


// namespace:
this.createjs = this.createjs||{};

/**
 * The SoundJS library manages the playback of audio on the web via plugins which abstract the implementation, so
 * playback is possible on any platform without specific knowledge of what mechanisms are necessary to play audio. By
 * default, WebAudio and HTML audio modes are available, although developers can change plugin priority or add new
 * plugins (such as Flash). Please see the SoundJS documentation for more on the playback and plugin APIs.
 *
 * When sounds are played, SoundJS returns instances which can be paused, resumed, muted, etc. Please see the
 * SoundInstance documentation for more on the instance control APIs.
 *
 * @module SoundJS
 */

/*OJR
Notes on iOS limitations
    - sound is initially muted, and needs to be turned on inside a user event (through call to play because noteOn needs called)
    - despite suggestions to the opposite, we have control over audio volume through our gain nodes
     http://stackoverflow.com/questions/12517000/no-sound-on-ios-6-web-audio-api

Notes on Android limitations
    - Android chrome reports true when you run createjs.SoundJS.BrowserDetect.isChrome, but is a different browser with different abilities
    - Android chrome is built on AppleWebKit, and seems to inherit some limitations
    - we have no control over audio volume.  Only the user can set volume on their device.
    - we can only play audio inside a user event (touch).  This currently means you cannot loop sounds.
    - unlike iOS, we can have more than one <audio> tag
 */

(function() {

	//TODO: Interface to validate plugins and throw warnings
	//TODO: Determine if methods exist on a plugin before calling  // OJR this is only an issue if something breaks or user changes something
	//TODO: Interface to validate instances and throw warnings
	//TODO: Surface errors on audio from all plugins
	//TODO: Timeouts

	/**
	 * SoundJS is the public API for creating sounds, controlling the overall sound levels, and managing plugins.
	 * All SoundJS APIs on this class are static.
	 *
	 * Before sounds can be played, a plugin must be specified. If no plugins are specified, SoundJS will try to
	 * instantiate WebAudio or HTMLAudio plugins. If the system can not support any of the specified plugins, playback
	 * will fail.
	 *
	 * Use the instances that get returned to pause, resume, and control individual sound instances.
	 *
	 * @example
	 *  var soundInstance = SoundJS.play("sound.mp3");
	 *  soundInstance.pause();
	 *
	 * All sounds need to be registered with SoundJS before they can be played. The maximum number of concurrently
	 *      playing instances of the same sound can be specified in the "data" property.
	 *
	 * @example
	 *  createjs.SoundJS.registerSound("sound.mp3", "soundId", 4);
	 *
	 * SoundJS can also be used as a PreloadJS plugin to help preload audio properly. Audio preloaded with PreloadJS
	 * is automatically registered with SoundJS in this case. When audio is not preloaded, SoundJS will do an interal preload, and
	 * as a result, it may not play immediately the first time. It is recommended that all audio is preloaded before it
	 * is played.
	 *
	 * @example
	 *  createjs.PreloadJS.installPlugin(createjs.SoundJS);
	 *
	 * @class SoundJS
	 * @constructor
	 */
	function SoundJS() {
		throw "SoundJS cannot be instantiated";
	}

	var s = SoundJS;

	/**
	 * The current version of the SoundJS library.
	 * @type {String}
	 * @default 0.3.1
	 */
	s.VERSION = "0.3.1";

	/**
	 * Determine how audio paths are split when multiple paths are specified in a source.
	 * @property DELIMITER
	 * @type String
	 * @default |
	 * @static
	 */
	s.DELIMITER = "|";

	/**
	 * The duration in milliseconds to determine a timeout.
	 * @property AUDIO_TIMEOUT
	 * @static
	 * @type Number
	 * @default 8000
	 */
	s.AUDIO_TIMEOUT = 8000; //TODO: Not fully implemented

	/**
	 * The interrupt value to use to interrupt any currently playing instance with the same source.
	 * @property INTERRUPT_ANY
	 * @type String
	 * @default any
	 * @static
	 */
	s.INTERRUPT_ANY = "any";

	/**
	 * The interrupt value to use to interrupt the earliest currently playing instance with the same source.
	 * @property INTERRUPT_EARLY
	 * @type String
	 * @default early
	 * @static
	 */
	s.INTERRUPT_EARLY = "early";

	/**
	 * The interrupt value to use to interrupt the latest currently playing instance with the same source.
	 * @property INTERRUPT_LATE
	 * @type String
	 * @default late
	 * @static
	 */
	s.INTERRUPT_LATE = "late";

	/**
	 * The interrupt value to use to interrupt no currently playing instances with the same source.
	 * @property INTERRUPT_NONE
	 * @type String
	 * @default none
	 * @static
	 */
	s.INTERRUPT_NONE = "none";

	// Important, implement playState in plugins with these values.

	/**
	 * Defines the playState of an instance that is still initializing.
	 * @property PLAY_INITED
	 * @type String
	 * @default playInited
	 * @static
	 */
	s.PLAY_INITED = "playInited";

	/**
	 * Defines the playState of an instance that is currently playing or paused.
	 * @property PLAY_SUCCEEDED
	 * @type String
	 * @default playSucceeded
	 * @static
	 */
	s.PLAY_SUCCEEDED = "playSucceeded";

	/**
	 * Defines the playState of an instance that was interrupted by another instance.
	 * @property PLAY_INTERRUPTED
	 * @type String
	 * @default playInterrupted
	 * @static
	 */
	s.PLAY_INTERRUPTED = "playInterrupted";

	/**
	 * Defines the playState of an instance that completed playback.
	 * @property PLAY_FINISHED
	 * @type String
	 * @default playFinished
	 * @static
	 */
	s.PLAY_FINISHED = "playFinished";

	/**
	 * Defines the playState of an instance that failed to play. This is usually caused by a lack of available channels
	 * when the interrupt mode was "INTERRUPT_NONE", the playback stalled, or the sound could not be found.
	 * @property PLAY_FAILED
	 * @type String
	 * @default playFailed
	 * @static
	 */
	s.PLAY_FAILED = "playFailed";

	/**
	 * A list of the default supported extensions that SoundJS will try to play. Plugins will indicate if the browser
     * can play these types with them, so adding to this list will allow the plugins to support additional types if they
     * are supported by the browser.
	 * @property SUPPORTED_EXTENSIONS
	 * @type {Array}
	 * @public
	 */
	s.SUPPORTED_EXTENSIONS = ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"];  // OJR does not currently support FlashPlugin
	 // More details on file formats can be found at http://en.wikipedia.org/wiki/Audio_file_format
    // A very detailed list of file formats can be found //http://www.fileinfo.com/filetypes/audio

    /**
     * Some extensions use another type of extension support to play (one of them is a codex).  This allows you to map
     * that support so plugins can accurately determine if an extension is supported.  Adding to this list can help
     * plugins determine more accurately if an extension is supported.
     * @property EXTENSION_MAP
     * @type {Object}
     * @public
     */
    s.EXTENSION_MAP = {
        m4a: "mp4"
    };

	/**
	 * The RegExp pattern to use to parse file URIs. This supports simple file names, as well as full domain URIs with
	 * query strings. The resulting match is: protocol:$1 domain:$2 path:$3 file:$4 ext:$5 params:$6.
	 * @property FILE_PATTERN
	 * @type {RegExp}
	 * @static
	 * @protected
	 */
	s.FILE_PATTERN = /(\w+:\/{2})?((?:\w+\.){2}\w+)?(\/?[\S]+\/|\/)?([\w\-%]+)(?:\.)(\w+)?(\?\S+)?/i;

    /**
     * Used internally to assign unique ID's to each SoundInstance
     * @type {Number}
     * @private
     */
    s.lastId = 0,

	/**
	 * The currently active plugin. If this is null, then no plugin could be initialized.
	 * If no plugin was specified, the default plugins are tested (WebAudio, followed by HTMLAudio).
	 * @property activePlugin
	 * @type Object
	 * @default null
	 * @static
	 */
	s.activePlugin = null;

	/**
	 * SoundJS is currently muted. No audio will play, unless existing instances are un-muted. This property
	 * is read-only.
	 * @property masterMute
	 * @type {Boolean}
	 * @default false
	 */
	s.masterMute = false;


// Private
	/**
	 * Determines if the plugins have been registered. If false, the first call to play() will instantiate the default
	 * plugins (WebAudio, followed by HTMLAudio). If plugins have been registered, but none are applicable, then
	 * sound playback will not work.
	 * @property pluginsRegistered
	 * @type {Boolean}
	 * @default false
	 * @private
	 */
	s.pluginsRegistered = false;

	/**
	 * The master volume. Use SoundJS.getVolume and SoundJS.setVolume to modify this value.
	 * @property masterVolume
	 * @type {Number}
	 * @default 1
	 * @private
	 */
	s.masterVolume = 1;

	/**
	 * An array containing all currently playing instances. This helps SoundJS affect the volume and playback of all
	 * instances when using static APIs like stop and setVolume. When an instance has finished playback, it gets
	 * removed via the finishedPlaying() method. If the user replays an instance, it gets added back in via the
	 * beginPlaying() method.
	 * @property instances
	 * @type {Array}
	 * @private
	 */
	s.instances = [];

	/**
	 * A hash lookup of sound sources via their correpsonding ID.
	 * @property idHash
	 * @type {Object}
	 * @private
	 * @review
	 */
	s.idHash = {};

    /**
     * A hash lookup of preloading sound sources via the parsed source that is passed to the plugin.  Contains the
     * source and id that was passed in by the user.
     * @property preloadHash
     * @type {Object}
     * @private
     * @review
     */
    s.preloadHash = {};

    /**
	 * An object that stands in for audio that fails to play. This allows developers to continue to call methods
	 * on the failed instance without having to check if it is valid first. The instance is instantiated once, and
	 * shared to keep the memory footprint down.
	 * @property defaultSoundInstance
	 * @type {Object}
	 * @private
	 */
	s.defaultSoundInstance = null;


// mix-ins:
    // EventDispatcher methods:
    s.addEventListener = null;
    s.removeEventListener = null;
    s.removeAllEventListeners = null;
    s.dispatchEvent = null;
    s.hasEventListener = null;
    s._listeners = null;

    // we only use EventDispatcher if it's available:
    createjs.EventDispatcher && createjs.EventDispatcher.initialize(s); // inject EventDispatcher methods.

	/**
	 * Get the preload rules to allow SoundJS to be used as a plugin by PreloadJS. Any load calls that have the matching
	 * type or extension will fire the callback methods, and use the resulting object. This helps when determining the correct
	 * path, as well as registering the audio instance(s) with SoundJS. This function should not be called,
	 * except by PreloadJS.
	 * @method getPreloadHandlers
	 * @return {Object} An object containing:
	 * <ol><li>A preload callback (callback) that is fired when a file is added to PreloadJS, which provides SoundJS
	 *      a mechanism to modify the load parameters, select the correct file format, register the sound, etc.</li>
	 * <li>A post-load callback (postCallback) that is fired when a file has completed preloading, which provides SoundJS
	 *      a mechanism to run any processes once a sound is ready.</li>
	 * <li>A list of file types that are supported by SoundJS (currently supports "sound").</li>
	 * <li>A list of file extensions that are supported by SoundJS (see the SoundJS.SUPPORTED_EXTENSIONS).</li>
	 * @static
	 * @private
	 */
	s.getPreloadHandlers = function() {
		return {
			callback: s.proxy(s.initLoad, s),
			types: ["sound"],
            extensions: s.SUPPORTED_EXTENSIONS
		};
	}

	/**
	 * Register a SoundJS plugin. Plugins handle the actual playing of audio.
     * The default plugins (WebAudio, followed by HTMLAudio) will be installed
     * if no other plugins are present when the user starts playback.
	 * @example //TODO
	 * @method registerPlugin
	 * @param {Object} plugin The plugin class to install.
	 * @return {Boolean} Whether the plugin was successfully initialized.
	 * @static
	 */
	s.registerPlugin = function(plugin) {
		s.pluginsRegistered = true;
		if (plugin == null) { return false; }
		// Note: Each plugin is passed in as a class reference, but we store the activePlugin as an instances
		if (plugin.isSupported()) {
			s.activePlugin = new plugin();
			//TODO: Check error on initialization
			return true;
		}
		return false;
	}

	/**
	 * Register a list of SoundJS plugins, in order of precedence.
	 * @method registerPlugins
	 * @param {Array} plugins An array of plugins classes to install.
	 * @return {Boolean} Whether a plugin was successfully initialized.
	 * @static
	 * @see registerPlugin
	 */
	s.registerPlugins = function(plugins) {
		for (var i=0, l=plugins.length; i<l; i++) {
			var plugin = plugins[i];
			if (s.registerPlugin(plugin)) { return true; }
		}
		return false;
	}

	/**
	 * Initialize one of the default plugins. This method is called when any audio is played before the user has
	 * registered any plugins, and enables SoundJS to work without manual plugin setup. Currently, the default plugins
	 * are WebAudio and HTML5.
	 * @method initializeDefaultPlugins
	 * @returns {Boolean} If a plugin is initialized (true) or not (false). If the browser does not have the
	 *      capabilities to initialize any available plugins, this will return false.
	 */
	s.initializeDefaultPlugins = function() {
		if (s.activePlugin != null) { return true; }
		if (s.pluginsRegistered) { return false; }
        if (s.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin])) {
	        return true;
		}
		return false;
	}

	/**
	 * Determines if SoundJS has been initialized, and a plugin has been activated.
	 * @method isReady
	 * @return {Boolean} If SoundJS has initialized a plugin.
	 * @static
	 */
	s.isReady = function() {
		return (s.activePlugin != null);
	}

	/**
	 * Get the active plugins capabilities, which help determine if a plugin can be used in the current environment,
	 * or if the plugin supports a specific feature. Capabilities include:
	 * <ul>
	 *     <li><b>panning:</b> If the plugin can pan audio from left to right</li>
	 *     <li><b>volume;</b> If the plugin can control audio volume.</li>
	 *     <li><b>mp3:</b> If MP3 audio is supported.</li>
	 *     <li><b>ogg:</b> If OGG audio is supported.</li>
	 *     <li><b>wav:</b> If WAV audio is supported.</li>
	 *     <li><b>mpeg:</b> If MPEG audio is supported.</li>
	 *     <li><b>m4a:</b> If M4A audio is supported.</li>
	 *     <li><b>tracks:</b> The maximum number of audio tracks that can be played back at a time.
	 *          This will be -1 if there is no known limit.</li>
	 * @method getCapabilities
	 * @return {Object} An object containing the capabilities of the active plugin.
	 * @static
	 */
	s.getCapabilities = function() {
		if (s.activePlugin == null) { return null; }
		return s.activePlugin.capabilities;
	}

	/**
	 * Get a specific capability of the active plugin. See <b>getCapabilities</b> for a full list of capabilities.
	 * @method getCapability
	 * @param {String} key The capability to retrieve
	 * @return {Number | Boolean} The capability value.
	 * @static
	 * @see getCapabilities
	 */
	s.getCapability = function(key) {
		if (s.activePlugin == null) { return null; }
		return s.activePlugin.capabilities[key];
	}

	/**
	 * Process manifest items from PreloadJS. This method is intended for usage by a plugin, and not for direct
	 *      interaction. Currently there is no way to add instances to SoundJS without PreloadJS.
	 * @method initLoad
	 * @param {String | Object} src The src or object to load. This is usually a string path, but can also be
	 *      an HTMLAudioElement or similar audio playback object.
	 * @param {String} type The optional type of object. Will likely be "sound" or null.
	 * @param {String} id An optional user-specified id that is used to play sounds.
	 * @param {Number | String | Boolean | Object} data Optional data associated with the item. SoundJS uses the data
	 *      parameter as the number of channels for an audio instance, however a "channels" property can be appended
	 *      to the data object if it is used for other information. The audio channels will default to 1 if no value
	 *      is found.
	 * @return {Object} An object with the modified values that were passed in.
	 * @protected
	 */
	s.initLoad = function(src, type, id, data) {
		var details = s.registerSound(src, id, data, false);
		if (details == null) { return false; }
		return details;
	}

	/**
	 * Register a sound to playback in SoundJS. This is automatically called when using PreloadJS, however if you just
	 * wish to register a sound without PreloadJS, this method will handle it. It is recommended to register all sounds
	 * that need to be played back in order to properly prep and preload them. SoundJS does internal preloading when
     * required.
	 * @method registerSound
	 * @param {String | Object} src The src or object to load.
	 * @param {String} id An optional id specified by the user to play the sound later.
	 * @param {Number | Object} data Optional data associated with the item. SoundJS uses the data
	 *      parameter as the number of channels for an audio instance, however a "channels" property can be appended
	 *      to the data object if it is used for other information. The audio channels will default to 1 if no value
	 *      is found.
	 * @param {Boolean} preload If the sound should be internally preloaded so that it can be played by SoundJS without
	 *      an external preloader.  Defaults to true if not passed in.
	 * @return {Object} An object with the modified values that were passed in, which defines the sound.  Returns false if src cannot be parsed.
	 * @public
	 */
	s.registerSound = function(src, id, data, preload) {
		if (!s.initializeDefaultPlugins()) { return false; }

		if (src instanceof Object) {
			src = src.src;
			id = src.id;
			data = src.data;
		}
		var details = s.parsePath(src, "sound", id, data);
		if (details == null) { return false; }

		if (id != null) {
			s.idHash[id] = details.src;
		}

		var numChannels = 1;
		if (data != null) {
			if (!isNaN(data.channels)) { numChannels = parseInt(data.channels); }
			else if (!isNaN(data)) { numChannels = parseInt(data); }
		}

		SoundChannel.create(details.src, numChannels);

		// TODO: Rename instance to something better
		var instance = s.activePlugin.register(details.src, numChannels);

		if (instance != null) {
			// If the instance returns a tag, return it instead for preloading.
			if (instance.tag != null) { details.tag = instance.tag; }
			else if (instance.src) { details.src = instance.src; }
			// If the instance returns a complete handler, pass it on to the prelaoder.
			if (instance.completeHandler != null) { details.handler = instance.completeHandler; }
			details.type = instance.type;
		}

		if (preload != false) {
            s.preloadHash[details.src] = {src:src, id:id, data:data};  // keep this data so we can return it onLoadComplete
			s.activePlugin.preload(details.src, instance);
            // OJR add a callback for load complete, then dispatch event
		}

		return details;
	}

    /**
     * Register a manifest of sounds to playback in SoundJS. It is recommended to register all sounds that need to be
     * played back in order to properly prep and preload them. SoundJS does internal preloading when required.
     * @method registerManifest
     * @param {Array} manifest An array of objects to load.  Objects are expected to be in the format needed for
     * registerSound: {src:srcURI, id:optionalID, data:optionalData, preload:optionalUseInternalPreloader}
     * @return {Object} An array of objects with the modified values that were passed in, which defines the sound.
     * Returns false if src cannot be parsed.
     * @public
     */
    s.registerManifest = function(manifest) {
        var returnValues = [];
        for(var i= 0, l = manifest.length; i < l; i++) {
            returnValues[i] = createjs.SoundJS.registerSound(manifest[i].src, manifest[i].id, manifest[i].data, manifest[i].preload)
        }
        return returnValues;
    }

    /**
     * Check if a src has been loaded by internal preloaders.
     * @method loadComplete
     * @param {String} src The src or id that is being loaded.
     * @return {Boolean} If the src is loaded.
     */
    s.loadComplete = function(src) {
        var details = s.parsePath(src, "sound");
        if (details) {
            src = s.getSrcById(details.src);
        } else {
            src = s.getSrcById(src);
        }
        return (s.preloadHash[src] == true);
    }

    /**
     * The callback to fire when a file progress changes. The event contains a reference to the item that is being
     * loaded, the "loaded" and "total" bytes (often just a percentage of 1), and a "progress" property that is a
     * percentage of 1. Alternately, there is an <code>onFileProgress</code> callback that can be used as well.
     * @event fileProgress
     */
    s.onLoadComplete = null;

    /**
     * Dispatch a loadComplete event (onLoadComplete callback). The dispatched event contains:
     * <ul><li>target: A reference to the dispatching instance</li>
     *      <li>src: The src that was loaded.  Note this will not be the same as the src that was passed in if delimiters were used.</li>
     *      <li>id: id passed in when src registered.  If not passed in, will be undefined.</li>
     *      <li>data: data passed in when src registered.  If not passed in, will be undefined.</li>
     * @method sendLoadComplete
     * @param {String} src The audio source that was passed in for loading.
     * @param {String} id The optional id that may have been passed in when src was registers.  If not declared, this will be undefined.
     * @param {Number | Object} data Optional data associated with the item.  If not declared, this will be undefined.
     * @protected
     */
    s.sendLoadComplete = function(src) {
        var event = {
            target: this,
            type: "loadComplete",
            src: s.preloadHash[src].src,
            id: s.preloadHash[src].id,
            data: s.preloadHash[src].data
        };
        s.preloadHash[src] = true;
        s.onLoadComplete && s.onLoadComplete(event);
        s._listeners && s.dispatchEvent(event);
    }

    /**
	 * Parse the path of a sound, usually from a manifest item. Manifest items support single file paths, as well as
	 * composite paths using a delimiter. The first path supported by the current browser will be used.
	 * @method parsePath
	 * @param {String | Object} value The path to an audio source.
	 * @param {String} type The type of path. This will typically be "sound" or null.
	 * @param {String} id The user-specified sound ID.
	 * @param {Number | String | Boolean | Object} data Arbitrary data appended to the sound, usually denoting the
	 *      number of channels for the sound. This method doesn't currently do anything with the data property.
	 * @return {Object} A formatted object that can be registered with the active plugin, and returned to a preloader
	 *      like PreloadJS.
	 * @protected
	 */
	s.parsePath = function(value, type, id, data) {
		// Assume value is string.
		var sounds = value.split(s.DELIMITER);
		var ret = {type:type||"sound", id:id, data:data};
		var c = s.getCapabilities();
		for (var i=0, l=sounds.length; i<l; i++) {
			var sound = sounds[i];

			var match = sound.match(s.FILE_PATTERN);
			if (match == null) { return false; }
			var name = match[4];
			var ext = match[5];

			if (c[ext] && s.SUPPORTED_EXTENSIONS.indexOf(ext) > -1) {
				ret.name = name;
				ret.src = sound;
				ret.extension = ext;
				return ret;
			}
		}
		return null;
	}


	/* ---------------
	 Static API.
	--------------- */
	/**
	 * Play a sound, receive an instance to control. If the sound failed to play, the soundInstance
	 * will still be returned, and have a playState of SoundJS.PLAY_FAILED. Note that even on sounds with
	 * failed playback, you may still be able to call play(), since the failure could be due to lack of available
	 * channels.
	 * @method play
	 * @param {String} src The src or ID of the audio.
	 * @param {String} interrupt How to interrupt other instances of audio. Values are defined as constants on SoundJS.
	 * @param {Number} delay The amount of time to delay the start of the audio. Delay is in milliseconds.
	 * @param {Number} offset The point to start the audio. Offset is in milliseconds.
	 * @param {Number} loop Determines how many times the audio loops when it reaches the end of a sound. Default is 0 (no loops). Set to -1 for infinite.
	 * @param {Number} volume The volume of the sound, between 0 and 1
	 * @param {Number} pan The left-right pan of the sound (if supported), between -1 (left) and 1 (right)
	 * @return {SoundInstance} A SoundInstance that can be controlled after it is created.
	 * @static
	 */
	s.play = function (src, interrupt, delay, offset, loop, volume, pan) {
        var instance = s.createInstance(src);

		var ok = s.playInstance(instance, interrupt, delay, offset, loop, volume, pan);
		if (!ok) { instance.playFailed(); }
		return instance;
	}

    /**
     * Creates a SoundInstance using the passed in src.
     * @method createInstance
     * @param {String} src The src of the audio.
     * @return {SoundInstance} A SoundInstance that can be controlled after it is created.
     */
    s.createInstance = function (src) {
        if (!s.initializeDefaultPlugins()) { return s.defaultSoundInstance; }
        var details = s.parsePath(src, "sound");
        if (details) {
            src = s.getSrcById(details.src);
        } else {
            src = s.getSrcById(src);
        }

        // make sure that we have a sound channel (sound is registered or previously played)
        SoundChannel.create(src);

        var instance = s.activePlugin.create(src);
        instance.uniqueId = s.lastId++;  // OJR moved this here so we can have multiple plugins active in theory

        return instance;
    }

	/**
	 * Set the master volume of SoundJS. The master volume is multiplied against each sound's individual volume.
	 * To set individual sound volume, use instance.setVolume() instead.
	 * @method setVolume
	 * @param {Number} The master volume to apply. The acceptable range is 0-1.
	 * @static
	 */
	s.setVolume = function(value) {
		if (Number(value) == null) { return false; }
		value = Math.max(0, Math.min(1, value));
		s.masterVolume = value;
		if (!this.activePlugin || !this.activePlugin.setVolume || !this.activePlugin.setVolume(value)) {
			for (var i= 0,l=this.instances.length; i<l; i++) {
				this.instances[i].setMasterVolume(value);
			}
		}
	}

    /**
     * Get the master volume of SoundJS. The master volume is multiplied against each sound's individual volume.
     * To get individual sound volume, use instance.getVolume() instead.
     * @method getVolume
     * @return {Number} The master volume, in a range of 0-1.
     * @static
     */
    s.getVolume = function(value) {
        return s.masterVolume;
    }

    /**
     * This function has been deprecated.  Please use setMute instead.
	 * Mute/Unmute all audio. Note that muted audio still plays at 0 volume. The global mute is maintained separately
	 * and will not affect the mute property of inidividual instances.
	 * @method setMute
	 * @param {Boolean} isMuted Whether the audio should be muted or not.
	 * @param {String} id The specific sound ID (set) to target.
	 * @return {Boolean} If the mute was set.
	 * @static
     * @deprecated
	 */
	s.mute = function(isMuted) {
		this.masterMute = isMuted;
		if (!this.activePlugin || !this.activePlugin.setMute || !this.activePlugin.setMute(isMuted)) {
			for (var i= 0, l=this.instances.length; i<l; i++) {
				this.instances[i].setMasterMute(isMuted);
			}
		}
	}

    /**
     * Mute/Unmute all audio. Note that muted audio still plays at 0 volume. The global mute is maintained separately
     * and will not affect the mute property of inidividual instances.
     * @method setMute
     * @param {Boolean} value Whether the audio should be muted or not.
     * @return {Boolean} If the mute was set.
     * @static
     */
    s.setMute = function(value) {
        if(value == null || value == undefined) { return false};

        this.masterMute = value;
        if (!this.activePlugin || !this.activePlugin.setMute || !this.activePlugin.setMute(value)) {
            for (var i= 0, l=this.instances.length; i<l; i++) {
                this.instances[i].setMasterMute(value);
            }
        }
        return true;
    }

    /**
     * Returns the global mute value.
     * @method getMute
     * @return {Boolean} If the mute is set.
     * @static
     */
    s.getMute = function() {
        return this.masterMute;
    }

    /**
	 * Stop all audio (global stop).
	 * @method stop
	 * @static
	 */
	s.stop = function() {
        for (var i= this.instances.length; i>0; i--) {
			this.instances[i-1].stop();  // NOTE stop removes instance from this.instances
		}
	}


/* ---------------
 Internal methods
--------------- */
	/**
	 * Play an instance. This is called by the static API, as well as from plugins. This allows the
	 * core class to control delays.
	 * @method playInstance
	 * @return {Boolean} If the sound can start playing.
	 * @protected
	 */
	s.playInstance = function(instance, interrupt, delay, offset, loop, volume, pan) {
		interrupt = interrupt || s.INTERRUPT_NONE;
		if (delay == null) { delay = 0; }
		if (offset == null) { offset = instance.getPosition(); }
		if (loop == null) { loop = 0; }
		if (volume == null) { volume = instance.getVolume(); }
		if (pan == null) { pan = instance.getPan(); }

		if (delay == 0) {
			var ok = s.beginPlaying(instance, interrupt, offset, loop, volume, pan);
			if (!ok) { return false; }
		} else {
			//Note that we can't pass arguments to proxy OR setTimeout (IE only), so just wrap the function call.
			var delayTimeoutId = setTimeout(function() {
					s.beginPlaying(instance, interrupt, offset, loop, volume, pan);
				}, delay);
			instance.delayTimeoutId = delayTimeoutId;
		}

		this.instances.push(instance);

		return true;
	}

	/**
	 * Begin playback. This is called immediately, or after delay by SoundJS.beginPlaying
	 * @method beginPlaying
	 * @protected
	 */
	s.beginPlaying = function(instance, interrupt, offset, loop, volume, pan) {
		if (!SoundChannel.add(instance, interrupt)) { return false; }
		var result = instance.beginPlaying(offset, loop, volume, pan);
		if (!result) {
			var index = this.instances.indexOf(instance);
			if (index > -1) {
				this.instances.splice(index, 1);
			}
			return false;
		}
		return true;
	}

	/**
	 * Get the source of a sound via the ID passed in with a register or preload call. If no ID is found the value is
	 * returned instead.
	 * @method getSrcById
	 * @param {String} value The ID the sound was registered with.
	 * @return {String} The source of the sound.
	 * @static
	 * @protected
	 */
	s.getSrcById = function(value) {
		if (s.idHash == null || s.idHash[value] == null) { return value; }
		return s.idHash[value];
	}

	/**
	 * A sound has completed playback, been interrupted, failed, or been stopped.
	 * Remove instance management. It will be added again, if the sound re-plays.
	 * Note that this method is called from the instances.
	 * @method playFinished
	 * @param {SoundInstance} instance The instance that finished playback.
	 * @protected
	 */
	s.playFinished = function(instance) {
		SoundChannel.remove(instance);
		var index = this.instances.indexOf(instance);
		if (index > -1) {
			this.instances.splice(index, 1);
		}
	}

	/**
	 * A function proxy for SoundJS methods. By default, JavaScript methods do not maintain scope, so passing a
	 * method as a callback will result in the method getting called in the scope of the caller. Using a proxy
	 * ensures that the method gets called in the correct scope. All internal callbacks in SoundJS use this approach.
	 * @method proxy
	 * @param {Function} method The function to call
	 * @param {Object} scope The scope to call the method name on
	 * @static
	 * @private
	 */
	s.proxy = function(method, scope) {
		return function() {
			return method.apply(scope, arguments);
		}
	}

	createjs.SoundJS = SoundJS;



	/**
	 * SoundChannel manages the number of active instances for each sound type. The number of sounds is artificially
	 * limited by SoundJS in order to prevent over-saturation of a single sound, as well as to stay within hardware
	 * limitations, although the latter may disappear with better browser support and updated plugins like WebAudio.
	 * When a sound is played, this class ensures that there is an available instance, or interrupts an appropriate
	 * sound that is already playing.
	 * @class SoundChannel
	 * @param src The source of the instances
	 * @param max The number of instances allowed
	 * @private
	 */
    //OJR this naming could be changed, as sound channels in sound engineering and web audio refer to mono, left and right, surround, etc
	function SoundChannel(src, max) {
		this.init(src, max);
	}

/* ------------
   Static API
------------ */
	/**
	 * A hash of channel instances indexed by source.
	 * @property channels
	 * @type Object
	 * @static
	 * @private
	 */
	SoundChannel.channels = {};
	/**
	 * Create a sound channel. Note that if the sound channel already exists, this will fail.
	 * @method create
	 * @static
	 * @param {String} src The source for the channel
	 * @param {Number} max The maximum amount this channel holds. The default is 1
	 * @return {Boolean} If the channels were created.
	 * @private
	 */
	SoundChannel.create = function(src, max) {
		var channel = SoundChannel.get(src);
		if (max == null) { max = 1; }
		if (channel == null) {
			SoundChannel.channels[src] = new SoundChannel(src, max);
			return true;
		}
		return false;
	}
	/**
	 * Add an instance to a sound channel.
	 * @method add
	 * @param {SoundInstance} instance The instance to add to the channel
	 * @param {String} interrupt The interrupt value to use. Please see the SoundJS.play for details on interrupt modes.
	 * @see SoundJS.play
	 * @static
	 * @private
	 */
	SoundChannel.add = function(instance, interrupt) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) { return false; }
		return channel.add(instance, interrupt);
	}
	/**
	 * Remove an instance from the channel.
	 * method remove
	 * @param {SoundInstance} instance The instance to remove from the channel
	 * @return The success of the method call. If there is no channel, it will return false.
	 * @static
	 * @private
	 */
	SoundChannel.remove = function(instance) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) { return false; }
		channel.remove(instance);
		return true;
	}
	/**
	 * Get a channel instance by its src.
	 * method get
	 * @param {String} src The src to use to look up the channel
	 * @static
	 * @private
	 */
	SoundChannel.get = function(src) {
		return SoundChannel.channels[src];
	}

	var p = SoundChannel.prototype = {

		/**
		 * The source of the channel.
		 * @property src
		 * @type String
		 * @private
		 */
		src: null,

		/**
		 * The maximum number of instances in this channel.
		 * @property max
		 * @type Number
		 * @private
		 */
		max: null,
		/**
		 * The current number of active instances.
		 * @property length
		 * @type Number
		 * @private
		 */
		length: 0,

		/**
		 * Initialize the channel.
		 * @method init
		 * @param {String} src The source of the channel
		 * @param {Number} max The maximum number of instances in the channel
		 * @private
		 */
		init: function(src, max) {
			this.src = src;
			this.max = max || 1;
			this.instances = [];
		},

		/**
		 * Get an instance by index.
		 * @method get
		 * @param {Number} index The index to return.
		 * @return {SoundInstance} The SoundInstance at a specific instance.
		 * @private
		 */
		get: function(index) {
			return this.instances[index];
		},

		/**
		 * Add a new instance to the channel.
		 * @method add
		 * @param {SoundInstance} instance The instance to add.
		 * @return {Boolean} If the instance could not be played because the channel is full.
		 * @private
		 */
		add: function(instance, interrupt) {
			if (!this.getSlot(interrupt, instance)) {
				return false;
			};
			this.instances.push(instance);
			this.length++;
			return true;
		},

		/**
		 * Remove an instance from the channel, either when it has finished playing, or it has been interrupted.
		 * @method remove
		 * @param {SoundInstance} instance The instance to remove
		 * @return {Boolean} The success of the remove call. If the instance is not found in this channel, it will
		 *      return false.
		 * @private
		 */
		remove: function(instance) {
			var index = this.instances.indexOf(instance);
			if (index == -1) { return false; }
			this.instances.splice(index, 1);
			this.length--;
			return true;
		},

		/**
		 * Get an available slot. This will
		 * @method getSlot
		 * @param {String} interrupt The interrupt value to use.
		 * @param {SoundInstance} instance The sound instance the will go in the channel if successful.
		 * @return {Boolean} Determines if there is an available slot. Depending on the interrupt mode, if there are no slots,
		 *      an existing SoundInstance may be interrupted. If there are no slots, this method returns false.
		 * @private
		 */
		getSlot: function(interrupt, instance) {
			var target, replacement;

			var margin = SoundJS.activePlugin.FT || 0;

			for (var i=0, l=this.max||100; i<l; i++) {
				target = this.get(i);

				// Available Space
				if (target == null) {
					return true;
				} else if (interrupt == SoundJS.INTERRUPT_NONE && target.playState != SoundJS.PLAY_FINISHED) {
					continue;
				}

				// First replacement candidate
				if (i == 0) {
					replacement = target;
					continue;
				}

				// Audio is complete or not playing
				if (target.playState == SoundJS.PLAY_FINISHED ||
						target == SoundJS.PLAY_INTERRUPTED ||
						target == SoundJS.PLAY_FAILED) {
					replacement = target;

				// Audio is a better candidate than the current target, according to playhead
				} else if (
						(interrupt == SoundJS.INTERRUPT_EARLY && target.getPosition() < replacement.getPosition()) ||
						(interrupt == SoundJS.INTERRUPT_LATE && target.getPosition() > replacement.getPosition())) {
					replacement = target;
				}
			}

			if (replacement != null) {
				replacement.interrupt();
				this.remove(replacement);
				return true;
			}
			return false;
		},

		toString: function() {
			return "[SoundJS SoundChannel]";
		}

	}

	// do not add SoundChannel to namespace

	// This is a dummy sound instance, which allows SoundJS to return something so
	// developers don't need to check nulls.
	function SoundInstance() {
        this.isDefault = true;
		this.addEventListener = this.removeEventListener = this.removeAllEventListener = this.dispatchEvent = this.hasEventListener = this._listeners = this.interrupt = this.playFailed = this.pause = this.resume = this.play = this.beginPlaying = this.cleanUp = this.stop = this.setMasterVolume = this.setVolume = this.mute = this.setMute = this.getMute = this.setPan = this.getPosition = this.setPosition = function() { return false; };
		this.getVolume = this.getPan = this.getDuration = function() { return 0; }
		this.playState = SoundJS.PLAY_FAILED;
		this.toString = function() { return "[SoundJS Default Sound Instance]"; }
	}
	SoundJS.defaultSoundInstance = new SoundInstance();


	// An additional module to determine the current browser, version, operating system, and other environment variables.
	function BrowserDetect() {}

	BrowserDetect.init = function() {
		var agent = navigator.userAgent;
		BrowserDetect.isFirefox = (agent.indexOf("Firefox") > -1);
		BrowserDetect.isOpera = (window.opera != null);
		BrowserDetect.isChrome = (agent.indexOf("Chrome") > -1);  // NOTE that Chrome on the Android returns true but is a completely different browser with different abilities
		BrowserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
	}

	BrowserDetect.init();

	createjs.SoundJS.BrowserDetect = BrowserDetect;

    //Patch for IE7 and 8 that don't have indexOf
    //Used from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }
    }


}());
