import Group from "./Group"
import Sample from "./Sample";

export default class Sound {
    static get context(){
        if(!Sound._context){
            let ctxClass = window.AudioContext || window.webkitAudioContext;
            Sound._context =  new ctxClass();
        }

        return Sound._context;
    }

    static get _rootGroup(){
        if(!Sound.__rootGroup){
            Sound.__rootGroup = new Group(null);
            Sound.__rootGroup.outputNode.connect(Sound.context.destination);
        }

        return Sound.__rootGroup;
    }

    static pause(){
        // TODO: actually implement pausing and unpausing - just putting this here as a reminder that suspend exists.
        Sound.context.suspend();
    }

    static createInstance(src, startTime = null, duration = null){
        // TODO: start time, duration.
        return new Sample(src);
    }
}()