/*
 * Sound
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
this.createjs = this.createjs || {};

/**
 * The SoundJS library manages the playback of audio on the web. It works via plugins which abstract the actual audio
 * implementation, so playback is possible on any platform without specific knowledge of what mechanisms are necessary
 * to play sounds.
 *
 * To use SoundJS, use the public API on the {{#crossLink "Sound"}}{{/crossLink}} class. This API is for:
 * <ul><li>Installing Plugins</li>
 *      <li>Registering (and preloading) sounds</li>
 *      <li>Playing sounds</li>
 *      <li>Controlling all sounds volume, mute, and stopping everything</li>
 * </ul>
 *
 * <b>Please note that as of version 0.4.0, the "SoundJS" object only provides version information. All APIs from
 * SoundJS are now available on the {{#crossLink "Sound"}}{{/crossLink}} class.</b>
 *
 * <b>Controlling Sounds</b><br />
 * Playing sounds creates {{#crossLink "SoundInstance"}}{{/crossLink}} instances, which can be controlled individually.
 * <ul><li>Pause, resume, and stop sounds</li>
 *      <li>Control a sound's volume, mute, and pan</li>
 *      <li>Add events to sound instances to get notified when they finish, loop, or fail</li>
 * </ul>
 *
 * <h4>Feature Set Example</h4>
 *      createjs.Sound.addEventListener("loadComplete", createjs.proxy(this.loadHandler, this));
 *      createjs.Sound.registerSound("path/to/mySound.mp3|path/to/mySound.ogg", "sound");
 *      function loadHandler(event) {
 *          // This is fired for each sound that is registered.
 *          var instance = createjs.Sound.play("sound");  // play using id.  Could also use source.
 *          instance.addEventListener("complete", createjs.proxy(this.handleComplete, this));
 *          instance.setVolume(0.5);
 *      }
 *
 * @module SoundJS
 * @main SoundJS
 */

(function () {

	//TODO: Interface to validate plugins and throw warnings
	//TODO: Determine if methods exist on a plugin before calling  // OJR this is only an issue if something breaks or user changes something
	//TODO: Interface to validate instances and throw warnings
	//TODO: Surface errors on audio from all plugins
	//TODO: Timeouts  // OJR for?
	/**
	 * The Sound class is the public API for creating sounds, controlling the overall sound levels, and managing plugins.
	 * All Sound APIs on this class are static.
	 *
	 * <b>Registering and Preloading</b><br />
	 * Before you can play a sound, it <b>must</b> be registered. You can do this with {{#crossLink "Sound/registerSound"}}{{/crossLink}},
	 * or register multiple sounds using {{#crossLink "Sound/registerManifest"}}{{/crossLink}}. If you don't register
	 * them immediately, they will be automatically registered if you try and play a sound using {{#crossLink "Sound/play"}}{{/crossLink}},
	 * or if you create a stopped sound using {{#crossLink "Sound/createInstance"}}{{/crossLink}}. If you use
	 * <a href="http://preloadjs.com" target="_blank">PreloadJS</a>, this is handled for you when the sound is
	 * preloaded. It is recommended to preload sounds internally using the register functions or externally using
	 * PreloadJS so they are ready when you want to use them.
	 *
	 * <b>Playback</b><br />
	 * To play a sound once its been registered and preloaded, use the {{#crossLink "Sound/play"}}{{/crossLink}} method.
	 * This method returns a {{#crossLink "SoundInstance"}}{{/crossLink}} which can be paused, resumed, muted, etc.
	 * Please see the {{#crossLink "SoundInstance"}}{{/crossLink}} documentation for more on the instance control APIs.
	 *
	 * <b>Plugins</b><br />
	 * By default, the {{#crossLink "WebAudioPlugin"}}{{/crossLink}} or the {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}
	 * are used (when available), although developers can change plugin priority or add new plugins (such as the
	 * provided {{#crossLink "FlashPlugin"}}{{/crossLink}}). Please see the {{#crossLink "Sound"}}{{/crossLink}} API
	 * methods for more on the playback and plugin APIs. To install plugins, or specify a different plugin order, see
	 * {{#crossLink "Sound/installPlugins"}}{{/crossLink}}.
	 *
	 * <h4>Example</h4>
	 *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashPlugin]);
	 *      createjs.Sound.addEventListener("loadComplete", createjs.proxy(this.loadHandler, (this));
	 *      createjs.Sound.registerSound("path/to/mySound.mp3|path/to/mySound.ogg", "sound");
	 *      function loadHandler(event) {
     *          // This is fired for each sound that is registered.
     *          var instance = createjs.Sound.play("sound");  // play using id.  Could also use source.
     *          instance.addEventListener("complete", createjs.proxy(this.handleComplete, this));
     *          instance.setVolume(0.5);
	 *      }
	 *
	 * The maximum number of concurrently playing instances of the same sound can be specified in the "data" argument
	 * of {{#crossLink "Sound/registerSound"}}{{/crossLink}}.
	 *
	 *      createjs.Sound.registerSound("sound.mp3", "soundId", 4);
	 *
	 * Sound can be used as a plugin with PreloadJS to help preload audio properly. Audio preloaded with PreloadJS is
	 * automatically registered with the Sound class. When audio is not preloaded, Sound will do an automatic internal
	 * preload, and as a result, it may not play immediately the first time play is called. Use the
	 * {{#crossLink "Sound/loadComplete"}}{{/crossLink}} event to determine when a sound has finished internally preloading.
	 * It is recommended that all audio is preloaded before it is played.
	 *
	 *      createjs.PreloadJS.installPlugin(createjs.Sound);
	 *
	 * <h4>Known Browser and OS issues</h4>
	 * <b>IE 9 html limitations</b><br />
	 * <ul><li>There is a delay in applying volume changes to tags that occurs once playback is started. So if you have
	 * muted all sounds, they will all play during this delay until the mute applies internally. This happens regardless of
	 * when or how you apply the volume change, as the tag seems to need to play to apply it.</li>
     * <li>MP3 encoding will not always work for audio tags, particularly in Internet Explorer. We've found default
	 * encoding with 64kbps works.</li></ul>
	 *
	 * <b>iOS 6 limitations</b><br />
	 * <ul><li>Sound is initially muted and will only unmute through play being called inside a user initiated event (touch).</li>
	 *      <li>Despite suggestions to the opposite, we have control over audio volume through our gain nodes.</li></ul>
	 * More details: http://stackoverflow.com/questions/12517000/no-sound-on-ios-6-web-audio-api
	 *
	 * <b>Android limitations</b><br />
	 * <ul><li>Android chrome reports true when you run createjs.Sound.BrowserDetect.isChrome, but is a different browser
	 *      with different abilities</li>
	 *      <li>We have no control over audio volume. Only the user can set volume on their device.</li>
	 *      <li>We can only play audio inside a user event (touch).  This currently means you cannot loop sound.</li></ul>
	 *
	 * @class Sound
	 * @static
	 * @uses EventDispatcher
	 */
	function Sound() {
		throw "Sound cannot be instantiated";
	}

	var s = Sound;

	/**
	 * The character (or characters) that are used to split multiple paths from an audio source.
	 * @property DELIMITER
	 * @type {String}
	 * @default |
	 * @static
	 */
	s.DELIMITER = "|";

	/**
	 * The duration in milliseconds to determine a timeout.
	 * @property AUDIO_TIMEOUT
	 * @static
	 * @type {Number}
	 * @default 8000
	 */
	s.AUDIO_TIMEOUT = 8000; // TODO: This is not implemeneted  // OJR remove property?

	/**
	 * The interrupt value to interrupt any currently playing instance with the same source, if the maximum number of
	 * instances of the sound are already playing.
	 * @property INTERRUPT_ANY
	 * @type {String}
	 * @default any
	 * @static
	 */
	s.INTERRUPT_ANY = "any";

	/**
	 * The interrupt value to interrupt the earliest currently playing instance with the same source that progressed the
	 * least distance in the audio track, if the maximum number of instances of the sound are already playing.
	 * @property INTERRUPT_EARLY
	 * @type {String}
	 * @default early
	 * @static
	 */
	s.INTERRUPT_EARLY = "early";

	/**
	 * The interrupt value to interrupt the currently playing instance with the same source that progressed the most
	 * distance in the audio track, if the maximum number of instances of the sound are already playing.
	 * @property INTERRUPT_LATE
	 * @type {String}
	 * @default late
	 * @static
	 */
	s.INTERRUPT_LATE = "late";

	/**
	 * The interrupt value to interrupt no currently playing instances with the same source, if the maximum number of
	 * instances of the sound are already playing.
	 * @property INTERRUPT_NONE
	 * @type {String}
	 * @default none
	 * @static
	 */
	s.INTERRUPT_NONE = "none";

// The playState in plugins should be implemented with these values.
	/**
	 * Defines the playState of an instance that is still initializing.
	 * @property PLAY_INITED
	 * @type {String}
	 * @default playInited
	 * @static
	 */
	s.PLAY_INITED = "playInited";

	/**
	 * Defines the playState of an instance that is currently playing or paused.
	 * @property PLAY_SUCCEEDED
	 * @type {String}
	 * @default playSucceeded
	 * @static
	 */
	s.PLAY_SUCCEEDED = "playSucceeded";

	/**
	 * Defines the playState of an instance that was interrupted by another instance.
	 * @property PLAY_INTERRUPTED
	 * @type {String}
	 * @default playInterrupted
	 * @static
	 */
	s.PLAY_INTERRUPTED = "playInterrupted";

	/**
	 * Defines the playState of an instance that completed playback.
	 * @property PLAY_FINISHED
	 * @type {String}
	 * @default playFinished
	 * @static
	 */
	s.PLAY_FINISHED = "playFinished";

	/**
	 * Defines the playState of an instance that failed to play. This is usually caused by a lack of available channels
	 * when the interrupt mode was "INTERRUPT_NONE", the playback stalled, or the sound could not be found.
	 * @property PLAY_FAILED
	 * @type {String}
	 * @default playFailed
	 * @static
	 */
	s.PLAY_FAILED = "playFailed";

	/**
	 * A list of the default supported extensions that Sound will <i>try</i> to play. Plugins will check if the browser
	 * can play these types, so modifying this list before a plugin is initialized will allow the plugins to try and
	 * support additional media types.
	 *
	 * NOTE this does not currently work for {{#crossLink "FlashPlugin"}}{{/crossLink}}.
	 *
	 * More details on file formats can be found at http://en.wikipedia.org/wiki/Audio_file_format. A very detailed
	 * list of file formats can be found //http://www.fileinfo.com/filetypes/audio. A useful list of extensions for a
	 * format can be found at http://html5doctor.com/html5-audio-the-state-of-play/
	 * @property SUPPORTED_EXTENSIONS
	 * @type {Array[String]}
	 * @default ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"]
	 */
	s.SUPPORTED_EXTENSIONS = ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"];  // OJR does not currently support FlashPlugin

	/**
	 * Some extensions use another type of extension support to play (one of them is a codex).  This allows you to map
	 * that support so plugins can accurately determine if an extension is supported.  Adding to this list can help
	 * plugins determine more accurately if an extension is supported.
	 * @property EXTENSION_MAP
	 * @type {Object}
	 * @since 0.4.0
	 */
	s.EXTENSION_MAP = {
		m4a:"mp4"
	};

	/**
	 * The RegExp pattern to use to parse file URIs. This supports simple file names, as well as full domain URIs with
	 * query strings. The resulting match is: protocol:$1 domain:$2 path:$3 file:$4 extension:$5 query string:$6.
	 * @property FILE_PATTERN
	 * @type {RegExp}
	 * @static
	 * @private
	 */
	s.FILE_PATTERN = /(\w+:\/{2})?((?:\w+\.){2}\w+)?(\/?[\S]+\/|\/)?([\w\-%\.]+)(?:\.)(\w+)?(\?\S+)?/i;

	/**
	 * Determines the default behavior for interrupting other currently playing instances with the same source, if the
	 * maximum number of instances of the sound are already playing.  Currently the default is <code>Sound.INTERRUPT_NONE</code>
	 * but this can be set and will change playback behavior accordingly.  This is only used if {{#crossLink "Sound/play"}}{{/crossLink}}
	 * is called without passing a value for interrupt.
	 * @property defaultInterruptBehavior
	 * @type {String}
	 * @default none
	 * @static
	 * @since 0.4.0
	 */
	s.defaultInterruptBehavior = s.INTERRUPT_NONE;  // OJR does s.INTERRUPT_ANY make more sense as default?  Needs game dev testing to see which case makes more sense.

	/**
	 * Used internally to assign unique IDs to each SoundInstance
	 * @property lastID
	 * @type {Number}
	 * @static
	 * @private
	 */
	s.lastId = 0,

	/**
	 * The currently active plugin. If this is null, then no plugin could be initialized. If no plugin was specified,
	 * Sound attempts to apply the default plugins: {{#crossLink "WebAudioPlugin"}}{{/crossLink}}, followed by
	 * {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}.
	 * @property activePlugin
	 * @type {Object}
	 * @static
	 */
    s.activePlugin = null;

	/**
	 * Determines if the plugins have been registered. If false, the first call to play() will instantiate the default
	 * plugins ({{#crossLink "WebAudioPlugin"}}{{/crossLink}}, followed by {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}).
	 * If plugins have been registered, but none are applicable, then sound playback will fail.
	 * @property pluginsRegistered
	 * @type {Boolean}
	 * @default false
	 * @static
	 * @private
	 */
	s.pluginsRegistered = false;

	/**
	 * The master volume value. Use {{#crossLink "Sound/getVolume"}}{{/crossLink}} and {{#crossLink "Sound/setVolume"}}{{/crossLink}}
	 * to modify the volume of all audio.
	 * @property masterVolume
	 * @type {Number}
	 * @default 1
	 * @private
	 * @since 0.4.0
	 */
	s.masterVolume = 1;

	/**
	 * The master mute value for Sound.  This is applies to all sound instances.  This value can be set through
	 * {{#crossLink "Sound/setMute"}}{{/crossLink}} and accessed via {{#crossLink "Sound/getMute"}}{{/crossLink}}.
	 * @property masterMute
	 * @type {Boolean}
	 * @default false
	 * @private
	 * @static
	 * @since 0.4.0
	 */
	s.masterMute = false;

	/**
	 * An array containing all currently playing instances. This helps Sound control the volume, mute, and playback of
	 * all instances when using static APIs like {{#crossLink "Sound/stop"}}{{/crossLink}} and {{#crossLink "Sound/setVolume"}}{{/crossLink}}.
	 * When an instance has finished playback, it gets removed via the {{#crossLink "Sound/finishedPlaying"}}{{/crossLink}}
	 * method. If the user replays an instance, it gets added back in via the {{#crossLink "Sound/beginPlaying"}}{{/crossLink}}
	 * method.
	 * @property instances
	 * @type {Array}
	 * @private
	 * @static
	 */
	s.instances = [];

	/**
	 * A hash lookup of sound sources via the corresponding ID.
	 * @property idHash
	 * @type {Object}
	 * @private
	 * @static
	 */
	s.idHash = {};

	/**
	 * A hash lookup of preloading sound sources via the parsed source that is passed to the plugin.  Contains the
	 * source, id, and data that was passed in by the user.  Parsed sources can contain multiple instances of source, id,
	 * and data.
	 * @property preloadHash
	 * @type {Object}
	 * @private
	 * @static
	 */
	s.preloadHash = {};

	/**
	 * An object that stands in for audio that fails to play. This allows developers to continue to call methods
	 * on the failed instance without having to check if it is valid first. The instance is instantiated once, and
	 * shared to keep the memory footprint down.
	 * @property defaultSoundInstance
	 * @type {Object}
	 * @protected
	 * @static
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

	createjs.EventDispatcher.initialize(s); // inject EventDispatcher methods.


// Events
	/**
	 * This event that is fired when a file finishes loading internally. This event is fired for each loaded sound,
	 * so any handler methods should look up the <code>event.src</code> to handle a particular sound.
	 * @event loadComplete
	 * @param {Object} target The object that dispatched the event.
	 * @param {String} type The event type.
	 * @param {String} src The source of the sound that was loaded. Note this will only return the loaded part of a
	 * delimiter-separated source.
	 * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
	 * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
	 * @since 0.4.0
	 */

// Callbacks
	/**
	 * The callback that is fired when a file finishes loading internally.
	 * @property onLoadComplete
	 * @type {Function}
	 * @deprecated In favour of the "loadComplete" event. Will be removed in a future version.
	 * @since 0.4.0
	 */
	s.onLoadComplete = null;

	/**
	 * @method sendLoadComplete
	 * @param {String} src A sound file has completed loading, and should be dispatched.
	 * @private
	 * @static
	 * @since 0.4.0
	 */
	s.sendLoadComplete = function (src) {
		if (!s.preloadHash[src]) {
			return;
		}
		for (var i = 0, l = s.preloadHash[src].length; i < l; i++) {
			var item = s.preloadHash[src][i];
			var event = {
				target:this,
				type:"loadComplete",
				src:item.src, // OJR LM thinks this might be more consistent if it returned item like PreloadJS
				id:item.id,
				data:item.data
			};
			s.preloadHash[src][i] = true;
			s.onLoadComplete && s.onLoadComplete(event);
			s.dispatchEvent(event);
		}
	}

	/**
	 * Get the preload rules to allow Sound to be used as a plugin by <a href="http://preloadjs.com" target="_blank">PreloadJS</a>.
	 * Any load calls that have the matching type or extension will fire the callback method, and use the resulting
	 * object, which is potentially modified by Sound. This helps when determining the correct path, as well as
	 * registering the audio instance(s) with Sound. This method should not be called, except by PreloadJS.
	 * @method getPreloadHandlers
	 * @return {Object} An object containing:
	 * <ul><li>callback: A preload callback that is fired when a file is added to PreloadJS, which provides
	 *      Sound a mechanism to modify the load parameters, select the correct file format, register the sound, etc.</li>
	 *      <li>types: A list of file types that are supported by Sound (currently supports "sound").</li>
	 *      <li>extensions A list of file extensions that are supported by Sound (see Sound.SUPPORTED_EXTENSIONS).</li></ul>
	 * @static
	 * @protected
	 */
	s.getPreloadHandlers = function () {
		return {
			callback:createjs.proxy(s.initLoad, s),
			types:["sound"],
			extensions:s.SUPPORTED_EXTENSIONS
		};
	}

	/**
	 * Register a Sound plugin. Plugins handle the actual playback of audio. The default plugins are
	 * ({{#crossLink "WebAudioPlugin"}}{{/crossLink}} followed by the {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}),
	 * and are installed if no other plugins are present when the user starts playback.
	 * <h4>Example</h4>
	 *      createjs.FlashPlugin.BASE_PATH = "../src/SoundJS/";
	 *      createjs.Sound.registerPlugin(createjs.FlashPlugin);
	 *
	 * To register multiple plugins, use {{#crossLink "Sound/registerPlugins"}}{{/crossLink}}.
	 *
	 * @method registerPlugin
	 * @param {Object} plugin The plugin class to install.
	 * @return {Boolean} Whether the plugin was successfully initialized.
	 * @static
	 */
	s.registerPlugin = function (plugin) {
		s.pluginsRegistered = true;
		if (plugin == null) {
			return false;
		}
		// Note: Each plugin is passed in as a class reference, but we store the activePlugin as an instance
		if (plugin.isSupported()) {
			s.activePlugin = new plugin();
			//TODO: Check error on initialization
			return true;
		}
		return false;
	}

	/**
	 * Register a list of Sound plugins, in order of precedence. To register a single plugin, use
	 * {{#crossLink "Sound/registerPlugin"}}{{/crossLink}}.
	 *
	 * <h4>Example</h4>
	 *      createjs.FlashPlugin.BASE_PATH = "../src/SoundJS/";
	 *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);
	 *
	 * @method registerPlugins
	 * @param {Array} plugins An array of plugins classes to install.
	 * @return {Boolean} Whether a plugin was successfully initialized.
	 * @static
	 */
	s.registerPlugins = function (plugins) {
		for (var i = 0, l = plugins.length; i < l; i++) {
			var plugin = plugins[i];
			if (s.registerPlugin(plugin)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Initialize the default plugins. This method is called when any audio is played before the user has registered
	 * any plugins, and enables Sound to work without manual plugin setup. Currently, the default plugins are
	 * {{#crossLink "WebAudioPlugin"}}{{/crossLink}} followed by {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}.
	 * @method initializeDefaultPlugins
	 * @returns {Boolean} If a plugin is initialized (true) or not (false). If the browser does not have the
	 * capabilities to initialize any available plugins, this will return false.
	 * @private
	 * @since 0.4.0
	 */
	s.initializeDefaultPlugins = function () {
		if (s.activePlugin != null) {
			return true;
		}
		if (s.pluginsRegistered) {
			return false;
		}
		if (s.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin])) {
			return true;
		}
		return false;
	}

	/**
	 * Determines if Sound has been initialized, and a plugin has been activated.
	 * @method isReady
	 * @return {Boolean} If Sound has initialized a plugin.
	 * @static
	 */
	s.isReady = function () {
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
	 *     <li><b>mp4:</b> If MP4 audio is supported.</li>
	 *     <li><b>aiff:</b> If aiff audio is supported.</li>
	 *     <li><b>wma:</b> If wma audio is supported.</li>
	 *     <li><b>mid:</b> If mid audio is supported.</li>
	 *     <li><b>tracks:</b> The maximum number of audio tracks that can be played back at a time. This will be -1
	 *     if there is no known limit.</li>
	 * @method getCapabilities
	 * @return {Object} An object containing the capabilities of the active plugin.
	 * @static
	 */
	s.getCapabilities = function () {
		if (s.activePlugin == null) {
			return null;
		}
		return s.activePlugin.capabilities;
	}

	/**
	 * Get a specific capability of the active plugin. See {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} for a
	 * full list of capabilities.
	 * @method getCapability
	 * @param {String} key The capability to retrieve
	 * @return {Number|Boolean} The value of the capability.
	 * @static
	 * @see getCapabilities
	 */
	s.getCapability = function (key) {
		if (s.activePlugin == null) {
			return null;
		}
		return s.activePlugin.capabilities[key];
	}

	/**
	 * Process manifest items from <a href="http://preloadjs.com" target="_blank">PreloadJS</a>. This method is intended
	 * for usage by a plugin, and not for direct interaction.
	 * @method initLoad
	 * @param {String | Object} src The src or object to load. This is usually a string path, but can also be an
	 * HTMLAudioElement or similar audio playback object.
	 * @param {String} [type] The type of object. Will likely be "sound" or null.
	 * @param {String} [id] An optional user-specified id that is used to play sounds.
	 * @param {Number|String|Boolean|Object} [data] Data associated with the item. Sound uses the data parameter as the
	 * number of channels for an audio instance, however a "channels" property can be appended to the data object if
	 * this property is used for other information. The audio channels will default to 1 if no value is found.
	 * @return {Boolean|Object} An object with the modified values of those that were passed in, or false if the active
	 * plugin can not play the audio type.
	 * @protected
	 * @static
	 */
	s.initLoad = function (src, type, id, data) {
		var details = s.registerSound(src, id, data, false);
		if (details == null) {
			return false;
		}
		return details;
	}

	/**
	 * Register a sound to playback in Sound. This is automatically called when using <a href="http://preloadjs.com" target="_blank">PreloadJS</a>,
	 * however if you just wish to register a sound manually, this method will handle it. It is recommended to
	 * register all sounds that need to be played back in order to properly prepare and preload them. Sound does
	 * internal preloading when required.
	 *
	 * <h4>Example</h4>
	 *      createjs.Sound.registerSound("myAudioPath/mySound.mp3|myAudioPath/mySound.ogg", "myID", 3);
	 *
	 * @method registerSound
	 * @param {String | Object} src The source or an Objects with a "src" property
	 * @param {String} [id] An id specified by the user to play the sound later.
	 * @param {Number | Object} [data] Data associated with the item. Sound uses the data parameter as the number of
	 * channels for an audio instance, however a "channels" property can be appended to the data object if it is used
	 * for other information. The audio channels will set a default based on plugin if no value is found.
	 * @param {Boolean} [preload=true] If the sound should be internally preloaded so that it can be played back
	 * without an external preloader.
	 * @return {Object} An object with the modified values that were passed in, which defines the sound. Returns false
	 * if the source cannot be parsed.
	 * @static
	 * @since 0.4.0
	 */
	s.registerSound = function (src, id, data, preload) {
		if (!s.initializeDefaultPlugins()) {
			return false;
		}

		if (src instanceof Object) {
			src = src.src;
			id = src.id;
			data = src.data;
			//OJR also do? preload = src.preload;
		}
		var details = s.parsePath(src, "sound", id, data);
		if (details == null) {
			return false;
		}

		if (id != null) {
			s.idHash[id] = details.src;
		}

		var numChannels = null; // null will set all SoundChannel to set this to it's internal maxDefault
		if (data != null) {
			if (!isNaN(data.channels)) {
				numChannels = parseInt(data.channels);
			}
			else if (!isNaN(data)) {
				numChannels = parseInt(data);
			}
		}
		var loader = s.activePlugin.register(details.src, numChannels);  // Note only HTML audio uses numChannels

		if (loader != null) {
			if (loader.numChannels != null) {
				numChannels = loader.numChannels;
			} // currently only HTMLAudio returns this
			SoundChannel.create(details.src, numChannels);

			// return the number of instances to the user.  This will also be returned in the load event.
			if (data == null || !isNaN(data)) {
				data = details.data = numChannels || SoundChannel.maxPerChannel();
			} else {
				data.channels = details.data.channels = numChannels || SoundChannel.maxPerChannel();
			}

			// If the loader returns a tag, return it instead for preloading.
			if (loader.tag != null) {
				details.tag = loader.tag;
			}
			else if (loader.src) {
				details.src = loader.src;
			}
			// If the loader returns a complete handler, pass it on to the prelaoder.
			if (loader.completeHandler != null) {
				details.completeHandler = loader.completeHandler;
			}
			details.type = loader.type;
		}

		if (preload != false) {
			if (!s.preloadHash[details.src]) {
				s.preloadHash[details.src] = [];
			}  // we do this so we can store multiple id's and data if needed
			s.preloadHash[details.src].push({src:src, id:id, data:data});  // keep this data so we can return it onLoadComplete
			if (s.preloadHash[details.src].length == 1) {
				s.activePlugin.preload(details.src, loader)
			}
			;  // if already loaded once, don't load a second time  // OJR note this will disallow reloading a sound if loading fails or the source changes
		}

		return details;
	}

	/**
	 * Register a manifest of sounds to playback in Sound. It is recommended to register all sounds that need to be
	 * played back in order to properly prepare and preload them. Sound does internal preloading when required.
	 *
	 * <h4>Example</h4>
	 *      var manifest = [
	 *          {src:"assetPath/asset0.mp3|assetPath/asset0.ogg", id:"example"}, // Note the Sound.DELIMITER
	 *          {src:"assetPath/asset1.mp3|assetPath/asset1.ogg", id:"1", data:6},
	 *          {src:"assetPath/asset2.mp3", id:"works"}
	 *      ];
	 *      createjs.Sound.addEventListener("loadComplete", doneLoading); // call doneLoading when each sound loads
	 *      createjs.Sound.registerManifest(manifest);
	 *
	 *
	 * @method registerManifest
	 * @param {Array} manifest An array of objects to load. Objects are expected to be in the format needed for
	 * {{#crossLink "Sound/registerSound"}}{{/crossLink}}: <code>{src:srcURI, id:ID, data:Data, preload:UseInternalPreloader}</code>
	 * with "id", "data", and "preload" being optional.
	 * @return {Object} An array of objects with the modified values that were passed in, which defines each sound. It
	 * will return false for any values that the source cannot be parsed.
	 * @static
	 * @since 0.4.0
	 */
	s.registerManifest = function (manifest) {
		var returnValues = [];
		for (var i = 0, l = manifest.length; i < l; i++) {
			returnValues[i] = createjs.Sound.registerSound(manifest[i].src, manifest[i].id, manifest[i].data, manifest[i].preload)
		}
		return returnValues;
	}

	/**
	 * Check if a source has been loaded by internal preloaders. This is necessary to ensure that sounds that are
	 * not completed preloading will not kick off a new internal preload if they are played.
	 * @method loadComplete
	 * @param {String} src The src or id that is being loaded.
	 * @return {Boolean} If the src is already loaded.
	 * @since 0.4.0
	 */
	s.loadComplete = function (src) {
		var details = s.parsePath(src, "sound");
		if (details) {
			src = s.getSrcById(details.src);
		} else {
			src = s.getSrcById(src);
		}
		return (s.preloadHash[src][0] == true);  // src only loads once, so if it's true for the first it's true for all
	}

	/**
	 * Parse the path of a sound, usually from a manifest item. Manifest items support single file paths, as well as
	 * composite paths using <code>Sound.DELIMITER</code>, which defaults to "|". The first path supported by the
	 * current browser/plugin will be used.
	 * @method parsePath
	 * @param {String} value The path to an audio source.
	 * @param {String} [type] The type of path. This will typically be "sound" or null.
	 * @param {String} [id] The user-specified sound ID. This may be null, in which case the src will be used instead.
	 * @param {Number | String | Boolean | Object} [data] Arbitrary data appended to the sound, usually denoting the
	 * number of channels for the sound. This method doesn't currently do anything with the data property.
	 * @return {Object} A formatted object that can be registered with the <code>Sound.activePlugin</code> and returned
	 * to a preloader like <a href="http://preloadjs.com" target="_blank">PreloadJS</a>.
	 * @protected
	 */
	s.parsePath = function (value, type, id, data) {
        if (typeof(value) != "string") {value = value.toString();}
		var sounds = value.split(s.DELIMITER);
		var ret = {type:type || "sound", id:id, data:data};
		var c = s.getCapabilities();
		for (var i = 0, l = sounds.length; i < l; i++) {
			var sound = sounds[i];

			var match = sound.match(s.FILE_PATTERN);
			if (match == null) {
				return false;
			}
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
	 * Play a sound and get a {{#crossLink "SoundInstance"}}{{/crossLink}} to control. If the sound fails to play, a
	 * SoundInstance will still be returned, and have a playState of <code>Sound.PLAY_FAILED</code>. Note that even on
	 * sounds with failed playback, you may still be able to call SoundInstance {{#crossLink "SoundInstance/play"}}{{/crossLink}},
	 * since the failure could be due to lack of available channels. If there is no available plugin,
	 * <code>Sound.defaultSoundInstance</code> will be returned, which will not play any audio, but will not generate
	 * errors.
	 *
	 * <h4>Example</h4>
	 *      createjs.Sound.registerSound("myAudioPath/mySound.mp3", "myID", 3);
	 *      // wait until load is complete
	 *      createjs.Sound.play("myID");
	 *      // alternately we could call the following
	 *      var myInstance = createjs.Sound.play("myAudioPath/mySound.mp3", createjs.Sound.INTERRUPT_ANY, 0, 0, -1, 1, 0);
	 *
	 * @method play
	 * @param {String} src The src or ID of the audio.
	 * @param {String} [interrupt="none"] How to interrupt other instances of audio. Values are defined as <code>INTERRUPT_TYPE</code>
	 * constants on the Sound class.
	 * @param {Number} [delay=0] The amount of time to delay the start of the audio in milliseconds.
	 * @param {Number} [offset=0] The point to start the audio in milliseconds.
	 * @param {Number} [loop=0] How many times the audio loops when it reaches the end of playback. The efault is 0 (no
	 * loops), and -1 can be used for infinite playback.
	 * @param {Number} [volume=1] The volume of the sound, between 0 and 1. Note that the master volume is applied
	 * against the individual volume.
	 * @param {Number} [pan=0] The left-right pan of the sound (if supported), between -1 (left) and 1 (right).
	 * @return {SoundInstance} A {{#crossLink "SoundInstance"}}{{/crossLink}} that can be controlled after it is created.
	 * @static
	 */
	s.play = function (src, interrupt, delay, offset, loop, volume, pan) {
		var instance = s.createInstance(src);

		var ok = s.playInstance(instance, interrupt, delay, offset, loop, volume, pan);
		if (!ok) {
			instance.playFailed();
		}
		return instance;
	}

	/**
	 * Creates a {{#crossLink "SoundInstance"}}{{/crossLink}} using the passed in src. If the src does not have a
	 * supported extension, a default SoundInstance will be returned that can be called safely but does nothing.
	 * @method createInstance
	 * @param {String} src The src of the audio.
	 * @return {SoundInstance} A {{#crossLink "SoundInstance"}}{{/crossLink}} that can be controlled after it is created.
	 * Unsupported extensions will return the default SoundInstance.
	 * @since 0.4.0
	 */
	s.createInstance = function (src) {
		//TODO this function appears to be causing a memory leak, and needs spike tested.
		// OJR it is not EventDispatcher.  It appears to be var instance = s.activePlugin.create(src);  HTML makes sense because of the tag pool.  web audio is crashing though.
		// in new SoundInstance
		if (!s.initializeDefaultPlugins()) {
			return s.defaultSoundInstance;
		}
		var details = s.parsePath(src, "sound");
		if (details) {
			src = s.getSrcById(details.src);
		} else {
			src = s.getSrcById(src);
		}

		var dot = src.lastIndexOf(".");
		var ext = src.slice(dot + 1);  // sound have format of "path+name . ext"
		if (dot != -1 && s.SUPPORTED_EXTENSIONS.indexOf(ext) > -1) {  // we have an ext and it is one of our supported,Note this does not mean the plugin supports it.  // OJR consider changing to check against activePlugin.capabilities[ext]
			// make sure that we have a sound channel (sound is registered or previously played)
			SoundChannel.create(src);

			var instance = s.activePlugin.create(src);
		} else var instance = Sound.defaultSoundInstance;  // the src is not supported, so give back a dummy instance.
		// This can happen if PreloadJS fails because the plugin does not support the ext, and was passed an id which
		// will not get added to the idHash.

		instance.uniqueId = s.lastId++;  // OJR moved this here so we can have multiple plugins active in theory

		return instance;
	}

	/**
	 * Set the master volume of Sound. The master volume is multiplied against each sound's individual volume.
	 * To set individual sound volume, use SoundInstance {{#crossLink "SoundInstance/setVolume"}}{{/crossLink}} instead.
	 * @method setVolume
	 * @param {Number} value The master volume value. The acceptable range is 0-1.
	 * @static
	 */
	s.setVolume = function (value) {
		if (Number(value) == null) {
			return false;
		}
		value = Math.max(0, Math.min(1, value));
		s.masterVolume = value;
		if (!this.activePlugin || !this.activePlugin.setVolume || !this.activePlugin.setVolume(value)) {
			var instances = this.instances;  // OJR does this impact garbage collection more than it helps performance?
			for (var i = 0, l = instances.length; i < l; i++) {
				instances[i].setMasterVolume(value);
			}
		}
	}

	/**
	 * Get the master volume of Sound. The master volume is multiplied against each sound's individual volume.
	 * To get individual sound volume, use SoundInstance {{#crossLink "SoundInstance/getVolume"}}{{/crossLink}} instead.
	 * @method getVolume
	 * @return {Number} The master volume, in a range of 0-1.
	 * @static
	 */
	s.getVolume = function (value) {
		return s.masterVolume;
	}

	/**
	 * Mute/Unmute all audio. Please see {{#crossLink "Sound/setMute"}}{{/crossLink}}.
	 * @method mute
	 * @param {Boolean} value Whether the audio should be muted or not.
	 * @static
	 * @deprecated This function has been deprecated. Please use setMute instead.
	 */
	s.mute = function (value) {
		this.masterMute = value;
		if (!this.activePlugin || !this.activePlugin.setMute || !this.activePlugin.setMute(value)) {
			var instances = this.instances;
			for (var i = 0, l = instances.length; i < l; i++) {
				instances[i].setMasterMute(value);
			}
		}
	}

	/**
	 * Mute/Unmute all audio. Note that muted audio still plays at 0 volume. This global mute value is maintained
	 * separately and will override, but not change the mute property of individual instances. To mute an individual
	 * instance, use SoundInstance {{#crossLink "SoundInstance/setMute"}}{{/crossLink}} instead.
	 * @method setMute
	 * @param {Boolean} value Whether the audio should be muted or not.
	 * @return {Boolean} If the mute was set.
	 * @static
	 * @since 0.4.0
	 */
	s.setMute = function (value) {
		if (value == null || value == undefined) {
			return false
		}
		;

		this.masterMute = value;
		if (!this.activePlugin || !this.activePlugin.setMute || !this.activePlugin.setMute(value)) {
			var instances = this.instances;
			for (var i = 0, l = instances.length; i < l; i++) {
				instances[i].setMasterMute(value);
			}
		}
		return true;
	}

	/**
	 * Returns the global mute value. To get the mute value of an individual instance, use SoundInstance
	 * {{#crossLink "SoundInstance/getMute"}}{{/crossLink}} instead.
	 * @method getMute
	 * @return {Boolean} The mute value of Sound.
	 * @static
	 * @since 0.4.0
	 */
	s.getMute = function () {
		return this.masterMute;
	}

	/**
	 * Stop all audio (global stop). Stopped audio is reset, and not paused. To play back audio that has been stopped,
	 * call {{#crossLink "SoundInstance.play"}}{{/crossLink}}.
	 * @method stop
	 * @static
	 */
	s.stop = function () {
		var instances = this.instances;
		for (var i = instances.length; i > 0; i--) {
			instances[i - 1].stop();  // NOTE stop removes instance from this.instances
		}
	}


	/* ---------------
	 Internal methods
	 --------------- */
	/**
	 * Play an instance. This is called by the static API, as well as from plugins. This allows the core class to
	 * control delays.
	 * @method playInstance
	 * @param {SoundInstance} instance The {{#crossLink "SoundInstance"}}{{/crossLink}} to start playing.
	 * @param {String} [interrupt=none] How this sound interrupts other instances with the same source.  Defaults to
	 * <code>Sound.INTERRUPT_NONE</code>. All interrupt values are defined as <code>INTERRUPT_TYPE</code>constants on Sound.
	 * @param {Number} [delay=0] Time in milliseconds before playback begins.
	 * @param {Number} [offset=instance.offset] Time into the sound to begin playback in milliseconds.  Defaults to the
	 * current value on the instance.
	 * @param {Number} [loop=0] The number of times to loop the audio. Use 0 for no loops, and -1 for an infinite loop.
	 * @param {Number} [volume] The volume of the sound between 0 and 1. Defaults to current instance value.
	 * @param {Number} [pan] The pan of the sound between -1 and 1. Defaults to current instance value.
	 * @return {Boolean} If the sound can start playing. Sounds that fail immediately will return false. Sounds that
	 * have a delay will return true, but may still fail to play.
	 * @protected
	 * @static
	 */
	s.playInstance = function (instance, interrupt, delay, offset, loop, volume, pan) {
		interrupt = interrupt || s.defaultInterruptBehavior;
		if (delay == null) {
			delay = 0;
		}
		if (offset == null) {
			offset = instance.getPosition();
		}
		if (loop == null) {
			loop = 0;
		}
		if (volume == null) {
			volume = instance.getVolume();
		}
		if (pan == null) {
			pan = instance.getPan();
		}

		if (delay == 0) {
			var ok = s.beginPlaying(instance, interrupt, offset, loop, volume, pan);
			if (!ok) {
				return false;
			}
		} else {
			//Note that we can't pass arguments to proxy OR setTimeout (IE only), so just wrap the function call.
			var delayTimeoutId = setTimeout(function () {
				s.beginPlaying(instance, interrupt, offset, loop, volume, pan);
			}, delay);
			instance.delayTimeoutId = delayTimeoutId;
		}

		this.instances.push(instance);

		return true;
	}

	/**
	 * Begin playback. This is called immediately or after delay by {{#crossLink "Sound/playInstance"}}{{/crossLink}}.
	 * @method beginPlaying
	 * @param {SoundInstance} instance A {{#crossLink "SoundInstance"}}{{/crossLink}} to begin playback.
	 * @param {String} [interrupt=none] How this sound interrupts other instances with the same source. Defaults to
	 * <code>Sound.INTERRUPT_NONE</code>. Interrupts are defined as <code>INTERRUPT_TYPE</code> constants on Sound.
	 * @param {Number} [offset] Time in milliseconds into the sound to begin playback.  Defaults to the current value on
	 * the instance.
	 * @param {Number} [loop=0] The number of times to loop the audio. Use 0 for no loops, and -1 for an infinite loop.
	 * @param {Number} [volume] The volume of the sound between 0 and 1. Defaults to the current value on the instance.
	 * @param {Number} [pan=instance.pan] The pan of the sound between -1 and 1. Defaults to current instance value.
	 * @return {Boolean} If the sound can start playing. If there are no available channels, or the instance fails to
	 * start, this will return false.
	 * @protected
	 * @static
	 */
	s.beginPlaying = function (instance, interrupt, offset, loop, volume, pan) {
		if (!SoundChannel.add(instance, interrupt)) {
			return false;
		}
		var result = instance.beginPlaying(offset, loop, volume, pan);
		if (!result) {
			//LM: Should we remove this from the SoundChannel (see finishedPlaying)
			var index = this.instances.indexOf(instance);
			if (index > -1) {
				this.instances.splice(index, 1);
			}
			return false;
		}
		return true;
	}

	/**
	 * Get the source of a sound via the ID passed in with a register call. If no ID is found the value is returned
	 * instead.
	 * @method getSrcById
	 * @param {String} value The ID the sound was registered with.
	 * @return {String} The source of the sound.  Returns null if src has been registered with this id.
	 * @protected
	 * @static
	 */
	s.getSrcById = function (value) {
		if (s.idHash == null || s.idHash[value] == null) {
			return value;
		}
		return s.idHash[value];
	}

	/**
	 * A sound has completed playback, been interrupted, failed, or been stopped. This method removes the instance from
	 * Sound management. It will be added again, if the sound re-plays. Note that this method is called from the
	 * instances themselves.
	 * @method playFinished
	 * @param {SoundInstance} instance The instance that finished playback.
	 * @protected
	 * @static
	 */
	s.playFinished = function (instance) {
		SoundChannel.remove(instance);
		var index = this.instances.indexOf(instance);
		if (index > -1) {
			this.instances.splice(index, 1);
		}
	}

	/**
	 * A function proxy for Sound methods. By default, JavaScript methods do not maintain scope, so passing a
	 * method as a callback will result in the method getting called in the scope of the caller. Using a proxy
	 * ensures that the method gets called in the correct scope.
	 * @method proxy
	 * @param {Function} method The function to call
	 * @param {Object} scope The scope to call the method name on
	 * @protected
	 * @static
	 * @deprecated Deprecated in favor of createjs.proxy.
	 */
	s.proxy = function (method, scope) {
		return function () {
			return method.apply(scope, arguments);
		}
	}

	createjs.Sound = Sound;

	/**
	 * A function proxy for Sound methods. By default, JavaScript methods do not maintain scope, so passing a
	 * method as a callback will result in the method getting called in the scope of the caller. Using a proxy
	 * ensures that the method gets called in the correct scope.
	 * Note arguments can be passed that will be applied to the function when it is called.
	 *
	 * <h4>Example<h4>
	 *     myObject.myCallback = createjs.proxy(myHandler, this, arg1, arg2);
	 *
	 * #method proxy
	 * @param {Function} method The function to call
	 * @param {Object} scope The scope to call the method name on
	 * @param {mixed} [arg] * Arguments that are appended to the callback for additional params.
	 * @protected
	 * @static
	 */
	createjs.proxy = function (method, scope) {
		var aArgs = Array.prototype.slice.call(arguments, 2);
		return function () {
			return method.apply(scope, Array.prototype.slice.call(arguments, 0).concat(aArgs));
		};
	}


	/**
	 * An internal class that manages the number of active {{#crossLink "SoundInstance"}}{{/crossLink}} instances for
	 * each sound type. This method is only used internally by the {{#crossLink "Sound"}}{{/crossLink}} class.
	 *
	 * The number of sounds is artificially limited by Sound in order to prevent over-saturation of a
	 * single sound, as well as to stay within hardware limitations, although the latter may disappear with better
	 * browser support.
	 *
	 * When a sound is played, this class ensures that there is an available instance, or interrupts an appropriate
	 * sound that is already playing.
	 * #class SoundChannel
	 * @param {String} src The source of the instances
	 * @param {Number} [max=1] The number of instances allowed
	 * @constructor
	 * @protected
	 */
	function SoundChannel(src, max) {
		this.init(src, max);
	}

	/* ------------
	 Static API
	 ------------ */
	/**
	 * A hash of channel instances indexed by source.
	 * #property channels
	 * @type {Object}
	 * @static
	 */
	SoundChannel.channels = {};

	/**
	 * Create a sound channel. Note that if the sound channel already exists, this will fail.
	 * #method create
	 * @param {String} src The source for the channel
	 * @param {Number} max The maximum amount this channel holds. The default is {{#crossLink "SoundChannel.maxDefault"}}{{/crossLink}}.
	 * @return {Boolean} If the channels were created.
	 * @static
	 */
	SoundChannel.create = function (src, max) {
		var channel = SoundChannel.get(src);
		//if (max == null) { max = -1; }  // no longer need this check
		if (channel == null) {
			SoundChannel.channels[src] = new SoundChannel(src, max);
			return true;
		}
		return false;
	}
	/**
	 * Add an instance to a sound channel.
	 * #method add
	 * @param {SoundInstance} instance The instance to add to the channel
	 * @param {String} interrupt The interrupt value to use. Please see the {{#crossLink "Sound/play"}}{{/crossLink}}
	 * for details on interrupt modes.
	 * @return {Boolean} The success of the method call. If the channel is full, it will return false.
	 * @static
	 */
	SoundChannel.add = function (instance, interrupt) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) {
			return false;
		}
		return channel.add(instance, interrupt);
	}
	/**
	 * Remove an instance from the channel.
	 * #method remove
	 * @param {SoundInstance} instance The instance to remove from the channel
	 * @return The success of the method call. If there is no channel, it will return false.
	 * @static
	 */
	SoundChannel.remove = function (instance) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) {
			return false;
		}
		channel.remove(instance);
		return true;
	}
	/**
	 * Get the maximum number of sounds you can have in a channel.
	 * #method
	 * @return {Number} The maximum number of sounds you can have in a channel.
	 */
	SoundChannel.maxPerChannel = function () {
		return p.maxDefault;
	}
	/**
	 * Get a channel instance by its src.
	 * #method get
	 * @param {String} src The src to use to look up the channel
	 * @static
	 */
	SoundChannel.get = function (src) {
		return SoundChannel.channels[src];
	}

	var p = SoundChannel.prototype = {

		/**
		 * The source of the channel.
		 * #property src
		 * @type {String}
		 */
		src:null,

		/**
		 * The maximum number of instances in this channel.  -1 indicates no limit
		 * #property max
		 * @type {Number}
		 */
		max:null,

		/**
		 * The default value to set for max, if it isn't passed in.  Also used if -1 is passed.
		 * #property maxDefault
		 * @type {Number}
		 * @default 100
		 * @since 0.4.0
		 */
		maxDefault:100,

		/**
		 * The current number of active instances.
		 * #property length
		 * @type {Number}
		 */
		length:0,

		/**
		 * Initialize the channel.
		 * #method init
		 * @param {String} src The source of the channel
		 * @param {Number} max The maximum number of instances in the channel
		 * @protected
		 */
		init:function (src, max) {
			this.src = src;
			this.max = max || this.maxDefault;
			if (this.max == -1) {
				this.max == this.maxDefault;
			}
			this.instances = [];
		},

		/**
		 * Get an instance by index.
		 * #method get
		 * @param {Number} index The index to return.
		 * @return {SoundInstance} The SoundInstance at a specific instance.
		 */
		get:function (index) {
			return this.instances[index];
		},

		/**
		 * Add a new instance to the channel.
		 * #method add
		 * @param {SoundInstance} instance The instance to add.
		 * @return {Boolean} The success of the method call. If the channel is full, it will return false.
		 */
		add:function (instance, interrupt) {
			if (!this.getSlot(interrupt, instance)) {
				return false;
			}
			;
			this.instances.push(instance);
			this.length++;
			return true;
		},

		/**
		 * Remove an instance from the channel, either when it has finished playing, or it has been interrupted.
		 * #method remove
		 * @param {SoundInstance} instance The instance to remove
		 * @return {Boolean} The success of the remove call. If the instance is not found in this channel, it will
		 * return false.
		 */
		remove:function (instance) {
			var index = this.instances.indexOf(instance);
			if (index == -1) {
				return false;
			}
			this.instances.splice(index, 1);
			this.length--;
			return true;
		},

		/**
		 * Get an available slot depending on interrupt value and if slots are available.
		 * #method getSlot
		 * @param {String} interrupt The interrupt value to use.
		 * @param {SoundInstance} instance The sound instance that will go in the channel if successful.
		 * @return {Boolean} Determines if there is an available slot. Depending on the interrupt mode, if there are no slots,
		 * an existing SoundInstance may be interrupted. If there are no slots, this method returns false.
		 */
		getSlot:function (interrupt, instance) {
			var target, replacement;

			for (var i = 0, l = this.max; i < l; i++) {
				target = this.get(i);

				// Available Space
				if (target == null) {
					return true;
				} else if (interrupt == Sound.INTERRUPT_NONE && target.playState != Sound.PLAY_FINISHED) {
					continue;
				}

				// First replacement candidate
				if (i == 0) {
					replacement = target;
					continue;
				}

				// Audio is complete or not playing
				if (target.playState == Sound.PLAY_FINISHED ||
						target.playState == Sound.PLAY_INTERRUPTED ||
						target.playState == Sound.PLAY_FAILED) {
					replacement = target;

					// Audio is a better candidate than the current target, according to playhead
				} else if (
						(interrupt == Sound.INTERRUPT_EARLY && target.getPosition() < replacement.getPosition()) ||
								(interrupt == Sound.INTERRUPT_LATE && target.getPosition() > replacement.getPosition())) {
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

		toString:function () {
			return "[Sound SoundChannel]";
		}

	}

	// do not add SoundChannel to namespace


	// This is a dummy sound instance, which allows Sound to return something so developers don't need to check nulls.
	function SoundInstance() {
		this.isDefault = true;
		this.addEventListener = this.removeEventListener = this.removeAllEventListener = this.dispatchEvent = this.hasEventListener = this._listeners = this.interrupt = this.playFailed = this.pause = this.resume = this.play = this.beginPlaying = this.cleanUp = this.stop = this.setMasterVolume = this.setVolume = this.mute = this.setMute = this.getMute = this.setPan = this.getPosition = this.setPosition = function () {
			return false;
		};
		this.getVolume = this.getPan = this.getDuration = function () {
			return 0;
		}
		this.playState = Sound.PLAY_FAILED;
		this.toString = function () {
			return "[Sound Default Sound Instance]";
		}
	}

	Sound.defaultSoundInstance = new SoundInstance();


	/**
	 * An additional module to determine the current browser, version, operating system, and other environment
	 * variables. It is not publically documented.
	 * #class BrowserDetect
	 * @param {Boolean} isFirefox True if our browser is Firefox.
	 * @param {Boolean} isOpera True if our browser is opera.
	 * @param {Boolean} isChrome True if our browser is Chrome.  Note that Chrome for Android returns true, but is a
	 * completely different browser with different abilities.
	 * @param {Boolean} isIOS True if our browser is safari for iOS devices (iPad, iPhone, and iPad).
	 * @param {Boolean} isAndroid True if our browser is Android.
	 * @param {Boolean} isBlackberry True if our browser is Blackberry.
	 * @constructor
	 * @static
	 */
	function BrowserDetect() {
	}

	BrowserDetect.init = function () {
		var agent = navigator.userAgent;
		BrowserDetect.isFirefox = (agent.indexOf("Firefox") > -1);
		BrowserDetect.isOpera = (window.opera != null);
		BrowserDetect.isChrome = (agent.indexOf("Chrome") > -1);  // NOTE that Chrome on Android returns true but is a completely different browser with different abilities
		BrowserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
		BrowserDetect.isAndroid = (agent.indexOf("Android") > -1);
		BrowserDetect.isBlackberry = (agent.indexOf("Blackberry") > -1);
	}

	BrowserDetect.init();

	createjs.Sound.BrowserDetect = BrowserDetect;


}());
