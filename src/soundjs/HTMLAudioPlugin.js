/*
 * HTMLAudioPlugin
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
	 * Play sounds using HTML &lt;audio&gt; tags in the browser. This plugin is the second priority plugin installed
	 * by default, after the {{#crossLink "WebAudioPlugin"}}{{/crossLink}}.  For older browsers that do not support html
	 * audio, include and install the {{#crossLink "FlashPlugin"}}{{/crossLink}}.
	 *
	 * <h4>Known Browser and OS issues for HTML Audio</h4>
	 * <b>All browsers</b><br />
	 * Testing has shown in all browsers there is a limit to how many audio tag instances you are allowed.  If you exceed
	 * this limit, you can expect to see unpredictable results.  This will be seen as soon as you register sounds, as
	 * tags are precreated to allow Chrome to load them.  Please use {{#crossLink "Sound.MAX_INSTANCES"}}{{/crossLink}} as
	 * a guide to how many total audio tags you can safely use in all browsers.
	 *
     * <b>IE html limitations</b><br />
     * <ul><li>There is a delay in applying volume changes to tags that occurs once playback is started. So if you have
     * muted all sounds, they will all play during this delay until the mute applies internally. This happens regardless of
     * when or how you apply the volume change, as the tag seems to need to play to apply it.</li>
     * <li>MP3 encoding will not always work for audio tags if it's not default.  We've found default encoding with
     * 64kbps works.</li>
	 * <li>Occasionally very short samples will get cut off.</li>
	 * <li>There is a limit to how many audio tags you can load and play at once, which appears to be determined by
	 * hardware and browser settings.  See {{#crossLink "HTMLAudioPlugin.MAX_INSTANCES"}}{{/crossLink}} for a safe estimate.
	 * Note that audio sprites can be used as a solution to this issue.</li></ul>
	 *
	 * <b>Safari limitations</b><br />
	 * <ul><li>Safari requires Quicktime to be installed for audio playback.</li></ul>
	 *
	 * <b>iOS 6 limitations</b><br />
	 * <ul><li>Note it is recommended to use {{#crossLink "WebAudioPlugin"}}{{/crossLink}} for iOS (6+)</li>
	 * 		<li>HTML Audio is disabled by default because</li>
	 * 		<li>can only have one &lt;audio&gt; tag</li>
	 * 		<li>can not preload or autoplay the audio</li>
	 * 		<li>can not cache the audio</li>
	 * 		<li>can not play the audio except inside a user initiated event.</li>
	 * 		<li>audio sprites can be used to mitigate some of these issues and are strongly recommended on iOS</li>
	 * </ul>
	 *
	 * <b>Android Native Browser limitations</b><br />
	 * <ul><li>We have no control over audio volume. Only the user can set volume on their device.</li>
	 *      <li>We can only play audio inside a user event (touch/click).  This currently means you cannot loop sound or use a delay.</li></ul>
	 * <b> Android Chrome 26.0.1410.58 specific limitations</b><br />
	 * <ul><li>Chrome reports true when you run createjs.Sound.BrowserDetect.isChrome, but is a different browser
	 *      with different abilities.</li>
	 *      <li>Can only play 1 sound at a time.</li>
	 *      <li>Sound is not cached.</li>
	 *      <li>Sound can only be loaded in a user initiated touch/click event.</li>
	 *      <li>There is a delay before a sound is played, presumably while the src is loaded.</li>
	 * </ul>
	 *
	 * See {{#crossLink "Sound"}}{{/crossLink}} for general notes on known issues.
	 *
	 * @class HTMLAudioPlugin
	 * @constructor
	 */
	function HTMLAudioPlugin() {
		this._init();
	}

	var s = HTMLAudioPlugin;

	/**
	 * The maximum number of instances that can be loaded and played. This is a browser limitation, primarily limited to IE9.
	 * The actual number varies from browser to browser (and is largely hardware dependant), but this is a safe estimate.
	 * @property MAX_INSTANCES
	 * @type {Number}
	 * @default 30
	 * @static
	 */
	s.MAX_INSTANCES = 30;

	/**
	 * Event constant for the "canPlayThrough" event for cleaner code.
	 * @property _AUDIO_READY
	 * @type {String}
	 * @default canplaythrough
	 * @static
	 * @protected
	 */
	s._AUDIO_READY = "canplaythrough";

	/**
	 * Event constant for the "ended" event for cleaner code.
	 * @property _AUDIO_ENDED
	 * @type {String}
	 * @default ended
	 * @static
	 * @protected
	 */
	s._AUDIO_ENDED = "ended";

	/**
	 * Event constant for the "seeked" event for cleaner code.  We utilize this event for maintaining loop events.
	 * @property _AUDIO_SEEKED
	 * @type {String}
	 * @default seeked
	 * @static
	 * @protected
	 */
	s._AUDIO_SEEKED = "seeked";

	/**
	 * Event constant for the "stalled" event for cleaner code.
	 * @property _AUDIO_STALLED
	 * @type {String}
	 * @default stalled
	 * @static
	 * @protected
	 */
	s._AUDIO_STALLED = "stalled";

	/**
	 * Event constant for the "timeupdate" event for cleaner code.  Utilized for looping audio sprites.
	 * This event callsback ever 15 to 250ms and can be dropped by the browser for performance.
	 * @property _TIME_UPDATE
	 * @type {String}
	 * @default timeupdate
	 * @static
	 * @protected
	 */
	s._TIME_UPDATE = "timeupdate";

	/**
	 * The capabilities of the plugin. This is generated via the the SoundInstance {{#crossLink "HTMLAudioPlugin/_generateCapabilities"}}{{/crossLink}}
	 * method. Please see the Sound {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} method for an overview of all
	 * of the available properties.
	 * @property _capabilities
	 * @type {Object}
	 * @protected
	 * @static
	 */
	s._capabilities = null;

	/**
	 * Deprecated now that we have audio sprite support.  Audio sprites are strongly recommend on iOS.
	 * <li>it can only have one &lt;audio&gt; tag</li>
	 * <li>can not preload or autoplay the audio</li>
	 * <li>can not cache the audio</li>
	 * <li>can not play the audio except inside a user initiated event</li>
	 *
	 * @property enableIOS
	 * @type {Boolean}
	 * @default false
	 * @deprecated
	 */
	s.enableIOS = false;

	/**
	 * Determine if the plugin can be used in the current browser/OS. Note that HTML audio is available in most modern
	 * browsers, but is disabled in iOS because of its limitations.
	 * @method isSupported
	 * @return {Boolean} If the plugin can be initialized.
	 * @static
	 */
	s.isSupported = function () {
		s._generateCapabilities();
		if (s._capabilities == null) {return false;}
		return true;
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
		var t = document.createElement("audio");
		if (t.canPlayType == null) {return null;}

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
	}

	var p = HTMLAudioPlugin.prototype;
	p.constructor = HTMLAudioPlugin;

	// doc'd above
	p._capabilities = null;

	/**
	 * Object hash indexed by the source of each file to indicate if an audio source is loaded, or loading.
	 * @property _audioSources
	 * @type {Object}
	 * @protected
	 * @since 0.4.0
	 */
	p._audioSources = null;

	/**
	 * The default number of instances to allow.  Used by {{#crossLink "Sound"}}{{/crossLink}} when a source
	 * is registered using the {{#crossLink "Sound/register"}}{{/crossLink}} method.  This is only used if
	 * a value is not provided.
	 *
	 * <b>NOTE this property only exists as a limitation of HTML audio.</b>
	 * @property defaultNumChannels
	 * @type {Number}
	 * @default 2
	 * @since 0.4.0
	 */
	p.defaultNumChannels = 2;

	/**
	 * An initialization function run by the constructor
	 * @method _init
	 * @protected
	 */
	p._init = function () {
		this._capabilities = s._capabilities;
		this._audioSources = {};
	};

	/**
	 * Pre-register a sound instance when preloading/setup. This is called by {{#crossLink "Sound"}}{{/crossLink}}.
	 * Note that this provides an object containing a tag used for preloading purposes, which
	 * <a href="http://preloadjs.com" target="_blank">PreloadJS</a> can use to assist with preloading.
	 * @method register
	 * @param {String} src The source of the audio
	 * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
	 * @return {Object} A result object, containing a tag for preloading purposes and a numChannels value for internally
	 * controlling how many instances of a source can be played by default.
	 */
	p.register = function (src, instances) {
		this._audioSources[src] = true;  // Note this does not mean preloading has started
		var channel = createjs.HTMLAudioPlugin.TagPool.get(src);
		var tag = null;
		var l = instances;
		for (var i = 0; i < l; i++) {
			tag = this._createTag(src);
			channel.add(tag);
		}

		return {
			tag:tag // Return one instance for preloading purposes
		};
	};

	/**
	 * Create an HTML audio tag.
	 * @method _createTag
	 * @param {String} src The source file to set for the audio tag.
	 * @return {HTMLElement} Returns an HTML audio tag.
	 * @protected
	 */
	p._createTag = function (src) {
		var tag = document.createElement("audio");
		tag.autoplay = false;
		tag.preload = "none";
		//LM: Firefox fails when this the preload="none" for other tags, but it needs to be "none" to ensure PreloadJS works.
		tag.src = src;
		return tag;
	};

	/**
	 * Remove a sound added using {{#crossLink "HTMLAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel
	 * a preload.
	 * @method removeSound
	 * @param {String} src The sound URI to unload.
	 * @since 0.4.1
	 */
	p.removeSound = function (src) {
		delete(this._audioSources[src]);
		createjs.HTMLAudioPlugin.TagPool.remove(src);
	};

	/**
	 * Remove all sounds added using {{#crossLink "HTMLAudioPlugin/register"}}{{/crossLink}}. Note this does not cancel a preload.
	 * @method removeAllSounds
	 * @param {String} src The sound URI to unload.
	 * @since 0.4.1
	 */
	p.removeAllSounds = function () {
		this._audioSources = {};
		createjs.HTMLAudioPlugin.TagPool.removeAll();
	};

	/**
	 * Create a sound instance. If the sound has not been preloaded, it is internally preloaded here.
	 * @method create
	 * @param {String} src The sound source to use.
	 * @param {Number} startTime Audio sprite property used to apply an offset, in milliseconds.
	 * @param {Number} duration Audio sprite property used to set the time the clip plays for, in milliseconds.
	 * @return {SoundInstance} A sound instance for playback and control.
	 */
	p.create = function (src, startTime, duration) {
		// if this sound has not be registered, create a tag and preload it
		if (!this.isPreloadStarted(src)) {
			var channel = createjs.HTMLAudioPlugin.TagPool.get(src);
			var tag = this._createTag(src);
			tag.id = src;
			channel.add(tag);
			this.preload(src, {tag:tag});
		}

		return new createjs.HTMLAudioPlugin.SoundInstance(src, startTime, duration, this);
	};

	/**
	 * Checks if preloading has started for a specific source.
	 * @method isPreloadStarted
	 * @param {String} src The sound URI to check.
	 * @return {Boolean} If the preload has started.
	 * @since 0.4.0
	 */
	p.isPreloadStarted = function (src) {
		return (this._audioSources[src] != null);
	};

	/**
	 * Internally preload a sound.
	 * @method preload
	 * @param {String} src The sound URI to load.
	 * @param {Object} tag An HTML audio tag used to load src.
	 * @since 0.4.0
	 */
	p.preload = function (src, tag) {
		this._audioSources[src] = true;
		new createjs.HTMLAudioPlugin.Loader(src, tag);
	};

	p.toString = function () {
		return "[HTMLAudioPlugin]";
	};

	createjs.HTMLAudioPlugin = HTMLAudioPlugin;
}());


(function () {

	"use strict";

	// NOTE Documentation for the SoundInstance class in WebAudioPlugin file. Each plugin generates a SoundInstance that
	// follows the same interface.
	function SoundInstance(src, startTime, duration, owner) {
		this._init(src, startTime, duration, owner);
	}

	var p = SoundInstance.prototype = new createjs.EventDispatcher();
	p.constructor = SoundInstance;

	p.src = null;
	p.uniqueId = -1;
	p.playState = null;
	p._owner = null;
	p.loaded = false;
	p._offset = 0;
	p._startTime = 0;
	p._volume =  1;
	if (createjs.definePropertySupported) {
		Object.defineProperty(p, "volume", {
			get: function() {
				return this._volume;
			},
			set: function(value) {
				if (Number(value) == null) {return;}
				value = Math.max(0, Math.min(1, value));
				this._volume = value;
				this._updateVolume();
			}
		});
	}
	p.pan = 0;
	p._duration = 0;
	p._audioSpriteStopTime = null;	// HTMLAudioPlugin only
	p._remainingLoops = 0;
	if (createjs.definePropertySupported) {
		Object.defineProperty(p, "loop", {
			get: function() {
				return this._remainingLoops;
			},
			set: function(value) {
				this._remainingLoops = value;
			}
		});
	}
	p._delayTimeoutId = null;
	p.tag = null;
	p._muted = false;
	p.paused = false;
	p._paused = false;

	// Proxies, make removing listeners easier.
	p._endedHandler = null;
	p._readyHandler = null;
	p._stalledHandler = null;
	p._audioSpriteEndHandler = null;

// Constructor
	p._init = function (src, startTime, duration, owner) {
		this.src = src;
		this._startTime = startTime || 0;	// convert ms to s as web audio handles everything in seconds
		if (duration) {
			this._duration = duration;
			this._audioSpriteStopTime = (startTime + duration) * 0.001;
		} else {
			this._duration = createjs.HTMLAudioPlugin.TagPool.getDuration(this.src);
		}
		this._owner = owner;

		this._endedHandler = createjs.proxy(this._handleSoundComplete, this);
		this._readyHandler = createjs.proxy(this._handleSoundReady, this);
		this._stalledHandler = createjs.proxy(this._handleSoundStalled, this);
		this._audioSpriteEndHandler = createjs.proxy(this._handleAudioSpriteLoop, this);
	};

	p._sendEvent = function (type) {
		var event = new createjs.Event(type);
		this.dispatchEvent(event);
	};

	p._cleanUp = function () {
		var tag = this.tag;
		if (tag != null) {
			tag.pause();
			this.tag.loop = false;
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
			tag.removeEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this._audioSpriteEndHandler, false);

			try {
				tag.currentTime = this._startTime;
			} catch (e) {
			} // Reset Position
			createjs.HTMLAudioPlugin.TagPool.setInstance(this.src, tag);
			this.tag = null;
		}

		clearTimeout(this._delayTimeoutId);
		createjs.Sound._playFinished(this);
	};

	p._interrupt = function () {
		if (this.tag == null) {return;}
		this.playState = createjs.Sound.PLAY_INTERRUPTED;
		this._cleanUp();
		this.paused = this._paused = false;
		this._sendEvent("interrupted");
	};

// Public API
	p.play = function (interrupt, delay, offset, loop, volume, pan) {
		if (this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			if (interrupt instanceof Object) {
				offset = interrupt.offset;
				loop = interrupt.loop;
				volume = interrupt.volume;
				pan = interrupt.pan;
			}
			if (offset != null) { this.setPosition(offset) }
			if (loop != null) { this.loop = loop; }
			if (volume != null) { this.setVolume(volume); }
			if (pan != null) { this.setPan(pan); }
			if (this._paused) {	this.resume(); }
			return;
		}
		this._cleanUp();
		createjs.Sound._playInstance(this, interrupt, delay, offset, loop, volume, pan);
	};

	p._beginPlaying = function (offset, loop, volume, pan) {
		var tag = this.tag = createjs.HTMLAudioPlugin.TagPool.getInstance(this.src);
		if (tag == null) {
			this.playFailed();
			return -1;
		}

		tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);

		// Reset this instance.
		this._offset = offset;
		this.volume = volume;
		this._updateVolume();
		this._remainingLoops = loop;

		if (tag.readyState !== 4) {
			tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);
			tag.addEventListener(createjs.HTMLAudioPlugin._AUDIO_STALLED, this._stalledHandler, false);
			tag.preload = "auto"; // This is necessary for Firefox, as it won't ever "load" until this is set.
			tag.load();
		} else {
			this._handleSoundReady(null);
		}

		this._sendEvent("succeeded");
		return 1;
	};

	// Note: Sounds stall when trying to begin playback of a new audio instance when the existing instances
	//  has not loaded yet. This doesn't mean the sound will not play.
	p._handleSoundStalled = function (event) {
		this._cleanUp();  // OJR this will stop playback, we could remove this and let the developer decide how to handle stalled instances
		this._sendEvent("failed");
	};

	p._handleSoundReady = function (event) {
		this.playState = createjs.Sound.PLAY_SUCCEEDED;
		this.paused = this._paused = false;
		this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_READY, this._readyHandler, false);

		if (this._offset >= this.getDuration()) {
			this.playFailed();
			return;
		}
		this.tag.currentTime = (this._startTime + this._offset) * 0.001;

		if (this._audioSpriteStopTime) {
			this.tag.removeEventListener(createjs.HTMLAudioPlugin._AUDIO_ENDED, this._endedHandler, false);
			this.tag.addEventListener(createjs.HTMLAudioPlugin._TIME_UPDATE, this._audioSpriteEndHandler, false);
		}

		this.tag.play();
	};

	p.pause = function () {
		if (!this._paused && this.playState == createjs.Sound.PLAY_SUCCEEDED && this.tag != null) {
			this.paused = this._paused = true;
			this.tag.pause();
			clearTimeout(this._delayTimeoutId);
			return true;
		}
		return false;
	};

	p.resume = function () {
		if (!this._paused || this.tag == null) {return false;}
		this.paused = this._paused = false;
		this.tag.play();
		return true;
	};

	p.stop = function () {
		this._offset = 0;
		this.pause();
		this.playState = createjs.Sound.PLAY_FINISHED;
		this._cleanUp();
		return true;
	};

	p.setMasterVolume = function (value) {
		this._updateVolume();
	};

	p.setVolume = function (value) {
		this.volume = value;
		return true;
	};

	p._updateVolume = function () {
		if (this.tag != null) {
			var newVolume = (this._muted || createjs.Sound._masterMute) ? 0 : this._volume * createjs.Sound._masterVolume;
			if (newVolume != this.tag.volume) {this.tag.volume = newVolume;}
		}
	};

	p.getVolume = function (value) {
		return this.volume;
	};

	p.setMasterMute = function (isMuted) {
		this._updateVolume();
	};

	p.setMute = function (isMuted) {
		if (isMuted == null) {return false;}
		this._muted = isMuted;
		this._updateVolume();
		return true;
	};

	p.getMute = function () {
		return this._muted;
	};

	// Can not set pan in HTML audio
	p.setPan = function (value) {
		return false;
	};

	p.getPan = function () {
		return 0;
	};

	p.getPosition = function () {
		if (this.tag == null) {return this._offset;}
		return (this.tag.currentTime * 1000) - this._startTime;
	};

	p.setPosition = function (value) {
		if (this.tag == null) {
			this._offset = value
		} else {
			try {
				value = value + this._startTime;
				this.tag.currentTime = value * 0.001;
			} catch (error) { // Out of range
				return false;
			}
		}
		return true;
	};

	p.getDuration = function () {  // NOTE this will always return 0 until sound has been played unless it is set
		return this._duration;
	};

	p._handleSoundComplete = function (event) {
		this._offset = 0;
		if (this._remainingLoops != 0) {
			this._remainingLoops--;
			this.tag.currentTime = this._startTime * 0.001;
			if (!this._paused) { this.tag.play(); }
			this._sendEvent("loop");
			return;
		}
		this.playState = createjs.Sound.PLAY_FINISHED;
		this._cleanUp();
		this._sendEvent("complete");
	};

	// NOTE because of the inaccuracies in the timeupdate event (15 - 250ms) and in setting the tag to the desired timed
	// (up to 300ms), it is strongly recommended not to loop audio sprites with HTML Audio if smooth looping is desired
	p._handleAudioSpriteLoop = function (event) {
		if(this.tag.currentTime <= this._audioSpriteStopTime) {return;}
		this.tag.pause();
		if(this._remainingLoops == 0) {
			this._handleSoundComplete(null);
		} else {
			this._offset = 0;
			this._remainingLoops--;
			this.tag.currentTime = this._startTime * 0.001;
			if(!this._paused) {this.tag.play();}
			this._sendEvent("loop");
		}
	};

	p.playFailed = function () {
		this.playState = createjs.Sound.PLAY_FAILED;
		this._cleanUp();
		this._sendEvent("failed");
	};

	p.toString = function () {
		return "[HTMLAudioPlugin SoundInstance]";
	};

	createjs.HTMLAudioPlugin.SoundInstance = SoundInstance;

}());


(function () {

	"use strict";

	/**
	 * An internal helper class that preloads html audio via HTMLAudioElement tags. Note that PreloadJS will NOT use
	 * this load class like it does Flash and WebAudio plugins.
	 * Note that this class and its methods are not documented properly to avoid generating HTML documentation.
	 * #class Loader
	 * @param {String} src The source of the sound to load.
	 * @param {HTMLAudioElement} tag The audio tag of the sound to load.
	 * @constructor
	 * @protected
	 * @since 0.4.0
	 */
	function Loader(src, tag) {
		this._init(src, tag);
	};

	var p = Loader.prototype;
	p.constructor = Loader;

	/**
	 * The source to be loaded.
	 * #property src
	 * @type {String}
	 * @default null
	 * @protected
	 */
	p.src = null;

	/**
	 * The tag to load the source with / into.
	 * #property tag
	 * @type {AudioTag}
	 * @default null
	 * @protected
	 */
	p.tag = null;

	/**
	 * An interval used to give us progress.
	 * #property preloadTimer
	 * @type {String}
	 * @default null
	 * @protected
	 */
	p.preloadTimer = null;

	// Proxies, make removing listeners easier.
	p.loadedHandler = null;

	// constructor
	p._init = function (src, tag) {
		this.src = src;
		this.tag = tag;

		this.preloadTimer = setInterval(createjs.proxy(this.preloadTick, this), 200);

		// This will tell us when audio is buffered enough to play through, but not when its loaded.
		// The tag doesn't keep loading in Chrome once enough has buffered, and we have decided that behaviour is sufficient.
		// Note that canplaythrough callback doesn't work in Chrome, we have to use the event.
		this.loadedHandler = createjs.proxy(this.sendLoadedEvent, this);  // we need this bind to be able to remove event listeners
		this.tag.addEventListener && this.tag.addEventListener("canplaythrough", this.loadedHandler);
		if(this.tag.onreadystatechange == null) {
			this.tag.onreadystatechange = createjs.proxy(this.sendLoadedEvent, this);
		} else {
			var f = this.tag.onreadystatechange;
			this.tag.onreadystatechange = function() {
				f();
				this.tag.onreadystatechange = createjs.proxy(this.sendLoadedEvent, this);
			}
		}

		this.tag.preload = "auto";
		//this.tag.src = src;
		this.tag.load();
	};

	/**
	 * Allows us to have preloading progress and tell when its done.
	 * #method preloadTick
	 * @protected
	 */
	p.preloadTick = function () {
		var buffered = this.tag.buffered;
		var duration = this.tag.duration;

		if (buffered.length > 0) {
			if (buffered.end(0) >= duration - 1) {
				this.handleTagLoaded();
			}
		}
	};

	/**
	 * Internal handler for when a tag is loaded.
	 * #method handleTagLoaded
	 * @protected
	 */
	p.handleTagLoaded = function () {
		clearInterval(this.preloadTimer);
	};

	/**
	 * Communicates back to Sound that a load is complete.
	 * #method sendLoadedEvent
	 * @param {Object} evt The load Event
	 */
	p.sendLoadedEvent = function (evt) {
		this.tag.removeEventListener && this.tag.removeEventListener("canplaythrough", this.loadedHandler);  // cleanup and so we don't send the event more than once
		this.tag.onreadystatechange = null;  // cleanup and so we don't send the event more than once
		createjs.Sound._sendFileLoadEvent(this.src);  // fire event or callback on Sound

	};

	// used for debugging
	p.toString = function () {
		return "[HTMLAudioPlugin Loader]";
	};

	createjs.HTMLAudioPlugin.Loader = Loader;

}());


(function () {

	"use strict";

	/**
	 * The TagPool is an object pool for HTMLAudio tag instances. In Chrome, we have to pre-create the number of HTML
	 * audio tag instances that we are going to play before we load the data, otherwise the audio stalls.
	 * (Note: This seems to be a bug in Chrome)
	 * #class TagPool
	 * @param {String} src The source of the channel.
	 * @protected
	 */
	function TagPool(src) {
		this._init(src);
	}

	var s = TagPool;

	/**
	 * A hash lookup of each sound channel, indexed by the audio source.
	 * #property tags
	 * @static
	 * @protected
	 */
	s.tags = {};

	/**
	 * Get a tag pool. If the pool doesn't exist, create it.
	 * #method get
	 * @param {String} src The source file used by the audio tag.
	 * @static
	 * @protected
	 */
	s.get = function (src) {
		var channel = s.tags[src];
		if (channel == null) {
			channel = s.tags[src] = new TagPool(src);
		}
		return channel;
	};

	/**
	 * Delete a TagPool and all related tags. Note that if the TagPool does not exist, this will fail.
	 * #method remove
	 * @param {String} src The source for the tag
	 * @return {Boolean} If the TagPool was deleted.
	 * @static
	 */
	s.remove = function (src) {
		var channel = s.tags[src];
		if (channel == null) {return false;}
		channel.removeAll();
		delete(s.tags[src]);
		return true;
	};

	/**
	 * Delete all TagPools and all related tags.
	 * #method removeAll
	 * @static
	 */
	s.removeAll = function () {
		for(var channel in s.tags) {
			s.tags[channel].removeAll();	// this stops and removes all active instances
		}
		s.tags = {};
	};

	/**
	 * Get a tag instance. This is a shortcut method.
	 * #method getInstance
	 * @param {String} src The source file used by the audio tag.
	 * @static
	 * @protected
	 */
	s.getInstance = function (src) {
		var channel = s.tags[src];
		if (channel == null) {return null;}
		return channel.get();
	};

	/**
	 * Return a tag instance. This is a shortcut method.
	 * #method setInstance
	 * @param {String} src The source file used by the audio tag.
	 * @param {HTMLElement} tag Audio tag to set.
	 * @static
	 * @protected
	 */
	s.setInstance = function (src, tag) {
		var channel = s.tags[src];
		if (channel == null) {return null;}
		return channel.set(tag);
	};

	/**
	 * Gets the duration of the src audio in milliseconds
	 * #method getDuration
	 * @param {String} src The source file used by the audio tag.
	 * @return {Number} Duration of src in milliseconds
	 */
	s.getDuration= function (src) {
		var channel = s.tags[src];
		if (channel == null) {return 0;}
		return channel.getDuration();
	};

	var p = TagPool.prototype;
	p.constructor = TagPool;

	/**
	 * The source of the tag pool.
	 * #property src
	 * @type {String}
	 * @protected
	 */
	p.src = null;

	/**
	 * The total number of HTMLAudio tags in this pool. This is the maximum number of instance of a certain sound
	 * that can play at one time.
	 * #property length
	 * @type {Number}
	 * @default 0
	 * @protected
	 */
	p.length = 0;

	/**
	 * The number of unused HTMLAudio tags.
	 * #property available
	 * @type {Number}
	 * @default 0
	 * @protected
	 */
	p.available = 0;

	/**
	 * A list of all available tags in the pool.
	 * #property tags
	 * @type {Array}
	 * @protected
	 */
	p.tags = null;

	/**
	 * The duration property of all audio tags, converted to milliseconds, which originally is only available on the
	 * last tag in the tags array because that is the one that is loaded.
	 * #property
	 * @type {Number}
	 * @protected
	 */
	p.duration = 0;

	// constructor
	p._init = function (src) {
		this.src = src;
		this.tags = [];
	};

	/**
	 * Add an HTMLAudio tag into the pool.
	 * #method add
	 * @param {HTMLAudioElement} tag A tag to be used for playback.
	 */
	p.add = function (tag) {
		this.tags.push(tag);
		this.length++;
		this.available++;
	};

	/**
	 * Remove all tags from the channel.  Usually in response to a delete call.
	 * #method removeAll
	 */
	p.removeAll = function () {
		var tag;
		while(this.length--) {
			tag = this.tags[this.length];
			if(tag.parentNode) {
				tag.parentNode.removeChild(tag);
			}
			delete(this.tags[this.length]);	// NOTE that the audio playback is already stopped by this point
		}
		this.src = null;
		this.tags.length = 0;
	};

	/**
	 * Get an HTMLAudioElement for immediate playback. This takes it out of the pool.
	 * #method get
	 * @return {HTMLAudioElement} An HTML audio tag.
	 */
	p.get = function () {
		if (this.tags.length == 0) {return null;}
		this.available = this.tags.length;
		var tag = this.tags.pop();
		if (tag.parentNode == null) {document.body.appendChild(tag);}
		return tag;
	};

	/**
	 * Put an HTMLAudioElement back in the pool for use.
	 * #method set
	 * @param {HTMLAudioElement} tag HTML audio tag
	 */
	p.set = function (tag) {
		var index = createjs.indexOf(this.tags, tag);
		if (index == -1) {this.tags.push(tag);}
		this.available = this.tags.length;
	};

	/**
	 * Gets the duration for the src audio and on first call stores it to this.duration
	 * #method getDuration
	 * @return {Number} Duration of the src in milliseconds
	 */
	p.getDuration = function () {
		// this will work because this will be only be run the first time a sound instance is created and before any tags are taken from the pool
		if (!this.duration) {this.duration = this.tags[this.tags.length - 1].duration * 1000;}
		return this.duration;
	};

	p.toString = function () {
		return "[HTMLAudioPlugin TagPool]";
	};

	createjs.HTMLAudioPlugin.TagPool = TagPool;

}());
