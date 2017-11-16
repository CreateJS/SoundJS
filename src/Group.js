import Sound from "./Sound"
import Sample from "./Sample";

export default class Group{

    constructor(parent = Sound._rootGroup){
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
    }


}