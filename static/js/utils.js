export const styleMapper = (element, styles = {}) => {
    if (!element) return;
  
    Object.assign(element.style, styles);
};
  
export const appendChildren = (element, children = []) => {
    if (!element) return;
  
    children.forEach(child => {
      element.appendChild(child);
    });
};
  
export const capitalize = (str = "") => {
    if (str.trim() === "") return "";
  
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
  
const getElementById = (element, label) => {
    if (label[0] === "#") {
      return element.getAttribute("id") === label.slice(1) ? element : null;
    } else if (label[0] === ".") {
      return element.classList.contains(label.slice(1)) ? element : null;
    }
    return null;
};
  
const traverseChildren = (element, label) => {
    const queue = [...element.children];
  
    while (queue.length > 0) {
      const child = queue.shift();
      const res = getElementById(child, label);
  
      if (res) return res;
  
      queue.push(...child.children);
    }
  
    return null;
};
  
export const querySelect = (element, label) => {
    if (!element) return;
  
    return traverseChildren(element, label);
};
  
export const querySelectAll = (element, label) => {
    if (!element) return [];
  
    const results = [];
  
    const traverseAndCollect = (element, label) => {
      const queue = [...element.children];
  
      while (queue.length > 0) {
        const child = queue.shift();
        const res = getElementById(child, label);
  
        if (res) results.push(res);
  
        queue.push(...child.children);
      }
    };
  
    traverseAndCollect(element, label);
  
    return results;
};
  
export const preprocessText = (text = "") => {
    return text.toLowerCase().replace(/-|_/g, "");
};
 
export const validateEmail = (email) =>{
  // Simple email validation using regular expression
  var emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
}

export const xml_req = (method,url,body,json = false) =>{

    const xhr = new XMLHttpRequest()

    try {
      xhr.open(method.toUpperCase(),url,false)
      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      xhr.setRequestHeader('Access-Control-Allow-Headers', 'Content-Type');
      body?xhr.send(body):xhr.send()
    } catch (error) {
      console.log(error);
    }

    return json ? JSON.parse(xhr.responseText) : xhr
}

export const get_current_dateTime = () =>{
  let date = new Date()
  return  `${date.getFullYear()}-${date.getDate()}-${date.getMonth()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

export const link = (target = "",click = false) =>{
  const a_link = document.createElement("a")

  a_link.href = target

  if (click) a_link.click()
  
  return a_link
}