
import {preprocessText} from "../utils.js"

export class Frame{
    constructor(name,parent){
        this.data = {
            el:document.createElement("div"),
            parent:parent,
            name:name,
            pages:[],
            currentIndex:0,
            stack:[],
            dataStores:[]
        }

        const { el } = this.data;

        el.className = "frame flex-col width";
    }

    setPages(pages = []){
        const data = this.data
        pages.forEach((page)=>{
            page.setParent(this)
        })
        data.pages = pages
    }

    pushPage(name, intent) {
        const { stack, currentIndex, pages } = this.data;
        let current_page = this.getCurrentPage();
        current_page.derender()
        current_page.data.intents = [];

        const index = this.getPageByName(name);
        stack.push(currentIndex);
        this.data.currentIndex = index;
    
        current_page = this.getCurrentPage();
    
        if (intent) {
          current_page.addIntent(intent);
        }

        current_page.render()
      }
    
    popPage() {
        const { stack } = this.data;
        let current_page = this.getCurrentPage();
        current_page.derender()
        current_page.data.intents = [];
        this.data.currentIndex = stack.pop();

        current_page = this.getCurrentPage();
        current_page.render()
    }

    getPageByName(name) {
        const { pages } = this.data;
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].getPageName().toLowerCase() === name.toLowerCase()) {
            return i;
          }
        }
        return 0;
    }

    getCurrentPage() {
        const { currentIndex, pages } = this.data;
        return pages[currentIndex];
    }

    pushData(datastore) {
        if (!datastore) return;
        const name = datastore.getName();
    
        for (let i = 0; i < this.data.dataStores.length; i++) {
          const store = this.data.dataStores[i];
          if (store.getName() == name) return;
        }
    
        datastore.setParent(this);
        this.data.dataStores.push(datastore);
    }
    
    popData(name = "") {
        for (let i = 0; i < this.data.dataStores.length; i++) {
          const store = this.data.dataStores[i];
          if (store.getName() == preprocessText(name)) {
            this.data.dataStores.splice(store, 1);
            break;
          }
        }
    }

    getStore(name = ""){
        const { dataStores } = this.data;
        for (let i = 0; i < dataStores.length; i++) {
            const store =  dataStores[i]
            if(store.getName() == preprocessText(name)){
                return store;
            }
        }
    }

    getElement(){
        return this.data.el
    }

    refreshData(){
        const {dataStores} = this.data

        dataStores.forEach(dataStore=>{
            dataStore.refresh()
        })
    }

    reset(){
        const data = this.data

        data.currentIndex = 0
        data.el.innerHTML = ""
        data.stack = []

        data.pages.forEach(page =>{
            page.reset()
        })
    }

    refresh(){
        this.getCurrentPage().render()
    }

    render() {
        const { parent, el, pages } = this.data;
        
        this.refresh()

        if (parent) parent.appendChild(el);
    }
    
    derender() {
        const { parent, el,pages } = this.data;
        
        this.reset()
        if (parent) parent.removeChild(el);
    }
    
    
}