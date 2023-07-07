
export class Tab {
    constructor(parent, name) {
        this.data = {
            el: document.createElement("div"),
            parent: parent,
        }
        
        const data = this.data

        data.el.className = "tab flex-row";
  
        const tabName = document.createElement("p");
        tabName.innerText = name;
    
        data.el.appendChild(tabName);
    
        data.el.onclick = () => {
            parent.pushToView(parent.idxOfTab(this));
            parent.data.tabs.forEach((x) => {
                x.getElement().classList.remove("active-tab");
            });
            data.el.classList.add("active-tab");
        };
    }

    getElement(){
        return this.data.el
    }
}