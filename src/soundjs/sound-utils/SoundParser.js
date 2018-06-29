// TODO remove SoundParser from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundParser = (function () {

	var FILE_PATTERN = /^(?:(\w+:)\/{2}(\w+(?:\.\w+)*\/?))?([/.]*?(?:[^?]+)?\/)?((?:[^/?]+)\.(\w+))(?:\?(\S+)?)?$/,
		MATCH_NAME = 4,
		MATCH_EXTENSION = 5;

	var _soundVolume = null;

    var SoundParser = function (soundVolume) {
		_soundVolume = soundVolume;
		this.alternateExtensions = [];
	};

	var prototype = SoundParser.prototype;
	prototype.constructor = SoundParser;

    prototype.parsePath = _parsePath;
	prototype.parseSrc = _parseSrc;

	SoundParser.FILE_PATTERN = FILE_PATTERN;

    return SoundParser;

    function _parsePath(value) {
		if (typeof(value) != "string") {
			value = value.toString();
		}

		var match = value.match(FILE_PATTERN);
		if (match == null) { return false; }

		var name = match[MATCH_NAME];
		var extension = match[MATCH_EXTENSION];
		var capabilities = _soundVolume.capabilities;
		var i = 0;
		while (!capabilities[extension]) {
			extension = this.alternateExtensions[i++];
			if (i > this.alternateExtensions.length) { return null; }	// no extensions are supported
		}
		value = value.replace("."+match[MATCH_EXTENSION], "."+extension);

		var ret = {name:name, src:value, extension:extension};
		return ret;
	}

    function _parseSrc(value) {
		var ret = {name:undefined, src:undefined, extension:undefined};
		var c = _soundVolume.capabilities;

		for (var prop in value) {
		  if(value.hasOwnProperty(prop) && c[prop]) {
				ret.src = value[prop];
				ret.extension = prop;
				break;
		  }
		}
		if (!ret.src) {return false;}	// no matches

		var i = ret.src.lastIndexOf("/");
		if (i != -1) {
			ret.name = ret.src.slice(i+1);
		} else {
			ret.name = ret.src;
		}

		return ret;
	}
})();