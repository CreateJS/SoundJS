/*
 * WebAudioPlugin
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
	 * Play sounds using Web Audio in the browser. The WebAudio plugin has been successfully tested with:
	 * <ul><li>Google Chrome, version 23+ on OS X and Windows</li>
	 *      <li>Safari 6+ on OS X</li>
	 *      <li>Mobile Safari on iOS 6+</li>
	 * </ul>
	 *
	 * The WebAudioPlugin is currently the default plugin, and will be used anywhere that it is supported. Currently
	 * Chrome and Safari offer support.  Firefox and Android Chrome both offer support for web audio in upcoming
	 * releases.  To change plugin priority, check out the Sound API {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} method.

	 * <h4>Known Browser and OS issues for Web Audio Plugin</h4>
	 * <b>Webkit (Chrome and Safari)</b><br />
	 * <ul><li>AudioNode.disconnect does not always seem to work.  This can cause the file size to grow over time if you
	 * are playing a lot of audio files.</li>
	 *
	 * <b>iOS 6 limitations</b><br />
	 * <ul><li>Sound is initially muted and will only unmute through play being called inside a user initiated event (touch/click).</li>
	 *      <li>Despite suggestions to the opposite, we have relative control over audio volume through the gain nodes.</li>
	 *		<li>A bug exists that will distort uncached audio when a video element is present in the DOM.</li>
	 * </ul>
	 * @class WebAudioPlugin
	 * @constructor
	 * @since 0.4.0
	 */
	function WebAudioPlugin() {
		this.init();
	}

	var s = WebAudioPlugin;

	/**
	 * The capabilities of the plugin. This is generated via the <code>"WebAudioPlugin/generateCapabilities</code>
	 * method and is used internally.
	 * @property capabilities
	 * @type {Object}
	 * @default null
	 * @protected
	 * @static
	 */
	s.capabilities = null;

	/**
	 * Determine if the plugin can be used in the current browser/OS.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		// check if this is some kind of mobile device, Web Audio works with local protocol under PhoneGap and it is unlikely someone is trying to run a local file
		var isMobilePhoneGap = createjs.Sound.BrowserDetect.isIOS || createjs.Sound.BrowserDetect.isAndroid || createjs.Sound.BrowserDetect.isBlackberry;
	    // phonegap check first, so we don't do a unneeded XHR call
	    if (location.protocol == "file:" && !(isMobilePhoneGap || isFileXhrSupported()) { return false; } // Web Audio requires XHR, which is not available locally
		s.generateCapabilities();
		if (s.context == null) {
			return false;
		}
		return true;
	};
	
	/**
	 * Perform a dummy XHR request to this javascript file and return on its succes.
	 */
	function isFileXhrSupported() {
	    // it's much easier to detect when something goes wrong, so let's start optimisticaly
	    var supported = true;
	
	    var xhr = new XMLHttpRequest();
	    xhr.open('GET', 'file://WebAudioPlugin.js', false); // this file will always exist (synchronous call)
	    xhr.onerror = function() { supported = false; }; // cause irrelevant
	    // with security turned off, we can get empty succes results, which is actually a failed read (status code 0?)
	    xhr.onload = function() { supported = (this.status == 200) || (this.status == 0 && this.response != ''); };
	    
	    try {
	        xhr.send();
	    } catch (error) {
	        // catch errors in cases where the onerror is passed by
	        supported = false;
	    }
	    
	    return supported;
	}

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
		// Web Audio can be in any formats supported by the audio element, from http://www.w3.org/TR/webaudio/#AudioContext-section,
		// therefore tag is still required for the capabilities check
		var t = document.createElement("audio");

		if (t.canPlayType == null) {
			return null;
		}

		// This check is first because it's what is currently used, but the spec calls for it to be AudioContext so this
		//  will probably change in time
		if (window.webkitAudioContext) {
			s.context = new webkitAudioContext();
		} else if (window.AudioContext) {
			s.context = new AudioContext();
		} else {
			return null;
		}

		// playing this inside of a touch event will enable audio on iOS, which starts muted
		s.playEmptySound();

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

		// 0=no output, 1=mono, 2=stereo, 4=surround, 6=5.1 surround.
		// See http://www.w3.org/TR/webaudio/#AudioChannelSplitter for more details on channels.
		if (s.context.destination.numberOfChannels < 2) {
			s.capabilities.panning = false;
		}

		// set up AudioNodes that all of our source audio will connect to
		s.dynamicsCompressorNode = s.context.createDynamicsCompressor();
		s.dynamicsCompressorNode.connect(s.context.destination);
		s.gainNode = s.context.createGainNode();  // OJR deprecated, replaced with createGain
		s.gainNode.connect(s.dynamicsCompressorNode);
	};

	/**
	 * Plays an empty sound in the web audio context.  This is used to enable web audio on iOS devices, as they
	 * require the first sound to be played inside of a user initiated event (touch/click).  This is called when
	 * {{#crossLink "WebAudioPlugin"}}{{/crossLink}} is initialized (by {{#crossLink "Sound/initializeDefaultPlugins"}}{{/crossLink}}
	 * for example).
	 *
	 * <h4>Example</h4>
	 *
	 *     function handleTouch(event) {
	 *         createjs.WebAudioPlugin.playEmptySound();
	 *     }
	 *
	 * @method playEmptySound
	 * @since 0.4.1
	 */
	s.playEmptySound = function() {
		// create empty buffer
		var buffer = this.context.createBuffer(1, 1, 22050);
		var source = this.context.createBufferSource();
		source.buffer = buffer;

		// connect to output (your speakers)
		source.connect(this.context.destination);

		// play the file
		source.noteOn(0);
	};


	var p = s.prototype = {

		capabilities:null, // doc'd above

		/**
		 * The internal volume value of the plugin.
		 * @property volume
		 * @type {Number}
		 * @default 1
		 * @protected
		 */
		// TODO refactor Sound.js so we can use getter setter for volume
		volume:1,

		/**
		 * The web audio context, which WebAudio uses to play audio. All nodes that interact with the WebAudioPlugin
         * need to be created within this context.
		 * @property context
		 * @type {AudioContext}
		 */
		context:null,

		/**
		 * A DynamicsCompressorNode, which is used to improve sound quality and prevent audio distortion according to
		 * http://www.w3.org/TR/webaudio/#DynamicsCompressorNode. It is connected to <code>context.destination</code>.
		 * @property dynamicsCompressorNode
		 * @type {AudioNode}
		 */
		dynamicsCompressorNode:null,

		/**
		 * A GainNode for controlling master volume. It is connected to <code>dynamicsCompressorNode</code>.
		 * @property gainNode
		 * @type {AudioGainNode}
		 */
		gainNode:null,

		/**
		 * An object hash used internally to store ArrayBuffers, indexed by the source URI used  to load it. This
		 * prevents having to load and decode audio files more than once. If a load has been started on a file,
		 * <code>arrayBuffers[src]</code> will be set to true. Once load is complete, it is set the the loaded
		 * ArrayBuffer instance.
		 * @property arrayBuffers
		 * @type {Object}
		 * @protected
		 */
		arrayBuffers:null,

		/**
		 * An initialization function run by the constructor
		 * @method init
		 * @protected
		 */
		init:function () {
			this.capabilities = s.capabilities;
			this.arrayBuffers = {};

			this.context = s.context;
			this.gainNode = s.gainNode;
			this.dynamicsCompressorNode = s.dynamicsCompressorNode;
		},

		/**
		 * Pre-register a sound for preloading and setup. This is called by {{#crossLink "Sound"}}{{/crossLink}}.
		 * Note that WebAudio provides a <code>WebAudioLoader</code> instance, which <a href="http://preloadjs.com">PreloadJS</a>
		 * can use to assist with preloading.
		 * @method register
		 * @param {String} src The source of the audio
		 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
		 * Note that the WebAudioPlugin does not manage this property.
		 * @return {Object} A result object, containing a "tag" for preloading purposes.
		 */
		register:function (src, instances) {
			this.arrayBuffers[src] = true;  // This is needed for PreloadJS
			var tag = new WebAudioLoader(src, this);
			return {
				tag:tag
			};
		},

		/**
		 * Checks if preloading has started for a specific source. If the source is found, we can assume it is loading,
		 * or has already finished loading.
		 * @method isPreloadStarted
		 * @param {String} src The sound URI to check.
		 * @return {Boolean}
		 */
		isPreloadStarted:function (src) {
			return (this.arrayBuffers[src] != null);
		},

		/**
		 * Checks if preloading has finished for a specific source.
		 * @method isPreloadComplete
		 * @param {String} src The sound URI to load.
		 * @return {Boolean}
		 */
		isPreloadComplete:function (src) {
			return (!(this.arrayBuffers[src] == null || this.arrayBuffers[src] == true));
		},

		/**
		 * Remove a source from our preload list. Note this does not cancel a preload.
		 * @method removeFromPreload
		 * @param {String} src The sound URI to unload.
		 * @deprecated
		 */
		removeFromPreload:function (src) {
			delete(this.arrayBuffers[src]);
		},

		/**
		 * Remove a sound added using {{#crossLink "WebAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel a preload.
		 * @method removeSound
		 * @param {String} src The sound URI to unload.
		 * @since 0.4.1
		 */
		removeSound:function (src) {
			delete(this.arrayBuffers[src]);
		},

		/**
		 * Remove all sounds added using {{#crossLink "WebAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel a preload.
		 * @method removeAllSounds
		 * @param {String} src The sound URI to unload.
		 * @since 0.4.1
		 */
		removeAllSounds:function () {
			this.arrayBuffers = {};
		},

		/**
		 * Add loaded results to the preload object hash.
		 * @method addPreloadResults
		 * @param {String} src The sound URI to unload.
		 * @return {Boolean}
		 */
		addPreloadResults:function (src, result) {
			this.arrayBuffers[src] = result;
		},

		/**
		 * Handles internal preload completion.
		 * @method handlePreloadComplete
		 * @protected
		 */
		handlePreloadComplete:function () {
			//LM: I would recommend having the WebAudioLoader include an "event" in the onload, and properly binding this callback.
			createjs.Sound.sendFileLoadEvent(this.src);  // fire event or callback on Sound
			// note "this" will reference WebAudioLoader object
		},

		/**
		 * Internally preload a sound. Loading uses XHR2 to load an array buffer for use with WebAudio.
		 * @method preload
		 * @param {String} src The sound URI to load.
		 * @param {Object} instance Not used in this plugin.
		 * @param {String} basePath A file path to prepend to the src.
		 * @protected
		 */
		preload:function (src, instance, basePath) {
			this.arrayBuffers[src] = true;
			var loader = new WebAudioLoader(src, this);
			loader.onload = this.handlePreloadComplete;
			if (basePath != null) {loader.src = basePath+loader.src;}
			loader.load();
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
			return new SoundInstance(src, this);
		},

		/**
		 * Set the master volume of the plugin, which affects all SoundInstances.
		 * @method setVolume
		 * @param {Number} value The volume to set, between 0 and 1.
		 * @return {Boolean} If the plugin processes the setVolume call (true). The Sound class will affect all the
		 * instances manually otherwise.
		 */
		setVolume:function (value) {
			this.volume = value;
			this.updateVolume();
			return true;
		},

		/**
		 * Set the gain value for master audio. Should not be called externally.
		 * @method updateVolume
		 * @protected
		 */
		updateVolume:function () {
			var newVolume = createjs.Sound.masterMute ? 0 : this.volume;
			if (newVolume != this.gainNode.gain.value) {
				this.gainNode.gain.value = newVolume;
			}
		},

		/**
		 * Get the master volume of the plugin, which affects all SoundInstances.
		 * @method getVolume
		 * @return The volume level, between 0 and 1.
		 */
		getVolume:function () {
			return this.volume;
		},

		/**
		 * Mute all sounds via the plugin.
		 * @method setMute
		 * @param {Boolean} value If all sound should be muted or not. Note that plugin-level muting just looks up
		 * the mute value of Sound {{#crossLink "Sound/getMute"}}{{/crossLink}}, so this property is not used here.
		 * @return {Boolean} If the mute call succeeds.
		 */
		setMute:function (value) {
			this.updateVolume();
			return true;
		},

		toString:function () {
			return "[WebAudioPlugin]";
		}

	}

	createjs.WebAudioPlugin = WebAudioPlugin;


	/**
	 * A SoundInstance is created when any calls to the Sound API method {{#crossLink "Sound/play"}}{{/crossLink}} or
	 * {{#crossLink "Sound/createInstance"}}{{/crossLink}} are made. The SoundInstance is returned by the active plugin
	 * for control by the user.
	 *
	 * <h4>Example</h4>
	 *
	 *      var myInstance = createjs.Sound.play("myAssetPath/mySrcFile.mp3");
	 *
	 * A number of additional parameters provide a quick way to determine how a sound is played. Please see the Sound
	 * API method {{#crossLink "Sound/play"}}{{/crossLink}} for a list of arguments.
	 *
	 * Once a SoundInstance is created, a reference can be stored that can be used to control the audio directly through
	 * the SoundInstance. If the reference is not stored, the SoundInstance will play out its audio (and any loops), and
	 * is then de-referenced from the {{#crossLink "Sound"}}{{/crossLink}} class so that it can be cleaned up. If audio
	 * playback has completed, a simple call to the {{#crossLink "SoundInstance/play"}}{{/crossLink}} instance method
	 * will rebuild the references the Sound class need to control it.
	 *
	 *      var myInstance = createjs.Sound.play("myAssetPath/mySrcFile.mp3");
	 *      myInstance.addEventListener("complete", playAgain);
	 *      function playAgain(event) {
	 *          myInstance.play();
	 *      }
	 *
	 * Events are dispatched from the instance to notify when the sound has completed, looped, or when playback fails
	 *
	 *      var myInstance = createjs.Sound.play("myAssetPath/mySrcFile.mp3");
	 *      myInstance.addEventListener("complete", handleComplete);
	 *      myInstance.addEventListener("loop", handleLoop);
	 *      myInstance.addEventListener("failed", handleFailed);
	 *
	 *
	 * @class SoundInstance
	 * @param {String} src The path to and file name of the sound.
	 * @param {Object} owner The plugin instance that created this SoundInstance.
	 * @uses EventDispatcher
	 * @constructor
	 */
	function SoundInstance(src, owner) {
		this.init(src, owner);
	}

	var p = SoundInstance.prototype = {

		/**
		 * The source of the sound.
		 * @property src
		 * @type {String}
		 * @default null
		 * @protected
		 */
		src:null,

		/**
		 * The unique ID of the instance. This is set by <code>Sound</code>.
		 * @property uniqueId
		 * @type {String} | Number
		 * @default -1
		 */
		uniqueId:-1,

		/**
		 * The play state of the sound. Play states are defined as constants on <code>Sound</code>.
		 * @property playState
		 * @type {String}
		 * @default null
		 */
		playState:null,

		/**
		 * The plugin that created the instance
		 * @property owner
		 * @type {WebAudioPlugin}
		 * @default null
		 * @protected
		 */
		owner:null,

		/**
		 * How far into the sound to begin playback in milliseconds. This is passed in when play is called and used by
		 * pause and setPosition to track where the sound should be at.
		 * Note this is converted from milliseconds to seconds for consistency with the WebAudio API.
		 * @property offset
		 * @type {Number}
		 * @default 0
		 * @protected
		 */
		offset:0,

		/**
		 * The time in milliseconds before the sound starts.
		 * Note this is handled by <code>Sound</code>.
		 * @property delay
		 * @type {Number}
		 * @default 0
		 * @protected
		 */
		delay:0,


		/**
		 * The volume of the sound, between 0 and 1.
		 * Note this uses a getter setter, which is not supported by Firefox versions 3.6 or lower and Opera versions 11.50 or lower
		 *
		 * The actual output volume of a sound can be calculated using:
		 * <code>myInstance.volume * createjs.Sound.getVolume();</code>
		 *
		 * @property volume
		 * @type {Number}
		 * @default 1
		 */
		_volume: 1,
		get volume() {
			return this._volume;
		},
		set volume(value) {
			if (Number(value) == null) {return false}
			value = Math.max(0, Math.min(1, value));
			this._volume = value;
			this.updateVolume();
		},

		/**
		 * The pan of the sound, between -1 (left) and 1 (right). Note that pan does not work for HTML Audio.
		 * Note this uses a getter setter, which is not supported by Firefox versions 3.6 or lower and Opera versions 11.50 or lower
		 * Note in WebAudioPlugin this only gives us the "x" value of what is actually 3D audio.
		 *
		 * @property pan
		 * @type {Number}
		 * @default 0
		 */
		_pan: 0,
		get pan() {
			return this._pan;
		},
		set pan(value) {
			if (!this.owner.capabilities.panning || Number(value) == null) {return false;}

			value = Math.max(-1, Math.min(1, value));	// force pan to stay in the -1 to 1 range
			// Note that panning in WebAudioPlugin can support 3D audio, but our implementation does not.
			this._pan = value;  // Unfortunately panner does not give us a way to access this after it is set http://www.w3.org/TR/webaudio/#AudioPannerNode
			this.panNode.setPosition(value, 0, -0.5);  // z need to be -0.5 otherwise the sound only plays in left, right, or center
		},

		/**
		 * The length of the audio clip, in milliseconds.
		 * Use <code>getDuration</code> to access.
		 * @property pan
		 * @type {Number}
		 * @default 0
		 * @protected
		 */
		duration:0,

		/**
		 * The number of play loops remaining. Negative values will loop infinitely.
		 * @property remainingLoops
		 * @type {Number}
		 * @default 0
		 * @protected
		 */
		remainingLoops:0,

		/**
		 * A Timout created by <code>Sound</code> when this SoundInstance is played with a delay. This allows SoundInstance
		 * to remove the delay if stop or pause or cleanup are called before playback begins.
		 * @property delayTimeoutId
		 * @type {timeoutVariable}
		 * @default null
		 * @protected
		 * @since 0.4.0
		 */
		delayTimeoutId:null,

		/**
		 * Timeout that is created internally to handle sound playing to completion. Stored so we can remove it when
		 * stop, pause, or cleanup are called
		 * @property soundCompleteTimeout
		 * @type {timeoutVariable}
		 * @default null
		 * @protected
		 * @since 0.4.0
		 */
		soundCompleteTimeout:null,

		/**
		 * NOTE this only exists as a <code>WebAudioPlugin</code> property and is only intended for use by advanced users.
		 * A panNode allowing left and right audio channel panning only. Connected to our <code>WebAudioPlugin.gainNode</code>
		 * that sequences to <code>context.destination</code>.
		 * @property panNode
		 * @type {AudioPannerNode}
		 * @default null
		 * @since 0.4.0
		 */
		panNode:null,

		/**
		 * NOTE this only exists as a <code>WebAudioPlugin</code> property and is only intended for use by advanced users.
		 * GainNode for controlling <code>SoundInstance</code> volume. Connected to <code>panNode</code>.
		 * @property gainNode
		 * @type {AudioGainNode}
		 * @default null
		 * @since 0.4.0
		 *
		 */
		gainNode:null,

		/**
		 * NOTE this only exists as a <code>WebAudioPlugin</code> property and is only intended for use by advanced users.
		 * sourceNode is the audio source. Connected to <code>gainNode</code>.
		 * @property sourceNode
		 * @type {AudioSourceNode}
		 * @default null
		 * @since 0.4.0
		 *
		 */
		sourceNode:null,

		/**
		 * NOTE this only exists as a <code>WebAudioPlugin</code> property and is only intended for use by advanced users.
		 * sourceNodeNext is the audio source for the next loop, inserted in a look ahead approach to allow for smooth
		 * looping. Connected to <code>gainNode</code>.
		 * @property sourceNodeNext
		 * @type {AudioSourceNode}
		 * @default null
		 * @protected
		 * @since 0.4.1
		 *
		 */
		sourceNodeNext:null,

		/**
		 * Determines if the audio is currently muted.
		 * Use <code>getMute</code> and <code>setMute</code> to access.
		 * @property muted
		 * @type {Boolean}
		 * @default false
		 * @protected
		 */
		muted:false,

		/**
		 * Determines if the audio is currently paused.
		 * Use <code>pause()</code> and <code>resume()</code> to set.
		 * @property paused
		 * @type {Boolean}
		 * @default false
		 * @protected
		 */
		paused:false,

		/**
		 * WebAudioPlugin only.
		 * Time audio started playback, in seconds. Used to handle set position, get position, and resuming from paused.
		 * @property startTime
		 * @type {Number}
		 * @default 0
		 * @protected
		 * @since 0.4.0
		 */
		startTime:0,

// mix-ins:
		// EventDispatcher methods:
		addEventListener:null,
		removeEventListener:null,
		removeAllEventListeners:null,
		dispatchEvent:null,
		hasEventListener:null,
		_listeners:null,

		// Proxies, make removing listeners easier.
		endedHandler:null,
		readyHandler:null,
		stalledHandler:null,

// Events
		/**
		 * The event that is fired when a sound is ready to play.
		 * @event ready
		 * @param {Object} target The object that dispatched the event.
		 * @param {String} type The event type.
		 * @since 0.4.0
		 */

		/**
		 * The event that is fired when playback has started successfully.
		 * @event succeeded
		 * @param {Object} target The object that dispatched the event.
		 * @param {String} type The event type.
		 * @since 0.4.0
		 */

		/**
		 * The event that is fired when playback is interrupted. This happens when another sound with the same
		 * src property is played using an interrupt value that causes this instance to stop playing.
		 * @event interrupted
		 * @param {Object} target The object that dispatched the event.
		 * @param {String} type The event type.
		 * @since 0.4.0
		 */

		/**
		 * The event that is fired when playback has failed. This happens when there are too many channels with the same
		 * src property already playing (and the interrupt value doesn't cause an interrupt of another instance), or
		 * the sound could not be played, perhaps due to a 404 error.
		 * @event failed
		 * @param {Object} target The object that dispatched the event.
		 * @param {String} type The event type.
		 * @since 0.4.0
		 */

		/**
		 * The event that is fired when a sound has completed playing but has loops remaining.
		 * @event loop
		 * @param {Object} target The object that dispatched the event.
		 * @param {String} type The event type.
		 * @since 0.4.0
		 */

		/**
		 * The event that is fired when playback completes. This means that the sound has finished playing in its
		 * entirety, including its loop iterations.
		 * @event complete
		 * @param {Object} target The object that dispatched the event.
		 * @param {String} type The event type.
		 * @since 0.4.0
		 */

// Callbacks
		/**
		 * The callback that is fired when a sound is ready to play.
		 * @property onReady
		 * @type {Function}
		 * @deprecated In favor of the "ready" event. Will be removed in a future version.
		 */
		onReady:null,

		/**
		 * The callback that is fired when playback has started successfully.
		 * @property onPlaySucceeded
		 * @type {Function}
		 * @deprecated In favour of the "succeeded" event. Will be removed in a future version.
		 */
		onPlaySucceeded:null,

		/**
		 * The callback that is fired when a sound has been interrupted.
		 * @property onPlayInterrupted
		 * @type {Function}
		 * @deprecated Deprecated in favor of the "interrupted" event. Will be removed in a future version.
		 */
		onPlayInterrupted:null,

		/**
		 * The callback that is fired when a sound has failed to start.
		 * @property onPlayFailed
		 * @type {Function}
		 * @deprecated In favor of the "failed" event. Will be removed in a future version.
		 */
		onPlayFailed:null,

		/**
		 * The callback that is fired when a sound has completed playback.
		 * @property onComplete
		 * @type {Function}
		 * @deprecated In favor of the "complete" event. Will be removed in a future version.
		 */
		onComplete:null,

		/**
		 * The callback that is fired when a sound has completed playback, but has loops remaining.
		 * @property onLoop
		 * @type {Function}
		 * @deprecated In favor of the "loop" event. Will be removed in a future version.
		 */
		onLoop:null,


		/**
		 * A helper method that dispatches all events for SoundInstance.
		 * @method sendEvent
		 * @param {String} type The event type
		 * @protected
		 */
		sendEvent:function (type) {
			var event = {
				target:this,
				type:type
			};
			this.dispatchEvent(event);
		},

// Constructor
		/**
		 * Initialize the SoundInstance. This is called from the constructor.
		 * @method init
		 * @param {string} src The source of the audio.
		 * @param {Class} owner The plugin that created this instance.
		 * @protected
		 */
		init:function (src, owner) {
			this.owner = owner;
			this.src = src;

			this.panNode = this.owner.context.createPanner();  // TODO test how this affects when we have mono audio
            this.panNode.panningModel = 0;  // OJR deprecated in favor of "equalpower"

			this.gainNode = this.owner.context.createGainNode();  // OJR deprecated in favor of context.createGain
			this.gainNode.connect(this.panNode);

			if (this.owner.isPreloadComplete(this.src)) {
				this.duration = this.owner.arrayBuffers[this.src].duration * 1000;
			}

			this.endedHandler = createjs.proxy(this.handleSoundComplete, this);
			this.readyHandler = createjs.proxy(this.handleSoundReady, this);
			this.stalledHandler = createjs.proxy(this.handleSoundStalled, this);
		},

		/**
		 * Clean up the instance. Remove references and clean up any additional properties such as timers.
		 * @method cleanup
		 * @protected
		 */
		cleanUp:function () {
			// if playbackState is UNSCHEDULED_STATE, then noteON or noteGrainOn has not been called so calling noteOff would throw an error
			if (this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) {
				this.sourceNode = this.cleanUpAudioNode(this.sourceNode);
				this.sourceNodeNext = this.cleanUpAudioNode(this.sourceNodeNext);
			}

			if (this.panNode.numberOfOutputs != 0) {
				this.panNode.disconnect(0);
			}  // this works because we only have one connection, and it returns 0 if we've already disconnected it.
			// OJR there appears to be a bug that this doesn't always work in webkit (Chrome and Safari). According to the documentation, this should work.

			clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
			clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete

			this.startTime = 0;	// This is used by getPosition

			if (window.createjs == null) {
				return;
			}
			createjs.Sound.playFinished(this);
		},

		/**
		 * Turn off and disconnect an audioNode, then set reference to null to release it for garbage collection
		 * @param audioNode
		 * @return {audioNode}
		 * @protected
		 * @since 0.4.1
		 */
		cleanUpAudioNode: function(audioNode) {
			if(audioNode) {
				audioNode.noteOff(0);	// OJR deprecated, replaced with stop()  // note this means the sourceNode cannot be reused and must be recreated
				audioNode.disconnect(this.gainNode);
				audioNode = null;	// release reference so Web Audio can handle removing references and garbage collection
			}
			return audioNode;
		},

		/**
		 * The sound has been interrupted.
		 * @method interrupt
		 * @protected
		 */
		interrupt:function () {
			this.playState = createjs.Sound.PLAY_INTERRUPTED;
			if (this.onPlayInterrupted) {
				this.onPlayInterrupted(this);
			}
			this.cleanUp();
			this.paused = false;
			this.sendEvent("interrupted");
		},

		// Playback has stalled, and therefore failed.
		handleSoundStalled:function (event) {
			if (this.onPlayFailed != null) {
				this.onPlayFailed(this);
			}
			this.sendEvent("failed");
		},

		// The sound is ready for playing
		handleSoundReady:function (event) {
			if (window.createjs == null) {
				return;
			}

			if ((this.offset*1000) > this.getDuration()) {	// converting offset to ms
				this.playFailed();
				return;
			} else if (this.offset < 0) {  // may not need this check if noteGrainOn ignores negative values, this is not specified in the API http://www.w3.org/TR/webaudio/#AudioBufferSourceNode
				this.offset = 0;
			}

			this.playState = createjs.Sound.PLAY_SUCCEEDED;
			this.paused = false;

			this.panNode.connect(this.owner.gainNode);  // this line can cause a memory leak.  Nodes need to be disconnected from the audioDestination or any sequence that leads to it.

			var dur = this.owner.arrayBuffers[this.src].duration;
			this.sourceNode = this.createAndPlayAudioNode((this.owner.context.currentTime - dur), this.offset);
			this.duration = dur * 1000;	// NOTE *1000 because WebAudio reports everything in seconds but js uses milliseconds
			this.startTime = this.sourceNode.startTime - this.offset;

			this.soundCompleteTimeout = setTimeout(this.endedHandler, (dur - this.offset) * 1000);

			if(this.remainingLoops != 0) {
				this.sourceNodeNext = this.createAndPlayAudioNode(this.startTime, 0);
			}
		},

		/**
		 * Creates an audio node using the current src and context, connects it to the gain node, and starts playback.
		 * @method createAudioNode
		 * @param {Number} startTime The time to add this to the web audio context, in seconds.
		 * @param {Number} offset The amount of time into the src audio to start playback, in seconds.
		 * @return {audioNode}
		 * @protected
		 * @since 0.4.1
		 */
		createAndPlayAudioNode: function(startTime, offset) {
			// WebAudio supports BufferSource, MediaElementSource, and MediaStreamSource.
			// NOTE MediaElementSource requires different commands to play, pause, and stop because it uses audio tags.
			// The same is assumed for MediaStreamSource, although it may share the same commands as MediaElementSource.
			var audioNode = this.owner.context.createBufferSource();
			audioNode.buffer = this.owner.arrayBuffers[this.src];
			audioNode.connect(this.gainNode);
			var currentTime = this.owner.context.currentTime;
			audioNode.startTime = startTime + audioNode.buffer.duration;	//currentTime + audioNode.buffer.duration - (currentTime - startTime);
			audioNode.noteGrainOn(audioNode.startTime, offset, audioNode.buffer.duration - offset);  // OJR deprecated in favor of start()
			return audioNode;
		},

		// Public API
		/**
		 * Play an instance. This method is intended to be called on SoundInstances that already exist (created
		 * with the Sound API {{#crossLink "Sound/createInstance"}}{{/crossLink}} or {{#crossLink "Sound/play"}}{{/crossLink}}).
		 *
		 * <h4>Example</h4>
		 *
		 *      var myInstance = createjs.Sound.createInstance(mySrc);
		 *      myInstance.play(createjs.Sound.INTERRUPT_ANY);
		 *
		 * @method play
		 * @param {String} [interrupt=none] How this sound interrupts other instances with the same source. Interrupt values
		 * are defined as constants on {{#crossLink "Sound"}}{{/crossLink}}. The default value is <code>Sound.INTERRUPT_NONE</code>.
		 * @param {Number} [delay=0] The delay in milliseconds before the sound starts
		 * @param {Number} [offset=0] How far into the sound to begin playback, in milliseconds.
		 * @param {Number} [loop=0] The number of times to loop the audio. Use -1 for infinite loops.
		 * @param {Number} [volume=1] The volume of the sound, between 0 and 1.
		 * @param {Number} [pan=0] The pan of the sound between -1 (left) and 1 (right). Note that pan is not supported
		 * for HTML Audio.
		 */
		play:function (interrupt, delay, offset, loop, volume, pan) {
			this.cleanUp();
			createjs.Sound.playInstance(this, interrupt, delay, offset, loop, volume, pan);
		},

		/**
		 * Called by the Sound class when the audio is ready to play (delay has completed). Starts sound playing if the
		 * src is loaded, otherwise playback will fail.
		 * @method beginPlaying
		 * @param {Number} offset How far into the sound to begin playback, in milliseconds.
		 * @param {Number} loop The number of times to loop the audio. Use -1 for infinite loops.
		 * @param {Number} volume The volume of the sound, between 0 and 1.
		 * @param {Number} pan The pan of the sound between -1 (left) and 1 (right). Note that pan does not work for HTML Audio.
		 * @protected
		 */
		beginPlaying:function (offset, loop, volume, pan) {
			if (window.createjs == null) {
				return;
			}

			if (!this.src) {
				return;
			}

			this.offset = offset / 1000;  //convert ms to sec
			this.remainingLoops = loop;
			this.setVolume(volume);
			this.setPan(pan);

			if (this.owner.isPreloadComplete(this.src)) {
				this.handleSoundReady(null);
				this.onPlaySucceeded && this.onPlaySucceeded(this);
				this.sendEvent("succeeded");
				return 1;
			} else {
				this.playFailed();
				return;
			}
		},

		/**
		 * Pause the instance. Paused audio will stop at the current time, and can be resumed using
		 * {{#crossLink "SoundInstance/resume"}}{{/crossLink}}.
		 *
		 * <h4>Example</h4>
		 *
		 *      myInstance.pause();
		 *
		 * @method pause
		 * @return {Boolean} If the pause call succeeds. This will return false if the sound isn't currently playing.
		 */
		pause:function () {
			if (!this.paused && this.playState == createjs.Sound.PLAY_SUCCEEDED) {
				this.paused = true;

				this.offset = this.owner.context.currentTime - this.startTime;  // this allows us to restart the sound at the same point in playback
				this.cleanUpAudioNode(this.sourceNode);
				this.cleanUpAudioNode(this.sourceNodeNext);

				if (this.panNode.numberOfOutputs != 0) {
					this.panNode.disconnect();
				}  // this works because we only have one connection, and it returns 0 if we've already disconnected it.

				clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
				clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete
				return true;
			}
			return false;
		},

		/**
		 * Resume an instance that has been paused using {{#crossLink "SoundInstance/pause"}}{{/crossLink}}. Audio that
		 * has not been paused will not playback when this method is called.
		 *
		 * <h4>Example</h4>
		 *
		 *     myInstance.pause();
		 *     // do some stuff
		 *     myInstance.resume();
		 *
		 * @method resume
		 * @return {Boolean} If the resume call succeeds. This will return false if called on a sound that is not paused.
		 */
		resume:function () {
			if (!this.paused) {
				return false;
			}
			this.handleSoundReady(null);
			return true;
		},

		/**
		 * Stop playback of the instance. Stopped sounds will reset their position to 0, and calls to {{#crossLink "SoundInstance/resume"}}{{/crossLink}}
		 * will fail.  To start playback again, call {{#crossLink "SoundInstance/play"}}{{/crossLink}}.
		 *
		 * <h4>Example</h4>
		 *
		 *     myInstance.stop();
		 *
		 * @method stop
		 * @return {Boolean} If the stop call succeeds.
		 */
		stop:function () {
			this.playState = createjs.Sound.PLAY_FINISHED;
			this.cleanUp();
			this.offset = 0;  // set audio to start at the beginning
			return true;
		},

		/**
		 * Set the volume of the instance. You can retrieve the volume using {{#crossLink "SoundInstance/getVolume"}}{{/crossLink}}.
		 *
		 * <h4>Example</h4>
		 *
		 *      myInstance.setVolume(0.5);
		 *
		 * Note that the master volume set using the Sound API method {{#crossLink "Sound/setVolume"}}{{/crossLink}}
		 * will be applied to the instance volume.
		 *
		 * @method setVolume
		 * @param value The volume to set, between 0 and 1.
		 * @return {Boolean} If the setVolume call succeeds.
		 * @deprecated in favor of setter
		 */
		setVolume:function (value) {
			this.volume = value;
			return true;  // This is always true because even if the volume is not updated, the value is set
		},

		/**
		 * Internal function used to update the volume based on the instance volume, master volume, instance mute value,
		 * and master mute value.
		 * @method updateVolume
		 * @return {Boolean} if the volume was updated.
		 * @protected
		 */
		updateVolume:function () {
			var newVolume = this.muted ? 0 : this._volume;
			if (newVolume != this.gainNode.gain.value) {
				this.gainNode.gain.value = newVolume;
				return true;
			}
			return false;
		},

		/**
		 * Get the volume of the instance. The actual output volume of a sound can be calculated using:
		 * <code>myInstance.getVolume() * createjs.Sound.getVolume();</code>
		 *
		 * @method getVolume
		 * @return The current volume of the sound instance.
		 * @deprecated in favor of getter
		 */
		getVolume:function () {
			return this.volume;
		},

		/**
		 * Mute and unmute the sound. <strong>Please use {{#crossLink "SoundInstance/setMute"}}{{/crossLink}} instead</strong>.
		 * @method mute
		 * @param {Boolean} value If the sound should be muted or not.
		 * @return {Boolean} If the mute call succeeds.
		 * @deprecated This method has been replaced by setMute.
		 */
		mute:function (value) {
			this.muted = value;
			this.updateVolume();
			return true;
		},

		/**
		 * Mute and unmute the sound. Muted sounds will still play at 0 volume. Note that an unmuted sound may still be
		 * silent depending on {{#crossLink "Sound"}}{{/crossLink}} volume, instance volume, and Sound mute.
		 *
		 * <h4>Example</h4>
		 *
		 *     myInstance.setMute(true);
		 *
		 * @method setMute
		 * @param {Boolean} value If the sound should be muted.
		 * @return {Boolean} If the mute call succeeds.
		 * @since 0.4.0
		 */
		setMute:function (value) {
			if (value == null || value == undefined) {
				return false;
			}

			this.muted = value;
			this.updateVolume();
			return true;
		},

		/**
		 * Get the mute value of the instance.
		 *
		 * <h4>Example</h4>
		 *
		 *      var isMuted = myInstance.getMute();
		 *
		 * @method getMute
		 * @return {Boolean} If the sound is muted.
		 * @since 0.4.0
		 */
		getMute:function () {
			return this.muted;
		},

		/**
		 * Set the left(-1)/right(+1) pan of the instance. Note that {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}} does not
		 * support panning, and only simple left/right panning has been implemented for {{#crossLink "WebAudioPlugin"}}{{/crossLink}}.
		 * The default pan value is 0 (center).
		 *
		 * <h4>Example</h4>
		 *
		 *     myInstance.setPan(-1);  // to the left!
		 *
		 * @method setPan
		 * @param {Number} value The pan value, between -1 (left) and 1 (right).
		 * @return {Number} If the setPan call succeeds.
		 * @deprecated in favor of setter
		 */
		setPan:function (value) {
			this.pan = value;  // Unfortunately panner does not give us a way to access this after it is set http://www.w3.org/TR/webaudio/#AudioPannerNode
			if(this.pan != value) {return false;}
		},

		/**
		 * Get the left/right pan of the instance. Note in WebAudioPlugin this only gives us the "x" value of what is
		 * actually 3D audio.
		 *
		 * <h4>Example</h4>
		 *
		 *     var myPan = myInstance.getPan();
		 *
		 * @method getPan
		 * @return {Number} The value of the pan, between -1 (left) and 1 (right).
		 * @deprecated in favor of getter.
		 */
		getPan:function () {
			return this.pan;
		},

		/**
		 * Get the position of the playhead in the instance in milliseconds.
		 *
		 * <h4>Example</h4>
		 *
		 *     var currentOffset = myInstance.getPosition();
		 *
		 * @method getPosition
		 * @return {Number} The position of the playhead in the sound, in milliseconds.
		 */
		getPosition:function () {
			if (this.paused || this.sourceNode == null) {
				var pos = this.offset;
			} else {
				var pos = this.owner.context.currentTime - this.startTime;
			}

			return pos * 1000; // pos in seconds * 1000 to give milliseconds
		},

		/**
		 * Set the position of the playhead in the instance. This can be set while a sound is playing, paused, or even
		 * stopped.
		 *
		 * <h4>Example</h4>
		 *
		 *      myInstance.setPosition(myInstance.getDuration()/2); // set audio to its halfway point.
		 *
		 * @method setPosition
		 * @param {Number} value The position to place the playhead, in milliseconds.
		 */
		setPosition:function (value) {
			this.offset = value / 1000; // convert milliseconds to seconds

			if (this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) {  // if playbackState is UNSCHEDULED_STATE, then noteON or noteGrainOn has not been called so calling noteOff would throw an error
				// we need to stop this sound from continuing to play, as we need to recreate the sourceNode to change position
				this.cleanUpAudioNode(this.sourceNode);
				this.cleanUpAudioNode(this.sourceNodeNext);
				clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete
			}  // NOTE we cannot just call cleanup because it also calls the Sound function playFinished which releases this instance in SoundChannel

			if (!this.paused && this.playState == createjs.Sound.PLAY_SUCCEEDED) {
				this.handleSoundReady(null);
			}

			return true;
		},

		/**
		 * Get the duration of the instance, in milliseconds. Note in most cases, you need to play a sound using
		 * {{#crossLink "SoundInstance/play"}}{{/crossLink}} or the Sound API {{#crossLink "Sound.play"}}{{/crossLink}}
		 * method before its duration can be reported accurately.
		 *
		 * <h4>Example</h4>
		 *
		 *     var soundDur = myInstance.getDuration();
		 *
		 * @method getDuration
		 * @return {Number} The duration of the sound instance in milliseconds.
		 */
		getDuration:function () {
			return this.duration;
		},

		// Audio has finished playing. Manually loop it if required.
		// called internally by soundCompleteTimeout in WebAudioPlugin
		handleSoundComplete:function (event) {
			this.offset = 0;  // have to set this as it can be set by pause during playback


			if (this.remainingLoops != 0) {
				this.remainingLoops--;  // NOTE this introduces a theoretical limit on loops = float max size x 2 - 1

				// OJR we are using a look ahead approach to ensure smooth looping.  We add sourceNodeNext to the audio
				// context so that it starts playing even if this callback is delayed.  This technique and the reasons for
				// using it are described in greater detail here:  http://www.html5rocks.com/en/tutorials/audio/scheduling/
				// NOTE the cost of this is that our audio loop may not always match the loop event timing precisely.
				if(this.sourceNodeNext) { // this can be set to null, but this should not happen when looping
					this.cleanUpAudioNode(this.sourceNode);
					this.sourceNode = this.sourceNodeNext;
					this.startTime = this.sourceNode.startTime;
					this.sourceNodeNext = this.createAndPlayAudioNode(this.startTime, 0);
					this.soundCompleteTimeout = setTimeout(this.endedHandler, this.duration);
				}
				else {
					this.handleSoundReady(null);
				}

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

		// Play has failed, which can happen for a variety of reasons.
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
			return "[WebAudioPlugin SoundInstance]";
		}

	}

	// This is for the above SoundInstance.
	createjs.EventDispatcher.initialize(SoundInstance.prototype); // inject EventDispatcher methods.


	/**
	 * An internal helper class that preloads web audio via XHR. Note that this class and its methods are not documented
	 * properly to avoid generating HTML documentation.
	 * #class WebAudioLoader
	 * @param {String} src The source of the sound to load.
	 * @param {Object} owner A reference to the class that created this instance.
	 * @constructor
	 */
	function WebAudioLoader(src, owner) {
		this.init(src, owner);
	}

	var p = WebAudioLoader.prototype = {

		// the request object for or XHR2 request
		request:null,

		owner:null,
		progress:-1,

		/**
		 * The source of the sound to load. Used by callback functions when we return this class.
		 * #property src
		 * @type {String}
		 */
		src:null,

		/**
		 * The original source of the sound, before it is altered with a basePath.
		 * #property src
		 * @type {String}
		 */
		originalSrc:null,

		/**
		 * The decoded AudioBuffer array that is returned when loading is complete.
		 * #property result
		 * @type {AudioBuffer}
		 * @protected
		 */
		result:null,

		// Calbacks
		/**
		 * The callback that fires when the load completes. This follows HTML tag naming.
		 * #property onload
		 * @type {Method}
		 */
		onload:null,

		/**
		 * The callback that fires as the load progresses. This follows HTML tag naming.
		 * #property onprogress
		 * @type {Method}
		 */
		onprogress:null,

		/**
		 * The callback that fires if the load hits an error.
		 * #property onError
		 * @type {Method}
		 * @protected
		 */
		onError:null,

		// constructor
		init:function (src, owner) {
			this.src = src;
			this.originalSrc = src;
			this.owner = owner;
		},

		/**
		 * Begin loading the content.
		 * #method load
		 * @param {String} src The path to the sound.
		 */
		load:function (src) {
			if (src != null) {
				// TODO does this need to set this.originalSrc
				this.src = src;
			}

			this.request = new XMLHttpRequest();
			this.request.open("GET", this.src, true);
			this.request.responseType = "arraybuffer";
			this.request.onload = createjs.proxy(this.handleLoad, this);
			this.request.onError = createjs.proxy(this.handleError, this);
			this.request.onprogress = createjs.proxy(this.handleProgress, this);

			this.request.send();
		},

		/**
		 * The loader has reported progress.
		 * #method handleProgress
		 * @param {Number} loaded The loaded amount.
		 * @param {Number} total The total amount.
		 * @protected
		 */
		handleProgress:function (loaded, total) {
			this.progress = loaded / total;
			if (this.onprogress == null) {
				return;
			}
			this.onprogress({loaded:loaded, total:total, progress:this.progress});
		},

		/**
		 * The sound has completed loading.
		 * #method handleLoad
		 * @protected
		 */
		handleLoad:function () {
			s.context.decodeAudioData(this.request.response,
					createjs.proxy(this.handleAudioDecoded, this),
					createjs.proxy(this.handleError, this));
		},

		/**
		 * The audio has been decoded.
		 * #method handleAudioDecoded
		 * @protected
		 */
		handleAudioDecoded:function (decodedAudio) {
			this.progress = 1;
			this.result = decodedAudio;
			this.src = this.originalSrc;
			this.owner.addPreloadResults(this.src, this.result);
			this.onload && this.onload();
		},

		/**
		 * Errors have been caused by the loader.
		 * #method handleError
		 * @protected
		 */
		handleError:function (evt) {
			this.owner.removeSound(this.src);
			this.onerror && this.onerror(evt);
		},

		toString:function () {
			return "[WebAudioPlugin WebAudioLoader]";
		}
	}

}());
