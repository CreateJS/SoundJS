// TODO remove SoundChannel from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundChannel = (function () {

	var SoundChannel = function (src, max) {
		this.init(src, max);
	};

	var prototype = SoundChannel.prototype;
	prototype.constructor = SoundChannel;

	prototype.init = function (src, max) {
		this.src = src;
		this.max = max || this.maxDefault;

		if (this.max == -1) {
			this.max = this.maxDefault;
		}

		this._instances = [];
		this.src = null;
		this.max = null;
		this.maxDefault = 100;
		this.length = 0;
	};

	prototype.toString = function () {
		return "[Sound SoundChannel]";
	};

	prototype._get = _get;
	prototype._add = _add;
	prototype._remove = _remove;
	prototype._removeAll = _removeAll;
	prototype._getSlot = _getSlot;

	SoundChannel.channels = {};

	SoundChannel.create = create;
	SoundChannel.removeSrc = removeSrc;
	SoundChannel.removeAll = removeAll;
	SoundChannel.add = add;
	SoundChannel.remove = remove;
	SoundChannel.maxPerChannel = maxPerChannel;
	SoundChannel.get = get;

	return SoundChannel;

	function _get(index) {
		return this._instances[index];
	}

	function _add(instance, interrupt) {
		if (!this._getSlot(interrupt, instance)) {
			return false;
		}

		this._instances.push(instance);
		this.length++;

		return true;
	}

	function _remove(instance) {
		var index = createjs.indexOf(this._instances, instance);
		
		if (index == -1) {
			return false;
		}

		this._instances.splice(index, 1);
		this.length--;

		return true;
	}

	function _removeAll() {
		// Note that stop() removes the item from the list
		for (var i=this.length-1; i>=0; i--) {
			this._instances[i].stop();
		}
	}

	function _getSlot(interrupt, instance) {
		var target, replacement;

		if (interrupt != Sound.INTERRUPT_NONE) {
			// First replacement candidate
			replacement = this._get(0);
			if (replacement == null) {
				return true;
			}
		}

		for (var i = 0, l = this.max; i < l; i++) {
			target = this._get(i);

			// Available Space
			if (target == null) {
				return true;
			}

			// Audio is complete or not playing
			if (target.playState == Sound.PLAY_FINISHED ||
				target.playState == Sound.PLAY_INTERRUPTED ||
				target.playState == Sound.PLAY_FAILED) {
				replacement = target;
				break;
			}

			if (interrupt == Sound.INTERRUPT_NONE) {
				continue;
			}

			// Audio is a better candidate than the current target, according to playhead
			if ((interrupt == Sound.INTERRUPT_EARLY && target.position < replacement.position) ||
				(interrupt == Sound.INTERRUPT_LATE && target.position > replacement.position)) {
					replacement = target;
			}
		}

		if (replacement != null) {
			replacement._interrupt();
			this._remove(replacement);
			return true;
		}

		return false;
	}

	function create(src, max) {
		var channel = SoundChannel.get(src);
		if (channel == null) {
			SoundChannel.channels[src] = new SoundChannel(src, max);
			return true;
		}

		return false;
	}

	function removeSrc(src) {
		var channel = SoundChannel.get(src);
		if (channel == null) {
			return false;
		}

		channel._removeAll();	// this stops and removes all active instances
		delete(SoundChannel.channels[src]);

		return true;
	}

	function removeAll() {
		for(var channel in SoundChannel.channels) {
			SoundChannel.channels[channel]._removeAll();	// this stops and removes all active instances
		}
		SoundChannel.channels = {};
	}

	function add(instance, interrupt) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) {
			return false;
		}

		return channel._add(instance, interrupt);
	}

	function remove(instance) {
		var channel = SoundChannel.get(instance.src);
		if (channel == null) {
			return false;
		}
		
		channel._remove(instance);
		return true;		
	}

	function maxPerChannel() {
		return p.maxDefault;
	}

	function get(src) {
		return SoundChannel.channels[src];
	}
  
})();