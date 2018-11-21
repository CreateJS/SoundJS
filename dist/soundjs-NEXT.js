/**
 * @license SoundJS
 * Visit https://createjs.com for documentation, updates and examples.
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

(function (exports) {
  'use strict';

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  var Event =

  function () {
    function Event(type, bubbles, cancelable) {
      if (bubbles === void 0) {
        bubbles = false;
      }

      if (cancelable === void 0) {
        cancelable = false;
      }

      this.type = type;

      this.target = null;

      this.currentTarget = null;

      this.eventPhase = 0;

      this.bubbles = bubbles;

      this.cancelable = cancelable;

      this.timeStamp = new Date().getTime();

      this.defaultPrevented = false;

      this.propagationStopped = false;

      this.immediatePropagationStopped = false;

      this.removed = false;
    }

    var _proto = Event.prototype;

    _proto.preventDefault = function preventDefault() {
      this.defaultPrevented = this.cancelable;
      return this;
    };

    _proto.stopPropagation = function stopPropagation() {
      this.propagationStopped = true;
      return this;
    };

    _proto.stopImmediatePropagation = function stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
      return this;
    };

    _proto.remove = function remove() {
      this.removed = true;
      return this;
    };

    _proto.clone = function clone() {
      var event = new Event(this.type, this.bubbles, this.cancelable);

      for (var n in this) {
        if (this.hasOwnProperty(n)) {
          event[n] = this[n];
        }
      }

      return event;
    };

    _proto.set = function set(props) {
      for (var n in props) {
        this[n] = props[n];
      }

      return this;
    };

    _proto.toString = function toString() {
      return "[" + this.constructor.name + " (type=" + this.type + ")]";
    };

    return Event;
  }();

  var EventDispatcher =

  function () {

    EventDispatcher.initialize = function initialize(target) {
      var p = EventDispatcher.prototype;
      target.addEventListener = p.addEventListener;
      target.on = p.on;
      target.removeEventListener = target.off = p.removeEventListener;
      target.removeAllEventListeners = p.removeAllEventListeners;
      target.hasEventListener = p.hasEventListener;
      target.dispatchEvent = p.dispatchEvent;
      target._dispatchEvent = p._dispatchEvent;
      target.willTrigger = p.willTrigger;
    };

    function EventDispatcher() {

      this._listeners = null;

      this._captureListeners = null;
    }

    var _proto = EventDispatcher.prototype;

    _proto.addEventListener = function addEventListener(type, listener, useCapture) {
      if (useCapture === void 0) {
        useCapture = false;
      }

      var listeners;

      if (useCapture) {
        listeners = this._captureListeners = this._captureListeners || {};
      } else {
        listeners = this._listeners = this._listeners || {};
      }

      var arr = listeners[type];

      if (arr) {
        this.removeEventListener(type, listener, useCapture);
        arr = listeners[type];
      }

      if (arr) {
        arr.push(listener);
      } else {
        listeners[type] = [listener];
      }

      return listener;
    };

    _proto.on = function on(type, listener, scope, once, data, useCapture) {
      if (scope === void 0) {
        scope = null;
      }

      if (once === void 0) {
        once = false;
      }

      if (data === void 0) {
        data = {};
      }

      if (useCapture === void 0) {
        useCapture = false;
      }

      if (listener.handleEvent) {
        scope = scope || listener;
        listener = listener.handleEvent;
      }

      scope = scope || this;
      return this.addEventListener(type, function (evt) {
        listener.call(scope, evt, data);
        once && evt.remove();
      }, useCapture);
    };

    _proto.removeEventListener = function removeEventListener(type, listener, useCapture) {
      if (useCapture === void 0) {
        useCapture = false;
      }

      var listeners = useCapture ? this._captureListeners : this._listeners;

      if (!listeners) {
        return;
      }

      var arr = listeners[type];

      if (!arr) {
        return;
      }

      var l = arr.length;

      for (var i = 0; i < l; i++) {
        if (arr[i] === listener) {
          if (l === 1) {
            delete listeners[type];
          }
          else {
              arr.splice(i, 1);
            }

          break;
        }
      }
    };

    _proto.off = function off(type, listener, useCapture) {
      if (useCapture === void 0) {
        useCapture = false;
      }

      this.removeEventListener(type, listener, useCapture);
    };

    _proto.removeAllEventListeners = function removeAllEventListeners(type) {
      if (type === void 0) {
        type = null;
      }

      if (type) {
        if (this._listeners) {
          delete this._listeners[type];
        }

        if (this._captureListeners) {
          delete this._captureListeners[type];
        }
      } else {
        this._listeners = this._captureListeners = null;
      }
    };

    _proto.dispatchEvent = function dispatchEvent(eventObj, bubbles, cancelable) {
      if (bubbles === void 0) {
        bubbles = false;
      }

      if (cancelable === void 0) {
        cancelable = false;
      }

      if (typeof eventObj === "string") {

        var listeners = this._listeners;

        if (!bubbles && (!listeners || !listeners[eventObj])) {
          return true;
        }

        eventObj = new Event(eventObj, bubbles, cancelable);
      } else if (eventObj.target && eventObj.clone) {

        eventObj = eventObj.clone();
      }

      try {
        eventObj.target = this;
      } catch (e) {}

      if (!eventObj.bubbles || !this.parent) {
        this._dispatchEvent(eventObj, 2);
      } else {
        var top = this;
        var list = [top];

        while (top.parent) {
          list.push(top = top.parent);
        }

        var l = list.length;
        var i;

        for (i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
          list[i]._dispatchEvent(eventObj, 1 + (i == 0));
        }

        for (i = 1; i < l && !eventObj.propagationStopped; i++) {
          list[i]._dispatchEvent(eventObj, 3);
        }
      }

      return !eventObj.defaultPrevented;
    };

    _proto.hasEventListener = function hasEventListener(type) {
      var listeners = this._listeners,
          captureListeners = this._captureListeners;
      return !!(listeners && listeners[type] || captureListeners && captureListeners[type]);
    };

    _proto.willTrigger = function willTrigger(type) {
      var o = this;

      while (o) {
        if (o.hasEventListener(type)) {
          return true;
        }

        o = o.parent;
      }

      return false;
    };

    _proto.toString = function toString() {
      return "[" + (this.constructor.name + this.name ? " " + this.name : "") + "]";
    };

    _proto._dispatchEvent = function _dispatchEvent(eventObj, eventPhase) {
      var listeners = eventPhase === 1 ? this._captureListeners : this._listeners;

      if (eventObj && listeners) {
        var arr = listeners[eventObj.type];
        var l;

        if (!arr || (l = arr.length) === 0) {
          return;
        }

        try {
          eventObj.currentTarget = this;
        } catch (e) {}

        try {
          eventObj.eventPhase = eventPhase;
        } catch (e) {}

        eventObj.removed = false;
        arr = arr.slice();

        for (var i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
          var o = arr[i];

          if (o.handleEvent) {
            o.handleEvent(eventObj);
          } else {
            o(eventObj);
          }

          if (eventObj.removed) {
            this.off(eventObj.type, o, eventPhase === 1);
            eventObj.removed = false;
          }
        }
      }
    };

    return EventDispatcher;
  }();

  var AbstractAudioWrapper =

  function (_EventDispatcher) {
    _inheritsLoose(AbstractAudioWrapper, _EventDispatcher);

    _createClass(AbstractAudioWrapper, [{
      key: "volume",
      set: function set(val) {
        this.volumeNode.gain.value = val;
      },
      get: function get() {
        return this.volumeNode.gain.value;
      }
    }, {
      key: "pan",
      set: function set(val) {
        this.panNode.setPosition(val, 0, 0.5);
      },
      get: function get() {
        return this.panNode.pan.value;
      }
    }, {
      key: "muted",
      set: function set(val) {
        if (val) {
          this.mute();
        } else {
          this.unmute();
        }
      },
      get: function get() {
        return this._muted;
      }
    }]);

    function AbstractAudioWrapper() {
      var _this;

      _this = _EventDispatcher.call(this) || this;
      var ctx = Sound.context;
      _this.outputNode = _this.volumeNode = ctx.createGain();
      _this.panNode = _this.postFxNode = ctx.createPanner();

      _this.panNode.connect(_this.outputNode);

      _this.muterNode = ctx.createGain();
      _this.muterNode.gain.value = 0;

      _this.muterNode.connect(_this.outputNode);

      _this.fxBus = ctx.createGain();

      _this.fxBus.connect(_this.panNode);

      _this._effects = [];
      _this.muted = false;
      return _this;
    }

    var _proto = AbstractAudioWrapper.prototype;

    _proto.mute = function mute() {
      if (this._muted) {
        return;
      }

      this.panNode.disconnect(this.outputNode);
      this.panNode.connect(this.muterNode);
      this._muted = true;
    };

    _proto.unmute = function unmute() {
      if (!this._muted) {
        return;
      }

      this.panNode.disconnect(this.muterNode);
      this.panNode.connect(this.outputNode);
      this._muted = false;
    };

    _proto.addEffect = function addEffect(effect) {
      this.effects = this._effects.concat([effect]);
    };

    _proto.getEffects = function getEffects() {
      return this._effects;
    };

    _proto.cloneEffects = function cloneEffects() {
    };

    _proto.removeAllEffects = function removeAllEffects() {
      this.fxBus.disconnect();

      for (var i = 0; i < this._effects.length; i++) {
        var e = this._effects[i];
        e.owner = null;
        e.disconnect();
      }

      this.fxBus.connect(this.postFxNode);

      this._effects.splice(0, this._effects.length);

    };

    _createClass(AbstractAudioWrapper, [{
      key: "effects",
      set: function set(effects) {
        this.removeAllEffects();

        if (!effects || !effects.length) {

          return;
        }

        for (var i = 0; i < effects.length; i++) {
          var e = effects[i];

          if (e.owner) {
            throw new Error("Error adding Effects - An effect in the provided list at index " + i + " is already added to another Group, Sample, or Playback." + "  Effects can be cloned to be used in multiple places, or alternately, can be placed on Groups to apply to all Samples in the Group.");
          }
        }

        var firstEffect = effects[0];
        firstEffect.owner = this;

        this._effects.push(firstEffect);

        this.fxBus.disconnect();
        this.fxBus.connect(firstEffect.inputNode);

        for (var j = 1; j < effects.length; j++) {
          var _e = effects[j];
          effects[j - 1].connect(_e);
          _e.owner = this;

          this._effects.push(_e);
        }

        effects[effects.length - 1].connect(this.postFxNode);
      }
    }]);

    return AbstractAudioWrapper;
  }(EventDispatcher);

  var Sample =

  function (_AbstractAudioWrapper) {
    _inheritsLoose(Sample, _AbstractAudioWrapper);

    _createClass(Sample, [{
      key: "elapsed",
      get: function get() {
        if (this.playbacks.length === 0) {
          return 0;
        }

        return this.playbacks[this.playbacks.length - 1].elapsed;
      }
    }, {
      key: "position",
      get: function get() {
        if (this.playbacks.length === 0) {
          return 0;
        }

        return this.playbacks[this.playbacks.length - 1].position;
      }
    }, {
      key: "paused",
      set: function set(val) {
        if (val) {
          this.pause();
        } else {
          this.resume();
        }
      },
      get: function get() {
        if (this.playbacks.length < 1) {
          return false;
        }

        for (var i = 0; i < this.playbacks.length; i++) {
          if (!this.playbacks[i].paused) {
            return false;
          }
        }

        return true;
      }
    }, {
      key: "loops",
      set: function set(val) {
        this._loops = val;
      },
      get: function get() {
        return this._loops;
      }
    }, {
      key: "duration",
      get: function get() {
        return this.audioBuffer ? this.audioBuffer.duration : null;
      }
    }]);

    function Sample(src, options, parent) {
      var _this;

      if (options === void 0) {
        options = {};
      }

      if (parent === void 0) {
        parent = Sound.rootGroup;
      }

      _this = _AbstractAudioWrapper.call(this) || this;

      _this.playbacks = [];
      _this.audioBuffer = null;
      _this._playbackRequested = false;
      _this.src = null;
      _this.volume = isNaN(Number(options.volume)) ? 1 : Number(options.volume);

      _this.loops = isNaN(Number(options.loops)) ? 0 : Math.max(Number(options.loops) | 0, -1);

      _this.delay = isNaN(Number(options.delay)) ? 0 : Number(options.delay);

      _this.pan = isNaN(Number(options.pan)) ? 0 : Number(options.pan);

      _this.offset = isNaN(Number(options.offset)) ? 0 : Number(options.offset);

      _this.playDuration = options.playDuration;

      Sound.requestBuffer(src).then(function (result) {
        _this.src = result.bufferId;

        _this.handleAudioDecoded(result.audioBuffer);
      });
      _this.parent = null;

      parent.add(_assertThisInitialized(_assertThisInitialized(_this)));
      return _this;
    }

    var _proto = Sample.prototype;

    _proto._resolveSource = function _resolveSource(src) {
      var ctx = Sound.context;

      if (src instanceof ArrayBuffer) {
        ctx.decodeAudioData(src, this.handleAudioDecoded.bind(this), this.handleAudioDecodeError.bind(this));
      } else if (src instanceof AudioBuffer) {
        this.audioBuffer = src;
      } else if (typeof src === "string") {
        if (/^data:.*?,/.test(src)) {

          this.loadAudio(src);
        } else {

          this.src = this._ensureValidFileExtension(src);
          this.loadAudio(this.src);
        }
      } else if (src instanceof Array) {
        for (var i = 0; i < src.length; i++) {
          var u = src[i];

          if (Sound.isExtensionSupported(u, false)) {
            this.src = u;
            this.loadAudio(this.src);
            break;
          }
        }
      } else if (typeof src === "object") {

        for (var ext in src) {
          if (!src.hasOwnProperty(ext)) {
            continue;
          }

          if (Sound.isExtensionSupported(ext, false)) {
            this.src = src[ext];
            this.loadAudio(this.src);
            break;
          }
        }
      }
    };

    _proto._ensureValidFileExtension = function _ensureValidFileExtension(url) {

      var extensionExp = /\.\w+$/;
      var result = extensionExp.exec(url);

      if (result === null) {

        url = url.concat("." + Sound.fallbackFileExtension);
      } else {

        var extension = result[0].substr(1);

        if (!Sound.isExtensionSupported(extension, false)) {
          url = url.replace(extensionExp, "." + Sound.fallbackFileExtension);
        }
      }

      return url;
    };

    _proto.clone = function clone() {
      var o = new Sample(this.audioBuffer);
      o.volume = this.volume;
      o.pan = this.pan;
      o.loops = this.loops;
      o.delay = this.delay;
      o.offset = this.offset;
      o.interrupt = this.interrupt;

      return o;
    };

    _proto.play = function play(playProps) {
      if (!this.audioBuffer) {
        this._playbackRequested = true;
        this._requestedPlaybackPlayprops = playProps;
        return null;
      } else {
        return this._play(playProps);
      }
    };

    _proto._play = function _play(playProps) {
      playProps = playProps || {
        loops: this.loops,
        playDuration: this.playDuration,
        offset: this.offset,
        delay: this.delay
      };
      var pb = new Playback(this.audioBuffer, playProps);
      this.playbacks.push(pb);
      pb.outputNode.connect(this.fxBus);
      pb.addEventListener("end", this.handlePlaybackEnd.bind(this));
      pb.addEventListener("stop", this.handlePlaybackStopped.bind(this));
      pb.addEventListener("destroyed", this.handlePlaybackDestroyed.bind(this));
      return pb;
    };

    _proto.pause = function pause() {
      this.playbacks.slice().forEach(function (pb) {
        return pb.pause();
      });
    };

    _proto.resume = function resume() {
      this.playbacks.slice().forEach(function (pb) {
        return pb.resume();
      });
    };

    _proto.stop = function stop() {
      this.playbacks.slice().forEach(function (pb) {
        return pb.stop();
      });
    };

    _proto.loadAudio = function loadAudio(url) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.onload = this.handleAudioLoaded.bind(this);
      request.send();
    };

    _proto.destroy = function destroy() {
      this.stop();

      this._play = function () {
        throw new Error("Cannot play Sample after it has been destroyed.");
      };

      this.dispatchEvent("destroyed");
      this.removeAllEventListeners();
    };

    _proto.handleAudioLoaded = function handleAudioLoaded(loadEvent) {
      var _this2 = this;

      var xhr = loadEvent.target;

      if (xhr.readyState === 4 && xhr.status === 200) {
        var result = loadEvent.target.response;
        Sound.requestBuffer(result).then(function (ab) {
          _this2.handleAudioDecoded(ab);
        });
      }
    };

    _proto.handleAudioDecoded = function handleAudioDecoded(buffer) {
      this.audioBuffer = buffer;
      this.dispatchEvent("ready");

      if (this._playbackRequested) {
        this._play(this._requestedPlaybackPlayprops);
      }
    };

    _proto.handleAudioDecodeError = function handleAudioDecodeError(e) {
      console.warn("Error decoding audio data in Sample.");
    };

    _proto.handlePlaybackEnd = function handlePlaybackEnd(e) {
      this.dispatchEvent("playbackEnd");
    };

    _proto.handlePlaybackStopped = function handlePlaybackStopped(e) {
      this.dispatchEvent("playbackStop");
    };

    _proto.handlePlaybackDestroyed = function handlePlaybackDestroyed(e) {
      var index = this.playbacks.indexOf(e.target);

      if (index > -1) {
        this.playbacks.splice(index, 1);
      }

      this.dispatchEvent("playbackDestroyed");
    };

    _proto.makePlayPropsObj = function makePlayPropsObj() {
      return {
        volume: this.volume,
        loops: this.loops,
        delay: this.delay,
        pan: this.pan,
        offset: this.offset,
        interrupt: this.interrupt,
        duration: this.playDuration
      };
    };

    _proto.consumePlayPropsObj = function consumePlayPropsObj(o) {
      if (!o) {
        return;
      }

      this.volume = isNaN(Number(o.volume)) ? this.volume : Number(o.volume);
      this.loops = isNaN(Number(o.loops)) ? this.loops : Math.max(Number(o.loops) | 0, -1);

      this.delay = isNaN(Number(o.delay)) ? this.delay : Number(o.delay);
      this.pan = isNaN(Number(o.pan)) ? this.pan : Number(o.pan);
      this.offset = isNaN(Number(o.offset)) ? this.offset : Number(o.offset);
      this.interrupt = o.interrupt === undefined ? this.interrupt : o.interrupt;
      this.playDuration = o.hasOwnProperty('playDuration') ? o.playDuration : this.playDuration;
    };

    return Sample;
  }(AbstractAudioWrapper);

  var Group =

  function (_AbstractAudioWrapper) {
    _inheritsLoose(Group, _AbstractAudioWrapper);

    function Group(parent) {
      var _this;

      _this = _AbstractAudioWrapper.call(this) || this;
      var ctx = Sound.context;
      _this.inputNode = ctx.createGain();

      _this.inputNode.connect(_this.fxBus);

      _this.samples = [];
      _this.subgroups = [];

      if (!parent || !(parent instanceof Group)) {
        parent = Sound.rootGroup;
      }

      if (parent) {
        parent.add(_assertThisInitialized(_assertThisInitialized(_this)));
      }

      return _this;
    }

    var _proto = Group.prototype;

    _proto.add = function add(groupOrSample) {
      if (groupOrSample instanceof Group) {
        this._addGroup(groupOrSample);
      } else if (groupOrSample instanceof Sample) {
        this._addSample(groupOrSample);
      } else {
        console.warn("Warning: Attempted to add an object that was not a Group or a Sample as a child to a Group; object was ignored.");
      }
    };

    _proto._addGroup = function _addGroup(subgroup) {
      if (subgroup.parent) {
        subgroup.parent._remove(subgroup);
      }

      subgroup.parent = this;
      this.subgroups.push(subgroup);
      subgroup.outputNode.connect(this.inputNode);
    };

    _proto._addSample = function _addSample(sample) {
      if (sample.parent) {
        sample.parent._remove(sample);
      }

      sample.parent = this;
      this.samples.push(sample);
      sample.outputNode.connect(this.inputNode);
      sample.on("destroyed", this.handleSampleDestroyed, this);
    };

    _proto._remove = function _remove(groupOrSample) {
      if (groupOrSample instanceof Group) {
        this._removeGroup(groupOrSample);
      } else if (groupOrSample instanceof Sample) {
        this._removeSample(groupOrSample);
      }
    };

    _proto._removeGroup = function _removeGroup(subgroup) {
      var index = this.subgroups.indexOf(subgroup);

      if (index === -1) {
        throw new Error("Cannot remove subgroup from group - group not found in subgroups list.");
      }

      subgroup.outputNode.disconnect(this.inputNode);
      this.subgroups.splice(index, 1);
    };

    _proto._removeSample = function _removeSample(sample) {
      var index = this.samples.indexOf(sample);

      if (index === -1) {
        throw new Error("Cannot remove sample from group - group not found in samples list.");
      }

      sample.outputNode.disconnect(this.inputNode);
      this.samples.splice(index, 1);
    };

    _proto.play = function play() {
      this.samples.forEach(function (s) {
        return s.play();
      });
      this.subgroups.forEach(function (g) {
        return g.play();
      });
    };

    _proto.pause = function pause() {
      this.samples.forEach(function (s) {
        return s.pause();
      });
      this.subgroups.forEach(function (g) {
        return g.pause();
      });
    };

    _proto.resume = function resume() {
      this.samples.forEach(function (s) {
        return s.resume();
      });
      this.subgroups.forEach(function (g) {
        return g.resume();
      });
    };

    _proto.stop = function stop() {
      this.samples.forEach(function (s) {
        return s.stop();
      });
      this.subgroups.forEach(function (g) {
        return g.stop();
      });
    };

    _proto.handleSampleDestroyed = function handleSampleDestroyed(e) {
      var index = this.samples.indexOf(e.target);

      if (index > -1) {
        this.samples.splice(index, 1);
      }

      this.dispatchEvent("sampleDestroyed");
      console.log("Sample destroyed");
    };

    _proto._getSampleDescendantsBySource = function _getSampleDescendantsBySource(src) {
      var out = new Set();
      this.samples.forEach(function (s) {
        if (s.src === src) {
          out.add(s);
        }
      });

      this.subgroups.forEach(function (g) {

        var sub = g._getSampleDescendantsBySource(src);

        sub.forEach(function (s) {
          return out.add(s);
        });
      });
      return Array.from(out);
    };

    _proto._getAllSampleDescendants = function _getAllSampleDescendants() {
      var out = new Set();
      this.samples.forEach(function (s) {
        return out.add(s);
      });

      this.subgroups.forEach(function (g) {

        var sub = g._getAllSampleDescendants(src);

        sub.forEach(function (s) {
          return out.add(s);
        });
      });
      return Array.from(out);
    };

    return Group;
  }(AbstractAudioWrapper);

  var Sound =

  function () {
    function Sound() {}

    Sound._initialize = function _initialize() {
      EventDispatcher.initialize(Sound);
      var soundContextClass = window.AudioContext || window.webkitAudioContext;
      Sound.__context = new soundContextClass();
      Sound.__rootGroup = new Group(null);

      Sound.__rootGroup.outputNode.connect(Sound.context.destination);

      Sound.__fileExtensionPriorityList = ["mp3"];
      Sound._strictFallbacks = true;
      Sound._idHash = {};
      Sound._arrayBufferIdSuffix = 0;
      Sound._audioBufferIdSuffix = 0;
      Sound._audioBuffers = {};
    };

    Sound.registerSound = function registerSound(sampleData, id, defaultPlayProps) {
      id = id || Sound._generateRegistrationId(sampleData);

      if (Sound._idHash[id]) {

        if (Sound._idHash[id] === sampleData || Sound._idHash[id].src === sampleData) {

          defaultPlayProps && Sound._idHash[id].consumePlayPropsObj(defaultPlayProps);
          return;
        } else {

          throw new Error("Error registering sound with id \"" + id + "\" - id already in use.");
        }
      }

      var sample = sampleData instanceof Sample ? sampleData : new Sample(sampleData);
      sample.consumePlayPropsObj(defaultPlayProps);
      Sound._idHash[id] = sample;
    };

    Sound._generateRegistrationId = function _generateRegistrationId(sampleOrSource) {
      return sampleOrSource instanceof Sample ? sampleOrSource.src : sampleOrSource;
    };

    Sound.removeSound = function removeSound(id) {

      var sample = Sound._idHash[id];

      if (sample) {
        delete Sound._idHash[id];
        sample.destroy();
      } else {
        throw new Error("Could not remove sample - sample not found.");
      }
    };

    Sound.play = function play(idOrSrc, playProps) {
      var registered = Sound._idHash[idOrSrc];

      if (registered) {
        registered.play(playProps);
        return registered;
      } else {

        var sample = new Sample(idOrSrc);
        Sound.registerSound(sample, idOrSrc);
        sample.play(playProps);
        return sample;
      }
    };

    Sound.stop = function stop() {
      Sound.rootGroup.stop();
    };

    Sound.isExtensionSupported = function isExtensionSupported(pathOrExtension, strict) {
      if (strict === void 0) {
        strict = true;
      }

      var match = /\.(\w+)$/.exec(pathOrExtension);
      var ext = match ? match[1] : pathOrExtension;
      var result = document.createElement("audio").canPlayType("audio/" + ext);

      return strict ? result === "probably" : result !== "";
    };

    Sound.purgeSamples = function purgeSamples(urlOrId) {

      var samples = null;

      if (urlOrId === "" || urlOrId === undefined) {
        samples = Sound.rootGroup._getAllSampleDescendants();
      } else {
        samples = Sound.rootGroup._getSampleDescendantsBySource(urlOrId);
      }

      if (Sound._idHash[urlOrId]) {
        Sound.removeSound(urlOrId);
      }

      samples.forEach(function (s) {
        return s.destroy();
      });
    };

    Sound.pause = function pause() {
      this.rootGroup.pause();
    };

    Sound.resume = function resume() {
      this.rootGroup.resume();
    };

    Sound.add = function add(sampleOrGroup) {
      this.rootGroup.add(sampleOrGroup);
    };

    Sound.getSampleBySrc = function getSampleBySrc(src) {
      var list = Sound.getSamplesBySrc(src);

      if (list) {
        return list[0];
      } else {
        return null;
      }
    };

    Sound.getSamplesBySrc = function getSamplesBySrc(src) {
      return this.rootGroup._getSampleDescendantsBySource(src);
    };

    Sound.registerSounds = function registerSounds(sounds) {
      sounds.forEach(function (s) {
        return Sound.registerSound(s);
      });
    };

    Sound.removeSounds = function removeSounds(sounds) {
      sounds.forEach(function (s) {
        return Sound.removeSound(s);
      });
    };

    Sound.removeAllSounds = function removeAllSounds() {
      Sound.purgeSamples();
    };

    Sound.requestBuffer = function requestBuffer(data, sample) {

      var id = Sound._reserveId(data);

      if (!id) {
        return null;

      }

      if (Sound._audioBuffers[id] instanceof Promise) {

        console.log("Already loading - we have a promise. returning");
        return Sound._audioBuffers[id];
      }

      if (Sound._audioBuffers[id] instanceof AudioBuffer) {
        console.log("buffer already exists - returning");
        return new Promise(function (resolve, reject) {
          resolve({
            audioBuffer: Sound._audioBuffers[id],
            bufferId: id
          });
        });
      }

      var pr = new Promise(function (resolve, reject) {
        if (Sound._audioBuffers[id] instanceof AudioBuffer) {

          console.log("AudioBuffer already in list");
          resolve({
            audioBuffer: Sound._audioBuffers[id],
            bufferId: id
          });

          return;
        }

        if (data instanceof ArrayBuffer) {
          Sound._fetchByArrayBuffer(data, id, resolve, reject);

          console.log("Fetching by array buffer");
        } else if (data instanceof AudioBuffer) {
          Sound._fetchByAudioBuffer(data, id, resolve, reject);

          console.log("Fetching by audio buffer");
        } else if (typeof data === "string") {
          Sound._fetchByString(data, id, resolve, reject);

          console.log("Fetching by string");
        } else if (data instanceof Array) {
          Sound._fetchByUrlArray(data, id, resolve, reject);

          console.log("Fetching by url array");
        } else if (typeof data === "object") {
          Sound._fetchByUrlHash(data, id, resolve, reject);

          console.log("Fetching by url hash");
        }
      });

      if (!(Sound._audioBuffers[id] instanceof AudioBuffer)) {

        console.log("storing promise");
        Sound._audioBuffers[id] = pr;
      }

      return pr;
    };

    Sound._reserveId = function _reserveId(data) {
      if (data instanceof ArrayBuffer) {
        data.soundJsId = data.soundJsId || "ab_" + Sound._arrayBufferIdSuffix++;
        return data.soundJsId;
      } else if (data instanceof AudioBuffer) {
        data.soundJsId = data.soundJsId || "audioBuffer_" + Sound._audioBufferIdSuffix++;
        return data.soundJsId;
      } else if (typeof data === "string") {
        return data;
      } else if (data instanceof Array) {
        return this._reserveIdFromUrlArray(data);
      } else if (typeof data === "object") {
        return this._reserveIdFromUrlHash(data);
      }
    };

    Sound._reserveIdFromUrlArray = function _reserveIdFromUrlArray(arr) {
      for (var i = 0; i < arr.length; i++) {
        var url = arr[i];

        if (Sound.isExtensionSupported(url, false)) {
          return url;
        }
      }

      console.warn("Warning: Attempted to create an audiobuffer from a url array, but didn't find any supported file types. Requested urls were:");
      console.log(arr);
      return null;
    };

    Sound._reserveIdFromUrlHash = function _reserveIdFromUrlHash(o) {

      for (var ext in o) {
        if (o.hasOwnProperty(ext) && Sound.isExtensionSupported(ext, false)) {
          return o[ext];
        }
      }

      console.error("Warning: Attempted to create an audiobuffer from a url hash, but didn't find any supported file types. Requested urls were:");
      console.log(o);
      return null;
    };

    Sound._fetchByArrayBuffer = function _fetchByArrayBuffer(buffer, id, resolve, reject) {
      Sound.decodeArrayBuffer(buffer).then(function (audioBuffer) {
        Sound._audioBuffers[id] = audioBuffer;
        resolve({
          audioBuffer: audioBuffer,
          bufferId: id
        });
      });
    };

    Sound._fetchByAudioBuffer = function _fetchByAudioBuffer(buffer, id, resolve, reject) {
      Sound._audioBuffers[id] = buffer;
      resolve({
        audioBuffer: buffer,
        bufferId: id
      });
    };

    Sound._fetchByString = function _fetchByString(data, id, resolve, reject) {
      console.log("found string url");
      var ab = Sound._audioBuffers[id];

      if (ab) {
        resolve({
          audioBuffer: ab,
          bufferId: id
        });

        return;
      }

      if (/^data:.*?,/.test(data)) {

        console.log("found data url");
        var _ab = Sound._audioBuffers[id];

        if (_ab instanceof AudioBuffer) {
          resolve({
            audioBuffer: _ab,
            bufferId: data
          });
        } else {

          Sound.loadAndDecodeAudio(data).then(function (audioBuffer) {
            Sound._audioBuffers[id] = audioBuffer;
            resolve({
              audioBuffer: audioBuffer,
              bufferId: data
            });
          });
        }
      } else {

        var src = Sound.ensureValidFileExtension(data);
        console.log("found regular string url");

        var _ab2 = Sound._audioBuffers[src];

        if (_ab2 instanceof AudioBuffer) {
          resolve({
            audioBuffer: _ab2,
            bufferId: src
          });
        } else {
          Sound.loadAndDecodeAudio(src).then(function (audioBuffer) {
            Sound._audioBuffers[id] = audioBuffer;
            resolve({
              audioBuffer: audioBuffer,
              bufferId: id
            });
          });
        }
      }
    };

    Sound._fetchByUrlArray = function _fetchByUrlArray(arr, id, resolve, reject) {
      var ab = Sound._audioBuffers[id];

      if (ab instanceof AudioBuffer) {
        resolve({
          audioBuffer: ab,
          bufferId: id
        });
      }

      for (var i = 0; i < arr.length; i++) {
        var url = arr[i];

        if (!Sound.isExtensionSupported(url, false)) {
          continue;
        }

        var _ab3 = Sound._audioBuffers[id];

        if (_ab3 instanceof AudioBuffer) {
          resolve({
            audioBuffer: _ab3,
            bufferId: id
          });
        } else {
          Sound.loadAndDecodeAudio(url).then(function (audioBuffer) {
            Sound._audioBuffers[id] = audioBuffer;
            resolve({
              audioBuffer: audioBuffer,
              bufferId: id
            });
          });
        }

        return;
      }

      reject("No supported files types found in URL array");
    };

    Sound._fetchByUrlHash = function _fetchByUrlHash(hash, id, resolve, reject) {

      for (var ext in data) {
        if (!data.hasOwnProperty(ext) || !Sound.isExtensionSupported(ext, false)) {
          continue;
        }

        var ab = Sound._audioBuffers[id];

        if (ab instanceof AudioBuffer) {
          resolve({
            audioBuffer: ab,
            bufferId: data[ext]
          });
        } else {
          Sound.loadAndDecodeAudio(data[ext]).then(function (audioBuffer) {
            Sound._audioBuffers[id] = audioBuffer;
            resolve({
              audioBuffer: audioBuffer,
              bufferId: id
            });
          });
        }

        break;
      }
    };

    Sound.loadAndDecodeAudio = function loadAndDecodeAudio(src) {
      return new Promise(function (resolve, reject) {
        Sound.loadAudio(src).then(function (arrayBuffer) {
          Sound.decodeArrayBuffer(arrayBuffer).then(function (audioBuffer) {
            return resolve(audioBuffer);
          });
        });
      });
    };

    Sound.loadAudio = function loadAudio(src) {
      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', src, true);
        request.responseType = 'arraybuffer';

        request.onload = function (loadEvent) {
          var xhr = loadEvent.target;

          if (xhr.readyState === 4 && xhr.status === 200) {
            var result = xhr.response;
            resolve(result);
          } else {
            reject(loadEvent);
          }
        };

        request.send();
      });
    };

    Sound.decodeArrayBuffer = function decodeArrayBuffer(arrayBuffer) {
      return new Promise(function (resolve, reject) {
        Sound.context.decodeAudioData(arrayBuffer, function (result) {

          resolve(result);
        }, function (error) {

          reject(error);
        });
      });
    };

    Sound.ensureValidFileExtension = function ensureValidFileExtension(url) {

      var extensionExp = /\.\w+$/;
      var result = extensionExp.exec(url);

      if (result === null) {

        url = url.concat("." + Sound.fallbackFileExtension);
      } else {

        var extension = result[0].substr(1);

        if (!Sound.isExtensionSupported(extension, false)) {
          url = url.replace(extensionExp, "." + Sound.fallbackFileExtension);
        }
      }

      return url;
    };

    Sound.releaseBuffer = function releaseBuffer(id, sample) {};

    _createClass(Sound, null, [{
      key: "context",
      get: function get() {
        return Sound.__context;
      }
    }, {
      key: "rootGroup",
      get: function get() {
        return Sound.__rootGroup;
      }

    }, {
      key: "strictFallbacks",
      get: function get() {
        return Sound._strictFallbacks;
      },
      set: function set(val) {
        Sound._strictFallbacks = val;
      }

    }, {
      key: "fileExtensionPriorityList",
      get: function get() {
        return Sound.__fileExtensionPriorityList;
      },
      set: function set(newList) {
        var list = Sound.fileExtensionPriorityList;

        list.splice(0, list.length);
        newList.forEach(function (item) {
          return list.push(item);
        });
      }
    }, {
      key: "fallbackFileExtension",
      get: function get() {

        var testElement = document.createElement("audio");
        var bestMaybe = null;

        for (var i = 0; i < Sound.fileExtensionPriorityList.length; i++) {
          var extension = Sound.fileExtensionPriorityList[i];
          var result = testElement.canPlayType("audio/" + extension);

          switch (result) {
            case "probably":
              return extension;

            case "maybe":
              if (!Sound.strictFallbacks) {
                return extension;
              } else if (bestMaybe === null) {
                bestMaybe = extension;
              }

              break;

            case "":

            default:

          }
        }

        return bestMaybe || null;
      }
    }]);

    return Sound;
  }();

  Sound._initialize();

  var Declicker =

  function (_EventDispatcher) {
    _inheritsLoose(Declicker, _EventDispatcher);

    _createClass(Declicker, [{
      key: "isFadingIn",
      get: function get() {
        return this.isFading && this._fadingIn === true;
      }
    }, {
      key: "isFadingOut",
      get: function get() {
        return this.isFading && this._fadingIn === false;
      }
    }, {
      key: "isFading",
      get: function get() {
        return !!this.fadeMaskTimeout;
      }
    }]);

    function Declicker(gainNode) {
      var _this;

      _this = _EventDispatcher.call(this) || this;

      _this.gainNode = _this.inputNode = _this.outputNode = gainNode || Sound.context.createGain();
      _this.fadeMaskDuration = 0.02;

      _this.fadeMaskTimeout = null;

      _this._fadingIn = null;
      return _this;
    }

    var _proto = Declicker.prototype;

    _proto.fadeOut = function fadeOut() {
      var _this2 = this;

      if (this.fadeMaskTimeout) {
        return;
      }

      this.gainNode.gain.value = 1;
      this.gainNode.gain.linearRampToValueAtTime(0, Sound.context.currentTime + this.fadeMaskDuration);
      this._fadingIn = false;
      this.fadeMaskTimeout = window.setTimeout(function () {
        _this2.dispatchEvent("fadeOutComplete");

        _this2.fadeMaskTimeout = null;
        _this2._fadingIn = null;
      }, this.fadeMaskDuration * 1100 | 0);
    };

    _proto.fadeIn = function fadeIn() {
      var _this3 = this;

      if (this.fadeMaskTimeout) {
        return;
      }

      this.gainNode.gain.value = 0;
      this.gainNode.gain.linearRampToValueAtTime(1, Sound.context.currentTime + this.fadeMaskDuration);
      this._fadingIn = true;
      this.fadeMaskTimeout = window.setTimeout(function () {
        _this3.dispatchEvent("fadeInComplete");

        _this3.fadeMaskTimeout = null;
        _this3._fadingIn = null;
      }, this.fadeMaskDuration * 1100 | 0);
    };

    _proto.cancelFade = function cancelFade() {
      if (!this.fadeMaskTimeout) {
        return;
      }

      this.gainNode.gain.cancelScheduledValues(Sound.context.currentTime);
      this.gainNode.gain.value = 1;
      window.clearTimeout(this.fadeMaskTimeout);
      this.fadeMaskTimeout = null;
      this._fadingIn = null;
    };

    return Declicker;
  }(EventDispatcher);

  var Playback =

  function (_AbstractAudioWrapper) {
    _inheritsLoose(Playback, _AbstractAudioWrapper);

    _createClass(Playback, [{
      key: "elapsed",
      get: function get() {
        var ctx = Sound.context;

        if (this._paused) {
          return this._positionOffset - this.offset - this._remainingDelay;
        } else {
          return ctx.currentTime - this._startTime + this._positionOffset - this.offset;
        }
      }
    }, {
      key: "position",
      get: function get() {
        var ctx = Sound.context;

        if (this._paused) {
          return this._positionOffset;
        } else {
          if (this.elapsed < 0) {

            return this.offset;
          } else {
            return ctx.currentTime - this._startTime + this._positionOffset;
          }
        }
      }
    }, {
      key: "duration",
      get: function get() {
        return this.buffer.duration;
      }
    }, {
      key: "playing",
      get: function get() {
        return Boolean(this._sourceNode) && !this.paused && !this._stopping;
      }
    }, {
      key: "paused",
      set: function set(val) {
        if (val) {
          this.pause();
        } else {
          this.resume();
        }
      },
      get: function get() {
        return this._pausing || this._paused;
      }
    }]);

    function Playback(audioBuffer, options) {
      var _this;

      if (options === void 0) {
        options = {};
      }

      _this = _AbstractAudioWrapper.call(this) || this;
      var ctx = Sound.context;
      _this.fademaskerNode = ctx.createGain();

      _this.fademaskerNode.connect(_this.fxBus);

      _this.declicker = new Declicker(_this.fademaskerNode);

      _this.declicker.on("fadeOutComplete", _this.handleFadeMaskComplete, _assertThisInitialized(_assertThisInitialized(_this)));

      _this.buffer = audioBuffer;
      _this._startTime = null;
      _this._positionOffset = 0;

      _this._remainingDelay = 0;

      _this._paused = false;
      _this._pausing = false;
      _this._stopping = false;

      var loops = Number(options.loops);
      _this.remainingLoops = loops ? Math.max(loops | 0, -1) : 0;
      _this.delay = isNaN(Number(options.delay)) ? 0 : Number(options.delay);

      _this.offset = isNaN(Number(options.offset)) ? 0 : Number(options.offset);

      _this.playDuration = options.playDuration;

      _this._play(_this.delay, _this.offset, _this.playDuration);

      return _this;
    }

    var _proto = Playback.prototype;

    _proto._play = function _play(delay, offset, duration) {
      if (delay === void 0) {
        delay = 0;
      }

      if (offset === void 0) {
        offset = 0;
      }

      if (duration === void 0) {
        duration = this.buffer.duration;
      }

      var ctx = Sound.context;

      if (this._sourceNode) {
        return;
      }

      if (duration === null) {
        duration = this.buffer.duration;
      }

      this.fademaskerNode.gain.value = 0;
      this._sourceNode || this._createSourceNode();

      this._sourceNode.start(ctx.currentTime + delay, offset, duration);

      this.declicker.fadeIn();
      this._startTime = ctx.currentTime + delay;
      this._positionOffset = offset;
      this._paused = false;
    };

    _proto._createSourceNode = function _createSourceNode() {
      var ctx = Sound.context;
      this._sourceNode = ctx.createBufferSource();
      this._sourceNode.buffer = this.buffer;

      this._sourceNode.connect(this.fademaskerNode);

      this._sourceNode.onended = this.handleEnded.bind(this);
    };

    _proto.loop = function loop() {
      this._sourceNode = null;

      this._play(0, this.offset, this.playDuration);

      if (this.remainingLoops > 0) {
        this.remainingLoops--;
      }
    };

    _proto.pause = function pause() {
      if (!this.playing) {

        return;
      }

      if (this.declicker.isFadingIn) {

        this.declicker.cancelFade();
      }

      this.dispatchEvent("paused");
      this._pausing = true;
      this.declicker.fadeOut();
    };

    _proto.resume = function resume() {
      if (this._stopping) ; else if (this._paused) {
        this._play(this._remainingDelay, this._positionOffset);

        this._paused = false;
      } else if (this._pausing) {
        this.declicker.cancelFade();
        this._pausing = false;
      }

    };

    _proto._pauseCore = function _pauseCore() {
      this._positionOffset = this.position;

      if (this.elapsed < 0) {
        this._remainingDelay = -this.elapsed;
      } else {
        this._remainingDelay = 0;
      }

      this._sourceNode.stop();

      this._sourceNode = null;
      this._pausing = false;
      this._paused = true;
    };

    _proto.stop = function stop() {
      if (this._stopping) {

        return;
      }

      if (this._paused) {
        this._stopCore();

        this.dispatchEvent("stopped");
        return;
      }

      this.dispatchEvent("stopped");
      this._stopping = true;
      this.declicker.fadeOut();
    };

    _proto._stopCore = function _stopCore() {

      this._stopping = false;
      this.destroy();
    };

    _proto.destroy = function destroy() {
      if (this._sourceNode) {
        this._sourceNode.onended = null;

        this._sourceNode && this._sourceNode.stop();
      }

      this.dispatchEvent("end");

      this._sourceNode = null;
      this._paused = false;
      this.dispatchEvent("destroyed");

      this._play = function () {
        throw new Error("Cannot play Playback after it has been destroyed.");
      };

      this.removeAllEventListeners();
      this.declicker.removeAllEventListeners();
    };

    _proto.handleEnded = function handleEnded() {
      if (this.paused) ; else {

        if (this.remainingLoops !== 0) {
          this.dispatchEvent("end");
          this.loop();
        } else {

          this.destroy();
        }
      }
    };

    _proto.handleFadeMaskComplete = function handleFadeMaskComplete() {
      if (this._stopping) {
        this._stopCore();
      } else if (this._pausing) {
        this._pauseCore();
      }
    };

    return Playback;
  }(AbstractAudioWrapper);

  var Effect =

  function () {
    function Effect() {

      this.inputNode = Sound.context.createGain();

      this.effectBus = Sound.context.createGain();

      this.outputNode = Sound.context.createGain();

      this.dryGain = Sound.context.createGain();

      this.wetGain = Sound.context.createGain();

      this.inputNode.connect(this.effectBus);
      this.inputNode.connect(this.dryGain);
      this.wetGain.connect(this.outputNode);
      this.dryGain.connect(this.outputNode);
      this.dryGain.gain.value = 0;
      this._enabled = true;
      this.owner = null;
    }

    var _proto = Effect.prototype;

    _proto.connect = function connect(destination) {
      if (destination && destination.inputNode) {

        destination = destination.inputNode;
      }

      this.outputNode.connect(destination);
    };

    _proto.disconnect = function disconnect(destination) {
      if (destination && destination.inputNode) {

        destination = destination.inputNode;
      }

      this.outputNode.disconnect(destination);
    };

    _proto.disable = function disable() {
      if (!this._enabled) {
        return;
      }

      this.inputNode.disconnect(this.effectBus);
      this.inputNode.disconnect(this.dryGain);
      this.inputNode.connect(this.outputNode);
      this._enabled = false;
    };

    _proto.enable = function enable() {
      if (this._enabled) {
        return;
      }

      this.inputNode.disconnect(this.outputNode);
      this.inputNode.connect(this.effectBus);
      this.inputNode.connect(this.dryGain);
      this._enabled = true;
    };

    return Effect;
  }();

  var LowPassFilter =

  function (_Effect) {
    _inheritsLoose(LowPassFilter, _Effect);

    _createClass(LowPassFilter, [{
      key: "Q",
      set: function set(val) {
        this.filterNode.Q.value = val;
      },
      get: function get() {
        return this.filterNode.Q.value;
      }
    }, {
      key: "frequency",
      set: function set(val) {
        this.filterNode.frequency.value = val;
      },
      get: function get() {
        return this.filterNode.frequency.value;
      }
    }]);

    function LowPassFilter(cutoffFrequency, Q) {
      var _this;

      if (cutoffFrequency === void 0) {
        cutoffFrequency = 2000;
      }

      if (Q === void 0) {
        Q = 1;
      }

      _this = _Effect.call(this) || this;
      _this.filterNode = Sound.context.createBiquadFilter();
      _this.filterNode.type = "lowpass";
      _this.frequency = cutoffFrequency;
      _this.Q = Q;

      _this.effectBus.connect(_this.filterNode);

      _this.filterNode.connect(_this.wetGain);

      return _this;
    }

    return LowPassFilter;
  }(Effect);

  var HighPassFilter =

  function (_Effect) {
    _inheritsLoose(HighPassFilter, _Effect);

    _createClass(HighPassFilter, [{
      key: "Q",
      set: function set(val) {
        this.filterNode.Q.value = val;
      },
      get: function get() {
        return this.filterNode.Q.value;
      }
    }, {
      key: "frequency",
      set: function set(val) {
        this.filterNode.frequency.value = val;
      },
      get: function get() {
        return this.filterNode.frequency.value;
      }
    }]);

    function HighPassFilter(cutoffFrequency, Q) {
      var _this;

      if (cutoffFrequency === void 0) {
        cutoffFrequency = 1000;
      }

      if (Q === void 0) {
        Q = 1;
      }

      _this = _Effect.call(this) || this;
      _this.filterNode = Sound.context.createBiquadFilter();
      _this.filterNode.type = "highpass";
      _this.frequency = cutoffFrequency;
      _this.Q = Q;

      _this.effectBus.connect(_this.filterNode);

      _this.filterNode.connect(_this.wetGain);

      return _this;
    }

    return HighPassFilter;
  }(Effect);

  var BiquadFilter =

  function (_Effect) {
    _inheritsLoose(BiquadFilter, _Effect);

    BiquadFilter._initialize = function _initialize() {

      BiquadFilter.HIGHPASS = "highpass";
      BiquadFilter.LOWPASS = "lowpass";
      BiquadFilter.BANDPASS = "bandpass";
      BiquadFilter.LOWSHELF = "lowshelf";
      BiquadFilter.HIGHSHELF = "highshelf";
      BiquadFilter.PEAKING = "peaking";
      BiquadFilter.NOTCH = "notch";
      BiquadFilter.ALLPASS = "allpass";
    };

    _createClass(BiquadFilter, [{
      key: "type",
      set: function set(val) {
        this.filterNode.type = val;
      },
      get: function get() {
        return this.filterNode.type;
      }
    }, {
      key: "Q",
      set: function set(val) {
        this.filterNode.Q.value = val;
      },
      get: function get() {
        return this.filterNode.Q.value;
      }
    }, {
      key: "frequency",
      set: function set(val) {
        this.filterNode.frequency.value = val;
      },
      get: function get() {
        return this.filterNode.frequency.value;
      }
    }, {
      key: "gain",
      set: function set(val) {
        this.filterNode.gain.value = val;
      },
      get: function get() {
        return this.filterNode.gain.value;
      }
    }, {
      key: "detune",
      set: function set(val) {
        this.filterNode.detune.value = val;
      },
      get: function get() {
        return this.filterNode.detune.value;
      }
    }]);

    function BiquadFilter(type, frequency, Q, gain, detune) {
      var _this;

      if (type === void 0) {
        type = "lowpass";
      }

      if (frequency === void 0) {
        frequency = 1500;
      }

      if (Q === void 0) {
        Q = 1;
      }

      if (gain === void 0) {
        gain = 0;
      }

      if (detune === void 0) {
        detune = 0;
      }

      _this = _Effect.call(this) || this;
      _this.filterNode = Sound.context.createBiquadFilter();
      _this.filterNode.type = type;
      _this.frequency = frequency;
      _this.Q = Q;
      _this.gain = gain;
      _this.detune = detune;

      _this.effectBus.connect(_this.filterNode);

      _this.filterNode.connect(_this.wetGain);

      return _this;
    }

    return BiquadFilter;
  }(Effect);

  BiquadFilter._initialize();

  var FX = {
    Effect: Effect,
    LowPassFilter: LowPassFilter,
    HighPassFilter: HighPassFilter,
    BiquadFilter: BiquadFilter
  };

  exports.FX = FX;
  exports.Playback = Playback;
  exports.Sample = Sample;
  exports.Group = Group;
  exports.Sound = Sound;

  var v = exports.versions = exports.versions || {};
  v.soundjs = "NEXT";

}((this.createjs = this.createjs || {})));
//# sourceMappingURL=soundjs-NEXT.js.map
