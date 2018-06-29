// TODO remove SoundPlugin from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundPlugin = (function () {

	var _pluginsRegistered = false;

	var SoundPlugin = function () {
		this.activePlugin = null;
	};

	var prototype = SoundPlugin.prototype;
	prototype.constructor = SoundPlugin;

	prototype.registerPlugins = registerPlugins;
	prototype.registerPlugin = _registerPlugin;
	prototype.initializeDefaultPlugins = initializeDefaultPlugins;
	prototype.isReady = isReady;

	return SoundPlugin;

	function registerPlugins(plugins) {
		_pluginsRegistered = true;
		for (var i = 0, l = plugins.length; i < l; i++) {
			if (_registerPlugin(plugins[i])) {
				return true;
			}
		}
		return false;
	}

	function _registerPlugin(plugin) {
		// Note: Each plugin is passed in as a class reference, but we store the activePlugin as an instance
		if (plugin && plugin.isSupported()) {
			this.activePlugin = new plugin();
			return true;
		}
		return false;
	}

	function initializeDefaultPlugins() {
		if (this.activePlugin != null) {
			return true;
		}
		if (_pluginsRegistered) {
			return false;
		}
		if (registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin])) {
			return true;
		}
		return false;
	}

	function isReady() {
		return (this.activePlugin != null);
	}
})();