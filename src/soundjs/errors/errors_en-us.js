(function() {
	var logs = {
		AUDIO_FAILED_404: "File %DETAILS can not play. 404 file not found",
		AUDIO_FAILED_INTERRUPT: "File %DETAILS% can not play. No available channels to interrupt.",
		AUDIO_FAILED_NOT_LOADED: "File %DETAILS% can not play. Not preloaded yet.",
		AUDIO_FLASH_FAILED: "Flash was unable to initialize."
	}
	createjs.Log && createjs.Log.addKeys(logs);
}())