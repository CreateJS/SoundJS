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

	"use strict";

	/**
	 * Play sounds using Web Audio in the browser. The WebAudioPlugin is currently the default plugin, and will be used
	 * anywhere that it is supported. To change plugin priority, check out the Sound API
	 * {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} method.

	 * <h4>Known Browser and OS issues for Web Audio</h4>
	 * <b>Firefox 25</b>
	 * <li>
	 *     mp3 audio files do not load properly on all windows machines, reported <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=929969" target="_blank">here</a>.
	 *     <br />For this reason it is recommended to pass another FireFox-supported type (i.e. ogg) as the default
	 *     extension, until this bug is resolved
	 * </li>
	 *
	 * <b>Webkit (Chrome and Safari)</b>
	 * <li>
	 *     AudioNode.disconnect does not always seem to work.  This can cause the file size to grow over time if you
	 * 	   are playing a lot of audio files.
	 * </li>
	 *
	 * <b>iOS 6 limitations</b>
	 * <ul>
	 *     <li>
	 *         Sound is initially muted and will only unmute through play being called inside a user initiated event
	 *         (touch/click). Please read the mobile playback notes in the the {{#crossLink "Sound"}}{{/crossLink}}
	 *         class for a full overview of the limitations, and how to get around them.
	 *     </li>
	 *	   <li>
	 *	       A bug exists that will distort un-cached audio when a video element is present in the DOM. You can avoid
	 *	       this bug by ensuring the audio and video audio share the same sample rate.
	 *	   </li>
	 * </ul>
	 * @class WebAudioPlugin
	 * @extends AbstractPlugin
	 * @constructor
	 * @since 0.4.0
	 */
	function WebAudioPlugin() {
		this.AbstractPlugin_constructor();


// Private Properties
		/**
		 * Value to set panning model to equal power for WebAudioSoundInstance.  Can be "equalpower" or 0 depending on browser implementation.
		 * @property _panningModel
		 * @type {Number / String}
		 * @protected
		 */
		this._panningModel = s._panningModel;;

		/**
		 * The web audio context, which WebAudio uses to play audio. All nodes that interact with the WebAudioPlugin
		 * need to be created within this context.
		 * @property context
		 * @type {AudioContext}
		 */
		this.context = s.context;

		/**
		 * A DynamicsCompressorNode, which is used to improve sound quality and prevent audio distortion.
		 * It is connected to <code>context.destination</code>.
		 *
		 * Can be accessed by advanced users through createjs.Sound.activePlugin.dynamicsCompressorNode.
		 * @property dynamicsCompressorNode
		 * @type {AudioNode}
		 */
		this.dynamicsCompressorNode = this.context.createDynamicsCompressor();
		this.dynamicsCompressorNode.connect(this.context.destination);

		/**
		 * A GainNode for controlling master volume. It is connected to {{#crossLink "WebAudioPlugin/dynamicsCompressorNode:property"}}{{/crossLink}}.
		 *
		 * Can be accessed by advanced users through createjs.Sound.activePlugin.gainNode.
		 * @property gainNode
		 * @type {AudioGainNode}
		 */
		this.gainNode = this.context.createGain();
		this.gainNode.connect(this.dynamicsCompressorNode);
		createjs.WebAudioSoundInstance.destinationNode = this.gainNode;

		this._capabilities = s._capabilities;

		this._loaderClass = createjs.WebAudioLoader;
		this._soundInstanceClass = createjs.WebAudioSoundInstance;

		this._addPropsToClasses();
	}
	var p = createjs.extend(WebAudioPlugin, createjs.AbstractPlugin);

// Static Properties
	var s = WebAudioPlugin;
	/**
	 * The capabilities of the plugin. This is generated via the {{#crossLink "WebAudioPlugin/_generateCapabilities:method"}}{{/crossLink}}
	 * method and is used internally.
	 * @property _capabilities
	 * @type {Object}
	 * @default null
	 * @private
	 * @static
	 */
	s._capabilities = null;

	/**
	 * Value to set panning model to equal power for WebAudioSoundInstance.  Can be "equalpower" or 0 depending on browser implementation.
	 * @property _panningModel
	 * @type {Number / String}
	 * @private
	 * @static
	 */
	s._panningModel = "equalpower";

	/**
	 * The web audio context, which WebAudio uses to play audio. All nodes that interact with the WebAudioPlugin
	 * need to be created within this context.
	 *
	 * Advanced users can set this to an existing context, but <b>must</b> do so before they call
	 * {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} or {{#crossLink "Sound/initializeDefaultPlugins"}}{{/crossLink}}.
	 *
	 * @property context
	 * @type {AudioContext}
	 * @static
	 */
	s.context = null;

	/**
	 * The scratch buffer that will be assigned to the buffer property of a source node on close.
	 * Works around an iOS Safari bug: https://github.com/CreateJS/SoundJS/issues/102
	 *
	 * Advanced users can set this to an existing source node, but <b>must</b> do so before they call
	 * {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} or {{#crossLink "Sound/initializeDefaultPlugins"}}{{/crossLink}}.
	 *
	 * @property _scratchBuffer
	 * @type {AudioBuffer}
	 * @private
	 * @static
	 */
	 s._scratchBuffer = null;

	/**
	 * Indicated whether audio on iOS has been unlocked, which requires a touchend/mousedown event that plays an
	 * empty sound.
	 * @property _unlocked
	 * @type {boolean}
	 * @since 0.6.2
	 * @private
	 */
	s._unlocked = false;

	/**
	 * The default sample rate used when checking for iOS compatibility. See {{#crossLink "WebAudioPlugin/_createAudioContext"}}{{/crossLink}}.
	 * @property DEFAULT_SAMPLE_REATE
	 * @type {number}
	 * @default 44100
	 * @static
	 */
	s.DEFAULT_SAMPLE_RATE = 44100;

// Static Public Methods
	/**
	 * Determine if the plugin can be used in the current browser/OS.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		// check if this is some kind of mobile device, Web Audio works with local protocol under PhoneGap and it is unlikely someone is trying to run a local file
		var isMobilePhoneGap = createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry;
		// OJR isMobile may be redundant with _isFileXHRSupported available.  Consider removing.
		if (location.protocol == "file:" && !isMobilePhoneGap && !this._isFileXHRSupported()) { return false; }  // Web Audio requires XHR, which is not usually available locally
		s._generateCapabilities();
		if (s.context == null) {return false;}
		return true;
	};

	/**
	 * Plays an empty sound in the web audio context.  This is used to enable web audio on iOS devices, as they
	 * require the first sound to be played inside of a user initiated event (touch/click).  This is called when
	 * {{#crossLink "WebAudioPlugin"}}{{/crossLink}} is initialized (by Sound {{#crossLink "Sound/initializeDefaultPlugins"}}{{/crossLink}}
	 * for example).
	 *
	 * <h4>Example</h4>
	 *
	 *     function handleTouch(event) {
	 *         createjs.WebAudioPlugin.playEmptySound();
	 *     }
	 *
	 * @method playEmptySound
	 * @static
	 * @since 0.4.1
	 */
	s.playEmptySound = function() {
		if (s.context == null) {return;}
		var source = s.context.createBufferSource();
		source.buffer = s._scratchBuffer;
		source.connect(s.context.destination);
		source.start(0, 0, 0);
	};


// Static Private Methods
	/**
	 * Determine if XHR is supported, which is necessary for web audio.
	 * @method _isFileXHRSupported
	 * @return {Boolean} If XHR is supported.
	 * @since 0.4.2
	 * @private
	 * @static
	 */
	s._isFileXHRSupported = function() {
		// it's much easier to detect when something goes wrong, so let's start optimistically
		var supported = true;

		var xhr = new XMLHttpRequest();
		try {
			xhr.open("GET", "WebAudioPluginTest.fail", false); // loading non-existant file triggers 404 only if it could load (synchronous call)
		} catch (error) {
			// catch errors in cases where the onerror is passed by
			supported = false;
			return supported;
		}
		xhr.onerror = function() { supported = false; }; // cause irrelevant
		// with security turned off, we can get empty success results, which is actually a failed read (status code 0?)
		xhr.onload = function() { supported = this.status == 404 || (this.status == 200 || (this.status == 0 && this.response != "")); };
		try {
			xhr.send();
		} catch (error) {
			// catch errors in cases where the onerror is passed by
			supported = false;
		}

		return supported;
	};

	/**
	 * Determine the capabilities of the plugin. Used internally. Please see the Sound API {{#crossLink "Sound/capabilities:property"}}{{/crossLink}}
	 * method for an overview of plugin capabilities.
	 * @method _generateCapabilities
	 * @static
	 * @private
	 */
	s._generateCapabilities = function () {
		if (s._capabilities != null) {return;}
		// Web Audio can be in any formats supported by the audio element, from http://www.w3.org/TR/webaudio/#AudioContext-section
		var t = document.createElement("audio");
		if (t.canPlayType == null) {return null;}

		if (s.context == null) {
			s.context = s._createAudioContext();
			if (s.context == null) { return null; }
		}
		if (s._scratchBuffer == null) {
			s._scratchBuffer = s.context.createBuffer(1, 1, 22050);
		}

		s._compatibilitySetUp();

		// Listen for document level clicks to unlock WebAudio on iOS. See the _unlock method.
		if ("ontouchstart" in window && s.context.state != "running") {
			s._unlock(); // When played inside of a touch event, this will enable audio on iOS immediately.
			document.addEventListener("mousedown", s._unlock, true);
			document.addEventListener("touchstart", s._unlock, true);
			document.addEventListener("touchend", s._unlock, true);
		}

		s._capabilities = {
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
			s._capabilities[ext] = (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
		}  // OJR another way to do this might be canPlayType:"m4a", codex: mp4

		// 0=no output, 1=mono, 2=stereo, 4=surround, 6=5.1 surround.
		// See http://www.w3.org/TR/webaudio/#AudioChannelSplitter for more details on channels.
		if (s.context.destination.numberOfChannels < 2) {
			s._capabilities.panning = false;
		}
	};

	/**
	 * Create an audio context for the sound.
	 *
	 * This method handles both vendor prefixes (specifically webkit support), as well as a case on iOS where
	 * audio played with a different sample rate may play garbled when first started. The default sample rate is
	 * 44,100, however it can be changed using the {{#crossLink "WebAudioPlugin/DEFAULT_SAMPLE_RATE:property"}}{{/crossLink}}.
	 * @method _createAudioContext
	 * @return {AudioContext | webkitAudioContext}
	 * @private
	 * @static
	 * @since 1.0.0
	 */
	s._createAudioContext = function() {
		// Slightly modified version of https://github.com/Jam3/ios-safe-audio-context
		// Resolves issues with first-run contexts playing garbled on iOS.
		var AudioCtor = (window.AudioContext || window.webkitAudioContext);
		if (AudioCtor == null) { return null; }
		var context = new AudioCtor();

		// Check if hack is necessary. Only occurs in iOS6+ devices
		// and only when you first boot the iPhone, or play a audio/video
		// with a different sample rate
		if (/(iPhone|iPad)/i.test(navigator.userAgent)
				&& context.sampleRate !== s.DEFAULT_SAMPLE_RATE) {
			var buffer = context.createBuffer(1, 1, s.DEFAULT_SAMPLE_RATE),
					dummy = context.createBufferSource();
			dummy.buffer = buffer;
			dummy.connect(context.destination);
			dummy.start(0);
			dummy.disconnect();
			context.close() // dispose old context

			context = new AudioCtor();
		}
		return context;
	}

	/**
	 * Set up compatibility if only deprecated web audio calls are supported.
	 * See http://www.w3.org/TR/webaudio/#DeprecationNotes
	 * Needed so we can support new browsers that don't support deprecated calls (Firefox) as well as old browsers that
	 * don't support new calls.
	 *
	 * @method _compatibilitySetUp
	 * @static
	 * @private
	 * @since 0.4.2
	 */
	s._compatibilitySetUp = function() {
		s._panningModel = "equalpower";
		//assume that if one new call is supported, they all are
		if (s.context.createGain) { return; }

		// simple name change, functionality the same
		s.context.createGain = s.context.createGainNode;

		// source node, add to prototype
		var audioNode = s.context.createBufferSource();
		audioNode.__proto__.start = audioNode.__proto__.noteGrainOn;	// note that noteGrainOn requires all 3 parameters
		audioNode.__proto__.stop = audioNode.__proto__.noteOff;

		// panningModel
		s._panningModel = 0;
	};

	/**
	 * Try to unlock audio on iOS. This is triggered from either WebAudio plugin setup (which will work if inside of
	 * a `mousedown` or `touchend` event stack), or the first document touchend/mousedown event. If it fails (touchend
	 * will fail if the user presses for too long, indicating a scroll event instead of a click event.
	 *
	 * Note that earlier versions of iOS supported `touchstart` for this, but iOS9 removed this functionality. Adding
	 * a `touchstart` event to support older platforms may preclude a `mousedown` even from getting fired on iOS9, so we
	 * stick with `mousedown` and `touchend`.
	 * @method _unlock
	 * @since 0.6.2
	 * @private
	 */
	s._unlock = function() {
		if (s._unlocked) { return; }
		s.playEmptySound();
		if (s.context.state == "running") {
			document.removeEventListener("mousedown", s._unlock, true);
			document.removeEventListener("touchend", s._unlock, true);
			document.removeEventListener("touchstart", s._unlock, true);
			s._unlocked = true;
		}
	};


// Public Methods
	p.toString = function () {
		return "[WebAudioPlugin]";
	};


// Private Methods
	/**
	 * Set up needed properties on supported classes WebAudioSoundInstance and WebAudioLoader.
	 * @method _addPropsToClasses
	 * @static
	 * @protected
	 * @since 0.6.0
	 */
	p._addPropsToClasses = function() {
		var c = this._soundInstanceClass;
		c.context = this.context;
		c._scratchBuffer = s._scratchBuffer;
		c.destinationNode = this.gainNode;
		c._panningModel = this._panningModel;

		this._loaderClass.context = this.context;
	};


	/**
	 * Set the gain value for master audio. Should not be called externally.
	 * @method _updateVolume
	 * @protected
	 */
	p._updateVolume = function () {
		var newVolume = createjs.Sound._masterMute ? 0 : this._volume;
		if (newVolume != this.gainNode.gain.value) {
			this.gainNode.gain.value = newVolume;
		}
	};

	createjs.WebAudioPlugin = createjs.promote(WebAudioPlugin, "AbstractPlugin");
}());
