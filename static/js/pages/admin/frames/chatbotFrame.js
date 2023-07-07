
import {Frame} from "../../../ui/frame.js"
import { Page } from "../../../ui/page.js";
import { View } from "../../../ui/view.js";
import { Intent } from "../../../ui/intent.js";
import { get_current_dateTime, validateEmail, xml_req } from "../../../utils.js";
import { IntentTag } from "../../../components/components.js";

const users_collection_url = './collection/users'
const chatbots_collection_url = './collection/chatbots'
const models_collection_url = './collection/models'
const search_users_collection_url = '/search/collection/users'
const search_one_users_collection_url = '/search-one/collection/users'
const search_one_chatbots_collection_url = '/search-one/collection/chatbots'
const search_models_collection_url = '/search/collection/models'

const content_box = document.getElementById("content-box")
export const chatbotFrame = new Frame("chatbot-frame",content_box)

const chatbotView = new View()
const createChatbotView = new View()
const chatbotPage = new Page("chatbot-page",["chatbots","create chatbot"],[chatbotView,createChatbotView])

const updateChatbotView = new View()

const updateChatbotPage = new Page("update-chatbot-page",["update chatbot"],
[updateChatbotView])

const trainChatbotView = new View()
const testChatbotView = new View()
const modelsView = new View()
const chatbotModelsPage = new Page("chatbot-models-page",["view models","train chatbot","test chatbot"],
[modelsView,trainChatbotView,testChatbotView])


// chatbot Page
chatbotView.template((self,parent)=>{
    const page = self.getPage()
    const frame = page.getFrame()

    parent.style = "padding: 0.5rem;"

    parent.innerHTML = `
    <div class="flex-row align-center space-evenly">
        <h2>View Chatbots</h2>
        <button id="refreshBtn">Refresh</button>
    </div>`
    const refreshBtn = parent.querySelector("#refreshBtn")

    refreshBtn.onclick = () =>{
        frame.refreshData()
        page.refresh()
    }

    let chatbots = xml_req("GET",chatbots_collection_url,null,true)
    
    const chatbot_table = document.createElement("div")
    chatbot_table.style = "width:80%; margin: auto;";

    if (chatbots["mode"]) {
                
        chatbots = chatbots["msg"]

        const chatbotDom = []
        for (let i = 0; i < chatbots.length; i++) {
    
            const chatbot = chatbots[i];
            const chatbot_row = document.createElement("div")

            const user_id = JSON.stringify({"id":chatbot["user_id"]}) 
            
            
            let user = xml_req("POST",search_one_users_collection_url,user_id,true)

            if (!user["mode"]) {
                continue
            }

            user = user["msg"][0]

            chatbot_row.innerHTML = `
            <flex-tag row margin="0.5rem 0">
                <flex-tag>
                    <h4>Name</h4>
                    <p>${chatbot["name"]}</p>
                </flex-tag>
                <flex-tag>
                    <h4>Email</h4>
                    <p>${user["email"]}</p>
                </flex-tag>
                <flex-tag row>
                    <button id="edit" style="margin:0 0.25rem;">Edit</button>
                    <button id="models" style="margin:0 0.25rem;">Models</button>
                  <button id="delete" style="margin:0 0.25rem;" >Delete</button>
                </flex-tag>
            </flex-tag>
            `
            const modelsBtn = chatbot_row.querySelector("#models")
    
            modelsBtn.onclick = (e) =>{
                frame.pushPage("chatbot-models-page", new Intent("id", chatbot["id"]))
            }

            const editBtn = chatbot_row.querySelector("#edit")
            editBtn.onclick = (e) =>{
                frame.pushPage("update-chatbot-page", new Intent("id", chatbot["id"]))
            }
    
            const removeBtn =  chatbot_row.querySelector("#delete")
            removeBtn.onclick = (e) =>{
                const id_query = JSON.stringify({"id":chatbot["id"]})
                let res = xml_req("DELETE",chatbots_collection_url,id_query,true)
                if(res["mode"]) chatbot_table.removeChild(chatbot_row)
            }
    
            chatbotDom.push(chatbot_row)
        }
    
        chatbotDom.forEach(x=>{
            chatbot_table.appendChild(x)
        })
        parent.appendChild(chatbot_table)
    }else{
        alert("Failed to load chatbots")
    }
})

createChatbotView.template((self,parent)=>{
    const page = self.getPage()
    const users = xml_req("GET",users_collection_url,null,true)
    parent.style = "padding: 0.5rem;"
    parent.innerHTML = `
    <flex-tag row class="align-center space-evenly">
        <h2>Create Chatbot</h2>
        <button id="refreshBtn">Refresh</button>
    </flex-tag>`

    const refreshBtn = parent.querySelector("#refreshBtn")

    refreshBtn.onclick = () =>{
        page.refresh()
    }
    
    const form = document.createElement("form")
    form.setAttribute("class","flex-col")
    form.setAttribute("id","createChatbotForm")

    if (users["mode"]) {
        const str = `
          <input-tag label="Name" name="name"></input-tag>
          <input-tag label="Description" name="description"></input-tag>
          <input-tag label="Created At" name="created at" type="date" hidden></input-tag>
          <select-tag label="Select User" name="user_id" data=${JSON.stringify(users["msg"].map(x=>{
            return {"name":x["firstname"],"id":x["id"]}
          }))} type="selected"></select-tag>
          <input-tag label="Disabled" name="disabled" type="checkbox" hidden></input-tag>
          <button type="button">Create Chatbot</button>
        `
        form.innerHTML = str
    
        const btn = form.querySelector("button")
    
        if (btn) {
            btn.onclick = () =>{
                var nameInput = form.elements['name'];
                
                if (nameInput.value.trim() === '') {
                    alert('Please enter a Name');
                    nameInput.focus();
                    return;
                }
    
                var formData = new FormData(form);
    
                const jsonData = {};
    
                for (let [key, value] of formData.entries()) {
                    jsonData[key] = value;
                }
                
                jsonData["created_at"] = get_current_dateTime()
                const jsonString = JSON.stringify(jsonData);
    
                const res = xml_req("POST",chatbots_collection_url,jsonString,true)
    
                if(res["mode"]){
                    alert("Chatbot created successfully")
                    page.popView()
                }
                else alert("Failed to create chatbot")
            }
        }
    
        parent.appendChild(form)
    }
})

// update Chatbot Page
updateChatbotView.template((self,parent)=>{
    const page = self.getPage()
    const frame = page.getFrame()
    const intent = page.getIntent("id");
    
    let chatbot = xml_req("POST",search_one_chatbots_collection_url,JSON.stringify({"id":intent.getValue()}),true)
    
    if (!chatbot["mode"]) return;
    chatbot = chatbot["msg"][0]

    let models = xml_req("POST",search_models_collection_url,JSON.stringify({"chatbot_id":chatbot["id"]}),true)
    
    if (!models["mode"]) return;
    
    models = models["msg"]

    parent.style = "padding: 0.5rem;"
    parent.innerHTML = `
    <div class="flex-row align-center space-evenly">
        <h2>Update Chatbot</h2>
        <button id="refreshBtn">Refresh</button>
    </div>`
    const refreshBtn = parent.querySelector("#refreshBtn")

    refreshBtn.onclick = () =>{
        page.refresh()
    }
    
    const form = document.createElement("form")
    form.setAttribute("class","flex-col")
    form.setAttribute("id","createChatbotForm")
    if (chatbot) {
        const str = `
          <input-tag label="Name" name="name" value="${chatbot["name"]}"></input-tag>
          <input-tag label="Description" name="description" value="${chatbot["description"]??""}"></input-tag>
          <input-tag label="Created At" name="created at" type="date" hidden></input-tag>
          <select-tag label="Select Model" name="model_id" data=${JSON.stringify(models.map(x=>{
            return {"name":x["name"],"id":x["id"]}
          }))} type="selected" value=${chatbot["model_id"]}></select-tag>
          <input-tag label="Disabled" name="disabled" type="checkbox" value=${chatbot["disabled"]}></input-tag>
          <button type="button">Update Chatbot</button>
        `
        form.innerHTML = str
    
        const btn = form.querySelector("button")
    
        if (btn) {
            btn.onclick = () =>{
                var nameInput = form.elements['name'];
                
                if (nameInput.value.trim() === '') {
                    alert('Please enter a Name');
                    nameInput.focus();
                    return;
                }
    
                var formData = new FormData(form);
    
                const jsonData = {};
    
                for (let [key, value] of formData.entries()) {
                    jsonData[key] = value;
                }
                
                const data = {
                    "query":{"id":chatbot["id"]},
                    "data":jsonData
                }
                const jsonString = JSON.stringify(data);
    
                let res = xml_req("PUT",chatbots_collection_url,jsonString,true);
    
                if(res["mode"]){
                    alert("Chatbot updated successfully")
                    frame.popPage()
                }
                else alert("Failed to update chatbot")
            }
        }
    }
    parent.appendChild(form)
})

trainChatbotView.template((self,parent)=>{
    const page = self.getPage()
    const frame = page.getFrame()

    const intent = page.getIntent("id");

    let chatbot = xml_req("POST",search_one_chatbots_collection_url,JSON.stringify({"id":intent.getValue()}),true)
    
    if (!chatbot["mode"]) return;
    chatbot = chatbot["msg"][0]


    parent.style = "padding: 0.5rem;"
    parent.innerHTML = `
    <flex-tag row class="align-center space-evenly">
        <h2>Train Chatbot</h2>
    </flex-tag>`
    
    const form = document.createElement("form")
    form.style.width = "80%"
    form.setAttribute("class","flex-col")
    form.setAttribute("id","trainChatbotForm")

    if (chatbot) {
        
        const str = `
            <input-tag label="Model Name" name="name"></input-tag>
            <input-tag label="Model Description" name="description"></input-tag>
            <flex-tag id="train-data-section" alignItems="center">
                <flex-tag>
                    <h3>Intents</h3>
                </flex-tag>
                <flex-tag row justify_content="space-evenly" alignItems="center">
                    <flex-tag row justify_content="space-evenly">
                        <input-tag id="intent-file" label="Load Intents" name="intent-file" type="file" style="width:60%;"></input-tag>
                    </flex-tag>
                    <flex-tag row justify_content="space-evenly" alignItems="center">
                        <div id="clearBtn" class="btn" style="align-self: flex-end;">Clear Intents</div>
                        <div id="addIntentBtn" class="btn" style="align-self: flex-end;">Add Intent</div>
                    </flex-tag>
                </flex-tag>
                <div id="train-data-div" class="width height">
                    <flex-tag id="train-data-container">
                    </flex-tag>
                </div>
            </flex-tag>
            <button type="button">Train Chatbot</button>
        `
        form.innerHTML = str
        
        const clearBtn = form.querySelector("#clearBtn")
        const addIntentBtn = form.querySelector("#addIntentBtn")
        const trainDataContainer = form.querySelector("#train-data-container")

        const fileInput = form.querySelector('#intent-file-input');

        fileInput.onchange = () =>{
            const file = fileInput.files[0];
            if (file) {
                trainDataContainer.innerHTML = ""
                const reader = new FileReader();
            
                reader.onload = function (e) {
                    const fileContent = e.target.result;
                    const jsondata = JSON.parse(fileContent)

                    jsondata["intents"].forEach(data=>{
                        new IntentTag(trainDataContainer,data)
                    })
                };
                reader.readAsText(file);
            }
        }

        clearBtn.onclick = () =>{
            fileInput.value = ""
            trainDataContainer.innerHTML = ""
        }

        addIntentBtn.onclick = () =>{
            new IntentTag(trainDataContainer)
        }

        const btn = form.querySelector("button")

        let valid = true

        const saveIntents = () =>{
            const intents = document.querySelectorAll(".intent-tag")
    
            const intentsArray = []

            for (let i = 0; i < intents.length; i++) {
                const intent = intents[i];
                
                const intentValue = intent.querySelector(".editable")
                if (intentValue.innerText.trim() == "") {
                    intentValue.focus()
                    valid = false
                    break
                }
                const inputs = intent.querySelector(".inputs")
                const inputEditables = inputs.querySelectorAll(".editable")
    
                const inputValues = []
                for (let x = 0; x < inputEditables.length; x++) {
                    let editable = inputEditables[x];

                    if (editable.innerText.trim() == "") {
                        editable.focus()
                        valid = false
                        break
                    }else{
                        inputValues.push(editable.innerText);
                    }
                }
    
                const responses = intent.querySelector(".responses")
                const responseEditables = responses.querySelectorAll(".editable")
    
                const responseValues = []
                for (let x = 0; x < responseEditables.length; x++) {
                    let editable = responseEditables[x];
                    if (editable.innerText.trim() == "") {
                        editable.focus()
                        valid = false
                        break
                    }else{
                        responseValues.push(editable.innerText);
                    }
                }
    
                const data = {
                    "intent":intentValue.innerText,
                    "inputs":inputValues,
                    "responses":responseValues
                }
    
                intentsArray.push(data);
            }

            return intentsArray
        }
    
        if (btn) {
            btn.onclick = () =>{
                var nameInput = form.elements['name'];
                
                if (nameInput.value.trim() === '') {
                    alert('Please enter a Name');
                    nameInput.focus();
                    return;
                }
    
                var formData = new FormData(form);
    
                const jsonData = {};
    
                for (let [key, value] of formData.entries()) {
                    jsonData[key] = value;
                }

                if (!valid) {
                    return;
                }
                
                jsonData["chatbot_id"] = chatbot["id"]
                jsonData["created_at"] = get_current_dateTime()
                const data = {
                    "files":[
                        {
                            "folder":"models",
                            "name":`${nameInput.value.trim()}-models`,
                            "data":{}
                        },
                        {
                            "folder":"intents",
                            "name":`${nameInput.value.trim()}-intents`,
                            "data":{
                                "intents":saveIntents()
                            }
                        }
                    ],
                    "data":jsonData
                }

                const jsonString = JSON.stringify(data);
                let res = xml_req("POST",'http://127.0.0.1:5000/train-model/collection/models',jsonString,true)
                
                if(res["mode"]){
                    alert("Model Successfully trained and saved")
                    frame.popPage()
                }
                else alert("Failed to train chatbot model")
            }
        }
    }

    parent.appendChild(form)
})

testChatbotView.template((self,parent)=>{
    const page = self.getPage()
    const intent = page.getIntent("id");
    const id = intent.getValue();

    parent.innerHTML = `
    <section class="flex-col">
        <h2>Test Chatbot</h2>
        <div id="chat-container" class="flex-col">
            <div id="chat-box" class="flex-col width">

            </div>
            <div id="chat-btns" class="flex-row width align-center">
                <input id="text-input" type="text" class="width height" placeholder="Enter Chat">
                <div id="send-chat" class="flex-row align-center height">
                    <i class='bx bx-send'></i>
                </div>
            </div>
        </div>
    </section>
    `

    const chat_box = parent.querySelector("#chat-box")

    const text_input = parent.querySelector("#text-input")
    const send_chat = parent.querySelector("#send-chat")

    send_chat.onclick = (e) =>{
        const userInput = text_input.value
        if(userInput.trim() != ""){
            const result = xml_req("POST",'http://127.0.0.1:5000/webhook/chatbots',JSON.stringify(
                {
                "id":parseInt(id),
                "text":userInput.trim()
                }
            ))
            
            const data = JSON.parse(result.responseText)
    
            if (data["mode"]) {
                chat_box.innerHTML += `<div class="convo-bubble user-bubble">${userInput.trim()}</div>`


                const add_bot_msg = () =>{
                    chat_box.innerHTML += `<div class="convo-bubble bot-bubble">${data["msg"]}</div>`
                    text_input.value = ""
                }

                setTimeout(add_bot_msg,0.5*1000)

            }else{
                alert("Chatbot not available")
            }
    
        }
    }
})


modelsView.template((self,parent)=>{
    const page = self.getPage()
    const frame = page.getFrame()
    const intent = page.getIntent("id");

    parent.style = "padding: 0.5rem;"

    parent.innerHTML = `
    <flex-tag row align_items="center" justify_content="space-evenly">
        <h2>View Models</h2>
        <button id="refreshBtn">Refresh</button>
    </flex-tag>`
    const refreshBtn = parent.querySelector("#refreshBtn")

    refreshBtn.onclick = () =>{
        page.refresh()
    }

    let chatbot = xml_req("POST",search_one_chatbots_collection_url,JSON.stringify({"id":intent.getValue()}),true)
    
    if (!chatbot["mode"]) return;
    chatbot = chatbot["msg"][0]

    let models = xml_req("POST",search_models_collection_url,JSON.stringify({"chatbot_id":chatbot["id"]}),true)
    
    if (!models["mode"]){
        alert("Chatbot models not available")
        frame.popPage()
        return
    }
    
    models = models["msg"]

    const models_table = document.createElement("div")
    models_table.style = "width:80%; margin: auto;";

    const modelDom = []
    for (let i = 0; i < models.length; i++) {

        const model = models[i];
        const model_row = document.createElement("div")
        
        model_row.innerHTML = `
        <flex-tag row margin="0.5rem 0">
            <flex-tag>
                <h4>Name</h4>
                <p>${model["name"]}</p>
            </flex-tag>
            <flex-tag row>
                <button id="delete" style="margin:0 0.25rem;" >Delete</button>
            </flex-tag>
        </flex-tag>
        `
        const removeBtn =  model_row.querySelector("#delete")
        removeBtn.onclick = (e) =>{
            const id_query = JSON.stringify({"id":model["id"]})
            let res = xml_req("DELETE",models_collection_url,id_query,true)
            if(res["mode"]) models_table.removeChild(model_row)
        }

        modelDom.push(model_row)
    }

    modelDom.forEach(x=>{
        models_table.appendChild(x)
    })
    parent.appendChild(models_table)
})


chatbotFrame.setPages([chatbotPage,updateChatbotPage,chatbotModelsPage])