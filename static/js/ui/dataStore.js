
import { preprocessText, xml_req } from "../utils.js";

export class DataStore{
    constructor(name = "",configMaps = []){
        this.data = {
            name:preprocessText(name),
            configMaps:configMaps,
            store: null,
            parent:null
        }

        const data = this.data

        data.store = this.exec("GET")
    }
    refresh(){
        const data = this.data
        data.store = this.exec("GET")
    }
    setParent(parent){
        if(parent)this.data.parent = parent
    }
    exec_args(method = "", body, args = []){
        const configMap = this.getConfigMap(method)

        if (!configMap)return;
        const url = `${configMap["url"]}/${args.join("/")}`
        const res = xml_req(method,url,body)

        return res.responseText != "" ? JSON.parse(res.responseText) : null
    }
    exec(method = "",body){
        
        const configMap = this.getConfigMap(method)

        if (!configMap)return;

        const res = xml_req(method,configMap["url"],body)

        return res.responseText != "" ? JSON.parse(res.responseText) : null
    }

    exec_custom(method,url,body){
        const configMap = this.getConfigMap(method)
        const res = xml_req(method,url??configMap["url"],body)

        return res.responseText != "" ? JSON.parse(res.responseText) : null
    }
    getConfigMap(method = ""){
        const data = this.data

        for (let i = 0; i < data.configMaps.length; i++) {
            const configMap = data.configMaps[i];
            const values = Object.values(configMap)

            if (values.map((x)=> preprocessText(x)).includes(preprocessText(method))) {
                return configMap
            }
        }

        return;
    }

    getName(){
        return this.data.name
    }

    getData(){
        return this.data.store
    }
}