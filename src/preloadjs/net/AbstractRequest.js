// namespace:
this.createjs = this.createjs || {};

(function () {
	"use strict";

	var AbstractRequest = function (item) {
		this._item = item;
	};

	var p = createjs.extend(AbstractRequest, createjs.EventDispatcher);
	var s = AbstractRequest;

	/**
	 * Abstract function.
	 *
	 */
	p.load =  function() {

	};

	p.destroy = function() {

	};

	createjs.AbstractRequest = createjs.promote(AbstractRequest, "EventDispatcher");

}());
