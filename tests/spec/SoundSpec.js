describe("SoundJS", function () {
	beforeEach(function () {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

		this.mp3File = "audio/Thunder1.mp3";
		this.oggFile = "audio/Thunder1.ogg";
		this.sound = createjs.Sound;
	});

	afterEach(function () {
		this.sound.removeAllSounds();
		this.sound.removeAllEventListeners("fileload");
	});

	it("should play mp3s", function (done) {
		var _this = this;
		this.sound.registerSound(this.mp3File, "thunder");
		this.sound.on("fileload", function (evt) {
			expect(evt.src).toBe(_this.mp3File);
			var s = createjs.Sound.play("thunder");
			expect(s.playState).toBe("playSucceeded");
			done();
		});
	});

	it("should play oggs", function (done) {
		var _this = this;
		this.sound.registerSound(this.oggFile, "thunder");
		this.sound.on("fileload", function (evt) {
			expect(evt.src).toBe(_this.oggFile);
			var s = createjs.Sound.play("thunder");
			expect(s.playState).toBe("playSucceeded");
			done();
		});

	});

	it("removeSound() should work", function (done) {
		this.sound.registerSound(this.mp3File, "thunder");
		this.sound.on("fileload", function (evt) {
			createjs.Sound.removeSound("thunder");
			var s = createjs.Sound.play("thunder");
			expect(s.playState).toBe("playFailed");
			done();
		});

	});

	it("removeAllSounds() should work", function (done) {
		this.sound.registerSound(this.mp3File, "thunder");
		this.sound.on("fileload", function (evt) {
			createjs.Sound.removeAllSounds();
			var s = createjs.Sound.play("thunder");
			expect(s.playState).toBe("playFailed");
			done();
		});

	});

	describe("Capabilities", function () {
		beforeEach(function () {
			this.capabilities = this.sound.getCapabilities();
			this.availableCapabilities = ["panning", "volume", "tracks", "mp3", "ogg", "wav", "mpeg", "m4a", "mp4", "aiff", "wma", "mid"];
		});

		it("getCapabilities() should contain the correct properties.", function () {
			var containsAll = true;
			var _this = this;
			this.availableCapabilities.forEach(function (item, index, arr) {
				if (!(item in _this.capabilities)) {
					containsAll = false;
				}
			});

			expect(containsAll).toBe(true);
		});

		it("getCapability() should match getCapabilities().", function () {
			for (var n in this.capabilities) {
				expect(this.capabilities[n]).toBe(this.sound.getCapability(n));
			}
		});
	});

	it("setMute() should work.", function () {
		this.sound.setMute(true);
		expect(this.sound.getMute()).toBe(true);
	});

	it("setVolume() should work.", function () {
		this.sound.setVolume(.5);
		expect(this.sound.getVolume()).toBe(.5);
	});

	it("initializeDefaultPlugins() should work", function () {
		expect(this.sound.initializeDefaultPlugins()).toBe(true);
	});

	it("isReady() should work", function () {
		expect(this.sound.isReady()).toBe(true);
	});

	it("loadComplete() should be true", function (done) {
		this.sound.registerSound(this.mp3File, "thunder");
		this.sound.on("fileload", function (evt) {
			expect(createjs.Sound.loadComplete("thunder")).toBe(true);
			createjs.Sound.removeAllSounds();
			expect(createjs.Sound.loadComplete("thunder")).toBe(false);
			done();
		});
	});

	it("loadComplete() should be false", function (done) {
		this.sound.registerSound(this.mp3File, "thunder");
		this.sound.on("fileload", function (evt) {
			createjs.Sound.removeAllSounds();
			expect(createjs.Sound.loadComplete("thunder")).toBe(false);
			done();
		});
	});

	it("registerSounds() should work", function (done) {
		var sounds = [
			{src: "Game-Shot.mp3", id: "shot"},
			{src: "Game-Spawn.mp3", id: "spawn"},
			{src: "Humm.mp3", id: "humm"}
		];
		createjs.Sound.registerSounds(sounds, "audio/");

		var loadCount = 0;

		this.sound.on("fileload", function (evt) {
			if (++loadCount == sounds.length) {
				for (var i = 0; i < sounds.length; i++) {
					var s = createjs.Sound.play(sounds[i].id);
					expect(s.playState).toBe("playSucceeded");
				}
				done();
			}
		});
	});

	it("defaultInterruptBehavior should be INTERRUPT_NONE", function () {
		expect(this.sound.defaultInterruptBehavior).toBe(this.sound.INTERRUPT_NONE);
	});

	it("EXTENSION_MAP should contain mp4", function () {
		expect(this.sound.EXTENSION_MAP.m4a).toBe("mp4");
	});

	it("Default constants should be be correct", function () {
		var defaults = {
			INTERRUPT_ANY: "any",
			INTERRUPT_EARLY: "early",
			INTERRUPT_LATE: "late",
			INTERRUPT_NONE: "none",
			PLAY_FAILED: "playFailed",
			PLAY_FINISHED: "playFinished",
			PLAY_INITED: "playInited",
			PLAY_INTERRUPTED: "playInterrupted",
			PLAY_SUCCEEDED: "playSucceeded"
		};

		for (var n in defaults) {
			expect(this.sound[n]).toBe(defaults[n]);
		}
	});

	it("Default SUPPORTED_EXTENSIONS should match defaults", function () {
		var correctCount = 0;
		var defaults = ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"];
		for (var i = 0; i < this.sound.SUPPORTED_EXTENSIONS.length; i++) {
			if (defaults.indexOf(this.sound.SUPPORTED_EXTENSIONS[i]) > -1) {
				correctCount++;
			}
		}

		expect(correctCount).toBe(defaults.length);
	});

	it("stop() should stop all playing sounds.", function (done) {
		var sounds = [
			{src: "Game-Shot.mp3", id: "shot"},
			{src: "Game-Spawn.mp3", id: "spawn"},
			{src: "Humm.mp3", id: "humm"}
		];
		createjs.Sound.registerSounds(sounds, "audio/");

		var loadCount = 0;
		var i;

		this.sound.on("fileload", function (evt) {
			if (++loadCount == sounds.length) {
				var playingSounds = [];
				for (i = 0; i < sounds.length; i++) {
					var s = createjs.Sound.play(sounds[i].id);
					playingSounds.push(s);
				}

				createjs.Sound.stop();
				for (i = 0; i < playingSounds.length; i++) {
					expect(playingSounds[i].playState).toBe("playFinished");
				}
				done();
			}
		});
	});
});
