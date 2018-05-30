import Sound from "./Sound";
import Sample from "./Sample";
import EventDispatcher from "@createjs/core/src/events/EventDispatcher";


class Group extends EventDispatcher {

	constructor(parent = Sound._rootGroup) {
		super();
		let ctx = Sound.context;
		this.outputNode = this.volumeNode = ctx.createGain();

		this.inputNode = ctx.createGain();
		this.fxBus = ctx.createGain();

		this.inputNode.connect(this.fxBus);
		this.fxBus.connect(this.outputNode); // TODO: Manage effects chain.

		this.samples = [];
		this.subgroups = [];

		if (parent) {
			parent.add(this);
		}
	}

	add(groupOrSample) {
		if (groupOrSample instanceof Group) {
			this._addGroup(groupOrSample);
		} else if (groupOrSample instanceof Sample) {
			this._addSample(groupOrSample);
		}else{
			console.warn("Warning: Attempted to add an object that was not a Group or a Sample as a child to a Group; object was ignored.")
		}
	}

	_addGroup(subgroup) {
		if(subgroup.parent){
			subgroup.parent._remove(subgroup);
		}
		subgroup.parent = this;
		this.subgroups.push(subgroup);
		subgroup.outputNode.connect(this.inputNode);
	}

	_addSample(sample) {
		if(sample.parent){
			sample.parent._remove(sample);
		}
		sample.parent = this;
		this.samples.push(sample);
		sample.outputNode.connect(this.inputNode);
		sample.on("destroyed", this.handleSampleDestroyed, this);
	}

	// Shouldn't be used during normal usage, and is normally only called as part of an add to another group.
	_remove(groupOrSample){
		if (groupOrSample instanceof Group) {
			this._removeGroup(groupOrSample);
		} else if (groupOrSample instanceof Sample) {
			this._removeSample(groupOrSample);
		}
	}

	_removeGroup(subgroup){
		let index = this.subgroups.indexOf(subgroup);

		if(index === -1){
			throw new Error("Cannot remove subgroup from group - group not found in subgroups list.")
		}

		subgroup.outputNode.disconnect(this.inputNode);
		this.subgroups.splice(index, 1);
	}

	_removeSample(sample){
		let index = this.samples.indexOf(sample);

		if(index === -1){
			throw new Error("Cannot remove sample from group - group not found in samples list.")
		}

		sample.outputNode.disconnect(this.inputNode);
		this.samples.splice(index, 1);
	}

	// NOTE: depending on group architecture, play/pause/resume  may need to change. E.G. if loops within the group structure are allowed,
	// then we need to check if we've played a group before in this call of play before playing it, to prevent infinite looping.

	/**
	 * Plays all samples in this group, and in all subgroups.
	 */
	play() {
		this.samples.forEach(s => s.play());
		this.subgroups.forEach(g => g.play());
	}

	/**
	 * Pauses all samples in this group, and in all subgroups.
	 */
	pause() {
		this.samples.forEach(s => s.pause());
		this.subgroups.forEach(g => g.pause());
	}

	/**
	 * Unpauses all samples in this group, and in all subgroups.
	 */
	resume() {
		this.samples.forEach(s => s.resume());
		this.subgroups.forEach(g => g.resume());
	}

	stop() {
		this.samples.forEach(s => s.stop());
		this.subgroups.forEach(g => g.stop());
	}

	handleSampleDestroyed(e) {
		let index = this.samples.indexOf(e.target);
		if (index > -1) {
			this.samples.splice(index, 1);
		}
		this.dispatchEvent("sampleDestroyed");
		console.log("Sample destroyed");
	}

	_getSampleDescendantsBySource(src){
		let out = new Set();

		this.samples.forEach( s => {  if(s.src === src){  out.add(s)  }   }); // Return all samples in this group that match...

		this.subgroups.forEach( g => {                                    // ... and recursively run on subgroups, too
			let sub = g._getSampleDescendantsBySource(src);
			sub.forEach(s => out.add(s))
		});

		return Array.from(out);
	}

	_getAllSampleDescendants(){
		let out = new Set();

		this.samples.forEach(  s => out.add(s)  ); 												// Return all samples in this group...

		this.subgroups.forEach( g => {                                    // ... and recursively run on subgroups, too
			let sub = g._getAllSampleDescendants(src);
			sub.forEach(s => out.add(s))
		});

		return Array.from(out);
	}

}

export default Group;

