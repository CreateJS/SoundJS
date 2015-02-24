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

(function () {
	"use strict";

	/**
	 * HTMLAudioTagPool is an object pool for HTMLAudio tag instances.
	 * @class HTMLAudioTagPool
	 * @param {String} src The source of the channel.
	 * @protected
	 */
	function HTMLAudioTagPool() {
			throw "HTMLAudioTagPool cannot be instantiated";
	}

	var s = HTMLAudioTagPool;

// Static Properties
	/**
	 * A hash lookup of each base audio tag, indexed by the audio source.
	 * @property _tags
	 * @type {{}}
	 * @static
	 * @protected
	 */
	s._tags = {};

	/**
	 * An object pool for html audio tags
	 * @property _tagPool
	 * @type {TagPool}
	 * @static
	 * @protected
	 */
	s._tagPool = new TagPool();

	/**
	 * A hash lookup of if a base audio tag is available, indexed by the audio source
	 * @property _tagsUsed
	 * @type {{}}
	 * @protected
	 * @static
	 */
	s._tagUsed = {};

// Static Methods
	/**
	  * Get an audio tag with the given source.
	  * @method get
	  * @param {String} src The source file used by the audio tag.
	  * @static
	  */
	 s.get = function (src) {
		var t = s._tags[src];
		if (t == null) {
			// create new base tag
			t = s._tags[src] = s._tagPool.get();
			t.src = src;
		} else {
			// get base or pool
			if (s._tagUsed[src]) {
				t = s._tagPool.get();
				t.src = src;
			} else {
				s._tagUsed[src] = true;
			}
		}
		return t;
	 };

	 /**
	  * Return an audio tag to the pool.
	  * @method set
	  * @param {String} src The source file used by the audio tag.
	  * @param {HTMLElement} tag Audio tag to set.
	  * @static
	  */
	 s.set = function (src, tag) {
		 // check if this is base, if yes set boolean if not return to pool
		 if(tag == s._tags[src]) {
			 s._tagUsed[src] = false;
		 } else {
			 s._tagPool.set(tag);
		 }
	 };

	/**
	 * Delete stored tag reference and return them to pool. Note that if the tag reference does not exist, this will fail.
	 * @method remove
	 * @param {String} src The source for the tag
	 * @return {Boolean} If the TagPool was deleted.
	 * @static
	 */
	s.remove = function (src) {
		var tag = s._tags[src];
		if (tag == null) {return false;}
		s._tagPool.set(tag);
		delete(s._tags[src]);
		delete(s._tagUsed[src]);
		return true;
	};

	/**
	 * Gets the duration of the src audio in milliseconds
	 * @method getDuration
	 * @param {String} src The source file used by the audio tag.
	 * @return {Number} Duration of src in milliseconds
	 * @static
	 */
	s.getDuration= function (src) {
		var t = s._tags[src];
		if (t == null) {return 0;}
		return t.duration * 1000;
	};

	createjs.HTMLAudioTagPool = HTMLAudioTagPool;


// ************************************************************************************************************
	/**
	 * The TagPool is an object pool for HTMLAudio tag instances.
	 * #class TagPool
	 * @param {String} src The source of the channel.
	 * @protected
	 */
	function TagPool(src) {

// Public Properties
		/**
		 * A list of all available tags in the pool.
		 * #property tags
		 * @type {Array}
		 * @protected
		 */
		this._tags = [];
	};

	var p = TagPool.prototype;
	p.constructor = TagPool;


// Public Methods
	/**
	 * Get an HTMLAudioElement for immediate playback. This takes it out of the pool.
	 * #method get
	 * @return {HTMLAudioElement} An HTML audio tag.
	 */
	p.get = function () {
		var tag;
		if (this._tags.length == 0) {
			tag = this._createTag();
		} else {
			tag = this._tags.pop();
		}
		if (tag.parentNode == null) {document.body.appendChild(tag);}
		return tag;
	};

	/**
	 * Put an HTMLAudioElement back in the pool for use.
	 * #method set
	 * @param {HTMLAudioElement} tag HTML audio tag
	 */
	p.set = function (tag) {
		// OJR this first step seems unnecessary
		var index = createjs.indexOf(this._tags, tag);
		if (index == -1) {
			this._tags.src = null;
			this._tags.push(tag);
		}
	};

	p.toString = function () {
		return "[TagPool]";
	};


// Private Methods
	/**
	 * Create an HTML audio tag.
	 * #method _createTag
	 * @param {String} src The source file to set for the audio tag.
	 * @return {HTMLElement} Returns an HTML audio tag.
	 * @protected
	 */
	p._createTag = function () {
		var tag = document.createElement("audio");
		tag.autoplay = false;
		tag.preload = "none";
		//LM: Firefox fails when this the preload="none" for other tags, but it needs to be "none" to ensure PreloadJS works.
		return tag;
	};

}());
