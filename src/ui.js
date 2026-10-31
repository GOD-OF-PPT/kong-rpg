(function(K){
  'use strict';
  // UI values are text or DOM nodes. No string is ever parsed as markup.
  const el=(tag,attributes={},...children)=>{
    const node=document.createElement(tag);
    for(const [name,value]of Object.entries(attributes)){
      if(name==='style'){
        for(const [property,setting]of Object.entries(value))node.style.setProperty(property,String(setting));
      }else if(['checked','disabled','hidden'].includes(name))node[name]=Boolean(value);
      else if(value!=null)node.setAttribute(name,String(value));
    }
    node.append(...children.flat(Infinity).filter(value=>value!=null&&value!==false));
    return node;
  };
  K.UI={el};
})(globalThis.Kong ||= {});
