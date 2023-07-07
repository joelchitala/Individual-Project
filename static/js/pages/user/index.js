import { link, xml_req } from "../../utils.js";
import { chatbotFrame } from "./frames/chatbotFrame.js";
import { profileFrame } from "./frames/profileFrame.js";

const res = xml_req("GET","session-id",null,true)

export const user_valid = res["mode"]

export let user;
export let user_id;

if (user_valid) {
    try {
        user = res["msg"][0]
        user_id = parseInt(res["msg"][0]["id"])
    } catch (error) {
        console.log(`${user_id} - failed`);
        link("/login-page",true)
    }
}else{
    link("/login-page",true)
}


let selected;
const selectSidebarContent = (index = 0) =>{
    if (selected) {
        selected.derender()
    }
    switch (index) {
        case 0:
            selected = profileFrame
            break;
        case 1:
            selected = chatbotFrame
            break;
        default:
            selected = profileFrame
            break;
    }

    if (selected) {
        selected.render()
    }
}

let options = [...document.getElementsByClassName("option-box")]
window.addEventListener('DOMContentLoaded',(e)=>{
    selectSidebarContent()
    options[0].classList.add("active-option")
})


if (options.length > 0) {
    
    options.forEach((option)=>{
        option.addEventListener('click',(e)=>{
            for (let i = 0; i < options.length; i++) {
                const op = options[i];
                op.classList.remove("active-option")
            }
            selectSidebarContent(parseInt(option.getAttribute("data-idx")));
            option.classList.add("active-option")
        })
    })
}
