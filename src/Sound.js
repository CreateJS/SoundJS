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

    static get fileExtensionPriorityList(){
        if(!Sound.__fileExtensionPriorityList){
            Sound.__fileExtensionPriorityList = ['mp3']
        }

        return Sound.__fileExtensionPriorityList;
    }

    static set fileExtensionPriorityList(newList){
        let list = Sound.fileExtensionPriorityList;

        // Swap the array contents in place so external refs stay valid:
        list.splice(0,list.length);
        newList.forEach( item => list.push(item));
    }

    static get fallbackFileExtension(){
        // Look up the fallback file extension each time. Performance cost should be small (since sound loading should be gated by
        // the sound loading part), and the array of fallback file extensions may have changed without our knowledge.

        let testElement = document.createElement("audio");
        let bestMaybe = null;
        for(let i = 0; i < Sound.fileExtensionPriorityList.length; i++){
            let extension = Sound.fileExtensionPriorityList[i];
            let result = testElement.canPlayType("audio/" + extension);

            if(result === "probably"){
                return extension; // Return the first one the browser thinks it can support.
            }else if(result === "maybe" && bestMaybe === null){
                bestMaybe = extension;
            }
        }

        if(bestMaybe && !Sound.strictFallbacks){
            // We didn't find a probably, so return our best 'maybe' unless strict fallbacks are enabled.
            return bestMaybe;
        }
        return bestMaybe || null;
    }

    static get strictFallbacks (){
        if(Sound._strictFallbacks === undefined){
            Sound._strictFallbacks = true;
        }

        return Sound._strictFallbacks;
    }

    static set strictFallbacks(val){ Sound._strictFallbacks = val; }

    static pause(){
        // TODO: actually implement pausing and unpausing - just putting this here as a reminder that suspend exists.
        Sound.context.suspend();
    }

    static createInstance(src, startTime = null, duration = null){
        // TODO: start time, duration.
        return new Sample(src);
    }
}