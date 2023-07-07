import { appendChildren, preprocessText } from "../utils.js";
import { Tab } from "./tab.js";

export class Page {
    constructor(name = "", tabs = [], views = []) {
        this.data = {
            el:document.createElement("div"),
            name: name,
            parent: null,
            tabs_box: document.createElement("div"),
            views_box: document.createElement("div"),
            currentIndex: 0,
            stack: [],
            tabs: tabs.map(x => new Tab(this, x)),
            views: views.map(x => {
                x.setParent(this);
                return x;
            }),
            intents: []
        };

        const data = this.data

        data.el.className = "page flex-col width";
        data.tabs_box.className = "tabs flex-row width";
        data.views_box.className = "views flex-row width";
    }

    setParent(parent) {
        this.data.parent = parent;
    }

    getPageName() {
      return this.data.name.toLowerCase();
    }
  
    idxOfTab(tab) {
        return this.data.tabs.indexOf(tab);
    }

    pushToView(index = 0) {
        const { stack, currentIndex, el } = this.data;
        if (index === currentIndex) return;
        stack.push(currentIndex);
        el.removeChild(this.getCurrentView().getElement())
        this.data.currentIndex = index;
        this.getCurrentView().render()
        el.appendChild(this.getCurrentView().getElement())
    }
    
    popView() {
        const {el,stack,tabs} = this.data;
        if (stack.length === 0) return;
        el.removeChild(this.getCurrentView().getElement())
        // console.log(this.data.currentIndex);
        this.data.currentIndex = stack.pop();
        // console.log(this.data.currentIndex);

        tabs.forEach((x) => {
            x.getElement().classList.remove("active-tab");
        })
        tabs[this.data.currentIndex].getElement().classList.add("active-tab")

        this.getCurrentView().render()
        el.appendChild(this.getCurrentView().getElement())
    }

    getCurrentView(){
        return this.data.views[this.data.currentIndex]
    }

    addIntent(intent) {
        if (!intent) return;
    
        const { intents } = this.data;
        if (intents.some(intentObj => intentObj.getName() === intent.getName())) return;
    
        intent.setParent(this);
        intents.push(intent);
    }
    
    getIntent(name = "") {
        const { intents } = this.data;
        for (let i = 0; i < intents.length; i++) {
          const intentObj = intents[i];
          if (intentObj.getName() === preprocessText(name)) {
            return intentObj;
          }
        }
    }

    getFrame(){
        return this.data.parent
    }

    getElement(){
        return this.data.el
    }

    reset(){
        const data = this.data

        this.data.el.innerHTML = ""
        
        data.currentIndex = 0

        data.tabs.forEach((x) => {
            x.getElement().classList.remove("active-tab");
        })
        data.tabs[data.currentIndex].getElement().classList.add("active-tab")
    }

    refresh(){
        const {el,parent} = this.data

        const parentEl = parent.getElement()

        parentEl.removeChild(el)
        el.innerHTML = ""

        this.render()
    }
    
    render() {

        const { el, parent, element, tabs_box, views_box, tabs, currentIndex, views } = this.data;

        tabs_box.innerHTML = "";
        appendChildren(element, [tabs_box, views_box]);

        const back_btn = document.createElement("div");
        back_btn.classList.add("back-btn");
        back_btn.style.padding = "0 1rem";

        const frame_data = parent.data;
        const stack = frame_data.stack;

        if (stack.length > 0) {
            back_btn.innerHTML = `<i class='bx bx-arrow-back' style="font-size: 1.75rem;"></i>`;
            back_btn.classList.add("active-back-btn");
            back_btn.onclick = () => {
                parent.popPage();
            };
        } else {
            back_btn.classList.remove("active-back-btn");
            back_btn.innerHTML = `<i class='bx bx-arrow-back' style="font-size: 1.75rem; color: grey;"></i>`;
        }

        tabs_box.appendChild(back_btn);

        if (tabs_box !== undefined) {
            let index = 0;
            tabs.forEach(x => {
                const tab_el = x.getElement()
                if (index === currentIndex) {
                    tab_el.classList.add("active-tab");
                }
                tabs_box.appendChild(tab_el);
                index++;
            });
        }

        el.appendChild(tabs_box)
        if (views.length > 0) {
            el.appendChild(views[currentIndex].getElement())
        }
        const view = this.getCurrentView()

        if(view) view.render()
        if(parent) parent.getElement().appendChild(el);
    }

    derender() {
        const {el, parent, views} = this.data
        this.reset()
        try {
            if(parent) parent.getElement().removeChild(el);
        } catch (error) {
            
        }
    }
  

}