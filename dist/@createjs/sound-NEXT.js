/**
 * @license @createjs/soundJS
 * Visit http://createjs.com for documentation, updates and examples.
 *
 * Copyright (c) 2017 gskinner.com, inc.
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
var createjs = function(exports, EventDispatcher, Event, Ticker) {
  "use strict";
  EventDispatcher = EventDispatcher && EventDispatcher.hasOwnProperty("default") ? EventDispatcher["default"] : EventDispatcher;
  Event = Event && Event.hasOwnProperty("default") ? Event["default"] : Event;
  Ticker = Ticker && Ticker.hasOwnProperty("default") ? Ticker["default"] : Ticker;
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj
  } : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj
  };
  var classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function")
    }
  };
  var createClass = function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor)
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor
    }
  }();
  var inherits = function(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass)
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass
  };
  var possibleConstructorReturn = function(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
    }
    return call && (typeof call === "object" || typeof call === "function") ? call : self
  };
  var Sample = function(_EventDispatcher) {
    inherits(Sample, _EventDispatcher);
    createClass(Sample, [{
      key: "volume",
      set: function set(val) {
        this.volumeNode.gain.value = val
      },
      get: function get() {
        return this.volumeNode.gain.value
      }
    }, {
      key: "pan",
      set: function set(val) {
        this.panNode.pan.value = val
      },
      get: function get() {
        return this.panNode.pan.value
      }
    }, {
      key: "duration",
      get: function get() {
        return this.audioBuffer ? this.audioBuffer.duration : null
      }
    }]);

    function Sample(url) {
      var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Sound._rootGroup;
      classCallCheck(this, Sample);
      var _this = possibleConstructorReturn(this, _EventDispatcher.call(this));
      var ctx = Sound.context;
      _this.outputNode = _this.volumeNode = ctx.createGain();
      _this.panNode = ctx.createStereoPanner();
      _this.panNode.connect(_this.outputNode);
      _this.fxBus = ctx.createGain();
      _this.fxBus.connect(_this.panNode); // TODO: Manage effects chain.
      _this.playbacks = [];
      _this.audioBuffer = null;
      _this._playbackRequested = false;
      _this.src = null;
      if (url instanceof ArrayBuffer) {
        ctx.decodeAudioData(url, _this.handleAudioDecoded.bind(_this), _this.handleAudioDecodeError.bind(_this))
      } else if (url instanceof AudioBuffer) {
        _this.audioBuffer = url
      } else if (typeof url === "string") {
        if (/^data:.*?,/.test(url)) {
          // Test for Data URL
          // Data URLs can just be loaded by XHR, so pass it in
          _this.loadAudio(url)
        } else {
          // Assumed to be a regular url at this point
          _this.src = _this._ensureValidFileExtension(url);
          _this.loadAudio(_this.src)
        }
      } else if (url instanceof Array) {
        for (var i = 0; i < url.length; i++) {
          var u = url[i];
          var extension = /\.\w+$/.exec(u);
          if (Sound.isExtensionSupported(extension)) {
            _this.src = u;
            _this.loadAudio(_this.src);
            break
          }
        }
      } else if ((typeof url === "undefined" ? "undefined" : _typeof(url)) === "object") {
        // Assume a source of the format: {<ext>:<url>} e.g. {mp3: path/to/file/sound.mp3, ogg: other/path/soundFileWithNoExtension}
        for (var ext in url) {
          if (!url.hasOwnProperty(ext)) {
            continue
          }
          if (Sound.isExtensionSupported(ext)) {
            _this.src = url[ext];
            _this.loadAudio(_this.src);
            break
          }
        }
      }
      if (parent) {
        parent.add(_this)
      }
      return _this
    }
    Sample.prototype._ensureValidFileExtension = function _ensureValidFileExtension(url) {
      // Not a data URL, so let's doublecheck the file extension before loading.
      var extensionExp = /\.\w+$/;
      var result = extensionExp.exec(url);
      if (result === null) {
        // No file extension, so add one
        url = url.concat("." + Sound.fallbackFileExtension)
      } else {
        // Found a file extension. Check if it's supported. If it's definitely not, fall back.
        var extension = result[0].substr(1);
        if (!Sound.isExtensionSupported(extension)) {
          url = url.replace(extensionExp, "." + Sound.fallbackFileExtension)
        }
      }
      return url
    };
    Sample.prototype.clone = function clone() {
      var o = new Sample(this.audioBuffer);
      o.volume = this.volume;
      o.pan = this.pan;
      // TODO: clone FX chain
      return o
    };
    /**
     * Play the sample. This creates and starts a new Playback of the sample, if it's loaded. If it's not loaded, calling this function
     * will make the Sample play when it finishes loading. A sample will only play once when it finishes loading, no matter how many
     * times play was called.
     * @returns {*}
     */
    Sample.prototype.play = function play() {
      if (!this.audioBuffer) {
        this._playbackRequested = true;
        return null
      } else {
        return this._play()
      }
    };
    Sample.prototype._play = function _play() {
      var pb = new Playback(this.audioBuffer);
      this.playbacks.push(pb);
      pb.outputNode.connect(this.fxBus);
      pb.addEventListener("end", this.handlePlaybackEnd.bind(this));
      pb.addEventListener("stop", this.handlePlaybackStopped.bind(this));
      pb.addEventListener("destroyed", this.handlePlaybackDestroyed.bind(this));
      return pb
    };
    /**
     * Pause all playbacks of this sample.
     */
    Sample.prototype.pause = function pause() {
      this.playbacks.slice().forEach(function(pb) {
        return pb.pause()
      })
    };
    /**
     * Resume all paused playbacks of this sample.
     */
    Sample.prototype.resume = function resume() {
      this.playbacks.slice().forEach(function(pb) {
        return pb.resume()
      })
    };
    /**
     * Stop all playbacks of this sample, destroying them.
     */
    Sample.prototype.stop = function stop() {
      this.playbacks.slice().forEach(function(pb) {
        return pb.stop()
      })
    };
    // Loading and Decoding
    Sample.prototype.loadAudio = function loadAudio(url) {
      var request = new XMLHttpRequest;
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
      request.onload = this.handleAudioLoaded.bind(this);
      request.send()
    };
    Sample.prototype.handleAudioLoaded = function handleAudioLoaded(loadEvent) {
      var ctx = Sound.context;
      var result = loadEvent.target.response;
      ctx.decodeAudioData(result, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this))
    };
    Sample.prototype.handleAudioDecoded = function handleAudioDecoded(buffer) {
      this.audioBuffer = buffer;
      this.dispatchEvent("ready");
      if (this._playbackRequested) {
        this._play()
      }
    };
    Sample.prototype.handleAudioDecodeError = function handleAudioDecodeError(e) {
      console.warn("Error decoding audio data in Sample. ")
    };
    Sample.prototype.handlePlaybackEnd = function handlePlaybackEnd(e) {
      this.dispatchEvent("playbackEnd")
    };
    Sample.prototype.handlePlaybackStopped = function handlePlaybackStopped(e) {
      this.dispatchEvent("playbackStop")
    };
    Sample.prototype.handlePlaybackDestroyed = function handlePlaybackDestroyed(e) {
      var index = this.playbacks.indexOf(e.target);
      if (index > -1) {
        this.playbacks.splice(index, 1)
      }
      this.dispatchEvent("playbackDestroyed")
    };
    return Sample
  }(EventDispatcher);
  var Group = function() {
    function Group() {
      var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Sound._rootGroup;
      classCallCheck(this, Group);
      var ctx = Sound.context;
      this.outputNode = this.volumeNode = ctx.createGain();
      this.inputNode = ctx.createGain();
      this.fxBus = ctx.createGain();
      this.inputNode.connect(this.fxBus);
      this.fxBus.connect(this.outputNode); // TODO: Manage effects chain.
      this.samples = [];
      this.subgroups = [];
      if (parent) {
        parent.add(this)
      }
    }
    Group.prototype.add = function add(groupOrSample) {
      if (groupOrSample instanceof Group) {
        this._addGroup(groupOrSample)
      } else if (groupOrSample instanceof Sample) {
        this._addSample(groupOrSample)
      }
    };
    Group.prototype._addGroup = function _addGroup(subgroup) {
      this.subgroups.push(subgroup);
      subgroup.outputNode.connect(this.inputNode)
    };
    Group.prototype._addSample = function _addSample(sample) {
      this.samples.push(sample);
      sample.outputNode.connect(this.fxBus)
    };
    // NOTE: depending on group architecture, play/pause/resume  may need to change. E.G. if loops within the group structure are allowed,
    // then we need to check if we've played a group before in this call of play before playing it, to prevent infinite looping.
    /**
     * Plays all samples in this group, and in all subgroups.
     */
    Group.prototype.play = function play() {
      this.samples.forEach(function(s) {
        return s.play()
      });
      this.subgroups.forEach(function(g) {
        return g.play()
      })
    };
    /**
     * Pauses all samples in this group, and in all subgroups.
     */
    Group.prototype.pause = function pause() {
      this.samples.forEach(function(s) {
        return s.pause()
      });
      this.subgroups.forEach(function(g) {
        return g.pause()
      })
    };
    /**
     * Unpauses all samples in this group, and in all subgroups.
     */
    Group.prototype.resume = function resume() {
      this.samples.forEach(function(s) {
        return s.resume()
      });
      this.subgroups.forEach(function(g) {
        return g.resume()
      })
    };
    Group.prototype.stop = function stop() {
      this.samples.forEach(function(s) {
        return s.stop()
      });
      this.subgroups.forEach(function(g) {
        return g.stop()
      })
    };
    return Group
  }();
  var Sound = function() {
    function Sound() {
      classCallCheck(this, Sound)
    }
    // Sets up all static class defaults. This function is immediately invoked below the Sound class definition to ensure it runs.
    Sound._initialize = function _initialize() {
      var soundContextClass = window.AudioContext || window.webkitAudioContext;
      Sound.__context = new soundContextClass;
      Sound.__rootGroup = new Group(null);
      Sound.__rootGroup.outputNode.connect(Sound.context.destination);
      Sound.__fileExtensionPriorityList = ["mp3"];
      Sound._strictFallbacks = true;
      Sound._idHash = {}
    };
    // Read-only properties
    Sound.registerSound = function registerSound(sampleOrSource, id) {
      if (sampleOrSource instanceof Sample) {
        Sound._idHash[id] = sampleOrSource
      } else {
        Sound._idHash[id] = new Sample(sampleOrSource)
      }
    };
    Sound.removeSound = function removeSound() {};
    Sound.isExtensionSupported = function isExtensionSupported(extension) {
      var strict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var extensionExp = /\.\w+$/;
      // The file extension is assumed to be either "everything after the last '.' character", or, if there is no ., the whole string.
      var e = extensionExp.exec(url) || extension;
      var testElement = document.createElement("audio");
      var result = testElement.canPlayType("audio/" + e);
      //return result !== "";
      return strict ? result === "probably" : result !== ""
    };
    Sound.pause = function pause() {
      // TODO: actually implement pausing and unpausing - just putting this here as a reminder that suspend exists.
      Sound.context.suspend()
    };
    Sound.createInstance = function createInstance(src) {
      return new Sample(src)
    };
    createClass(Sound, null, [{
      key: "context",
      get: function get() {
        return Sound.__context
      }
    }, {
      key: "_rootGroup",
      get: function get() {
        return Sound.__rootGroup
      }
    }, {
      key: "strictFallbacks",
      get: function get() {
        return Sound._strictFallbacks
      },
      set: function set(val) {
        Sound._strictFallbacks = val
      }
    }, {
      key: "fileExtensionPriorityList",
      get: function get() {
        return Sound.__fileExtensionPriorityList
      },
      set: function set(newList) {
        var list = Sound.fileExtensionPriorityList;
        // Swap the array contents in place so external refs stay valid:
        list.splice(0, list.length);
        newList.forEach(function(item) {
          return list.push(item)
        })
      }
    }, {
      key: "fallbackFileExtension",
      get: function get() {
        // Look up the fallback file extension each time. Performance cost should be small (since sound loading should be gated by
        // the sound loading part), and the array of fallback file extensions may have changed without our knowledge.
        var testElement = document.createElement("audio");
        var bestMaybe = null;
        for (var i = 0; i < Sound.fileExtensionPriorityList.length; i++) {
          var extension = Sound.fileExtensionPriorityList[i];
          var result = testElement.canPlayType("audio/" + extension);
          switch (result) {
            case "probably":
              return extension; // Found a good one, return it
            case "maybe":
              if (!Sound.strictFallbacks) {
                return extension
              } else if (bestMaybe === null) {
                bestMaybe = extension
              }
              break;
            case "":
              // no-op
            default:
          }
        }
        // We didn't find anything, so return our best maybe, or null if we didn't even find one of those.
        return bestMaybe || null
      }
    }]);
    return Sound
  }();
  Sound._initialize();
  var Playback = function(_EventDispatcher) {
    inherits(Playback, _EventDispatcher);
    createClass(Playback, [{
      key: "elapsed",
      get: function get() {
        var ctx = Sound.context;
        return ctx.currentTime - this._startTime + this._elapsedOffset
      }
    }, {
      key: "duration",
      get: function get() {
        return this.buffer.duration
      }
    }, {
      key: "playing",
      get: function get() {
        return Boolean(this._sourceNode)
      }
    }, {
      key: "paused",
      get: function get() {
        return this._paused
      }
    }]);

    function Playback(audioBuffer) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      classCallCheck(this, Playback);
      var _this = possibleConstructorReturn(this, _EventDispatcher.call(this));
      var ctx = Sound.context;
      // Audio tree setup
      _this.outputNode = _this.volumeNode = ctx.createGain();
      _this.fxBus = ctx.createGain();
      _this.fxBus.connect(_this.outputNode);
      // Data tracking
      _this.buffer = audioBuffer;
      _this._startTime = null;
      _this._elapsedOffset = 0; // The amount of time elapsed, including pauses.
      _this._paused = false;
      _this.remainingLoops = options.loops ? Math.max(options.loops | 0, -1) : 0;
      _this._play(); // TODO: 10ms fade in to prevent clicks
      return _this
    }
    Playback.prototype._play = function _play() {
      var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var ctx = Sound.context;
      if (this._sourceNode) {
        return
      }
      this._sourceNode || this._createSourceNode();
      this._sourceNode.start(delay, offset);
      this._startTime = ctx.currentTime;
      this._elapsedOffset = offset;
      this._paused = false
    };
    Playback.prototype._createSourceNode = function _createSourceNode() {
      var ctx = Sound.context;
      this._sourceNode = ctx.createBufferSource();
      this._sourceNode.buffer = this.buffer;
      this._sourceNode.connect(this.outputNode);
      this._sourceNode.onended = this.handleEnded.bind(this)
    };
    Playback.prototype.pause = function pause() {
      if (!this.playing) {
        return
      }
      // this.dispatchEvent("paused");
      this._elapsedOffset = this.elapsed;
      this._sourceNode.stop();
      this._sourceNode = null;
      this._paused = true
    };
    Playback.prototype.resume = function resume() {
      if (!this.paused) {
        return
      }
      this._play(0, this._elapsedOffset);
      this._paused = false
    };
    Playback.prototype.loop = function loop() {
      this._sourceNode = null;
      this._play(0, 0); // TODO: delay and offeset?
      if (this.remainingLoops !== -1) {
        this.remainingLoops--
      }
    };
    Playback.prototype.stop = function stop() {
      this.dispatchEvent("stop");
      this.destroy()
    };
    Playback.prototype.destroy = function destroy() {
      if (this._sourceNode) {
        this._sourceNode.onended = null; // Stop listening before stopping the node, since the listener does things we don't want for a destroyed sound
        this._sourceNode && this._sourceNode.stop()
      }
      this.dispatchEvent("end"); // Manually dispatch the end event since the listener has been removed
      this._sourceNode = null;
      this._paused = false;
      this.dispatchEvent("destroyed")
    };
    Playback.prototype.handleEnded = function handleEnded() {
      if (this.paused) {} else {
        // Reached end of playback. Loop if we have remaining loops - destroy otherwise.
        if (this.remainingLoops > 0) {
          this.dispatchEvent("end");
          this.loop()
        } else {
          // No event here - the destroy function dispatches an end event.
          this.destroy()
        }
      }
    };
    return Playback
  }(EventDispatcher);
  /**
   * The Sound JavaScript library manages the playback of audio on the web. It works via plugins which abstract the actual audio
   * implementation, so playback is possible on any platform without specific knowledge of what mechanisms are necessary
   * to play sounds.
   *
   * To use SoundJS, use the public API on the {{#crossLink "Sound"}}{{/crossLink}} class. This API is for:
   * <ul>
   *      <li>Installing audio playback Plugins</li>
   *      <li>Registering (and preloading) sounds</li>
   *      <li>Creating and playing sounds</li>
   *      <li>Master volume, mute, and stop controls for all sounds at once</li>
   * </ul>
   *
   * <b>Controlling Sounds</b><br />
   * Playing sounds creates {{#crossLink "AbstractSoundInstance"}}{{/crossLink}} instances, which can be controlled
   * individually.
   * <ul>
   *      <li>Pause, resume, seek, and stop sounds</li>
   *      <li>Control a sound's volume, mute, and pan</li>
   *      <li>Listen for events on sound instances to get notified when they finish, loop, or fail</li>
   * </ul>
   *
   * <h4>Example</h4>
   *
   *      createjs.Sound.alternateExtensions = ["mp3"];
   *      createjs.Sound.on("fileload", this.loadHandler, this);
   *      createjs.Sound.registerSound("path/to/mySound.ogg", "sound");
   *      function loadHandler(event) {
   *          // This is fired for each sound that is registered.
   *          var instance = createjs.Sound.play("sound");  // play using id.  Could also use full sourcepath or event.src.
   *          instance.on("complete", this.handleComplete, this);
   *          instance.volume = 0.5;
   *      }
   *
   * <h4>Browser Support</h4>
   * Audio will work in browsers which support Web Audio (<a href="http://caniuse.com/audio-api" target="_blank">http://caniuse.com/audio-api</a>)
   * or HTMLAudioElement (<a href="http://caniuse.com/audio" target="_blank">http://caniuse.com/audio</a>).
   * A Flash fallback can be used for any browser that supports the Flash player, and the Cordova plugin can be used in
   * any webview that supports <a href="http://plugins.cordova.io/#/package/org.apache.cordova.media" target="_blank">Cordova.Media</a>.
   * IE8 and earlier are not supported, even with the Flash fallback. To support earlier browsers, you can use an older
   * version of SoundJS (version 0.5.2 and earlier).
   *
   * @main SoundJS
   */
  // re-export shared classes
  // TODO: Review this version export.
  // version (templated in gulpfile, pulled from package).
  (window.createjs = window.createjs || {}).soundjs = "2.0.0";
  exports.EventDispatcher = EventDispatcher;
  exports.Event = Event;
  exports.Ticker = Ticker;
  exports.Playback = Playback;
  exports.Sample = Sample;
  exports.Group = Group;
  exports.Sound = Sound;
  return exports
}(this.createjs || {}, EventDispatcher, Event, Ticker);