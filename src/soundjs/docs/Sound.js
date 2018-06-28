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
/**
 * The SoundJS library manages the playback of audio on the web. It works via plugins which abstract the actual audio
 * implementation, so playback is possible on any platform without specific knowledge of what mechanisms are necessary
 * to play sounds.
 *
 * To use SoundJS, use the public API on the {{#crossLink "Sound"}}{{/crossLink}} class. This API is for:
 * <ul>
 *      <li>Installing audio playback Plugins</li>
 *      <li>Registering (and preloading) sounds</li>
 *      <li>Creating and playing sounds</li>
 *      <li>Master volume, mute, and stop controls for all sounds at once</li>
 * </ul>
 *
 * <b>Controlling Sounds</b><br />
 * Playing sounds creates {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} instances, which can be controlled
 * individually.
 * <ul>
 *      <li>Pause, resume, seek, and stop sounds</li>
 *      <li>Control a sound's volume, mute, and pan</li>
 *      <li>Listen for events on sound instances to get notified when they finish, loop, or fail</li>
 * </ul>
 *
 * <h4>Example</h4>
 *
 *      createjs.Sound.alternateExtensions = ["mp3"];
 *      createjs.Sound.on("fileload", this.loadHandler, this);
 *      createjs.Sound.registerSound("path/to/mySound.ogg", "sound");
 *      function loadHandler(event) {
 *          // This is fired for each sound that is registered.
 *          var instance = createjs.Sound.play("sound");  // play using id.  Could also use full sourcepath or event.src.
 *          instance.on("complete", this.handleComplete, this);
 *          instance.volume = 0.5;
 *      }
 *
 * <h4>Browser Support</h4>
 * Audio will work in browsers which support Web Audio (<a href="http://caniuse.com/audio-api" target="_blank">http://caniuse.com/audio-api</a>)
 * or HTMLAudioElement (<a href="http://caniuse.com/audio" target="_blank">http://caniuse.com/audio</a>).
 * A Flash fallback can be used for any browser that supports the Flash player, and the Cordova plugin can be used in
 * any webview that supports <a href="http://plugins.cordova.io/#/package/org.apache.cordova.media" target="_blank">Cordova.Media</a>.
 * IE8 and earlier are not supported, even with the Flash fallback. To support earlier browsers, you can use an older
 * version of SoundJS (version 0.5.2 and earlier).
 *
 * @module SoundJS
 * @main SoundJS
 */
/**
 * The Sound class is the public API for creating sounds, controlling the overall sound levels, and managing plugins.
 * All Sound APIs on this class are static.
 *
 * <b>Registering and Preloading</b><br />
 * Before you can play a sound, it <b>must</b> be registered. You can do this with {{#crossLink "Sound/registerSound"}}{{/crossLink}},
 * or register multiple sounds using {{#crossLink "Sound/registerSounds"}}{{/crossLink}}. If you don't register a
 * sound prior to attempting to play it using {{#crossLink "Sound/play"}}{{/crossLink}} or create it using {{#crossLink "Sound/createInstance"}}{{/crossLink}},
 * the sound source will be automatically registered but playback will fail as the source will not be ready. If you use
 * <a href="http://preloadjs.com" target="_blank">PreloadJS</a>, registration is handled for you when the sound is
 * preloaded. It is recommended to preload sounds either internally using the register functions or externally using
 * PreloadJS so they are ready when you want to use them.
 *
 * <b>Playback</b><br />
 * To play a sound once it's been registered and preloaded, use the {{#crossLink "Sound/play"}}{{/crossLink}} method.
 * This method returns a {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} which can be paused, resumed, muted, etc.
 * Please see the {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} documentation for more on the instance control APIs.
 *
 * <b>Plugins</b><br />
 * By default, the {{#crossLink "WebAudioPlugin"}}{{/crossLink}} or the {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}
 * are used (when available), although developers can change plugin priority or add new plugins (such as the
 * provided {{#crossLink "FlashAudioPlugin"}}{{/crossLink}}). Please see the {{#crossLink "Sound"}}{{/crossLink}} API
 * methods for more on the playback and plugin APIs. To install plugins, or specify a different plugin order, see
 * {{#crossLink "Sound/installPlugins"}}{{/crossLink}}.
 *
 * <h4>Example</h4>
 *
 *      createjs.FlashAudioPlugin.swfPath = "../src/soundjs/flashaudio";
 *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashAudioPlugin]);
 *      createjs.Sound.alternateExtensions = ["mp3"];
 *      createjs.Sound.on("fileload", this.loadHandler, this);
 *      createjs.Sound.registerSound("path/to/mySound.ogg", "sound");
 *      function loadHandler(event) {
 *          // This is fired for each sound that is registered.
 *          var instance = createjs.Sound.play("sound");  // play using id.  Could also use full source path or event.src.
 *          instance.on("complete", this.handleComplete, this);
 *          instance.volume = 0.5;
 *      }
 *
 * The maximum number of concurrently playing instances of the same sound can be specified in the "data" argument
 * of {{#crossLink "Sound/registerSound"}}{{/crossLink}}.  Note that if not specified, the active plugin will apply
 * a default limit.  Currently HTMLAudioPlugin sets a default limit of 2, while WebAudioPlugin and FlashAudioPlugin set a
 * default limit of 100.
 *
 *      createjs.Sound.registerSound("sound.mp3", "soundId", 4);
 *
 * Sound can be used as a plugin with PreloadJS to help preload audio properly. Audio preloaded with PreloadJS is
 * automatically registered with the Sound class. When audio is not preloaded, Sound will do an automatic internal
 * load. As a result, it may fail to play the first time play is called if the audio is not finished loading. Use
 * the {{#crossLink "Sound/fileload:event"}}{{/crossLink}} event to determine when a sound has finished internally
 * preloading. It is recommended that all audio is preloaded before it is played.
 *
 *      var queue = new createjs.LoadQueue();
 *		queue.installPlugin(createjs.Sound);
 *
 * <b>Audio Sprites</b><br />
 * SoundJS has added support for {{#crossLink "AudioSprite"}}{{/crossLink}}, available as of version 0.6.0.
 * For those unfamiliar with audio sprites, they are much like CSS sprites or sprite sheets: multiple audio assets
 * grouped into a single file.
 *
 * <h4>Example</h4>
 *
 *		var assetsPath = "./assets/";
 *		var sounds = [{
 *			src:"MyAudioSprite.ogg", data: {
 *				audioSprite: [
 *					{id:"sound1", startTime:0, duration:500},
 *					{id:"sound2", startTime:1000, duration:400},
 *					{id:"sound3", startTime:1700, duration: 1000}
 *				]}
 *			}
 *		];
 *		createjs.Sound.alternateExtensions = ["mp3"];
 *		createjs.Sound.on("fileload", loadSound);
 *		createjs.Sound.registerSounds(sounds, assetsPath);
 *		// after load is complete
 *		createjs.Sound.play("sound2");
 *
 * <b>Mobile Playback</b><br />
 * Devices running iOS require the WebAudio context to be "unlocked" by playing at least one sound inside of a user-
 * initiated event (such as touch/click). Earlier versions of SoundJS included a "MobileSafe" sample, but this is no
 * longer necessary as of SoundJS 0.6.2.
 * <ul>
 *     <li>
 *         In SoundJS 0.4.1 and above, you can either initialize plugins or use the {{#crossLink "WebAudioPlugin/playEmptySound"}}{{/crossLink}}
 *         method in the call stack of a user input event to manually unlock the audio context.
 *     </li>
 *     <li>
 *         In SoundJS 0.6.2 and above, SoundJS will automatically listen for the first document-level "mousedown"
 *         and "touchend" event, and unlock WebAudio. This will continue to check these events until the WebAudio
 *         context becomes "unlocked" (changes from "suspended" to "running")
 *     </li>
 *     <li>
 *         Both the "mousedown" and "touchend" events can be used to unlock audio in iOS9+, the "touchstart" event
 *         will work in iOS8 and below. The "touchend" event will only work in iOS9 when the gesture is interpreted
 *         as a "click", so if the user long-presses the button, it will no longer work.
 *     </li>
 *     <li>
 *         When using the <a href="http://www.createjs.com/docs/easeljs/classes/Touch.html">EaselJS Touch class</a>,
 *         the "mousedown" event will not fire when a canvas is clicked, since MouseEvents are prevented, to ensure
 *         only touch events fire. To get around this, you can either rely on "touchend", or:
 *         <ol>
 *             <li>Set the `allowDefault` property on the Touch class constructor to `true` (defaults to `false`).</li>
 *             <li>Set the `preventSelection` property on the EaselJS `Stage` to `false`.</li>
 *         </ol>
 *         These settings may change how your application behaves, and are not recommended.
 *     </li>
 * </ul>
 *
 * <b>Loading Alternate Paths and Extension-less Files</b><br />
 * SoundJS supports loading alternate paths and extension-less files by passing an object instead of a string for
 * the `src` property, which is a hash using the format `{extension:"path", extension2:"path2"}`. These labels are
 * how SoundJS determines if the browser will support the sound. This also enables multiple formats to live in
 * different folders, or on CDNs, which often has completely different filenames for each file.
 *
 * Priority is determined by the property order (first property is tried first).  This is supported by both internal loading
 * and loading with PreloadJS.
 *
 * <em>Note: an id is required for playback.</em>
 *
 * <h4>Example</h4>
 *
 *		var sounds = {path:"./audioPath/",
 * 				manifest: [
 *				{id: "cool", src: {mp3:"mp3/awesome.mp3", ogg:"noExtensionOggFile"}}
 *		]};
 *
 *		createjs.Sound.alternateExtensions = ["mp3"];
 *		createjs.Sound.addEventListener("fileload", handleLoad);
 *		createjs.Sound.registerSounds(sounds);
 *
 * <h3>Known Browser and OS issues</h3>
 * <b>IE 9 HTML Audio limitations</b><br />
 * <ul><li>There is a delay in applying volume changes to tags that occurs once playback is started. So if you have
 * muted all sounds, they will all play during this delay until the mute applies internally. This happens regardless of
 * when or how you apply the volume change, as the tag seems to need to play to apply it.</li>
 * <li>MP3 encoding will not always work for audio tags, particularly in Internet Explorer. We've found default
 * encoding with 64kbps works.</li>
 * <li>Occasionally very short samples will get cut off.</li>
 * <li>There is a limit to how many audio tags you can load and play at once, which appears to be determined by
 * hardware and browser settings.  See {{#crossLink "HTMLAudioPlugin.MAX_INSTANCES"}}{{/crossLink}} for a safe
 * estimate.</li></ul>
 *
 * <b>Firefox 25 Web Audio limitations</b>
 * <ul><li>mp3 audio files do not load properly on all windows machines, reported
 * <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=929969" target="_blank">here</a>. </br>
 * For this reason it is recommended to pass another FF supported type (ie ogg) first until this bug is resolved, if
 * possible.</li></ul>
 
 * <b>Safari limitations</b><br />
 * <ul><li>Safari requires Quicktime to be installed for audio playback.</li></ul>
 *
 * <b>iOS 6 Web Audio limitations</b><br />
 * <ul><li>Sound is initially locked, and must be unlocked via a user-initiated event. Please see the section on
 * Mobile Playback above.</li>
 * <li>A bug exists that will distort un-cached web audio when a video element is present in the DOM that has audio
 * at a different sampleRate.</li>
 * </ul>
 *
 * <b>Android HTML Audio limitations</b><br />
 * <ul><li>We have no control over audio volume. Only the user can set volume on their device.</li>
 * <li>We can only play audio inside a user event (touch/click).  This currently means you cannot loop sound or use
 * a delay.</li></ul>
 *
 * <b>Web Audio and PreloadJS</b><br />
 * <ul><li>Web Audio must be loaded through XHR, therefore when used with PreloadJS, tag loading is not possible.
 * This means that tag loading can not be used to avoid cross domain issues.</li><ul>
 *
 * @class Sound
 * @static
 * @uses EventDispatcher
 */
/**
 * The interrupt value to interrupt any currently playing instance with the same source, if the maximum number of
 * instances of the sound are already playing.
 * @property INTERRUPT_ANY
 * @type {String}
 * @default any
 * @static
 */
/**
 * The interrupt value to interrupt the earliest currently playing instance with the same source that progressed the
 * least distance in the audio track, if the maximum number of instances of the sound are already playing.
 * @property INTERRUPT_EARLY
 * @type {String}
 * @default early
 * @static
 */
/**
 * The interrupt value to interrupt the currently playing instance with the same source that progressed the most
 * distance in the audio track, if the maximum number of instances of the sound are already playing.
 * @property INTERRUPT_LATE
 * @type {String}
 * @default late
 * @static
 */
/**
 * The interrupt value to not interrupt any currently playing instances with the same source, if the maximum number of
 * instances of the sound are already playing.
 * @property INTERRUPT_NONE
 * @type {String}
 * @default none
 * @static
 */
/**
 * Defines the playState of an instance that is still initializing.
 * @property PLAY_INITED
 * @type {String}
 * @default playInited
 * @static
 */
/**
 * Defines the playState of an instance that is currently playing or paused.
 * @property PLAY_SUCCEEDED
 * @type {String}
 * @default playSucceeded
 * @static
 */
/**
 * Defines the playState of an instance that was interrupted by another instance.
 * @property PLAY_INTERRUPTED
 * @type {String}
 * @default playInterrupted
 * @static
 */
/**
 * Defines the playState of an instance that completed playback.
 * @property PLAY_FINISHED
 * @type {String}
 * @default playFinished
 * @static
 */
/**
 * Defines the playState of an instance that failed to play. This is usually caused by a lack of available channels
 * when the interrupt mode was "INTERRUPT_NONE", the playback stalled, or the sound could not be found.
 * @property PLAY_FAILED
 * @type {String}
 * @default playFailed
 * @static
 */
/**
 * A list of the default supported extensions that Sound will <i>try</i> to play. Plugins will check if the browser
 * can play these types, so modifying this list before a plugin is initialized will allow the plugins to try to
 * support additional media types.
 *
 * NOTE this does not currently work for {{#crossLink "FlashAudioPlugin"}}{{/crossLink}}.
 *
 * More details on file formats can be found at <a href="http://en.wikipedia.org/wiki/Audio_file_format" target="_blank">http://en.wikipedia.org/wiki/Audio_file_format</a>.<br />
 * A very detailed list of file formats can be found at <a href="http://www.fileinfo.com/filetypes/audio" target="_blank">http://www.fileinfo.com/filetypes/audio</a>.
 * @property SUPPORTED_EXTENSIONS
 * @type {Array[String]}
 * @default ["mp3", "ogg", "opus", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"]
 * @since 0.4.0
 * @static
 */
/**
 * Some extensions use another type of extension support to play (one of them is a codex).  This allows you to map
 * that support so plugins can accurately determine if an extension is supported.  Adding to this list can help
 * plugins determine more accurately if an extension is supported.
 *
 * A useful list of extensions for each format can be found at <a href="http://html5doctor.com/html5-audio-the-state-of-play/" target="_blank">http://html5doctor.com/html5-audio-the-state-of-play/</a>.
 * @property EXTENSION_MAP
 * @type {Object}
 * @since 0.4.0
 * @default {m4a:"mp4"}
 * @static
 */
/**
 * The RegExp pattern used to parse file URIs. This supports simple file names, as well as full domain URIs with
 * query strings. The resulting match is: protocol:$1 domain:$2 path:$3 file:$4 extension:$5 query:$6.
 * @property FILE_PATTERN
 * @type {RegExp}
 * @static
 * @private
 */
/**
 * Determines the default behavior for interrupting other currently playing instances with the same source, if the
 * maximum number of instances of the sound are already playing.  Currently the default is {{#crossLink "Sound/INTERRUPT_NONE:property"}}{{/crossLink}}
 * but this can be set and will change playback behavior accordingly.  This is only used when {{#crossLink "Sound/play"}}{{/crossLink}}
 * is called without passing a value for interrupt.
 * @property defaultInterruptBehavior
 * @type {String}
 * @default Sound.INTERRUPT_NONE, or "none"
 * @static
 * @since 0.4.0
 */
/**
 * An array of extensions to attempt to use when loading sound, if the default is unsupported by the active plugin.
 * These are applied in order, so if you try to Load Thunder.ogg in a browser that does not support ogg, and your
 * extensions array is ["mp3", "m4a", "wav"] it will check mp3 support, then m4a, then wav. The audio files need
 * to exist in the same location, as only the extension is altered.
 *
 * Note that regardless of which file is loaded, you can call {{#crossLink "Sound/createInstance"}}{{/crossLink}}
 * and {{#crossLink "Sound/play"}}{{/crossLink}} using the same id or full source path passed for loading.
 *
 * <h4>Example</h4>
 *
 *	var sounds = [
 *		{src:"myPath/mySound.ogg", id:"example"},
 *	];
 *	createjs.Sound.alternateExtensions = ["mp3"]; // now if ogg is not supported, SoundJS will try asset0.mp3
 *	createjs.Sound.on("fileload", handleLoad); // call handleLoad when each sound loads
 *	createjs.Sound.registerSounds(sounds, assetPath);
 *	// ...
 *	createjs.Sound.play("myPath/mySound.ogg"); // works regardless of what extension is supported.  Note calling with ID is a better approach
 *
 * @property alternateExtensions
 * @type {Array}
 * @since 0.5.2
 * @static
 */
/**
 * The currently active plugin. If this is null, then no plugin could be initialized. If no plugin was specified,
 * Sound attempts to apply the default plugins: {{#crossLink "WebAudioPlugin"}}{{/crossLink}}, followed by
 * {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}.
 * @property activePlugin
 * @type {Object}
 * @static
 */
/**
 * Set the master volume of Sound. The master volume is multiplied against each sound's individual volume.  For
 * example, if master volume is 0.5 and a sound's volume is 0.5, the resulting volume is 0.25. To set individual
 * sound volume, use AbstractSoundInstance {{#crossLink "AbstractSoundInstance/volume:property"}}{{/crossLink}}
 * instead.
 *
 * <h4>Example</h4>
 *
 *     createjs.Sound.volume = 0.5;
 *
 * @property volume
 * @type {Number}
 * @default 1
 * @static
 * @since 0.6.1
 */
/**
 * The internal volume level. Use {{#crossLink "Sound/volume:property"}}{{/crossLink}} to adjust the master volume.
 * @property _masterVolume
 * @type {number}
 * @default 1
 * @private
 */
/**
 * Use the {{#crossLink "Sound/volume:property"}}{{/crossLink}} property instead.
 * @method _getMasterVolume
 * @private
 * @static
 * @return {Number}
 **/
/**
 * @method getMasterVolume
 * @deprecated Use the {{#crossLink "Sound/volume:property"}}{{/crossLink}} property instead.
 */
/**
 * Use the {{#crossLink "Sound/volume:property"}}{{/crossLink}} property instead.
 * @method _setMasterVolume
 * @static
 * @private
 **/
/**
 * @method setVolume
 * @deprecated Use the {{#crossLink "Sound/volume:property"}}{{/crossLink}} property instead.
 */
/**
 * Mute/Unmute all audio. Note that muted audio still plays at 0 volume. This global mute value is maintained
 * separately and when set will override, but not change the mute property of individual instances. To mute an individual
 * instance, use AbstractSoundInstance {{#crossLink "AbstractSoundInstance/muted:property"}}{{/crossLink}} instead.
 *
 * <h4>Example</h4>
 *
 *     createjs.Sound.muted = true;
 *
 *
 * @property muted
 * @type {Boolean}
 * @default false
 * @static
 * @since 0.6.1
 */
/**
 * Use the {{#crossLink "Sound/muted:property"}}{{/crossLink}} property instead.
 * @method _getMute
 * @returns {Boolean}
 * @static
 * @private
 */
/**
 * @method getMute
 * @deprecated Use the {{#crossLink "Sound/muted:property"}}{{/crossLink}} property instead.
 */
/**
 * Use the {{#crossLink "Sound/muted:property"}}{{/crossLink}} property instead.
 * @method _setMute
 * @param {Boolean} value The muted value
 * @static
 * @private
 */
/**
 * @method setMute
 * @deprecated Use the {{#crossLink "Sound/muted:property"}}{{/crossLink}} property instead.
 */
/**
 * Get the active plugins capabilities, which help determine if a plugin can be used in the current environment,
 * or if the plugin supports a specific feature. Capabilities include:
 * <ul>
 *     <li><b>panning:</b> If the plugin can pan audio from left to right</li>
 *     <li><b>volume;</b> If the plugin can control audio volume.</li>
 *     <li><b>tracks:</b> The maximum number of audio tracks that can be played back at a time. This will be -1
 *     if there is no known limit.</li>
 * <br />An entry for each file type in {{#crossLink "Sound/SUPPORTED_EXTENSIONS:property"}}{{/crossLink}}:
 *     <li><b>mp3:</b> If MP3 audio is supported.</li>
 *     <li><b>ogg:</b> If OGG audio is supported.</li>
 *     <li><b>wav:</b> If WAV audio is supported.</li>
 *     <li><b>mpeg:</b> If MPEG audio is supported.</li>
 *     <li><b>m4a:</b> If M4A audio is supported.</li>
 *     <li><b>mp4:</b> If MP4 audio is supported.</li>
 *     <li><b>aiff:</b> If aiff audio is supported.</li>
 *     <li><b>wma:</b> If wma audio is supported.</li>
 *     <li><b>mid:</b> If mid audio is supported.</li>
 * </ul>
 *
 * You can get a specific capability of the active plugin using standard object notation
 *
 * <h4>Example</h4>
 *
 *      var mp3 = createjs.Sound.capabilities.mp3;
 *
 * Note this property is read only.
 *
 * @property capabilities
 * @type {Object}
 * @static
 * @readOnly
 * @since 0.6.1
 */
/**
 * Use the {{#crossLink "Sound/capabilities:property"}}{{/crossLink}} property instead.
 * @returns {null}
 * @private
 */
/**
 * @method getCapabilities
 * @deprecated Use the {{#crossLink "Sound/capabilities:property"}}{{/crossLink}} property instead.
 */
/**
 * Determines if the plugins have been registered. If false, the first call to {{#crossLink "play"}}{{/crossLink}} will instantiate the default
 * plugins ({{#crossLink "WebAudioPlugin"}}{{/crossLink}}, followed by {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}).
 * If plugins have been registered, but none are applicable, then sound playback will fail.
 * @property _pluginsRegistered
 * @type {Boolean}
 * @default false
 * @static
 * @private
 */
/**
 * Used internally to assign unique IDs to each AbstractSoundInstance.
 * @property _lastID
 * @type {Number}
 * @static
 * @private
 */
/**
 * An array containing all currently playing instances. This allows Sound to control the volume, mute, and playback of
 * all instances when using static APIs like {{#crossLink "Sound/stop"}}{{/crossLink}} and {{#crossLink "Sound/volume:property"}}{{/crossLink}}.
 * When an instance has finished playback, it gets removed via the {{#crossLink "Sound/finishedPlaying"}}{{/crossLink}}
 * method. If the user replays an instance, it gets added back in via the {{#crossLink "Sound/_beginPlaying"}}{{/crossLink}}
 * method.
 * @property _instances
 * @type {Array}
 * @private
 * @static
 */
/**
 * An object hash storing objects with sound sources, startTime, and duration via there corresponding ID.
 * @property _idHash
 * @type {Object}
 * @private
 * @static
 */
/**
 * An object hash that stores preloading sound sources via the parsed source that is passed to the plugin.  Contains the
 * source, id, and data that was passed in by the user.  Parsed sources can contain multiple instances of source, id,
 * and data.
 * @property _preloadHash
 * @type {Object}
 * @private
 * @static
 */
/**
 * An object hash storing {{#crossLink "PlayPropsConfig"}}{{/crossLink}} via the parsed source that is passed as defaultPlayProps in
 * {{#crossLink "Sound/registerSound"}}{{/crossLink}} and {{#crossLink "Sound/registerSounds"}}{{/crossLink}}.
 * @property _defaultPlayPropsHash
 * @type {Object}
 * @private
 * @static
 * @since 0.6.1
 */
/**
 * This event is fired when a file finishes loading internally. This event is fired for each loaded sound,
 * so any handler methods should look up the <code>event.src</code> to handle a particular sound.
 * @event fileload
 * @param {Object} target The object that dispatched the event.
 * @param {String} type The event type.
 * @param {String} src The source of the sound that was loaded.
 * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
 * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
 * @since 0.4.1
 */
/**
 * This event is fired when a file fails loading internally. This event is fired for each loaded sound,
 * so any handler methods should look up the <code>event.src</code> to handle a particular sound.
 * @event fileerror
 * @param {Object} target The object that dispatched the event.
 * @param {String} type The event type.
 * @param {String} src The source of the sound that was loaded.
 * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
 * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
 * @since 0.6.0
 */
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
 *      <li>extensions: A list of file extensions that are supported by Sound (see {{#crossLink "Sound/SUPPORTED_EXTENSIONS:property"}}{{/crossLink}}).</li></ul>
 * @static
 * @private
 */
/**
 * Used to dispatch fileload events from internal loading.
 * @method _handleLoadComplete
 * @param event A loader event.
 * @private
 * @static
 * @since 0.6.0
 */
/**
 * Used to dispatch error events from internal preloading.
 * @param event
 * @private
 * @since 0.6.0
 * @static
 */
/**
 * Used by {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} to register a Sound plugin.
 *
 * @method _registerPlugin
 * @param {Object} plugin The plugin class to install.
 * @return {Boolean} Whether the plugin was successfully initialized.
 * @static
 * @private
 */
/**
 * Register a list of Sound plugins, in order of precedence. To register a single plugin, pass a single element in the array.
 *
 * <h4>Example</h4>
 *
 *      createjs.FlashAudioPlugin.swfPath = "../src/soundjs/flashaudio/";
 *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin]);
 *
 * @method registerPlugins
 * @param {Array} plugins An array of plugins classes to install.
 * @return {Boolean} Whether a plugin was successfully initialized.
 * @static
 */
/**
 * Initialize the default plugins. This method is automatically called when any audio is played or registered before
 * the user has manually registered plugins, and enables Sound to work without manual plugin setup. Currently, the
 * default plugins are {{#crossLink "WebAudioPlugin"}}{{/crossLink}} followed by {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}.
 *
 * <h4>Example</h4>
 *
 * 	if (!createjs.initializeDefaultPlugins()) { return; }
 *
 * @method initializeDefaultPlugins
 * @returns {Boolean} True if a plugin was initialized, false otherwise.
 * @since 0.4.0
 * @static
 */
/**
 * Determines if Sound has been initialized, and a plugin has been activated.
 *
 * <h4>Example</h4>
 * This example sets up a Flash fallback, but only if there is no plugin specified yet.
 *
 * 	if (!createjs.Sound.isReady()) {
 *		createjs.FlashAudioPlugin.swfPath = "../src/soundjs/flashaudio/";
    * 		createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin]);
    *	}
    *
    * @method isReady
    * @return {Boolean} If Sound has initialized a plugin.
    * @static
    */
/**
 * Process manifest items from <a href="http://preloadjs.com" target="_blank">PreloadJS</a>. This method is intended
 * for usage by a plugin, and not for direct interaction.
 * @method initLoad
 * @param {Object} src The object to load.
 * @return {Object|AbstractLoader} An instance of AbstractLoader.
 * @private
 * @static
 */
/**
 * Internal method for loading sounds.  This should not be called directly.
 *
 * @method _registerSound
 * @param {Object} src The object to load, containing src property and optionally containing id and data.
 * @return {Object} An object with the modified values that were passed in, which defines the sound.
 * Returns false if the source cannot be parsed or no plugins can be initialized.
 * Returns true if the source is already loaded.
 * @static
 * @private
 * @since 0.6.0
 */
/**
 * Register an audio file for loading and future playback in Sound. This is automatically called when using
 * <a href="http://preloadjs.com" target="_blank">PreloadJS</a>.  It is recommended to register all sounds that
 * need to be played back in order to properly prepare and preload them. Sound does internal preloading when required.
 *
 * <h4>Example</h4>
 *
 *      createjs.Sound.alternateExtensions = ["mp3"];
 *      createjs.Sound.on("fileload", handleLoad); // add an event listener for when load is completed
 *      createjs.Sound.registerSound("myAudioPath/mySound.ogg", "myID", 3);
 *      createjs.Sound.registerSound({ogg:"path1/mySound.ogg", mp3:"path2/mySoundNoExtension"}, "myID", 3);
 *
 *
 * @method registerSound
 * @param {String | Object} src The source or an Object with a "src" property or an Object with multiple extension labeled src properties.
 * @param {String} [id] An id specified by the user to play the sound later.  Note id is required for when src is multiple extension labeled src properties.
 * @param {Number | Object} [data] Data associated with the item. Sound uses the data parameter as the number of
 * channels for an audio instance, however a "channels" property can be appended to the data object if it is used
 * for other information. The audio channels will set a default based on plugin if no value is found.
 * Sound also uses the data property to hold an {{#crossLink "AudioSprite"}}{{/crossLink}} array of objects in the following format {id, startTime, duration}.<br/>
 *   id used to play the sound later, in the same manner as a sound src with an id.<br/>
 *   startTime is the initial offset to start playback and loop from, in milliseconds.<br/>
 *   duration is the amount of time to play the clip for, in milliseconds.<br/>
 * This allows Sound to support audio sprites that are played back by id.
 * @param {string} basePath Set a path that will be prepended to src for loading.
 * @param {Object | PlayPropsConfig} defaultPlayProps Optional Playback properties that will be set as the defaults on any new AbstractSoundInstance.
 * See {{#crossLink "PlayPropsConfig"}}{{/crossLink}} for options.
 * @return {Object} An object with the modified values that were passed in, which defines the sound.
 * Returns false if the source cannot be parsed or no plugins can be initialized.
 * Returns true if the source is already loaded.
 * @static
 * @since 0.4.0
 */
/**
 * Register an array of audio files for loading and future playback in Sound. It is recommended to register all
 * sounds that need to be played back in order to properly prepare and preload them. Sound does internal preloading
 * when required.
 *
 * <h4>Example</h4>
 *
 * 		var assetPath = "./myAudioPath/";
 *      var sounds = [
 *          {src:"asset0.ogg", id:"example"},
 *          {src:"asset1.ogg", id:"1", data:6},
 *          {src:"asset2.mp3", id:"works"}
 *          {src:{mp3:"path1/asset3.mp3", ogg:"path2/asset3NoExtension"}, id:"better"}
 *      ];
 *      createjs.Sound.alternateExtensions = ["mp3"];	// if the passed extension is not supported, try this extension
 *      createjs.Sound.on("fileload", handleLoad); // call handleLoad when each sound loads
 *      createjs.Sound.registerSounds(sounds, assetPath);
 *
 * @method registerSounds
 * @param {Array} sounds An array of objects to load. Objects are expected to be in the format needed for
 * {{#crossLink "Sound/registerSound"}}{{/crossLink}}: <code>{src:srcURI, id:ID, data:Data}</code>
 * with "id" and "data" being optional.
 * You can also pass an object with path and manifest properties, where path is a basePath and manifest is an array of objects to load.
 * Note id is required if src is an object with extension labeled src properties.
 * @param {string} basePath Set a path that will be prepended to each src when loading.  When creating, playing, or removing
 * audio that was loaded with a basePath by src, the basePath must be included.
 * @return {Object} An array of objects with the modified values that were passed in, which defines each sound.
 * Like registerSound, it will return false for any values when the source cannot be parsed or if no plugins can be initialized.
 * Also, it will return true for any values when the source is already loaded.
 * @static
 * @since 0.6.0
 */
/**
 * Remove a sound that has been registered with {{#crossLink "Sound/registerSound"}}{{/crossLink}} or
 * {{#crossLink "Sound/registerSounds"}}{{/crossLink}}.
 * <br />Note this will stop playback on active instances playing this sound before deleting them.
 * <br />Note if you passed in a basePath, you need to pass it or prepend it to the src here.
 *
 * <h4>Example</h4>
 *
 *      createjs.Sound.removeSound("myID");
 *      createjs.Sound.removeSound("myAudioBasePath/mySound.ogg");
 *      createjs.Sound.removeSound("myPath/myOtherSound.mp3", "myBasePath/");
 *      createjs.Sound.removeSound({mp3:"musicNoExtension", ogg:"music.ogg"}, "myBasePath/");
 *
 * @method removeSound
 * @param {String | Object} src The src or ID of the audio, or an Object with a "src" property, or an Object with multiple extension labeled src properties.
 * @param {string} basePath Set a path that will be prepended to each src when removing.
 * @return {Boolean} True if sound is successfully removed.
 * @static
 * @since 0.4.1
 */
/**
 * Remove an array of audio files that have been registered with {{#crossLink "Sound/registerSound"}}{{/crossLink}} or
 * {{#crossLink "Sound/registerSounds"}}{{/crossLink}}.
 * <br />Note this will stop playback on active instances playing this audio before deleting them.
 * <br />Note if you passed in a basePath, you need to pass it or prepend it to the src here.
 *
 * <h4>Example</h4>
 *
 * 		assetPath = "./myPath/";
 *      var sounds = [
 *          {src:"asset0.ogg", id:"example"},
 *          {src:"asset1.ogg", id:"1", data:6},
 *          {src:"asset2.mp3", id:"works"}
 *      ];
 *      createjs.Sound.removeSounds(sounds, assetPath);
 *
 * @method removeSounds
 * @param {Array} sounds An array of objects to remove. Objects are expected to be in the format needed for
 * {{#crossLink "Sound/removeSound"}}{{/crossLink}}: <code>{srcOrID:srcURIorID}</code>.
 * You can also pass an object with path and manifest properties, where path is a basePath and manifest is an array of objects to remove.
 * @param {string} basePath Set a path that will be prepended to each src when removing.
 * @return {Object} An array of Boolean values representing if the sounds with the same array index were
 * successfully removed.
 * @static
 * @since 0.4.1
 */
/**
 * Remove all sounds that have been registered with {{#crossLink "Sound/registerSound"}}{{/crossLink}} or
 * {{#crossLink "Sound/registerSounds"}}{{/crossLink}}.
 * <br />Note this will stop playback on all active sound instances before deleting them.
 *
 * <h4>Example</h4>
 *
 *     createjs.Sound.removeAllSounds();
 *
 * @method removeAllSounds
 * @static
 * @since 0.4.1
 */
/**
 * Check if a source has been loaded by internal preloaders. This is necessary to ensure that sounds that are
 * not completed preloading will not kick off a new internal preload if they are played.
 *
 * <h4>Example</h4>
 *
 *     var mySound = "assetPath/asset0.ogg";
 *     if(createjs.Sound.loadComplete(mySound) {
 *         createjs.Sound.play(mySound);
 *     }
 *
 * @method loadComplete
 * @param {String} src The src or id that is being loaded.
 * @return {Boolean} If the src is already loaded.
 * @since 0.4.0
 * @static
 */
/**
 * Parse the path of a sound. Alternate extensions will be attempted in order if the
 * current extension is not supported
 * @method _parsePath
 * @param {String} value The path to an audio source.
 * @return {Object} A formatted object that can be registered with the {{#crossLink "Sound/activePlugin:property"}}{{/crossLink}}
 * and returned to a preloader like <a href="http://preloadjs.com" target="_blank">PreloadJS</a>.
 * @private
 * @static
 */
/**
 * Parse the path of a sound based on properties of src matching with supported extensions.
 * Returns false if none of the properties are supported
 * @method _parseSrc
 * @param {Object} value The paths to an audio source, indexed by extension type.
 * @return {Object} A formatted object that can be registered with the {{#crossLink "Sound/activePlugin:property"}}{{/crossLink}}
 * and returned to a preloader like <a href="http://preloadjs.com" target="_blank">PreloadJS</a>.
 * @private
 * @static
 */
/* ---------------
    Static API.
    --------------- */
/**
 * Play a sound and get a {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} to control. If the sound fails to
 * play, an AbstractSoundInstance will still be returned, and have a playState of {{#crossLink "Sound/PLAY_FAILED:property"}}{{/crossLink}}.
 * Note that even on sounds with failed playback, you may still be able to call the {{#crossLink "AbstractSoundInstance/play"}}{{/crossLink}},
 * method, since the failure could be due to lack of available channels. If the src does not have a supported
 * extension or if there is no available plugin, a default AbstractSoundInstance will still be returned, which will
 * not play any audio, but will not generate errors.
 *
 * <h4>Example</h4>
 *
 *      createjs.Sound.on("fileload", handleLoad);
 *      createjs.Sound.registerSound("myAudioPath/mySound.mp3", "myID", 3);
 *      function handleLoad(event) {
 *      	createjs.Sound.play("myID");
 *      	// store off AbstractSoundInstance for controlling
 *      	var myInstance = createjs.Sound.play("myID", {interrupt: createjs.Sound.INTERRUPT_ANY, loop:-1});
 *      }
 *
 * NOTE: To create an audio sprite that has not already been registered, both startTime and duration need to be set.
 * This is only when creating a new audio sprite, not when playing using the id of an already registered audio sprite.
 *
 * @method play
 * @param {String} src The src or ID of the audio.
 * @param {Object | PlayPropsConfig} props A PlayPropsConfig instance, or an object that contains the parameters to
 * play a sound. See the {{#crossLink "PlayPropsConfig"}}{{/crossLink}} for more info.
 * @return {AbstractSoundInstance} A {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} that can be controlled
 * after it is created.
 * @static
 */
/**
 * Creates a {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} using the passed in src. If the src does not have a
 * supported extension or if there is no available plugin, a default AbstractSoundInstance will be returned that can be
 * called safely but does nothing.
 *
 * <h4>Example</h4>
 *
 *      var myInstance = null;
 *      createjs.Sound.on("fileload", handleLoad);
 *      createjs.Sound.registerSound("myAudioPath/mySound.mp3", "myID", 3);
 *      function handleLoad(event) {
 *      	myInstance = createjs.Sound.createInstance("myID");
 *      	// alternately we could call the following
 *      	myInstance = createjs.Sound.createInstance("myAudioPath/mySound.mp3");
 *      }
 *
 * NOTE to create an audio sprite that has not already been registered, both startTime and duration need to be set.
 * This is only when creating a new audio sprite, not when playing using the id of an already registered audio sprite.
 *
 * @method createInstance
 * @param {String} src The src or ID of the audio.
 * @param {Number} [startTime=null] To create an audio sprite (with duration), the initial offset to start playback and loop from, in milliseconds.
 * @param {Number} [duration=null] To create an audio sprite (with startTime), the amount of time to play the clip for, in milliseconds.
 * @return {AbstractSoundInstance} A {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} that can be controlled after it is created.
 * Unsupported extensions will return the default AbstractSoundInstance.
 * @since 0.4.0
 * @static
 */
/**
 * Stop all audio (global stop). Stopped audio is reset, and not paused. To play audio that has been stopped,
 * call AbstractSoundInstance {{#crossLink "AbstractSoundInstance/play"}}{{/crossLink}}.
 *
 * <h4>Example</h4>
 *
 *     createjs.Sound.stop();
 *
 * @method stop
 * @static
 */
/**
 * Set the default playback properties for all new SoundInstances of the passed in src or ID.
 * See {{#crossLink "PlayPropsConfig"}}{{/crossLink}} for available properties.
 *
 * @method setDefaultPlayProps
 * @param {String} src The src or ID used to register the audio.
 * @param {Object | PlayPropsConfig} playProps The playback properties you would like to set.
 * @since 0.6.1
 */
/**
 * Get the default playback properties for the passed in src or ID.  These properties are applied to all
 * new SoundInstances.  Returns null if default does not exist.
 *
 * @method getDefaultPlayProps
 * @param {String} src The src or ID used to register the audio.
 * @returns {PlayPropsConfig} returns an existing PlayPropsConfig or null if one does not exist
 * @since 0.6.1
 */
/* ---------------
    Internal methods
    --------------- */
/**
 * Play an instance. This is called by the static API, as well as from plugins. This allows the core class to
 * control delays.
 * @method _playInstance
 * @param {AbstractSoundInstance} instance The {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} to start playing.
 * @param {PlayPropsConfig} playProps A PlayPropsConfig object.
 * @return {Boolean} If the sound can start playing. Sounds that fail immediately will return false. Sounds that
 * have a delay will return true, but may still fail to play.
 * @private
 * @static
 */
/**
 * Begin playback. This is called immediately or after delay by {{#crossLink "Sound/playInstance"}}{{/crossLink}}.
 * @method _beginPlaying
 * @param {AbstractSoundInstance} instance A {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} to begin playback.
 * @param {PlayPropsConfig} playProps A PlayPropsConfig object.
 * @return {Boolean} If the sound can start playing. If there are no available channels, or the instance fails to
 * start, this will return false.
 * @private
 * @static
 */
/**
 * Get the source of a sound via the ID passed in with a register call. If no ID is found the value is returned
 * instead.
 * @method _getSrcById
 * @param {String} value The ID the sound was registered with.
 * @return {String} The source of the sound if it has been registered with this ID or the value that was passed in.
 * @private
 * @static
 */
/**
 * A sound has completed playback, been interrupted, failed, or been stopped. This method removes the instance from
 * Sound management. It will be added again, if the sound re-plays. Note that this method is called from the
 * instances themselves.
 * @method _playFinished
 * @param {AbstractSoundInstance} instance The instance that finished playback.
 * @private
 * @static
 */
/**
 * An internal class that manages the number of active {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} instances for
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
/* ------------
    Static API
    ------------ */
/**
 * A hash of channel instances indexed by source.
 * #property channels
 * @type {Object}
 * @static
 */
/**
 * Create a sound channel. Note that if the sound channel already exists, this will fail.
 * #method create
 * @param {String} src The source for the channel
 * @param {Number} max The maximum amount this channel holds. The default is {{#crossLink "SoundChannel.maxDefault"}}{{/crossLink}}.
 * @return {Boolean} If the channels were created.
 * @static
 */
/**
 * Delete a sound channel, stop and delete all related instances. Note that if the sound channel does not exist, this will fail.
 * #method remove
 * @param {String} src The source for the channel
 * @return {Boolean} If the channels were deleted.
 * @static
 */
/**
 * Delete all sound channels, stop and delete all related instances.
 * #method removeAll
 * @static
 */
/**
 * Add an instance to a sound channel.
 * #method add
 * @param {AbstractSoundInstance} instance The instance to add to the channel
 * @param {String} interrupt The interrupt value to use. Please see the {{#crossLink "Sound/play"}}{{/crossLink}}
 * for details on interrupt modes.
 * @return {Boolean} The success of the method call. If the channel is full, it will return false.
 * @static
 */
/**
 * Remove an instance from the channel.
 * #method remove
 * @param {AbstractSoundInstance} instance The instance to remove from the channel
 * @return The success of the method call. If there is no channel, it will return false.
 * @static
 */
/**
 * Get the maximum number of sounds you can have in a channel.
 * #method maxPerChannel
 * @return {Number} The maximum number of sounds you can have in a channel.
 */
/**
 * Get a channel instance by its src.
 * #method get
 * @param {String} src The src to use to look up the channel
 * @static
 */
/**
 * The source of the channel.
 * #property src
 * @type {String}
 */
/**
 * The maximum number of instances in this channel.  -1 indicates no limit
 * #property max
 * @type {Number}
 */
/**
 * The default value to set for max, if it isn't passed in.  Also used if -1 is passed.
 * #property maxDefault
 * @type {Number}
 * @default 100
 * @since 0.4.0
 */
/**
 * The current number of active instances.
 * #property length
 * @type {Number}
 */
/**
 * Initialize the channel.
 * #method init
 * @param {String} src The source of the channel
 * @param {Number} max The maximum number of instances in the channel
 * @protected
 */
/**
 * Get an instance by index.
 * #method get
 * @param {Number} index The index to return.
 * @return {AbstractSoundInstance} The AbstractSoundInstance at a specific instance.
 */
/**
 * Add a new instance to the channel.
 * #method add
 * @param {AbstractSoundInstance} instance The instance to add.
 * @return {Boolean} The success of the method call. If the channel is full, it will return false.
 */
/**
 * Remove an instance from the channel, either when it has finished playing, or it has been interrupted.
 * #method remove
 * @param {AbstractSoundInstance} instance The instance to remove
 * @return {Boolean} The success of the remove call. If the instance is not found in this channel, it will
 * return false.
 */
/**
 * Stop playback and remove all instances from the channel.  Usually in response to a delete call.
 * #method removeAll
 */
/**
 * Get an available slot depending on interrupt value and if slots are available.
 * #method getSlot
 * @param {String} interrupt The interrupt value to use.
 * @param {AbstractSoundInstance} instance The sound instance that will go in the channel if successful.
 * @return {Boolean} Determines if there is an available slot. Depending on the interrupt mode, if there are no slots,
 * an existing AbstractSoundInstance may be interrupted. If there are no slots, this method returns false.
 */