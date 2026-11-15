export function fly(img:HTMLImageElement|null){
 const t=document.getElementById('mannequin');if(!img||!t)return;
 const a=img.getBoundingClientRect(),b=t.getBoundingClientRect(),c=img.cloneNode() as HTMLImageElement;
 Object.assign(c.style,{position:'fixed',left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px',zIndex:'100',pointerEvents:'none',objectFit:'contain'});
 document.body.appendChild(c);
 c.animate([{transform:'none',opacity:1},{transform:`translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+b.height*.4-a.top-a.height/2}px) scale(.25)`,opacity:.3}],{duration:700,easing:'cubic-bezier(.5,0,.2,1)'}).onfinish=()=>c.remove();
}
