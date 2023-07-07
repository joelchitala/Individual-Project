
export class View {
    constructor() {
        this.data = {
            el: document.createElement("div"),
            parent:null,
            template:null
        }
      
        this.data.el.className = "view width";
    }
  
    setParent(parent) {
        if (parent) this.data.parent = parent;
    }
  
    getIntent(name = "") {
        return this.parent.getIntent(name);
    }
    
    getElement(){
        return this.data.el
    }

    getPage(){
        return this.data.parent
    }

    template(template) {
        if (template) this.data.template = template;
    }
    render(){
        this.data.template(this, this.data.el);
    }
    derender(){
        this.data.el.innerHTML = ""
    }
}
  