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
	 * <ul><li>mp3 audio files do not load properly on all windows machines, reported
	 * <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=929969" target="_blank">here</a>. </br>
	 * For this reason it is recommended to pass another FF supported type (ie ogg) first until this bug is resolved, if possible.</li></ul>
	 * <br />
	 * <b>Webkit (Chrome and Safari)</b>
	 * <ul><li>AudioNode.disconnect does not always seem to work.  This can cause the file size to grow over time if you
	 * are playing a lot of audio files.</li></ul>
	 * <br />
	 * <b>iOS 6 limitations</b>
	 * 	<ul><li>Sound is initially muted and will only unmute through play being called inside a user initiated event (touch/click).</li>
	 *	<li>A bug exists that will distort uncached audio when a video element is present in the DOM.  You can avoid this bug
	 * 	by ensuring the audio and video audio share the same sampleRate.</li>
	 * </ul>
	 * @class WebAudioPlugin
	 * @constructor
	 * @since 0.4.0
	 */
	function WebAudioPlugin() {
		this.AbstractPlugin_constructor();


// Private Properties
		/**
		 * Value to set panning model to equal power for SoundInstance.  Can be "equalpower" or 0 depending on browser implementation.
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

		this._capabilities = s._capabilities;

		this._loader = createjs.WebAudioLoader;
		this._soundInstance = createjs.WebAudioSoundInstance;
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
	 * @protected
	 * @static
	 */
	s._capabilities = null;

	/**
	 * Value to set panning model to equal power for SoundInstance.  Can be "equalpower" or 0 depending on browser implementation.
	 * @property _panningModel
	 * @type {Number / String}
	 * @protected
	 * @static
	 */
	s._panningModel = "equalpower";

	/**
	 * The web audio context, which WebAudio uses to play audio. All nodes that interact with the WebAudioPlugin
	 * need to be created within this context.
	 * @property context
	 * @type {AudioContext}
	 * @static
	 */
	s.context = null;

// Static Methods
	/**
	 * Determine if the plugin can be used in the current browser/OS.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		// check if this is some kind of mobile device, Web Audio works with local protocol under PhoneGap and it is unlikely someone is trying to run a local file
		var isMobilePhoneGap = createjs.Sound.BrowserDetect.isIOS || createjs.Sound.BrowserDetect.isAndroid || createjs.Sound.BrowserDetect.isBlackberry;
		// OJR isMobile may be redundant with _isFileXHRSupported available.  Consider removing.
		if (location.protocol == "file:" && !isMobilePhoneGap && !this._isFileXHRSupported()) { return false; }  // Web Audio requires XHR, which is not usually available locally
		s._generateCapabilities();
		if (s.context == null) {return false;}
		return true;
	};

	/**
	 * Determine if XHR is supported, which is necessary for web audio.
	 * @method _isFileXHRSupported
	 * @return {Boolean} If XHR is supported.
	 * @since 0.4.2
	 * @protected
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
	 * Determine the capabilities of the plugin. Used internally. Please see the Sound API {{#crossLink "Sound/getCapabilities"}}{{/crossLink}}
	 * method for an overview of plugin capabilities.
	 * @method _generateCapabilities
	 * @static
	 * @protected
	 */
	s._generateCapabilities = function () {
		if (s._capabilities != null) {return;}
		// Web Audio can be in any formats supported by the audio element, from http://www.w3.org/TR/webaudio/#AudioContext-section
		var t = document.createElement("audio");
		if (t.canPlayType == null) {return null;}

		if (window.AudioContext) {
			s.context = new AudioContext();
		} else if (window.webkitAudioContext) {
			s.context = new webkitAudioContext();
		} else {
			return null;
		}

		s._compatibilitySetUp();

		// playing this inside of a touch event will enable audio on iOS, which starts muted
		s.playEmptySound();

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
	 * Set up compatibility if only deprecated web audio calls are supported.
	 * See http://www.w3.org/TR/webaudio/#DeprecationNotes
	 * Needed so we can support new browsers that don't support deprecated calls (Firefox) as well as old browsers that
	 * don't support new calls.
	 *
	 * @method _compatibilitySetUp
	 * @static
	 * @protected
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
	 * Plays an empty sound in the web audio context.  This is used to enable web audio on iOS devices, as they
	 * require the first sound to be played inside of a user initiated event (touch/click).  This is called when
	 * {{#crossLink "WebAudioPlugin"}}{{/crossLink}} is initialized (by Sound {{#crossLink "Sound/initializeDefaultPlugins"}}{{/crossLink}}
	 * for example).
	 *
	 * <h4>Example</h4>
	 *     function handleTouch(event) {
	 *         createjs.WebAudioPlugin.playEmptySound();
	 *     }
	 *
	 * @method playEmptySound
	 * @static
	 * @since 0.4.1
	 */
	s.playEmptySound = function() {
		var source = s.context.createBufferSource();
		source.buffer = s.context.createBuffer(1, 1, 22050);
		source.connect(s.context.destination);
		source.start(0, 0, 0);
	};


// Public Methods
	p.create = function (src, startTime, duration) {
		if (!this.isPreloadStarted(src)) {this.preload(src);}
		var si = new this._soundInstance(src, startTime, duration, this._audioSources[src], this);
		this._soundInstances[src].push(si);
		return si;
	};

	p.toString = function () {
		return "[WebAudioPlugin]";
	};


// Private Methods
	/**
	 * Handles internal preload completion.
	 * @method _handlePreloadComplete
	 * @protected
	 */
	p._handlePreloadComplete = function (loader) {
		this._audioSources[loader.src] = loader.result;

		this.AbstractPlugin__handlePreloadComplete(loader);
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


//=======================================================================================
//=======================================================================================
/**
  * @class WebAudioSoundInstance
  * @extends AbstractSoundInstance
  * @constructor
  */
(function () {
	"use strict";

	function SoundInstance(src, startTime, duration, playbackResource, plugin) {
		this.AbstractSoundInstance_constructor(src, startTime, duration, playbackResource);


// public properties
		/**
		 * Note this is only intended for use by advanced users.
		 * <br />Audio context used to create nodes.  This is and needs to be the same context used by {{#crossLink "WebAudioPlugin"}}{{/crossLink}}.
	  	 * @property context
		 * @type {AudioContext}
		 * @since 0.5.3
		 */
		this.context = plugin.context;

		/**
		 * Note this is only inteded for use by advanced users.
		 * <br /> Audio node from WebAudioPlugin that sequences to <code>context.destination</code>
		 * @property destinationNode
		 * @type {AudioNode}
		 * @since 0.5.3
		 */
		this.destinationNode = plugin.gainNode;

		/**
		 * NOTE this is only intended for use by advanced users.
		 * <br />GainNode for controlling <code>SoundInstance</code> volume. Connected to the {{#crossLink "WebAudioSoundInstance/destinationNode:property"}}{{/crossLink}}.
		 * @property gainNode
		 * @type {AudioGainNode}
		 * @since 0.4.0
		 *
		 */
		this.gainNode = this.context.createGain();

		/**
		 * NOTE this is only intended for use by advanced users.
		 * <br />A panNode allowing left and right audio channel panning only. Connected to SoundInstance {{#crossLink "SoundInstance/gainNode:property"}}{{/crossLink}}.
		 * @property panNode
		 * @type {AudioPannerNode}
		 * @since 0.4.0
		 */
		this.panNode = this.context.createPanner();
		this.panNode.panningModel = plugin._panningModel;
		this.panNode.connect(this.gainNode);

		/**
		 * NOTE this is only intended for use by advanced users.
		 * <br />sourceNode is the audio source. Connected to SoundInstance {{#crossLink "SoundInstance/panNode:property"}}{{/crossLink}}.
		 * @property sourceNode
		 * @type {AudioNode}
		 * @since 0.4.0
		 *
		 */
		this.sourceNode = null;


// private properties
		/**
		 * Timeout that is created internally to handle sound playing to completion.
		 * Stored so we can remove it when stop, pause, or cleanup are called
		 * @property _soundCompleteTimeout
		 * @type {timeoutVariable}
		 * @default null
		 * @protected
		 * @since 0.4.0
		 */
		this._soundCompleteTimeout = null;

		/**
		 * NOTE this is only intended for use by advanced users.
		 * _sourceNodeNext is the audio source for the next loop, inserted in a look ahead approach to allow for smooth
		 * looping. Connected to {{#crossLink "SoundInstance/gainNode:property"}}{{/crossLink}}.
		 * @property _sourceNodeNext
		 * @type {AudioNode}
		 * @default null
		 * @protected
		 * @since 0.4.1
		 *
		 */
		this._sourceNodeNext = null;

		/**
		 * Time audio started playback, in seconds. Used to handle set position, get position, and resuming from paused.
		 * @property _playbackStartTime
		 * @type {Number}
		 * @default 0
		 * @protected
		 * @since 0.4.0
		 */
		this._playbackStartTime = 0;

		// Proxies, make removing listeners easier.
		this._endedHandler = createjs.proxy(this._handleSoundComplete, this);
	};
	var p = createjs.extend(SoundInstance, createjs.AbstractSoundInstance);


// Public methods
	p.destroy = function() {
		this.AbstractSoundInstance_destroy();

		this.context = null;
		this.destinationNode = null;
		this.panNode.disconnect(0);
		this.panNode = null;
		this.gainNode = null;
	};

	p.toString = function () {
		return "[WebAudioPlugin SoundInstance]";
	};


// Private Methods
	p._updatePan = function() {
		this.panNode.setPosition(this._pan, 0, -0.5);
		// z need to be -0.5 otherwise the sound only plays in left, right, or center
	};

	p._removeLooping = function() {
		this._sourceNodeNext = this._cleanUpAudioNode(this._sourceNodeNext);
	};

	p._addLooping = function() {
		this._sourceNodeNext = this._createAndPlayAudioNode(this._playbackStartTime, 0);
	};

	p._setDurationFromSource = function () {
		this._duration = this.playbackResource.duration * 1000;
	};

	p._handleCleanUp = function () {
		if (this.sourceNode && this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			this.sourceNode = this._cleanUpAudioNode(this.sourceNode);
			this._sourceNodeNext = this._cleanUpAudioNode(this._sourceNodeNext);
		}

		if (this.gainNode.numberOfOutputs != 0) {this.gainNode.disconnect(0);}
		// OJR there appears to be a bug that this doesn't always work in webkit (Chrome and Safari). According to the documentation, this should work.

		clearTimeout(this._soundCompleteTimeout);

		this._playbackStartTime = 0;	// This is used by getPosition
	};

	/**
	 * Turn off and disconnect an audioNode, then set reference to null to release it for garbage collection
	 * @method _cleanUpAudioNode
	 * @param audioNode
	 * @return {audioNode}
	 * @protected
	 * @since 0.4.1
	 */
	p._cleanUpAudioNode = function(audioNode) {
		if(audioNode) {
			audioNode.stop(0);
			audioNode.disconnect(0);
			audioNode = null;
		}
		return audioNode;
	};

	p._handleSoundReady = function (event) {
		this.gainNode.connect(this.destinationNode);  // this line can cause a memory leak.  Nodes need to be disconnected from the audioDestination or any sequence that leads to it.

		var dur = this._duration * 0.001;
		this.sourceNode = this._createAndPlayAudioNode((this.context.currentTime - dur), this._position);
		this._playbackStartTime = this.sourceNode.startTime - this._position;

		this._soundCompleteTimeout = setTimeout(this._endedHandler, (dur - this._position) * 1000);

		if(this._loop != 0) {
			this._sourceNodeNext = this._createAndPlayAudioNode(this._playbackStartTime, 0);
		}
	};

	/**
	 * Creates an audio node using the current src and context, connects it to the gain node, and starts playback.
	 * @method _createAndPlayAudioNode
	 * @param {Number} startTime The time to add this to the web audio context, in seconds.
	 * @param {Number} offset The amount of time into the src audio to start playback, in seconds.
	 * @return {audioNode}
	 * @protected
	 * @since 0.4.1
	 */
	p._createAndPlayAudioNode = function(startTime, offset) {
		var audioNode = this.context.createBufferSource();
		audioNode.buffer = this.playbackResource;
		audioNode.connect(this.panNode);
		var dur = this._duration * 0.001;
		audioNode.startTime = startTime + dur;
		audioNode.start(audioNode.startTime, offset+this._startTime, dur - offset);
		return audioNode;
	};

	p._pause = function () {
		this._position = this.context.currentTime - this._playbackStartTime;  // this allows us to restart the sound at the same point in playback
		this.sourceNode = this._cleanUpAudioNode(this.sourceNode);
		this._sourceNodeNext = this._cleanUpAudioNode(this._sourceNodeNext);

		if (this.gainNode.numberOfOutputs != 0) {this.gainNode.disconnect(0);}

		clearTimeout(this._soundCompleteTimeout);
	};

	p._resume = function () {
		this._handleSoundReady();
	};

	/*
	p._handleStop = function () {
		// web audio does not need to do anything extra
	};
	*/

	p._updateVolume = function () {
		var newVolume = this._muted ? 0 : this._volume;
	  	if (newVolume != this.gainNode.gain.value) {
		  this.gainNode.gain.value = newVolume;
  		}
	};

	p._calculateCurrentPosition = function () {
		return ((this.context.currentTime - this._playbackStartTime) * 1000); // pos in seconds * 1000 to give milliseconds
	};

	p._updatePosition = function () {
		this.sourceNode = this._cleanUpAudioNode(this.sourceNode);
		this._sourceNodeNext = this._cleanUpAudioNode(this._sourceNodeNext);
		clearTimeout(this._soundCompleteTimeout);

		if (!this._paused) {this._handleSoundReady();}
	};

	// OJR we are using a look ahead approach to ensure smooth looping.
	// We add _sourceNodeNext to the audio context so that it starts playing even if this callback is delayed.
	// This technique is described here:  http://www.html5rocks.com/en/tutorials/audio/scheduling/
	// NOTE the cost of this is that our audio loop may not always match the loop event timing precisely.
	p._handleLoop = function () {
		this._cleanUpAudioNode(this.sourceNode);
		this.sourceNode = this._sourceNodeNext;
		this._playbackStartTime = this.sourceNode.startTime;
		this._sourceNodeNext = this._createAndPlayAudioNode(this._playbackStartTime, 0);
		this._soundCompleteTimeout = setTimeout(this._endedHandler, this._duration);
	};

	p._updateDuration = function () {
		this._pause();
		this._resume();
	};

	createjs.WebAudioSoundInstance = createjs.promote(SoundInstance, "AbstractSoundInstance");
}());


//=======================================================================================
//=======================================================================================
(function () {
	"use strict";
	function Loader(src) {
		this.AbstractSoundLoader_constructor(src);

		// the request object for or XHR2 request
		this.request = null;
	};
	var p = createjs.extend(Loader, createjs.AbstractSoundLoader);

	p.load = function(src) {
		this.AbstractSoundLoader_load(src);

		this.request = new XMLHttpRequest();
		this.request.open("GET", this.src, true);
		this.request.responseType = "arraybuffer";
		this.request.onload = createjs.proxy(this.handleLoad, this);
		this.request.onerror = createjs.proxy(this.handleError, this);
		this.request.onprogress = createjs.proxy(this.handleProgress, this);
	};

	p._handleProgress = function(event) {
		if (!event || event.loaded > 0 && event.total == 0) {
					return; // Sometimes we get no "total", so just ignore the progress event.
		}
		this.AbstractSoundLoader__handleProgress(event);
	};

	p.handleLoad = function (event) {
		this.owner.context.decodeAudioData(this.request.response,
	         createjs.proxy(this.handleAudioDecoded, this),
	         createjs.proxy(this.handleError, this));

		//this.AbstractSoundLoader_handleLoad(event);
	};


	/**
	* The audio has been decoded.
	* #method handleAudioDecoded
	* @protected
	*/
	p.handleAudioDecoded = function (decodedAudio) {
		this.result = decodedAudio;
		this.AbstractSoundLoader_handleLoad(event);
	};

	p.destroy = function () {
		this.request = null;
		this.AbstractSoundLoader_destroy();
	};
	p.toString = function () {
		return "[WebAudioLoader]";
	};

	createjs.WebAudioLoader = createjs.promote(Loader, "AbstractSoundLoader");
}());
