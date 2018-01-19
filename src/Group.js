import Sound from "./Sound"
import Sample from "./Sample";
import {EventDispatcher} from "./main";

export default class Group extends EventDispatcher{

    constructor(parent = Sound._rootGroup){
        super();
        let ctx = Sound.context;
        this.outputNode = this.volumeNode = ctx.createGain();

        this.inputNode = ctx.createGain();
        this.fxBus = ctx.createGain();

        this.inputNode.connect(this.fxBus);
        this.fxBus.connect(this.outputNode); // TODO: Manage effects chain.

        this.samples = [];
        this.subgroups = [];

        if(parent){
            parent.add(this);
        }
    }

    add(groupOrSample){
        if(groupOrSample instanceof Group){
            this._addGroup(groupOrSample);
        }else if(groupOrSample instanceof Sample){
            this._addSample(groupOrSample);
        }
    }

    _addGroup(subgroup){
        this.subgroups.push(subgroup);
        subgroup.outputNode.connect(this.inputNode);
    }

    _addSample(sample){
        this.samples.push(sample);
        sample.outputNode.connect(this.fxBus);
        sample.on("destroyed", this.handleSampleDestroyed, this);
    }

    // NOTE: depending on group architecture, play/pause/resume  may need to change. E.G. if loops within the group structure are allowed,
    // then we need to check if we've played a group before in this call of play before playing it, to prevent infinite looping.

    /**
     * Plays all samples in this group, and in all subgroups.
     */
    play(){
        this.samples.forEach(   s => s.play() );
        this.subgroups.forEach( g => g.play() );
    }

    /**
     * Pauses all samples in this group, and in all subgroups.
     */
    pause(){
        this.samples.forEach(   s => s.pause() );
        this.subgroups.forEach( g => g.pause() );
    }

    /**
     * Unpauses all samples in this group, and in all subgroups.
     */
    resume(){
        this.samples.forEach(   s => s.resume() );
        this.subgroups.forEach( g => g.resume() );
    }

    stop(){
        this.samples.forEach(   s => s.stop() );
        this.subgroups.forEach( g => g.stop() );
    }

    handleSampleDestroyed(e){
        let index = this.samples.indexOf(e.target);
        if(index > -1){
            this.samples.splice(index, 1);
        }
        this.dispatchEvent("sampleDestroyed");
        console.log("Sample destroyed");
    }

}