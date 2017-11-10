/**
 * @license SoundJS
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
var createjs = function(exports) {
  "use strict";
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
  /**
   * A collection of classes that are shared across the CreateJS libraries.
   * Classes required by a library are compiled with that library.
   *
   * @module CreateJS
   * @main CreateJS
   */
  /**
   * Contains properties and methods shared by all events for use with {{#crossLink "EventDispatcher"}}{{/crossLink}}.
   * Note that Event objects are often reused, so you should never
   * rely on an event object's state outside of the call stack it was received in.
   *
   * @class Event
   * @module CreateJS
   */
  var Event = function() {
    // constructor:
    /**
     * @param {String} type The event type.
     * @param {Boolean} [bubbles=false] Indicates whether the event will bubble through the display list.
     * @param {Boolean} [cancelable=false] Indicates whether the default behaviour of this event can be cancelled.
     * @constructor
     */
    function Event(type) {
      var bubbles = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var cancelable = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      classCallCheck(this, Event);
      /**
       * The type of event.
       * @property type
       * @type String
       */
      this.type = type;
      /**
       * The object that generated an event.
       * @property target
       * @type Object
       * @default null
       * @readonly
       */
      this.target = null;
      /**
       * The current target that a bubbling event is being dispatched from. For non-bubbling events, this will
       * always be the same as target. For example, if childObj.parent = parentObj, and a bubbling event
       * is generated from childObj, then a listener on parentObj would receive the event with
       * target=childObj (the original target) and currentTarget=parentObj (where the listener was added).
       * @property currentTarget
       * @type Object
       * @default null
       * @readonly
       */
      this.currentTarget = null;
      /**
       * For bubbling events, this indicates the current event phase:<OL>
       * 	<LI> capture phase: starting from the top parent to the target</LI>
       * 	<LI> at target phase: currently being dispatched from the target</LI>
       * 	<LI> bubbling phase: from the target to the top parent</LI>
       * </OL>
       * @property eventPhase
       * @type Number
       * @default 0
       * @readonly
       */
      this.eventPhase = 0;
      /**
       * Indicates whether the event will bubble through the display list.
       * @property bubbles
       * @type Boolean
       * @default false
       * @readonly
       */
      this.bubbles = bubbles;
      /**
       * Indicates whether the default behaviour of this event can be cancelled via
       * {{#crossLink "Event/preventDefault"}}{{/crossLink}}. This is set via the Event constructor.
       * @property cancelable
       * @type Boolean
       * @default false
       * @readonly
       */
      this.cancelable = cancelable;
      /**
       * The epoch time at which this event was created.
       * @property timeStamp
       * @type Number
       * @default 0
       * @readonly
       */
      this.timeStamp = (new Date).getTime();
      /**
       * Indicates if {{#crossLink "Event/preventDefault"}}{{/crossLink}} has been called
       * on this event.
       * @property defaultPrevented
       * @type Boolean
       * @default false
       * @readonly
       */
      this.defaultPrevented = false;
      /**
       * Indicates if {{#crossLink "Event/stopPropagation"}}{{/crossLink}} or
       * {{#crossLink "Event/stopImmediatePropagation"}}{{/crossLink}} has been called on this event.
       * @property propagationStopped
       * @type Boolean
       * @default false
       * @readonly
       */
      this.propagationStopped = false;
      /**
       * Indicates if {{#crossLink "Event/stopImmediatePropagation"}}{{/crossLink}} has been called
       * on this event.
       * @property immediatePropagationStopped
       * @type Boolean
       * @default false
       * @readonly
       */
      this.immediatePropagationStopped = false;
      /**
       * Indicates if {{#crossLink "Event/remove"}}{{/crossLink}} has been called on this event.
       * @property removed
       * @type Boolean
       * @default false
       * @readonly
       */
      this.removed = false
    }
    // public methods:
    /**
     * Sets {{#crossLink "Event/defaultPrevented"}}{{/crossLink}} to true if the event is cancelable.
     * Mirrors the DOM level 2 event standard. In general, cancelable events that have `preventDefault()` called will
     * cancel the default behaviour associated with the event.
     * @method preventDefault
     */
    Event.prototype.preventDefault = function preventDefault() {
      this.defaultPrevented = this.cancelable
    };
    /**
     * Sets {{#crossLink "Event/propagationStopped"}}{{/crossLink}} to true.
     * Mirrors the DOM event standard.
     * @method stopPropagation
     */
    Event.prototype.stopPropagation = function stopPropagation() {
      this.propagationStopped = true
    };
    /**
     * Sets {{#crossLink "Event/propagationStopped"}}{{/crossLink}} and
     * {{#crossLink "Event/immediatePropagationStopped"}}{{/crossLink}} to true.
     * Mirrors the DOM event standard.
     * @method stopImmediatePropagation
     */
    Event.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true
    };
    /**
     * Causes the active listener to be removed via removeEventListener();
     *
     * 		myBtn.addEventListener("click", function(evt) {
     * 			// do stuff...
     * 			evt.remove(); // removes this listener.
     * 		});
     *
     * @method remove
     */
    Event.prototype.remove = function remove() {
      this.removed = true
    };
    /**
     * Returns a clone of the Event instance.
     * @method clone
     * @return {Event} a clone of the Event instance.
     */
    Event.prototype.clone = function clone() {
      var event = new Event(this.type, this.bubbles, this.cancelable);
      for (var n in this) {
        if (this.hasOwnProperty(n)) {
          event[n] = this[n]
        }
      }
      return event
    };
    /**
     * Provides a chainable shortcut method for setting a number of properties on the instance.
     *
     * @method set
     * @param {Object} props A generic object containing properties to copy to the instance.
     * @return {Event} Returns the instance the method is called on (useful for chaining calls.)
     * @chainable
     */
    Event.prototype.set = function set(props) {
      for (var n in props) {
        this[n] = props[n]
      }
      return this
    };
    /**
     * Returns a string representation of this object.
     * @method toString
     * @return {String} a string representation of the instance.
     */
    Event.prototype.toString = function toString() {
      return "[" + this.constructor.name + " (type=" + this.type + ")]"
    };
    return Event
  }();
  /**
   * EventDispatcher provides methods for managing queues of event listeners and dispatching events.
   *
   * You can either extend EventDispatcher or mix its methods into an existing prototype or instance by using the
   * EventDispatcher {{#crossLink "EventDispatcher/initialize"}}{{/crossLink}} method.
   *
   * Together with the CreateJS Event class, EventDispatcher provides an extended event model that is based on the
   * DOM Level 2 event model, including addEventListener, removeEventListener, and dispatchEvent. It supports
   * bubbling / capture, preventDefault, stopPropagation, stopImmediatePropagation, and handleEvent.
   *
   * EventDispatcher also exposes a {{#crossLink "EventDispatcher/on"}}{{/crossLink}} method, which makes it easier
   * to create scoped listeners, listeners that only run once, and listeners with associated arbitrary data. The
   * {{#crossLink "EventDispatcher/off"}}{{/crossLink}} method is merely an alias to
   * {{#crossLink "EventDispatcher/removeEventListener"}}{{/crossLink}}.
   *
   * Another addition to the DOM Level 2 model is the {{#crossLink "EventDispatcher/removeAllEventListeners"}}{{/crossLink}}
   * method, which can be used to listeners for all events, or listeners for a specific event. The Event object also
   * includes a {{#crossLink "Event/remove"}}{{/crossLink}} method which removes the active listener.
   *
   * <h4>Example</h4>
   * Add EventDispatcher capabilities to the "MyClass" class.
   *
   *      EventDispatcher.initialize(MyClass.prototype);
   *
   * Add an event (see {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}}).
   *
   *      instance.addEventListener("eventName", handlerMethod);
   *      function handlerMethod(event) {
   *          console.log(event.target + " Was Clicked");
   *      }
   *
   * <b>Maintaining proper scope</b><br />
   * Scope (ie. "this") can be be a challenge with events. Using the {{#crossLink "EventDispatcher/on"}}{{/crossLink}}
   * method to subscribe to events simplifies this.
   *
   *      instance.addEventListener("click", function(event) {
   *          console.log(instance == this); // false, scope is ambiguous.
   *      });
   *
   *      instance.on("click", function(event) {
   *          console.log(instance == this); // true, "on" uses dispatcher scope by default.
   *      });
   *
   * If you want to use addEventListener instead, you may want to use function.bind() or a similar proxy to manage scope.
   *
   *
   * @class EventDispatcher
   * @module CreateJS
   */
  var EventDispatcher = function() {
    // static methods:
    /**
     * Static initializer to mix EventDispatcher methods into a target object or prototype.
     *
     * 		EventDispatcher.initialize(MyClass.prototype); // add to the prototype of the class
     * 		EventDispatcher.initialize(myObject); // add to a specific instance
     *
     * @method initialize
     * @static
     * @param {Object} target The target object to inject EventDispatcher methods into. This can be an instance or a
     * prototype.
     */
    EventDispatcher.initialize = function initialize(target) {
      var p = EventDispatcher.prototype;
      target.addEventListener = p.addEventListener;
      target.on = p.on;
      target.removeEventListener = target.off = p.removeEventListener;
      target.removeAllEventListeners = p.removeAllEventListeners;
      target.hasEventListener = p.hasEventListener;
      target.dispatchEvent = p.dispatchEvent;
      target._dispatchEvent = p._dispatchEvent;
      target.willTrigger = p.willTrigger
    };
    // constructor:
    /**
     * @constructor
     */
    function EventDispatcher() {
      classCallCheck(this, EventDispatcher);
      /**
       * @protected
       * @property _listeners
       * @type Object
       */
      this._listeners = null;
      /**
       * @protected
       * @property _captureListeners
       * @type Object
       */
      this._captureListeners = null
    }
    // public methods:
    /**
     * Adds the specified event listener. Note that adding multiple listeners to the same function will result in
     * multiple callbacks getting fired.
     *
     * <h4>Example</h4>
     *
     *      displayObject.addEventListener("click", handleClick);
     *      function handleClick(event) {
     *         // Click happened.
     *      }
     *
     * @method addEventListener
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener An object with a handleEvent method, or a function that will be called when
     * the event is dispatched.
     * @param {Boolean} [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     * @return {Function | Object} Returns the listener for chaining or assignment.
     */
    EventDispatcher.prototype.addEventListener = function addEventListener(type, listener, useCapture) {
      var listeners = void 0;
      if (useCapture) {
        listeners = this._captureListeners = this._captureListeners || {}
      } else {
        listeners = this._listeners = this._listeners || {}
      }
      var arr = listeners[type];
      if (arr) {
        this.removeEventListener(type, listener, useCapture)
      }
      arr = listeners[type]; // remove may have deleted the array
      if (!arr) {
        listeners[type] = [listener]
      } else {
        arr.push(listener)
      }
      return listener
    };
    /**
     * A shortcut method for using addEventListener that makes it easier to specify an execution scope, have a listener
     * only run once, associate arbitrary data with the listener, and remove the listener.
     *
     * This method works by creating an anonymous wrapper function and subscribing it with addEventListener.
     * The wrapper function is returned for use with `removeEventListener` (or `off`).
     *
     * <b>IMPORTANT:</b> To remove a listener added with `on`, you must pass in the returned wrapper function as the listener, or use
     * {{#crossLink "Event/remove"}}{{/crossLink}}. Likewise, each time you call `on` a NEW wrapper function is subscribed, so multiple calls
     * to `on` with the same params will create multiple listeners.
     *
     * <h4>Example</h4>
     *
     * 		var listener = myBtn.on("click", handleClick, null, false, {count:3});
     * 		function handleClick(evt, data) {
     * 			data.count -= 1;
     * 			console.log(this == myBtn); // true - scope defaults to the dispatcher
     * 			if (data.count == 0) {
     * 				alert("clicked 3 times!");
     * 				myBtn.off("click", listener);
     * 				// alternately: evt.remove();
     * 			}
     * 		}
     *
     * @method on
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener An object with a handleEvent method, or a function that will be called when
     * the event is dispatched.
     * @param {Object} [scope] The scope to execute the listener in. Defaults to the dispatcher/currentTarget for function listeners, and to the listener itself for object listeners (ie. using handleEvent).
     * @param {Boolean} [once=false] If true, the listener will remove itself after the first time it is triggered.
     * @param {*} [data] Arbitrary data that will be included as the second parameter when the listener is called.
     * @param {Boolean} [useCapture=false] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     * @return {Function} Returns the anonymous function that was created and assigned as the listener. This is needed to remove the listener later using .removeEventListener.
     */
    EventDispatcher.prototype.on = function on(type, listener) {
      var scope = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var once = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var data = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
      var useCapture = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
      if (listener.handleEvent) {
        scope = scope || listener;
        listener = listener.handleEvent
      }
      scope = scope || this;
      return this.addEventListener(type, function(evt) {
        listener.call(scope, evt, data);
        once && evt.remove()
      }, useCapture)
    };
    /**
     * Removes the specified event listener.
     *
     * <b>Important Note:</b> that you must pass the exact function reference used when the event was added. If a proxy
     * function, or function closure is used as the callback, the proxy/closure reference must be used - a new proxy or
     * closure will not work.
     *
     * <h4>Example</h4>
     *
     *      displayObject.removeEventListener("click", handleClick);
     *
     * @method removeEventListener
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener The listener function or object.
     * @param {Boolean} [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     */
    EventDispatcher.prototype.removeEventListener = function removeEventListener(type, listener, useCapture) {
      var listeners = useCapture ? this._captureListeners : this._listeners;
      if (!listeners) {
        return
      }
      var arr = listeners[type];
      if (!arr) {
        return
      }
      var l = arr.length;
      for (var i = 0; i < l; i++) {
        if (arr[i] == listener) {
          if (l == 1) {
            delete listeners[type]
          } else {
            arr.splice(i, 1)
          }
          break
        }
      }
    };
    /**
     * A shortcut to the removeEventListener method, with the same parameters and return value. This is a companion to the
     * .on method.
     *
     * <b>IMPORTANT:</b> To remove a listener added with `on`, you must pass in the returned wrapper function as the listener. See
     * {{#crossLink "EventDispatcher/on"}}{{/crossLink}} for an example.
     *
     * @method off
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener The listener function or object.
     * @param {Boolean} [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     */
    EventDispatcher.prototype.off = function off(type, listener, useCapture) {
      this.removeEventListener(type, listener, useCapture)
    };
    /**
     * Removes all listeners for the specified type, or all listeners of all types.
     *
     * <h4>Example</h4>
     *
     *      // Remove all listeners
     *      displayObject.removeAllEventListeners();
     *
     *      // Remove all click listeners
     *      displayObject.removeAllEventListeners("click");
     *
     * @method removeAllEventListeners
     * @param {String} [type] The string type of the event. If omitted, all listeners for all types will be removed.
     */
    EventDispatcher.prototype.removeAllEventListeners = function removeAllEventListeners(type) {
      if (!type) {
        this._listeners = this._captureListeners = null
      } else {
        if (this._listeners) {
          delete this._listeners[type]
        }
        if (this._captureListeners) {
          delete this._captureListeners[type]
        }
      }
    };
    /**
     * Dispatches the specified event to all listeners.
     *
     * <h4>Example</h4>
     *
     *      // Use a string event
     *      this.dispatchEvent("complete");
     *
     *      // Use an Event instance
     *      var event = new createjs.Event("progress");
     *      this.dispatchEvent(event);
     *
     * @method dispatchEvent
     * @param {Object | String | Event} eventObj An object with a "type" property, or a string type.
     * While a generic object will work, it is recommended to use a CreateJS Event instance. If a string is used,
     * dispatchEvent will construct an Event instance if necessary with the specified type. This latter approach can
     * be used to avoid event object instantiation for non-bubbling events that may not have any listeners.
     * @param {Boolean} [bubbles] Specifies the `bubbles` value when a string was passed to eventObj.
     * @param {Boolean} [cancelable] Specifies the `cancelable` value when a string was passed to eventObj.
     * @return {Boolean} Returns false if `preventDefault()` was called on a cancelable event, true otherwise.
     */
    EventDispatcher.prototype.dispatchEvent = function dispatchEvent(eventObj) {
      var bubbles = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var cancelable = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (typeof eventObj == "string") {
        // skip everything if there's no listeners and it doesn't bubble:
        var listeners = this._listeners;
        if (!bubbles && (!listeners || !listeners[eventObj])) {
          return true
        }
        eventObj = new Event(eventObj, bubbles, cancelable)
      } else if (eventObj.target && eventObj.clone) {
        // redispatching an active event object, so clone it:
        eventObj = eventObj.clone()
      }
      // TODO: it would be nice to eliminate this. Maybe in favour of evtObj instanceof Event? Or !!evtObj.createEvent
      try {
        eventObj.target = this
      } catch (e) {} // try/catch allows redispatching of native events
      if (!eventObj.bubbles || !this.parent) {
        this._dispatchEvent(eventObj, 2)
      } else {
        var top = this,
          i = void 0;
        var list = [top];
        while (top.parent) {
          list.push(top = top.parent)
        }
        var l = list.length;
        // capture & atTarget
        for (i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
          list[i]._dispatchEvent(eventObj, 1 + (i == 0))
        }
        // bubbling
        for (i = 1; i < l && !eventObj.propagationStopped; i++) {
          list[i]._dispatchEvent(eventObj, 3)
        }
      }
      return !eventObj.defaultPrevented
    };
    /**
     * Indicates whether there is at least one listener for the specified event type.
     * @method hasEventListener
     * @param {String} type The string type of the event.
     * @return {Boolean} Returns true if there is at least one listener for the specified event.
     */
    EventDispatcher.prototype.hasEventListener = function hasEventListener(type) {
      var listeners = this._listeners,
        captureListeners = this._captureListeners;
      return !!(listeners && listeners[type] || captureListeners && captureListeners[type])
    };
    /**
     * Indicates whether there is at least one listener for the specified event type on this object or any of its
     * ancestors (parent, parent's parent, etc). A return value of true indicates that if a bubbling event of the
     * specified type is dispatched from this object, it will trigger at least one listener.
     *
     * This is similar to {{#crossLink "EventDispatcher/hasEventListener"}}{{/crossLink}}, but it searches the entire
     * event flow for a listener, not just this object.
     * @method willTrigger
     * @param {String} type The string type of the event.
     * @return {Boolean} Returns `true` if there is at least one listener for the specified event.
     */
    EventDispatcher.prototype.willTrigger = function willTrigger(type) {
      var o = this;
      while (o) {
        if (o.hasEventListener(type)) {
          return true
        }
        o = o.parent
      }
      return false
    };
    /**
     * @method toString
     * @return {String} a string representation of the instance.
     */
    EventDispatcher.prototype.toString = function toString() {
      return "[EventDispatcher]"
    };
    // private methods:
    /**
     * @method _dispatchEvent
     * @param {Object | String | Event} eventObj
     * @param {Object} eventPhase
     * @protected
     */
    EventDispatcher.prototype._dispatchEvent = function _dispatchEvent(eventObj, eventPhase) {
      var listeners = eventPhase == 1 ? this._captureListeners : this._listeners;
      var l = void 0;
      if (eventObj && listeners) {
        var arr = listeners[eventObj.type];
        if (!arr || !(l = arr.length)) {
          return
        }
        try {
          eventObj.currentTarget = this
        } catch (e) {}
        try {
          eventObj.eventPhase = eventPhase
        } catch (e) {}
        eventObj.removed = false;
        arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
        for (var i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
          var o = arr[i];
          if (o.handleEvent) {
            o.handleEvent(eventObj)
          } else {
            o(eventObj)
          }
          if (eventObj.removed) {
            this.off(eventObj.type, o, eventPhase == 1);
            eventObj.removed = false
          }
        }
      }
    };
    return EventDispatcher
  }();
  /**
   * The Ticker provides a centralized tick or heartbeat broadcast at a set interval. Listeners can subscribe to the tick
   * event to be notified when a set time interval has elapsed.
   *
   * Note that the interval that the tick event is called is a target interval, and may be broadcast at a slower interval
   * when under high CPU load. The Ticker class uses a static interface (ex. `Ticker.framerate = 30;`) and
   * can not be instantiated.
   *
   * <h4>Example</h4>
   *
   *      createjs.Ticker.addEventListener("tick", handleTick);
   *      function handleTick(event) {
   *          // Actions carried out each tick (aka frame)
   *          if (!event.paused) {
   *              // Actions carried out when the Ticker is not paused.
   *          }
   *      }
   *
   * @class TickerAPI
   * @extends EventDispatcher
   * @module CreateJS
   */
  var TickerAPI = function(_EventDispatcher) {
    inherits(TickerAPI, _EventDispatcher);
    // constructor:
    /**
     * @param name {String} The name assigned to this instance.
     * @constructor
     * TODO-ES6: Pass timingMode, maxDelta, paused values as instantiation arguments?
     */
    function TickerAPI(name) {
      classCallCheck(this, TickerAPI);
      // public properties:
      /**
       * The name of this instance.
       * @property name
       * @type {String}
       */
      var _this = possibleConstructorReturn(this, _EventDispatcher.call(this));
      _this.name = name;
      /**
       * Specifies the timing api (setTimeout or requestAnimationFrame) and mode to use. See
       * {{#crossLink "Ticker/TIMEOUT"}}{{/crossLink}}, {{#crossLink "Ticker/RAF"}}{{/crossLink}}, and
       * {{#crossLink "Ticker/RAF_SYNCHED"}}{{/crossLink}} for mode details.
       * @property timingMode
       * @type {String}
       * @default Ticker.TIMEOUT
       */
      _this.timingMode = TickerAPI.TIMEOUT;
      /**
       * Specifies a maximum value for the delta property in the tick event object. This is useful when building time
       * based animations and systems to prevent issues caused by large time gaps caused by background tabs, system sleep,
       * alert dialogs, or other blocking routines. Double the expected frame duration is often an effective value
       * (ex. maxDelta=50 when running at 40fps).
       *
       * This does not impact any other values (ex. time, runTime, etc), so you may experience issues if you enable maxDelta
       * when using both delta and other values.
       *
       * If 0, there is no maximum.
       * @property maxDelta
       * @type {number}
       * @default 0
       */
      _this.maxDelta = 0;
      /**
       * When the ticker is paused, all listeners will still receive a tick event, but the <code>paused</code> property
       * of the event will be `true`. Also, while paused the `runTime` will not increase. See {{#crossLink "Ticker/tick:event"}}{{/crossLink}},
       * {{#crossLink "Ticker/getTime"}}{{/crossLink}}, and {{#crossLink "Ticker/getEventTime"}}{{/crossLink}} for more
       * info.
       *
       * <h4>Example</h4>
       *
       *      createjs.Ticker.addEventListener("tick", handleTick);
       *      createjs.Ticker.paused = true;
       *      function handleTick(event) {
       *          console.log(event.paused,
       *          	createjs.Ticker.getTime(false),
       *          	createjs.Ticker.getTime(true));
       *      }
       *
       * @property paused
       * @type {Boolean}
       * @default false
       */
      _this.paused = false;
      // private properties:
      /**
       * @property _inited
       * @type {Boolean}
       * @protected
       */
      _this._inited = false;
      /**
       * @property _startTime
       * @type {Number}
       * @protected
       */
      _this._startTime = 0;
      /**
       * @property _pausedTime
       * @type {Number}
       * @protected
       */
      _this._pausedTime = 0;
      /**
       * The number of ticks that have passed
       * @property _ticks
       * @type {Number}
       * @protected
       */
      _this._ticks = 0;
      /**
       * The number of ticks that have passed while Ticker has been paused
       * @property _pausedTicks
       * @type {Number}
       * @protected
       */
      _this._pausedTicks = 0;
      /**
       * @property _interval
       * @type {Number}
       * @protected
       */
      _this._interval = 50;
      /**
       * @property _lastTime
       * @type {Number}
       * @protected
       */
      _this._lastTime = 0;
      /**
       * @property _times
       * @type {Array}
       * @protected
       */
      _this._times = null;
      /**
       * @property _tickTimes
       * @type {Array}
       * @protected
       */
      _this._tickTimes = null;
      /**
       * Stores the timeout or requestAnimationFrame id.
       * @property _timerId
       * @type {Number}
       * @protected
       */
      _this._timerId = null;
      /**
       * True if currently using requestAnimationFrame, false if using setTimeout. This may be different than timingMode
       * if that property changed and a tick hasn't fired.
       * @property _raf
       * @type {Boolean}
       * @protected
       */
      _this._raf = true;
      return _this
    }
    // accessor properties:
    /**
     * Indicates the target time (in milliseconds) between ticks. Default is 50 (20 FPS).
     * Note that actual time between ticks may be more than specified depending on CPU load.
     * This property is ignored if the ticker is using the `RAF` timing mode.
     * @property interval
     * @static
     * @type {Number}
     */
    // public methods:
    /**
     * Call createjs.Ticker.create() to get a new TickerAPI instance.
     * It is not initalized by default and its ticks are not synched with any other instance.
     *
     * @param name {String} The name given to the new instance.
     * @method create
     * @return {TickerAPI} A new TickerAPI instance.
     */
    TickerAPI.prototype.create = function create(name) {
      return new TickerAPI(name)
    };
    /**
     * Starts the tick. This is called automatically when the first listener is added.
     * @method init
     */
    TickerAPI.prototype.init = function init() {
      if (this._inited) {
        return
      }
      this._inited = true;
      this._times = [];
      this._tickTimes = [];
      this._startTime = this._getTime();
      this._times.push(this._lastTime = 0);
      this._setupTick()
    };
    /**
     * Stops the Ticker and removes all listeners. Use init() to restart the Ticker.
     * @method reset
     */
    TickerAPI.prototype.reset = function reset() {
      if (this._raf) {
        var f = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame;
        f && f(this._timerId)
      } else {
        clearTimeout(this._timerId)
      }
      this.removeAllEventListeners("tick");
      this._timerId = this._times = this._tickTimes = null;
      this._startTime = this._lastTime = this._ticks = 0;
      this._inited = false
    };
    /**
     * Init the Ticker instance if it hasn't been already.
     * Docced in superclass.
     */
    TickerAPI.prototype.addEventListener = function addEventListener(type, listener, useCapture) {
      !this._inited && this.init();
      return _EventDispatcher.prototype.addEventListener.call(this, type, listener, useCapture)
    };
    /**
     * Returns the average time spent within a tick. This can vary significantly from the value provided by getMeasuredFPS
     * because it only measures the time spent within the tick execution stack.
     *
     * Example 1: With a target FPS of 20, getMeasuredFPS() returns 20fps, which indicates an average of 50ms between
     * the end of one tick and the end of the next. However, getMeasuredTickTime() returns 15ms. This indicates that
     * there may be up to 35ms of "idle" time between the end of one tick and the start of the next.
     *
     * Example 2: With a target FPS of 30, getFPS() returns 10fps, which indicates an average of 100ms between the end of
     * one tick and the end of the next. However, getMeasuredTickTime() returns 20ms. This would indicate that something
     * other than the tick is using ~80ms (another script, DOM rendering, etc).
     * @method getMeasuredTickTime
     * @param {Number} [ticks] The number of previous ticks over which to measure the average time spent in a tick.
     * Defaults to the number of ticks per second. To get only the last tick's time, pass in 1.
     * @return {Number} The average time spent in a tick in milliseconds.
     */
    TickerAPI.prototype.getMeasuredTickTime = function getMeasuredTickTime(ticks) {
      var times = this._tickTimes;
      if (!times || times.length < 1) {
        return -1
      }
      // by default, calculate average for the past ~1 second:
      ticks = Math.min(times.length, ticks || this.framerate | 0);
      var ttl = times.reduce(function(a, b) {
        return a + b
      }, 0);
      return ttl / ticks
    };
    /**
     * Returns the actual frames / ticks per second.
     * @method getMeasuredFPS
     * @param {Number} [ticks] The number of previous ticks over which to measure the actual frames / ticks per second.
     * Defaults to the number of ticks per second.
     * @return {Number} The actual frames / ticks per second. Depending on performance, this may differ
     * from the target frames per second.
     */
    TickerAPI.prototype.getMeasuredFPS = function getMeasuredFPS(ticks) {
      var times = this._times;
      if (!times || times.length < 2) {
        return -1
      }
      // by default, calculate fps for the past ~1 second:
      ticks = Math.min(times.length - 1, ticks || this.framerate | 0);
      return 1e3 / ((times[0] - times[ticks]) / ticks)
    };
    /**
     * Returns the number of milliseconds that have elapsed since Ticker was initialized via {{#crossLink "Ticker/init"}}.
     * Returns -1 if Ticker has not been initialized. For example, you could use
     * this in a time synchronized animation to determine the exact amount of time that has elapsed.
     * @method getTime
     * @param {Boolean} [runTime=false] If true only time elapsed while Ticker was not paused will be returned.
     * If false, the value returned will be total time elapsed since the first tick event listener was added.
     * @return {Number} Number of milliseconds that have elapsed since Ticker was initialized or -1.
     */
    TickerAPI.prototype.getTime = function getTime() {
      var runTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return this._startTime ? this._getTime() - (runTime ? this._pausedTime : 0) : -1
    };
    /**
     * Similar to the {{#crossLink "Ticker/getTime"}}{{/crossLink}} method, but returns the time on the most recent {{#crossLink "Ticker/tick:event"}}{{/crossLink}}
     * event object.
     * @method getEventTime
     * @param runTime {Boolean} [runTime=false] If true, the runTime property will be returned instead of time.
     * @returns {number} The time or runTime property from the most recent tick event or -1.
     */
    TickerAPI.prototype.getEventTime = function getEventTime() {
      var runTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return this._startTime ? (this._lastTime || this._startTime) - (runTime ? this._pausedTime : 0) : -1
    };
    /**
     * Returns the number of ticks that have been broadcast by Ticker.
     * @method getTicks
     * @param {Boolean} [pauseable=false] Indicates whether to include ticks that would have been broadcast
     * while Ticker was paused. If true only tick events broadcast while Ticker is not paused will be returned.
     * If false, tick events that would have been broadcast while Ticker was paused will be included in the return
     * value.
     * @return {Number} of ticks that have been broadcast.
     */
    TickerAPI.prototype.getTicks = function getTicks() {
      var pauseable = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      return this._ticks - (pauseable ? this._pausedTicks : 0)
    };
    // private methods:
    /**
     * @method _handleSynch
     * @protected
     */
    TickerAPI.prototype._handleSynch = function _handleSynch() {
      this._timerId = null;
      this._setupTick();
      // run if enough time has elapsed, with a little bit of flexibility to be early:
      if (this._getTime() - this._lastTime >= (this._interval - 1) * .97) {
        this._tick()
      }
    };
    /**
     * @method _handleRAF
     * @protected
     */
    TickerAPI.prototype._handleRAF = function _handleRAF() {
      this._timerId = null;
      this._setupTick();
      this._tick()
    };
    /**
     * @method _handleTimeout
     * @protected
     */
    TickerAPI.prototype._handleTimeout = function _handleTimeout() {
      this._timerId = null;
      this._setupTick();
      this._tick()
    };
    /**
     * @method _setupTick
     * @protected
     */
    TickerAPI.prototype._setupTick = function _setupTick() {
      if (this._timerId != null) {
        return
      } // avoid duplicates
      var mode = this.timingMode || this._raf && TickerAPI.RAF; // TODO-ES6: Verify that this is desired, since Ticker.useRAF was removed.
      if (mode == TickerAPI.RAF_SYNCHED || mode == TickerAPI.RAF) {
        var f = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
        if (f) {
          this._timerId = f(mode == TickerAPI.RAF ? this._handleRAF.bind(this) : this._handleSynch.bind(this));
          this._raf = true;
          return
        }
      }
      this._raf = false;
      this._timerId = setTimeout(this._handleTimeout.bind(this), this._interval)
    };
    /**
     * @method _tick
     * @protected
     */
    TickerAPI.prototype._tick = function _tick() {
      var paused = this.paused;
      var time = this._getTime();
      var elapsedTime = time - this._lastTime;
      this._lastTime = time;
      this._ticks++;
      if (paused) {
        this._pausedTicks++;
        this._pausedTime += elapsedTime
      }
      if (this.hasEventListener("tick")) {
        var event = new Event("tick");
        var maxDelta = this.maxDelta;
        event.delta = maxDelta && elapsedTime > maxDelta ? maxDelta : elapsedTime;
        event.paused = paused;
        event.time = time;
        event.runTime = time - this._pausedTime;
        this.dispatchEvent(event)
      }
      this._tickTimes.unshift(this._getTime() - time);
      while (this._tickTimes.length > 100) {
        this._tickTimes.pop()
      }
      this._times.unshift(time);
      while (this._times.length > 100) {
        this._times.pop()
      }
    };
    /**
     * @method _getTime
     * @protected
     */
    TickerAPI.prototype._getTime = function _getTime() {
      var now = window.performance.now;
      return (now && now.call(performance) || (new Date).getTime()) - this._startTime
    };
    createClass(TickerAPI, [{
      key: "interval",
      get: function get() {
        return this._interval
      },
      set: function set(interval) {
        this._interval = interval;
        if (!this._inited) {
          return
        }
        this._setupTick()
      }
    }, {
      key: "framerate",
      get: function get() {
        return 1e3 / this._interval
      },
      set: function set(fps) {
        this.interval = 1e3 / fps
      }
    }]);
    return TickerAPI
  }(EventDispatcher);
  // constants:
  /**
   * In this mode, Ticker uses the requestAnimationFrame API, but attempts to synch the ticks to target framerate. It
   * uses a simple heuristic that compares the time of the RAF return to the target time for the current frame and
   * dispatches the tick when the time is within a certain threshold.
   *
   * This mode has a higher variance for time between frames than {{#crossLink "Ticker/TIMEOUT:property"}}{{/crossLink}},
   * but does not require that content be time based as with {{#crossLink "Ticker/RAF:property"}}{{/crossLink}} while
   * gaining the benefits of that API (screen synch, background throttling).
   *
   * Variance is usually lowest for framerates that are a divisor of the RAF frequency. This is usually 60, so
   * framerates of 10, 12, 15, 20, and 30 work well.
   *
   * Falls back to {{#crossLink "Ticker/TIMEOUT:property"}}{{/crossLink}} if the requestAnimationFrame API is not
   * supported.
   * @property RAF_SYNCHED
   * @static
   * @type {String}
   * @default "synched"
   * @readonly
   */
  TickerAPI.RAF_SYNCHED = "synched";
  /**
   * In this mode, Ticker passes through the requestAnimationFrame heartbeat, ignoring the target framerate completely.
   * Because requestAnimationFrame frequency is not deterministic, any content using this mode should be time based.
   * You can leverage {{#crossLink "Ticker/getTime"}}{{/crossLink}} and the {{#crossLink "Ticker/tick:event"}}{{/crossLink}}
   * event object's "delta" properties to make this easier.
   *
   * Falls back on {{#crossLink "Ticker/TIMEOUT:property"}}{{/crossLink}} if the requestAnimationFrame API is not
   * supported.
   * @property RAF
   * @static
   * @type {String}
   * @default "raf"
   * @readonly
   */
  TickerAPI.RAF = "raf";
  /**
   * In this mode, Ticker uses the setTimeout API. This provides predictable, adaptive frame timing, but does not
   * provide the benefits of requestAnimationFrame (screen synch, background throttling).
   * @property TIMEOUT
   * @static
   * @type {String}
   * @default "timeout"
   * @readonly
   */
  TickerAPI.TIMEOUT = "timeout";
  // events:
  /**
   * Dispatched each tick. The event will be dispatched to each listener even when the Ticker has been paused using
   * {{#crossLink "Ticker/setPaused"}}{{/crossLink}}.
   *
   * <h4>Example</h4>
   *
   *      createjs.Ticker.addEventListener("tick", handleTick);
   *      function handleTick(event) {
   *          console.log("Paused:", event.paused, event.delta);
   *      }
   *
   * @event tick
   * @param {Object} target The object that dispatched the event.
   * @param {String} type The event type.
   * @param {Boolean} paused Indicates whether the ticker is currently paused.
   * @param {Number} delta The time elapsed in ms since the last tick.
   * @param {Number} time The total time in ms since Ticker was initialized.
   * @param {Number} runTime The total time in ms that Ticker was not paused since it was initialized. For example,
   * 	you could determine the amount of time that the Ticker has been paused since initialization with `time-runTime`.
   * @since 0.6.0
   */
  /**
   * The Ticker object is a singleton instance of the TickerAPI class.
   * See the {{#crossLink "TickerAPI"}}{{/crossLink}} documentation for its usage.
   * @class Ticker
   * @static
   * @module CreateJS
   */
  var Ticker = new TickerAPI("createjs.global");
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
  // version (templated in gulpfile, pulled from package).
  var version = "2.0.0";
  exports.version = version;
  exports.EventDispatcher = EventDispatcher;
  exports.Event = Event;
  exports.Ticker = Ticker;
  return exports
}(this.createjs || {});
//# sourceMappingURL=sound-NEXT.js.map
