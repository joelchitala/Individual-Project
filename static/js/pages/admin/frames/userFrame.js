import {Frame} from "../../../ui/frame.js"
import { Page } from "../../../ui/page.js";
import { View } from "../../../ui/view.js";
import { Intent } from "../../../ui/intent.js";
import { get_current_dateTime, validateEmail, xml_req } from "../../../utils.js";
import { IntentTag } from "../../../components/components.js";
import { user_id } from "../index.js";

const users_collection_url = '/collection/users'
const search_users_collection_url = '/search/collection/users'

const content_box = document.getElementById("content-box")
export const userFrame = new Frame("user-frame",content_box)

const usersView = new View()
const createUserView = new View()
const usersPage = new Page("users-page",["users","create user"],[usersView,createUserView])


const updateUserView = new View()
const updateUserPage = new Page("update-user-page",["update-user"],[updateUserView])

// users page

usersView.template((self,parent)=>{
    const page = self.getPage()
    const frame = page.getFrame()

    parent.innerHTML = `
    <flex-tag row alignItems="center" justify_content="space-evenly">
        <h2>View Users</h2>
        <button id="refreshBtn">Refresh</button>
    </flex-tag>`
    const refreshBtn = parent.querySelector("#refreshBtn")

    refreshBtn.onclick = () =>{
        page.refresh()
    }
    parent.style = "padding: 0.5rem;"

    let users = xml_req("GET",users_collection_url,null,true)

    const user_table = document.createElement("div")
    user_table.style = "width:80%; margin: auto;";

    if (users["mode"]) {

        users = users["msg"]
        const userDom = []
        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            if(user["id"] == user_id){
                continue
            }

            const user_row = document.createElement("div")
            user_row.innerHTML = `
            <flex-tag row margin="0.5rem 0">
                <flex-tag>
                    <h4>Name</h4>
                    <p>${user["firstname"]}</p>
                </flex-tag>
                <flex-tag>
                    <h4>Email</h4>
                    <p>${user["email"]}</p>
                </flex-tag>
                <flex-tag row>
                  <button id="edit" style="margin:0 0.25rem;">Edit</button>
                  <button id="delete" style="margin:0 0.25rem;" >Delete</button>
                </flex-tag>
            </flex-tag>
            `
            const editBtn = user_row.querySelector("#edit")
    
            editBtn.onclick = (e) =>{
                frame.pushPage("update-user-page", new Intent("id", user["id"]))
            }
    
            const removeBtn =  user_row.querySelector("#delete")
            removeBtn.onclick = (e) =>{
                const id_query = JSON.stringify({"id":user["id"]})
                let res = xml_req("DELETE",users_collection_url,id_query,true)
                if(res["mode"]) user_table.removeChild(user_row)
            }
            userDom.push(user_row)
        }
        userDom.forEach(x=>{
            user_table.appendChild(x)
        })
    }else{
        alert("Failed to load users")
    }
    parent.appendChild(user_table)
})

createUserView.template((self,parent)=>{
    const page = self.getPage()
    const frame = page.getFrame()

    parent.style = "padding: 0.5rem;"
    parent.innerHTML = `<h2>Create User</h2>`
    const form = document.createElement("form")
    form.setAttribute("class","flex-col")
    form.setAttribute("id","createUserForm")
    const str = `
      <input-tag label="First Name" name="firstname"></input-tag>
      <input-tag label="Last Name" name="lastname" hidden></input-tag>
      <input-tag label="Email" name="email" type="email"></input-tag>
      <input-tag label="Password" name="password" type="password"></input-tag>
      <input-tag label="Created At" name="created_at" type="date" hidden></input-tag>
      <input-tag label="isAdmin" name="isadmin" type="checkbox" hidden></input-tag>
      <input-tag label="Verified" name="verified" type="checkbox" hidden></input-tag>
      <input-tag label="Disabled" name="disabled" type="checkbox" hidden></input-tag>
      <button type="button">Create User</button>
    `
    form.innerHTML = str

    const btn = form.querySelector("button")
    form.onsubmit = (event) =>{
        event.preventDefault();
    }

    if (btn) {
        btn.onclick = (e) =>{
            
            var firstNameInput = form.elements['firstname'];
            var emailInput = form.elements['email'];
            var passwordInput = form.elements['password'];
            
            if (firstNameInput.value.trim() === '') {
                alert('Please enter a First Name');
                firstNameInput.focus();
                return;
            }

            var email = emailInput.value.trim();
            if (email === '') {
                alert('Please enter an Email');
                emailInput.focus();
                return;
            }
            if (!validateEmail(email)) {
                alert('Please enter a valid Email');
                emailInput.focus();
                return;
            }

            var password = passwordInput.value.trim();
            if (password === '') {
                alert('Please enter a Password');
                passwordInput.focus();
                return;
            }
            if (password.length < 6) {
                alert('Password should be at least 6 characters long');
                passwordInput.focus();
                return;
            }

            var formData = new FormData(form);

            const jsonData = {};

            for (let [key, value] of formData.entries()) {
                jsonData[key] = value;
            }

            jsonData["created_at"] = get_current_dateTime()
            jsonData["isadmin"] ? jsonData["isadmin"] = true : jsonData["isadmin"] = false
            jsonData["verified"] ? jsonData["verified"] = true : jsonData["verified"] = false
            jsonData["disabled"] ? jsonData["disabled"] = true : jsonData["disabled"] = false
            const jsonString = JSON.stringify(jsonData);

            let res = xml_req("POST",users_collection_url,jsonString,true);

            if(res["mode"])

            if(res["mode"]){
                page.popView()
                alert("User created successfully")
            }else{
                alert("User has not been created")
            }
            
        }
    }

    parent.appendChild(form)
})

// update user page

updateUserView.template((self,parent)=>{
    parent.style = "padding: 0.5rem;"
    parent.innerHTML = `<h2>Update User</h2>`

    const page = self.getPage()
    const frame = page.getFrame()

    const intent = page.getIntent("id");

    if (!intent) return

    const id = intent.getValue()
    const user_id = JSON.stringify({"id":id}) 

    let users = xml_req("POST",search_users_collection_url,user_id,true)

    const form = document.createElement("form")
    form.setAttribute("class","flex-col")
    form.setAttribute("id","createUserForm")

    if (users["mode"]) {
        users = users["msg"]

        if (users.length == 0) {
            frame.popPage()
        }

        const user = users[0]
        
        const str = `
          <input-tag label="First Name" name="firstname" value="${user["firstname"]??""}"></input-tag>
          <input-tag label="Last Name" name="lastname" value="${user["lastname"]??""}"></input-tag>
          <input-tag label="Email" name="email" type="email" value="${user["email"]}"></input-tag>
          <input-tag label="Password" name="password" type="password" value="${user["password"]??""}"></input-tag>
          <input-tag label="Created At" name="created_at" type="date" hidden></input-tag>
          <input-tag label="isAdmin" name="isadmin" type="checkbox" value="${user["isadmin"]}" hidden></input-tag>
          <input-tag label="Verified" name="verified" type="checkbox" value="${user["verified"]}" hidden></input-tag>
          <input-tag label="Disabled" name="disabled" type="checkbox" value="${user["disabled"]}" hidden></input-tag>
          <button type="button">Update User</button>
        `
        form.innerHTML = str
    
        const btn = form.querySelector("button")
    
        if (btn) {
            btn.onclick = () =>{
                var firstNameInput = form.elements['firstname'];
                var emailInput = form.elements['email'];
                var passwordInput = form.elements['password'];
                
                if (firstNameInput.value.trim() === '') {
                    alert('Please enter a First Name');
                    firstNameInput.focus();
                    return;
                }
    
                var email = emailInput.value.trim();
                if (email === '') {
                    alert('Please enter an Email');
                    emailInput.focus();
                    return;
                }

                if (!validateEmail(email)) {
                    alert('Please enter a valid Email');
                    emailInput.focus();
                    return;
                }
    
                var password = passwordInput.value.trim();
                if (password === '') {
                    alert('Please enter a Password');
                    passwordInput.focus();
                    return;
                }
                if (password.length < 6) {
                    alert('Password should be at least 6 characters long');
                    passwordInput.focus();
                    return;
                }
    
                var formData = new FormData(form);
    
                const jsonData = {};
    
                for (let [key, value] of formData.entries()) {
                    jsonData[key] = value;
                }
                
                
                jsonData["isadmin"] ? jsonData["isadmin"] = true : jsonData["isadmin"] = false
                jsonData["verified"] ? jsonData["verified"] = true : jsonData["verified"] = false
                jsonData["disabled"] ? jsonData["disabled"] = true : jsonData["disabled"] = false
                
                const data = {
                    "query":{"id":user["id"]},
                    "data":jsonData
                }
                
                const jsonString = JSON.stringify(data);
    
                let res = xml_req("PUT",users_collection_url,jsonString,true);
    
                if(res["mode"]){
                    frame.popPage()
                    alert("User updated successfully")
                }else{
                    alert("User update failed")
                }
            }
        }
    }

    parent.appendChild(form)
})

userFrame.setPages([usersPage,updateUserPage])