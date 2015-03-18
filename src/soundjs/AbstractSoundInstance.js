/*
 * AbstractSoundInstance
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
 * A AbstractSoundInstance is created when any calls to the Sound API method {{#crossLink "Sound/play"}}{{/crossLink}} or
 * {{#crossLink "Sound/createInstance"}}{{/crossLink}} are made. The AbstractSoundInstance is returned by the active plugin
 * for control by the user.
 *
 * <h4>Example</h4>
 *
 *      var myInstance = createjs.Sound.play("myAssetPath/mySrcFile.mp3");
 *
 * A number of additional parameters provide a quick way to determine how a sound is played. Please see the Sound
 * API method {{#crossLink "Sound/play"}}{{/crossLink}} for a list of arguments.
 *
 * Once a AbstractSoundInstance is created, a reference can be stored that can be used to control the audio directly through
 * the AbstractSoundInstance. If the reference is not stored, the AbstractSoundInstance will play out its audio (and any loops), and
 * is then de-referenced from the {{#crossLink "Sound"}}{{/crossLink}} class so that it can be cleaned up. If audio
 * playback has completed, a simple call to the {{#crossLink "AbstractSoundInstance/play"}}{{/crossLink}} instance method
 * will rebuild the references the Sound class need to control it.
 *
 *      var myInstance = createjs.Sound.play("myAssetPath/mySrcFile.mp3", {loop:2});
 *      myInstance.on("loop", handleLoop);
 *      function handleLoop(event) {
 *          myInstance.volume = myInstance.volume * 0.5;
 *      }
 *
 * Events are dispatched from the instance to notify when the sound has completed, looped, or when playback fails
 *
 *      var myInstance = createjs.Sound.play("myAssetPath/mySrcFile.mp3");
 *      myInstance.on("complete", handleComplete);
 *      myInstance.on("loop", handleLoop);
 *      myInstance.on("failed", handleFailed);
 *
 *
 * @class AbstractSoundInstance
 * @param {String} src The path to and file name of the sound.
 * @param {Number} startTime Audio sprite property used to apply an offset, in milliseconds.
 * @param {Number} duration Audio sprite property used to set the time the clip plays for, in milliseconds.
 * @param {Object} playbackResource Any resource needed by plugin to support audio playback.
 * @extends EventDispatcher
 * @constructor
 */

(function () {
	"use strict";


// Constructor:
	var AbstractSoundInstance = function (src, startTime, duration, playbackResource) {
		this.EventDispatcher_constructor();


	// public properties:
		/**
		 * The source of the sound.
		 * @property src
		 * @type {String}
		 * @default null
		 */
		this.src = src;

		/**
		 * The unique ID of the instance. This is set by {{#crossLink "Sound"}}{{/crossLink}}.
		 * @property uniqueId
		 * @type {String} | Number
		 * @default -1
		 */
		this.uniqueId = -1;

		/**
		 * The play state of the sound. Play states are defined as constants on {{#crossLink "Sound"}}{{/crossLink}}.
		 * @property playState
		 * @type {String}
		 * @default null
		 */
		this.playState = null;

		/**
		 * A Timeout created by {{#crossLink "Sound"}}{{/crossLink}} when this AbstractSoundInstance is played with a delay.
		 * This allows AbstractSoundInstance to remove the delay if stop, pause, or cleanup are called before playback begins.
		 * @property delayTimeoutId
		 * @type {timeoutVariable}
		 * @default null
		 * @protected
		 * @since 0.4.0
		 */
		this.delayTimeoutId = null;
		// TODO consider moving delay into AbstractSoundInstance so it can be handled by plugins


	// private properties
	// Getter / Setter Properties
		// OJR TODO find original reason that we didn't use defined functions.  I think it was performance related
		/**
		 * The volume of the sound, between 0 and 1.
		 *
		 * The actual output volume of a sound can be calculated using:
		 * <code>myInstance.volume * createjs.Sound.getVolume();</code>
		 *
		 * @property volume
		 * @type {Number}
		 * @default 1
		 */
		this._volume =  1;
		Object.defineProperty(this, "volume", {
			get: this.getVolume,
			set: this.setVolume
		});

		/**
		 * The pan of the sound, between -1 (left) and 1 (right). Note that pan is not supported by HTML Audio.
		 *
		 * <br />Note in WebAudioPlugin this only gives us the "x" value of what is actually 3D audio.
		 *
		 * @property pan
		 * @type {Number}
		 * @default 0
		 */
		this._pan =  0;
		Object.defineProperty(this, "pan", {
			get: this.getPan,
			set: this.setPan
		});

		/**
		 * Audio sprite property used to determine the starting offset.
		 * @property startTime
		 * @type {Number}
		 * @default 0
		 * @since 0.6.1
		 */
		this._startTime = Math.max(0, startTime || 0);
		Object.defineProperty(this, "startTime", {
			get: this.getStartTime,
			set: this.setStartTime
		});

		/**
		 * The length of the audio clip, in milliseconds.
		 *
		 * @property duration
		 * @type {Number}
		 * @default 0
		 * @since 0.6.0
		 */
		this._duration = Math.max(0, duration || 0);
		Object.defineProperty(this, "duration", {
			get: this.getDuration,
			set: this.setDuration
		});

		/**
		 * Object that holds plugin specific resource need for audio playback.
		 * This is set internally by the plugin.  For example, WebAudioPlugin will set an array buffer,
		 * HTMLAudioPlugin will set a tag, FlashAudioPlugin will set a flash reference.
		 *
		 * @property playbackResource
		 * @type {Object}
		 * @default null
		 */
		this._playbackResource = null;
		Object.defineProperty(this, "playbackResource", {
			get: this.getPlaybackResource,
			set: this.setPlaybackResource
		});
		if(playbackResource !== false && playbackResource !== true) { this.setPlaybackResource(playbackResource); }

		/**
		 * The position of the playhead in milliseconds. This can be set while a sound is playing, paused, or stopped.
		 *
		 * @property position
		 * @type {Number}
		 * @default 0
		 * @since 0.6.0
		 */
		this._position = 0;
		Object.defineProperty(this, "position", {
			get: this.getPosition,
			set: this.setPosition
		});

		/**
		 * The number of play loops remaining. Negative values will loop infinitely.
		 *
		 * @property loop
		 * @type {Number}
		 * @default 0
		 * @public
		 * @since 0.6.0
		 */
		this._loop = 0;
		Object.defineProperty(this, "loop", {
			get: this.getLoop,
			set: this.setLoop
		});

		/**
		 * Determines if the audio is currently muted.
		 *
		 * @property muted
		 * @type {Boolean}
		 * @default false
		 * @since 0.6.0
		 */
		this._muted = false;
		Object.defineProperty(this, "muted", {
			get: this.getMuted,
			set: this.setMuted
		});

		/**
		 * Tells you if the audio is currently paused.
		 *
		 * @property paused
		 * @type {Boolean}
		 */
		this._paused = false;
		Object.defineProperty(this, "paused", {
			get: this.getPaused,
			set: this.setPaused
		});


	// Events
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
	};

	var p = createjs.extend(AbstractSoundInstance, createjs.EventDispatcher);

	// TODO: deprecated
	// p.initialize = function() {}; // searchable for devs wondering where it is. REMOVED. See docs for details.


// Public Methods:
	/**
	 * Play an instance. This method is intended to be called on SoundInstances that already exist (created
	 * with the Sound API {{#crossLink "Sound/createInstance"}}{{/crossLink}} or {{#crossLink "Sound/play"}}{{/crossLink}}).
	 *
	 * <h4>Example</h4>
	 *
	 *      var myInstance = createjs.Sound.createInstance(mySrc);
	 *      myInstance.play({interrupt:createjs.Sound.INTERRUPT_ANY, loop:2, pan:0.5});
	 *
	 * Note that if this sound is already playing, this call will still set the passed in parameters.

	 * <b>Parameters Deprecated</b><br />
	 * The parameters for this method are deprecated in favor of a single parameter that is an Object or {{#crossLink "PlayPropsConfig"}}{{/crossLink}}.
	 *
	 * @method play
	 * @param {String | Object} [interrupt="none"|options] <b>This parameter will be renamed playProps in the next release.</b><br />
	 * This parameter can be an instance of {{#crossLink "PlayPropsConfig"}}{{/crossLink}} or an Object that contains any or all optional properties by name,
	 * including: interrupt, delay, offset, loop, volume, pan, startTime, and duration (see the above code sample).
	 * <br /><strong>OR</strong><br />
	 * <b>Deprecated</b> How to interrupt any currently playing instances of audio with the same source,
	 * if the maximum number of instances of the sound are already playing. Values are defined as <code>INTERRUPT_TYPE</code>
	 * constants on the Sound class, with the default defined by {{#crossLink "Sound/defaultInterruptBehavior:property"}}{{/crossLink}}.
	 * @param {Number} [delay=0] <b>Deprecated</b> The amount of time to delay the start of audio playback, in milliseconds.
	 * @param {Number} [offset=0] <b>Deprecated</b> The offset from the start of the audio to begin playback, in milliseconds.
	 * @param {Number} [loop=0] <b>Deprecated</b> How many times the audio loops when it reaches the end of playback. The default is 0 (no
	 * loops), and -1 can be used for infinite playback.
	 * @param {Number} [volume=1] <b>Deprecated</b> The volume of the sound, between 0 and 1. Note that the master volume is applied
	 * against the individual volume.
	 * @param {Number} [pan=0] <b>Deprecated</b> The left-right pan of the sound (if supported), between -1 (left) and 1 (right).
	 * Note that pan is not supported for HTML Audio.
	 * @return {AbstractSoundInstance} A reference to itself, intended for chaining calls.
	 */
	p.play = function (interrupt, delay, offset, loop, volume, pan) {
		var playProps;
		if (interrupt instanceof Object || interrupt instanceof createjs.PlayPropsConfig) {
			playProps = createjs.PlayPropsConfig.create(interrupt);
		} else {
			playProps = createjs.PlayPropsConfig.create({interrupt:interrupt, delay:delay, offset:offset, loop:loop, volume:volume, pan:pan});
		}

		if (this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			this.applyPlayProps(playProps);
			if (this._paused) {	this.setPaused(false); }
			return;
		}
		this._cleanUp();
		createjs.Sound._playInstance(this, playProps);	// make this an event dispatch??
		return this;
	};

	/**
	 * Stop playback of the instance. Stopped sounds will reset their position to 0, and calls to {{#crossLink "AbstractSoundInstance/resume"}}{{/crossLink}}
	 * will fail.  To start playback again, call {{#crossLink "AbstractSoundInstance/play"}}{{/crossLink}}.
	 *
	 * <h4>Example</h4>
	 *
	 *     myInstance.stop();
	 *
	 * @method stop
	 * @return {AbstractSoundInstance} A reference to itself, intended for chaining calls.
	 */
	p.stop = function () {
		this._position = 0;
		this._paused = false;
		this._handleStop();
		this._cleanUp();
		this.playState = createjs.Sound.PLAY_FINISHED;
		return this;
	};

	/**
	 * Remove all external references and resources from AbstractSoundInstance.  Note this is irreversible and AbstractSoundInstance will no longer work
	 * @method destroy
	 * @since 0.6.0
	 */
	p.destroy = function() {
		this._cleanUp();
		this.src = null;
		this.playbackResource = null;

		this.removeAllEventListeners();
	};

	/**
	 * Takes an PlayPropsConfig or Object with the same properties and sets them on this instance.
	 * @method applyPlayProps
	 * @param {PlayPropsConfig | Object} playProps A PlayPropsConfig or object containing the same properties.
	 * @since 0.6.1
	 * @return {AbstractSoundInstance} A reference to itself, intended for chaining calls.
	 */
	p.applyPlayProps = function(playProps) {
		if (playProps.offset != null) { this.setPosition(playProps.offset) }
		if (playProps.loop != null) { this.setLoop(playProps.loop); }
		if (playProps.volume != null) { this.setVolume(playProps.volume); }
		if (playProps.pan != null) { this.setPan(playProps.pan); }
		if (playProps.startTime != null) {
			this.setStartTime(playProps.startTime);
			this.setDuration(playProps.duration);
		}
		return this;
	};

	p.toString = function () {
		return "[AbstractSoundInstance]";
	};

// get/set methods that allow support for IE8
	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/paused:property"}}{{/crossLink}} directly as a property,
	 *
	 * @deprecated
	 * @method getPaused
	 * @returns {boolean} If the instance is currently paused
	 * @since 0.6.0
	 */
	p.getPaused = function() {
		return this._paused;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/paused:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setPaused
	 * @param {boolean} value
	 * @since 0.6.0
	 * @return {AbstractSoundInstance} A reference to itself, intended for chaining calls.
	 */
	p.setPaused = function (value) {
		if ((value !== true && value !== false) || this._paused == value) {return;}
		if (value == true && this.playState != createjs.Sound.PLAY_SUCCEEDED) {return;}
		this._paused = value;
		if(value) {
			this._pause();
		} else {
			this._resume();
		}
		clearTimeout(this.delayTimeoutId);
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/volume:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setVolume
	 * @param {Number} value The volume to set, between 0 and 1.
	 * @return {AbstractSoundInstance} A reference to itself, intended for chaining calls.
	 */
	p.setVolume = function (value) {
		if (value == this._volume) { return this; }
		this._volume = Math.max(0, Math.min(1, value));
		if (!this._muted) {
			this._updateVolume();
		}
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/volume:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method getVolume
	 * @return {Number} The current volume of the sound instance.
	 */
	p.getVolume = function () {
		return this._volume;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/muted:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setMuted
	 * @param {Boolean} value If the sound should be muted.
	 * @return {AbstractSoundInstance} A reference to itself, intended for chaining calls.
	 * @since 0.6.0
	 */
	p.setMuted = function (value) {
		if (value !== true && value !== false) {return;}
		this._muted = value;
		this._updateVolume();
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/muted:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method getMuted
	 * @return {Boolean} If the sound is muted.
	 * @since 0.6.0
	 */
	p.getMuted = function () {
		return this._muted;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/pan:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setPan
	 * @param {Number} value The pan value, between -1 (left) and 1 (right).
	 * @return {AbstractSoundInstance} Returns reference to itself for chaining calls
	 */
	p.setPan = function (value) {
		if(value == this._pan) { return this; }
		this._pan = Math.max(-1, Math.min(1, value));
		this._updatePan();
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/pan:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method getPan
	 * @return {Number} The value of the pan, between -1 (left) and 1 (right).
	 */
	p.getPan = function () {
		return this._pan;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/position:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method getPosition
	 * @return {Number} The position of the playhead in the sound, in milliseconds.
	 */
	p.getPosition = function () {
		if (!this._paused && this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			this._position = this._calculateCurrentPosition();
		}
		return this._position;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/position:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setPosition
	 * @param {Number} value The position to place the playhead, in milliseconds.
	 * @return {AbstractSoundInstance} Returns reference to itself for chaining calls
	 */
	p.setPosition = function (value) {
		this._position = Math.max(0, value);
		if (this.playState == createjs.Sound.PLAY_SUCCEEDED) {
			this._updatePosition();
		}
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/startTime:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method getStartTime
	 * @return {Number} The startTime of the sound instance in milliseconds.
	 */
	p.getStartTime = function () {
		return this._startTime;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/startTime:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setStartTime
	 * @param {number} value The new startTime time in milli seconds.
	 * @return {AbstractSoundInstance} Returns reference to itself for chaining calls
	 */
	p.setStartTime = function (value) {
		if (value == this._startTime) { return this; }
		this._startTime = Math.max(0, value || 0);
		this._updateStartTime();
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/duration:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method getDuration
	 * @return {Number} The duration of the sound instance in milliseconds.
	 */
	p.getDuration = function () {
		return this._duration;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/duration:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setDuration
	 * @param {number} value The new duration time in milli seconds.
	 * @return {AbstractSoundInstance} Returns reference to itself for chaining calls
	 * @since 0.6.0
	 */
	p.setDuration = function (value) {
		if (value == this._duration) { return this; }
		this._duration = Math.max(0, value || 0);
		this._updateDuration();
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/playbackResource:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setPlayback
	 * @param {Object} value The new playback resource.
	 * @return {AbstractSoundInstance} Returns reference to itself for chaining calls
	 * @since 0.6.0
	 **/
	p.setPlaybackResource = function (value) {
		this._playbackResource = value;
		if (this._duration == 0) { this._setDurationFromSource(); }
		return this;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/playbackResource:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method setPlayback
	 * @param {Object} value The new playback resource.
	 * @return {Object} playback resource used for playing audio
	 * @since 0.6.0
	 **/
	p.getPlaybackResource = function () {
		return this._playbackResource;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/loop:property"}}{{/crossLink}} directly as a property
	 *
	 * @deprecated
	 * @method getLoop
	 * @return {number}
	 * @since 0.6.0
	 **/
	p.getLoop = function () {
		return this._loop;
	};

	/**
	 * DEPRECATED, please use {{#crossLink "AbstractSoundInstance/loop:property"}}{{/crossLink}} directly as a property,
	 *
	 * @deprecated
	 * @method setLoop
	 * @param {number} value The number of times to loop after play.
	 * @since 0.6.0
	 */
	p.setLoop = function (value) {
		if(this._playbackResource != null) {
			// remove looping
			if (this._loop != 0 && value == 0) {
				this._removeLooping(value);
			}
			// add looping
			else if (this._loop == 0 && value != 0) {
				this._addLooping(value);
			}
		}
		this._loop = value;
	};


// Private Methods:
	/**
	 * A helper method that dispatches all events for AbstractSoundInstance.
	 * @method _sendEvent
	 * @param {String} type The event type
	 * @protected
	 */
	p._sendEvent = function (type) {
		var event = new createjs.Event(type);
		this.dispatchEvent(event);
	};

	/**
	 * Clean up the instance. Remove references and clean up any additional properties such as timers.
	 * @method _cleanUp
	 * @protected
	 */
	p._cleanUp = function () {
		clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
		this._handleCleanUp();
		this._paused = false;

		createjs.Sound._playFinished(this);	// TODO change to an event
	};

	/**
	 * The sound has been interrupted.
	 * @method _interrupt
	 * @protected
	 */
	p._interrupt = function () {
		this._cleanUp();
		this.playState = createjs.Sound.PLAY_INTERRUPTED;
		this._sendEvent("interrupted");
	};

	/**
	 * Called by the Sound class when the audio is ready to play (delay has completed). Starts sound playing if the
	 * src is loaded, otherwise playback will fail.
	 * @method _beginPlaying
	 * @param {PlayPropsConfig} playProps A PlayPropsConfig object.
	 * @return {Boolean} If playback succeeded.
	 * @protected
	 */
	// OJR FlashAudioSoundInstance overwrites
	p._beginPlaying = function (playProps) {
		this.setPosition(playProps.offset);
		this.setLoop(playProps.loop);
		this.setVolume(playProps.volume);
		this.setPan(playProps.pan);
		if (playProps.startTime != null) {
			this.setStartTime(playProps.startTime);
			this.setDuration(playProps.duration);
		}

		if (this._playbackResource != null && this._position < this._duration) {
			this._paused = false;
			this._handleSoundReady();
			this.playState = createjs.Sound.PLAY_SUCCEEDED;
			this._sendEvent("succeeded");
			return true;
		} else {
			this._playFailed();
			return false;
		}
	};

	/**
	 * Play has failed, which can happen for a variety of reasons.
	 * Cleans up instance and dispatches failed event
	 * @method _playFailed
	 * @private
	 */
	p._playFailed = function () {
		this._cleanUp();
		this.playState = createjs.Sound.PLAY_FAILED;
		this._sendEvent("failed");
	};

	/**
	 * Audio has finished playing. Manually loop it if required.
	 * @method _handleSoundComplete
	 * @param event
	 * @protected
	 */
	p._handleSoundComplete = function (event) {
		this._position = 0;  // have to set this as it can be set by pause during playback

		if (this._loop != 0) {
			this._loop--;  // NOTE this introduces a theoretical limit on loops = float max size x 2 - 1
			this._handleLoop();
			this._sendEvent("loop");
			return;
		}

		this._cleanUp();
		this.playState = createjs.Sound.PLAY_FINISHED;
		this._sendEvent("complete");
	};

// Plugin specific code
	/**
	 * Handles starting playback when the sound is ready for playing.
	 * @method _handleSoundReady
	 * @protected
 	 */
	p._handleSoundReady = function () {
		// plugin specific code
	};

	/**
	 * Internal function used to update the volume based on the instance volume, master volume, instance mute value,
	 * and master mute value.
	 * @method _updateVolume
	 * @protected
	 */
	p._updateVolume = function () {
		// plugin specific code
	};

	/**
	 * Internal function used to update the pan
	 * @method _updatePan
	 * @protected
	 * @since 0.6.0
	 */
	p._updatePan = function () {
		// plugin specific code
	};

	/**
	 * Internal function used to update the startTime of the audio.
	 * @method _updateStartTime
	 * @protected
	 * @since 0.6.1
	 */
	p._updateStartTime = function () {
		// plugin specific code
	};

	/**
	 * Internal function used to update the duration of the audio.
	 * @method _updateDuration
	 * @protected
	 * @since 0.6.0
	 */
	p._updateDuration = function () {
		// plugin specific code
	};

	/**
	 * Internal function used to get the duration of the audio from the source we'll be playing.
	 * @method _updateDuration
	 * @protected
	 * @since 0.6.0
	 */
	p._setDurationFromSource = function () {
		// plugin specific code
	};

	/**
	 * Internal function that calculates the current position of the playhead and sets this._position to that value
	 * @method _calculateCurrentPosition
	 * @protected
	 * @since 0.6.0
	 */
	p._calculateCurrentPosition = function () {
		// plugin specific code that sets this.position
	};

	/**
	 * Internal function used to update the position of the playhead.
	 * @method _updatePosition
	 * @protected
	 * @since 0.6.0
	 */
	p._updatePosition = function () {
		// plugin specific code
	};

	/**
	 * Internal function called when looping is removed during playback.
	 * @method _removeLooping
	 * @param {number} value The number of times to loop after play.
	 * @protected
	 * @since 0.6.0
	 */
	p._removeLooping = function (value) {
		// plugin specific code
	};

	/**
	 * Internal function called when looping is added during playback.
	 * @method _addLooping
	 * @param {number} value The number of times to loop after play.
	 * @protected
	 * @since 0.6.0
	 */
	p._addLooping = function (value) {
		// plugin specific code
	};

	/**
	 * Internal function called when pausing playback
	 * @method _pause
	 * @protected
	 * @since 0.6.0
	 */
	p._pause = function () {
		// plugin specific code
	};

	/**
	 * Internal function called when resuming playback
	 * @method _resume
	 * @protected
	 * @since 0.6.0
	 */
	p._resume = function () {
		// plugin specific code
	};

	/**
	 * Internal function called when stopping playback
	 * @method _handleStop
	 * @protected
	 * @since 0.6.0
	 */
	p._handleStop = function() {
		// plugin specific code
	};

	/**
	 * Internal function called when AbstractSoundInstance is being cleaned up
	 * @method _handleCleanUp
	 * @protected
	 * @since 0.6.0
	 */
	p._handleCleanUp = function() {
		// plugin specific code
	};

	/**
	 * Internal function called when AbstractSoundInstance has played to end and is looping
	 * @method _handleLoop
	 * @protected
	 * @since 0.6.0
	 */
	p._handleLoop = function () {
		// plugin specific code
	};

	createjs.AbstractSoundInstance = createjs.promote(AbstractSoundInstance, "EventDispatcher");
	createjs.DefaultSoundInstance = createjs.AbstractSoundInstance;	// used when no plugin is supported
}());
