/*
 * PlayPropsConfig
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
	 * A class to store the optional play properties passed in {{#crossLink "Sound/play"}}{{/crossLink}} and
	 * {{#crossLink "AbstractSoundInstance/play"}}{{/crossLink}} calls.
	 *
	 * Optional Play Properties Include:
	 * <ul>
	 * <li>interrupt - How to interrupt any currently playing instances of audio with the same source,
	 * if the maximum number of instances of the sound are already playing. Values are defined as <code>INTERRUPT_TYPE</code>
	 * constants on the Sound class, with the default defined by {{#crossLink "Sound/defaultInterruptBehavior:property"}}{{/crossLink}}.</li>
	 * <li>delay - The amount of time to delay the start of audio playback, in milliseconds.</li>
	 * <li>offset - The offset from the start of the audio to begin playback, in milliseconds.</li>
	 * <li>loop - How many times the audio loops when it reaches the end of playback. The default is 0 (no
	 * loops), and -1 can be used for infinite playback.</li>
	 * <li>volume - The volume of the sound, between 0 and 1. Note that the master volume is applied
	 * against the individual volume.</li>
	 * <li>pan - The left-right pan of the sound (if supported), between -1 (left) and 1 (right).</li>
	 * <li>startTime - To create an audio sprite (with duration), the initial offset to start playback and loop from, in milliseconds.</li>
	 * <li>duration - To create an audio sprite (with startTime), the amount of time to play the clip for, in milliseconds.</li>
	 * </ul>
	 *
	 * <h4>Example</h4>
	 *
	 * 	var ppc = new createjs.PlayPropsConfig().set({interrupt: createjs.Sound.INTERRUPT_ANY, loop: -1, volume: 0.5})
	 * 	createjs.Sound.play("mySound", ppc);
	 * 	mySoundInstance.play(ppc);
	 *
	 * @class PlayPropsConfig
	 * @constructor
	 * @since 0.6.1
	 */
	// TODO think of a better name for this class
	var PlayPropsConfig = function () {
// Public Properties
		/**
		 * How to interrupt any currently playing instances of audio with the same source,
		 * if the maximum number of instances of the sound are already playing. Values are defined as
		 * <code>INTERRUPT_TYPE</code> constants on the Sound class, with the default defined by
		 * {{#crossLink "Sound/defaultInterruptBehavior:property"}}{{/crossLink}}.
		 * @property interrupt
		 * @type {string}
		 * @default null
		 */
		this.interrupt = null;

		/**
		 * The amount of time to delay the start of audio playback, in milliseconds.
		 * @property delay
		 * @type {Number}
		 * @default null
		 */
		this.delay = null;

		/**
		 * The offset from the start of the audio to begin playback, in milliseconds.
		 * @property offset
		 * @type {number}
		 * @default null
		 */
		this.offset = null;

		/**
		 * How many times the audio loops when it reaches the end of playback. The default is 0 (no
		 * loops), and -1 can be used for infinite playback.
		 * @property loop
		 * @type {number}
		 * @default null
		 */
		this.loop = null;

		/**
		 * The volume of the sound, between 0 and 1. Note that the master volume is applied
		 * against the individual volume.
		 * @property volume
		 * @type {number}
		 * @default null
		 */
		this.volume = null;

		/**
		 * The left-right pan of the sound (if supported), between -1 (left) and 1 (right).
		 * @property pan
		 * @type {number}
		 * @default null
		 */
		this.pan = null;

		/**
		 * Used to create an audio sprite (with duration), the initial offset to start playback and loop from, in milliseconds.
		 * @property startTime
		 * @type {number}
		 * @default null
		 */
		this.startTime = null;

		/**
		 * Used to create an audio sprite (with startTime), the amount of time to play the clip for, in milliseconds.
		 * @property duration
		 * @type {number}
		 * @default null
		 */
		this.duration = null;
	};
	var p = PlayPropsConfig.prototype = {};
	var s = PlayPropsConfig;


// Static Methods
	/**
	 * Creates a PlayPropsConfig from another PlayPropsConfig or an Object.
	 *
	 * @method create
	 * @param {PlayPropsConfig|Object} value The play properties
	 * @returns {PlayPropsConfig}
	 * @static
	 */
	s.create = function (value) {
		if (value instanceof s || value instanceof Object) {
			var ppc = new createjs.PlayPropsConfig();
			ppc.set(value);
			return ppc;
		} else {
			throw new Error("Type not recognized.");
		}
	};

// Public Methods
	/**
	 * Provides a chainable shortcut method for setting a number of properties on the instance.
	 *
	 * <h4>Example</h4>
	 *
	 *      var PlayPropsConfig = new createjs.PlayPropsConfig().set({loop:-1, volume:0.7});
	 *
	 * @method set
	 * @param {Object} props A generic object containing properties to copy to the PlayPropsConfig instance.
	 * @return {PlayPropsConfig} Returns the instance the method is called on (useful for chaining calls.)
	*/
	p.set = function(props) {
		for (var n in props) { this[n] = props[n]; }
		return this;
	};

	p.toString = function() {
		return "[PlayPropsConfig]";
	};

	createjs.PlayPropsConfig = s;

}());
