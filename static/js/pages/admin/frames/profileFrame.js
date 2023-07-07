import {Frame} from "../../../ui/frame.js"
import { Page } from "../../../ui/page.js";
import { View } from "../../../ui/view.js";
import { Intent } from "../../../ui/intent.js";
import { get_current_dateTime, link, validateEmail, xml_req } from "../../../utils.js";
import { IntentTag } from "../../../components/components.js";

const users_collection_url = '/collection/users'
const search_users_collection_url = '/search/collection/users'

const content_box = document.getElementById("content-box")
export const profileFrame = new Frame("profile-frame",content_box)

const profileView = new View()
const profilePage = new Page("profile-page",["Profile"],[profileView])

profileView.template((self,parent)=>{
    parent.innerHTML = `<h1>Profile View</h1>`

    const page = self.getPage()
    const frame = page.getFrame()

    const res = xml_req("GET","session-id",null,true)

    if(!res["mode"])return;

    const user_id = JSON.stringify({"id":res["msg"][0]["id"]}) 

    let users = xml_req("POST",search_users_collection_url,user_id,true)

    const form = document.createElement("form")
    form.setAttribute("class","flex-col")
    form.setAttribute("id","createUserForm")

    if (users["mode"]) {
        users = users["msg"]

        if (users.length == 0) {
            link("/",true)
            return;
        }

        const user = users[0]
        
        const str = `
          <input-tag label="First Name" name="firstName" value="${user["firstname"]??""}"></input-tag>
          <input-tag label="Last Name" name="lastname" value="${user["lastname"]??""}"></input-tag>
          <input-tag label="Email" name="email" type="email" value="${user["email"]??""}"></input-tag>
          <input-tag label="Password" name="password" type="password" value="${user["password"]??""}"></input-tag>
          <input-tag label="Created At" name="created_at" type="date" hidden></input-tag>
          <button type="button">Update User</button>
        `
        form.innerHTML = str
    
        const btn = form.querySelector("button")
    
        if (btn) {
            btn.onclick = () =>{
                var firstNameInput = form.elements['firstName'];
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
    
                const data = {
                    "query":{"id":user["id"]},
                    "data":jsonData
                }
                
                const jsonString = JSON.stringify(data);
    
                let res = xml_req("PUT",users_collection_url,jsonString,true);
    
                if(res["mode"]){
                    page.refresh()
                    alert("Profile updated successfully")
                }else{
                    alert("Profile update failed")
                }
            }
        }
    }

    parent.appendChild(form)
})

profileFrame.setPages([profilePage])
