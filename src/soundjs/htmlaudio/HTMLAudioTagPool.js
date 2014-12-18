/*
 * HTMLAudioTagPool
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

//TODO verify that tags no longer need to be precreated (mac and pc)
//TODO modify this now that tags do not need to be precreated
(function () {
	"use strict";

	/**
	 * The TagPool is an object pool for HTMLAudio tag instances. In Chrome, we have to pre-create the number of HTML
	 * audio tag instances that we are going to play before we load the data, otherwise the audio stalls.
	 * (Note: This seems to be a bug in Chrome)
	 * @class HTMLAudioTagPool
	 * @param {String} src The source of the channel.
	 * @protected
	 */
	function TagPool(src) {


//Public Properties
		/**
		 * The source of the tag pool.
		 * #property src
		 * @type {String}
		 * @protected
		 */
		this.src = src;

		/**
		 * The total number of HTMLAudio tags in this pool. This is the maximum number of instance of a certain sound
		 * that can play at one time.
		 * #property length
		 * @type {Number}
		 * @default 0
		 * @protected
		 */
		this.length = 0;

		/**
		 * The number of unused HTMLAudio tags.
		 * #property available
		 * @type {Number}
		 * @default 0
		 * @protected
		 */
		this.available = 0;

		/**
		 * A list of all available tags in the pool.
		 * #property tags
		 * @type {Array}
		 * @protected
		 */
		this.tags = [];

		/**
		 * The duration property of all audio tags, converted to milliseconds, which originally is only available on the
		 * last tag in the tags array because that is the one that is loaded.
		 * #property
		 * @type {Number}
		 * @protected
		 */
		this.duration = 0;
	};

	var p = TagPool.prototype;
	p.constructor = TagPool;
	var s = TagPool;

	// TODO: deprecated
	// p.initialize = function() {}; // searchable for devs wondering where it is. REMOVED. See docs for details.


// Static Properties
	/**
	 * A hash lookup of each sound channel, indexed by the audio source.
	 * #property tags
	 * @static
	 * @protected
	 */
	s.tags = {};


// Static Methods
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


// Public Methods
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
		return "[HTMLAudioTagPool]";
	};

	createjs.HTMLAudioTagPool = TagPool;
}());
