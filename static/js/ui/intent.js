import { preprocessText } from "../utils.js";

export class Intent{
    constructor(name = "", value){
        this.constructor = {
            name:preprocessText(name),
            value:value,
            parent:null
        }
    }
    getName(){
        return this.constructor.name
    }
    getValue(){
        return this.constructor.value
    }
    setParent(parent){
        if(parent)this.constructor.parent = parent
    }
}