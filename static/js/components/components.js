import { appendChildren, capitalize, xml_req } from "../utils.js";

export class ContentBox extends HTMLElement {
  connectedCallback() {
    this.classList.add("width");
    const contentBox = document.createElement("div");
    contentBox.id = "content-box";
    contentBox.className = "width flex-row";

    this.appendChild(contentBox);
  }
}

customElements.define("content-tag", ContentBox);

export class Flex extends HTMLElement {
  connectedCallback() {
    const { width, height, padding, margin, justify_content, align_items, row } = this.attributes;

    const styles = {
      width: width?.value || "100%",
      height: height?.value || "",
      margin: margin?.value || "",
      padding: padding?.value || "",
      display: "flex",
      flexDirection: row? "row" : "column",
      justifyContent: justify_content?.value || "",
      alignItems: align_items?.value || ""
    };

    Object.assign(this.style, styles);
  }
}

customElements.define("flex-tag", Flex);

export class Sidebar extends HTMLElement {
  connectedCallback() {
    this.classList.add("sidebar");

    const profileBox = document.createElement("div");
    // profileBox.classList.add("profile-box");

    const image = this.getAttribute("image");
    profileBox.innerHTML = `
      <figure class="flex-col">
          
      </figure>
    `;

    profileBox.innerHTML = `
    <flex-tag>
      <flex-tag>
        <div style="width: 150px; height: 150px; background:black; border-radius:50%;"></div>
      </flex-tag>
      <flex-tag row justify_content="space-evenly" margin="0.75rem 0">
        <a href="/">Home</a>
        <a href="/logout">Logout</a>
      </flex-tag>
    </flex-tag>
    `
    profileBox.style = "display: flex; flex-direction: column align-items: center; justify-content: center;"
    const optionsBox = document.createElement("div");
    optionsBox.classList.add("options-box");

    const options = this.getAttribute("options");
    if (options) {
      const values = JSON.parse(options);
      for (let i = 0; i < values.length; i++) {
        const optionValue = values[i];
        const key = Object.keys(optionValue)[0].toString();

        const option = document.createElement("div");
        option.classList.add("option-box");
        option.dataset.idx = i;
        option.innerHTML = `<p>${capitalize(key)}</p>`;

        optionsBox.appendChild(option);
      }
    }

    appendChildren(this, [profileBox, optionsBox]);
  }
}

customElements.define("sidebar-tag", Sidebar);

class InputTag extends HTMLElement {
  constructor() {
    super();

    const {type, hidden, id} = this.attributes

    if(hidden)this.style.display = "none"

    this.innerHTML = `
      <div class="input-container ${type?.value == "checkbox" ? "flex-row align-center" : "flex-col"}">
        <label></label>
        <input ${id? `id=${id.value}-input`: ""} type="${type ? type.value : "text"}">
      </div>
    `;
  }

  connectedCallback() {

    const {type, value} = this.attributes

    const labelElement = this.querySelector('label');
    const inputElement = this.querySelector('input');

    labelElement.textContent = this.getAttribute('label');

    inputElement.name = this.getAttribute('name');
    inputElement.id = this.getAttribute('name');

    const getBool = (text = "") =>{
      return text.toLowerCase() == "true" ? true : false
    }
    
    if (type?.value == "checkbox") {
      if(value){
        if (getBool(value.value)) {
          inputElement.checked = true
        }else{
          inputElement.removeAttribute("checked")
        }
      }
    }else if (type?.value == "date") {
      inputElement.value = value? value.value.replaceAll("-","/") : ""
    }else{
      inputElement.value = value? value.value : ""
    }
  }
}

customElements.define('input-tag', InputTag);

class SelectTag extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback(){
    const {label,url,data,name,value} = this.attributes 
     const labelEl = document.createElement('label');

     labelEl.textContent = label ? label.value : "";
     this.appendChild(labelEl);
 
     const select = document.createElement('select');
     this.appendChild(select);

     select.classList.add("input-container")
     select.setAttribute("name",name?.value)

    const data_array = []

    if (url) {
      const req = JSON.parse(xml_req("GET",url).responseText) || null
    }else if(data){
      const req = JSON.parse(data.value) || null

      if (req) {
        req.forEach(x=>{
          data_array.push(x)
        })
      }
    }
     data_array.forEach(point => {
       const option = document.createElement('option');
       option.value = point.id;
       option.textContent = point.name;
       select.appendChild(option);
     });

     if (value) {
      select.value = value.value
     }
  }
}

// Define the custom element
customElements.define('select-tag', SelectTag);

export class IntentTag{
  constructor(parent,build){
      this.el = document.createElement("div")
      this.el.classList = `intent-container flex-col width intent-tag`

      const intent_header = document.createElement("div")

      intent_header.classList = `intent-header flex-row`
      intent_header.innerHTML = `
      <h4>Intent: </h4>
          <div contenteditable="true" class="editable width"></div>
          <div class="intent-header-btns flex-row">
              <div id="toggleBtn"><i class="bx bx-chevrons-down"></i></div>
              <div id="deleteBtn"><i class="bx bx-trash"></i></div>
          </div> 
      `
      
      const intent_editable = intent_header.querySelector(".editable")

      if (build) {
          intent_editable.innerText = build["intent"]
      }

      const toggleBtn = intent_header.querySelector("#toggleBtn")
      const deleteBtn = intent_header.querySelector("#deleteBtn")

      deleteBtn.onclick = (e) =>{
          this.el.parentElement.removeChild(this.el)
      }

      const intent_body = document.createElement("div")
      intent_body.classList = `intent-body flex-col`
      intent_body.style.display = "none"

      
      toggleBtn.onclick = (e) =>{
          const {expanded} = intent_body.attributes
          if (expanded) {
              intent_body.removeAttribute("expanded")
              intent_body.style.display = "none"
              toggleBtn.innerHTML = `<i class="bx bx-chevrons-down"></i>`
          }else{
              intent_body.setAttribute("expanded",true)
              intent_body.style.display = ""
              toggleBtn.innerHTML = `<i class="bx bx-chevrons-up"></i>`
          }
      }

      const inputsContainer = document.createElement("div")
      inputsContainer.classList = `inputs-container`
      inputsContainer.innerHTML = `<h5>Inputs</h5>`

      const inputs = document.createElement("div")
      inputs.classList = `inputs flex-row align-center flex-wrap`

      const create_bubble = (data) =>{
          const bubble = document.createElement("div")
          bubble.classList = `bubble flex-row align-center`
          bubble.innerHTML = `
              <div class="editable bubble-editable" contenteditable="true"></div>
              <div id="remove_bubble_btn" class="intent-btn"><i class="bx bx-x"></i></div>
          `
          const removeBubbleBtn = bubble.querySelector("#remove_bubble_btn")
          removeBubbleBtn.onclick = () =>{
              inputs.removeChild(bubble)
          }

          if(data) bubble.querySelector(".editable").innerText = data

          return bubble
      }

      if (build) {
          build["inputs"].forEach(input => {
              inputs.appendChild(create_bubble(input))
          });
      }

      inputs.innerHTML += `
          <div id="add_input_btn" class="bubble intent-btn flex-row align-center">
              <i class="bx bx-plus"></i>
          </div> 
      `

      

      const addInputBtn = inputs.querySelector("#add_input_btn")
      addInputBtn.onclick = (e) =>{
          inputs.removeChild(addInputBtn)
          inputs.appendChild(create_bubble())
          inputs.appendChild(addInputBtn)
      }

      inputsContainer.appendChild(inputs)

      const responseContainer = document.createElement("div")
      responseContainer.classList = `responses-container`
      responseContainer.innerHTML = `<h5>Reponses</h5>`

      const responses = document.createElement("div")
      responses.classList = `responses flex-row align-center flex-wrap`

      if (build) {
          build["responses"].forEach(response => {
              responses.appendChild(create_bubble(response))
          });
      }

      responses.innerHTML += `
          <div id="add_response_btn" class="bubble intent-btn flex-row align-center">
              <i class="bx bx-plus"></i>
          </div> 
      `

      const addResponseBtn = responses.querySelector("#add_response_btn")
      addResponseBtn.onclick = (e) =>{
          responses.removeChild(addResponseBtn)
          responses.appendChild(create_bubble())
          responses.appendChild(addResponseBtn)
      }

      responseContainer.appendChild(responses)


      intent_body.appendChild(inputsContainer)
      intent_body.appendChild(responseContainer)

      this.el.appendChild(intent_header)
      this.el.appendChild(intent_body)

      if(parent)parent.appendChild(this.el)
  }
}