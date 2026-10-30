// View-only CSS transform; artwork and exports stay in 720×720 face coordinates.
export function setupCanvasView({canvas,wrap,viewport,size,isHandTool,onChange}) {
 let zoom=1,angle=0,panX=0,panY=0,space=false,drag=null,fitMode=true;
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const editable=e=>['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||document.querySelector('dialog[open]');
 function apply(){wrap.style.transform=`translate(${panX}px,${panY}px) rotate(${angle}deg) scale(${zoom})`;canvas.dataset.zoom=zoom;canvas.dataset.viewRotation=angle;canvas.dataset.fitMode=String(fitMode);viewport.classList.toggle('pan-mode',space||isHandTool());onChange({zoom,angle,fitMode});}
 function toCanvas(e){
  const rect=wrap.getBoundingClientRect(),dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),r=angle*Math.PI/180;
  return {x:size/2+(dx*Math.cos(r)+dy*Math.sin(r))*size/(wrap.clientWidth*zoom),y:size/2+(-dx*Math.sin(r)+dy*Math.cos(r))*size/(wrap.clientWidth*zoom)};
 }
 function fit(){const available=Math.min(viewport.clientWidth-2,viewport.clientHeight-2);zoom=Math.max(.02,Math.min(1,available/wrap.clientWidth));panX=panY=0;apply();}
 function setZoom(value,anchor){
  fitMode=false;
  const before=anchor?toCanvas(anchor):null;zoom=clamp(value,.25,8);apply();
  if(before){const after=toCanvas(anchor),r=angle*Math.PI/180,s=wrap.clientWidth*zoom/size,dx=after.x-before.x,dy=after.y-before.y;panX+=(dx*Math.cos(r)-dy*Math.sin(r))*s;panY+=(dx*Math.sin(r)+dy*Math.cos(r))*s;apply();}
 }
 viewport.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*Math.exp(-e.deltaY*.0015),e);},{passive:false});
 viewport.addEventListener('pointerdown',e=>{
  if(!(e.button===1||(e.button===0&&(space||isHandTool()))))return;
  e.preventDefault();e.stopImmediatePropagation();fitMode=false;apply();drag={x:e.clientX,y:e.clientY,panX,panY};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');
 },true);
 viewport.addEventListener('pointermove',e=>{if(!drag)return;e.stopImmediatePropagation();panX=drag.panX+e.clientX-drag.x;panY=drag.panY+e.clientY-drag.y;apply();},true);
 const stop=e=>{if(!drag)return;drag=null;viewport.classList.remove('panning');e.stopImmediatePropagation();};
 viewport.addEventListener('pointerup',stop,true);viewport.addEventListener('pointercancel',stop,true);viewport.addEventListener('lostpointercapture',stop,true);
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&!editable(e)){e.preventDefault();space=true;apply();}});
 document.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;apply();}});window.addEventListener('blur',()=>{space=false;drag=null;viewport.classList.remove('panning');apply();});
 const observer=new ResizeObserver(()=>{if(fitMode)fit();});observer.observe(viewport);
 fit();
 return {toCanvas,setZoom,get zoom(){return zoom;},setAngle(value){fitMode=false;angle=Number.isFinite(value)?((value+180)%360+360)%360-180:0;apply();},reset(){fitMode=true;angle=0;fit();},refresh:apply};
}
