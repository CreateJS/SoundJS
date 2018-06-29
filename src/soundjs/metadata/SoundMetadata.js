// namespace:
this.createjs = this.createjs || {};

createjs.metadata.sound = (function () {

    var InterruptMode = {
        INTERRUPT_ANY: "any",
        INTERRUPT_EARLY: "early",
        INTERRUPT_LATE: "late",
        INTERRUPT_NONE: "none"
    };

    var PlayState = {
        PLAY_INITED: "playInited",
        PLAY_SUCCEEDED: "playSucceeded",
        PLAY_INTERRUPTED: "playInterrupted",
        PLAY_FINISHED: "playFinished",
        PLAY_FAILED: "playFailed"
    };

    return {
        InterruptMode: InterruptMode,
        PlayState: PlayState
    };
})();