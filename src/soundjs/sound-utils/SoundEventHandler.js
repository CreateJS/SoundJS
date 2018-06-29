// TODO remove SoundEventHandler from namespace
// namespace:
this.createjs = this.createjs || {};
createjs.soundUtils = createjs.soundUtils || {};

createjs.soundUtils.SoundEventHandler = (function (){
	var SoundEventHandler = function () {
		this.init();
	};

    var prototype = SoundEventHandler.prototype;
	prototype.constructor = SoundEventHandler;

	prototype.init = function () {
		this.addEventListener = null;
		this.removeEventListener = null;
		this.removeAllEventListeners = null;
		this.dispatchEvent = null;
		this.hasEventListener = null;
		this._listeners = null;

		createjs.EventDispatcher.initialize(this);
	};

    prototype.handleLoadComplete = _handleLoadComplete;
    prototype.handleLoadError = _handleLoadError;

    return SoundEventHandler;

    function _handleLoadComplete(event, preloadHash) {
		var src = event.target.getItem().src;
		if (!preloadHash[src]) {return;}

		for (var i = 0, l = preloadHash[src].length; i < l; i++) {
			var item = preloadHash[src][i];
			preloadHash[src][i] = true;

			if (!this.hasEventListener("fileload")) { continue; }

			var event = new createjs.Event("fileload");
			event.src = item.src;
			event.id = item.id;
			event.data = item.data;
			event.sprite = item.sprite;

			this.dispatchEvent(event);
		}
	}

    function _handleLoadError(event, preloadHash) {
		var src = event.target.getItem().src;
		if (!preloadHash[src]) {return;}

		for (var i = 0, l = preloadHash[src].length; i < l; i++) {
			var item = preloadHash[src][i];
			preloadHash[src][i] = false;

			if (!this.hasEventListener("fileerror")) { continue; }

			var event = new createjs.Event("fileerror");
			event.src = item.src;
			event.id = item.id;
			event.data = item.data;
			event.sprite = item.sprite;

			this.dispatchEvent(event);
		}
	}
})();