// View-only CSS transform; artwork and exports stay in 720×720 face coordinates.
export function setupCanvasView({canvas,wrap,viewport,size,isHandTool,shouldDrawWithTouch=()=>false,shouldNavigateWithTouch=()=>true,onTouchNavigationStart=()=>{},fitScale=()=>1,onChange}) {
 let zoom=1,angle=0,panX=0,panY=0,space=false,drag=null,fitMode=true,pinch=null,touchNavigation=false;
 const touches=new Map();
 const drawingTouches=new Set();
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const editable=e=>['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||document.querySelector('dialog[open]');
 function apply(){wrap.style.transform=`translate(${panX}px,${panY}px) rotate(${angle}deg) scale(${zoom})`;canvas.dataset.zoom=zoom;canvas.dataset.viewRotation=angle;canvas.dataset.fitMode=String(fitMode);viewport.classList.toggle('pan-mode',space||isHandTool());onChange({zoom,angle,fitMode});}
 function toCanvas(e){
  const rect=wrap.getBoundingClientRect(),dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),r=angle*Math.PI/180;
  return {x:size/2+(dx*Math.cos(r)+dy*Math.sin(r))*size/(wrap.clientWidth*zoom),y:size/2+(-dx*Math.sin(r)+dy*Math.cos(r))*size/(wrap.clientWidth*zoom)};
 }
 function fit(){const available=Math.min(viewport.clientWidth-2,viewport.clientHeight-2),contentScale=fitScale();zoom=Math.max(.02,Math.min(contentScale,available/wrap.clientWidth*contentScale));panX=panY=0;apply();}
 function setZoom(value,anchor){
  fitMode=false;
  const before=anchor?toCanvas(anchor):null;zoom=clamp(value,.25,8);apply();
  if(before){const after=toCanvas(anchor),r=angle*Math.PI/180,s=wrap.clientWidth*zoom/size,dx=after.x-before.x,dy=after.y-before.y;panX+=(dx*Math.cos(r)-dy*Math.sin(r))*s;panY+=(dx*Math.sin(r)+dy*Math.cos(r))*s;apply();}
 }
 viewport.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*Math.exp(-e.deltaY*.0015),e);},{passive:false});
 viewport.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'){
   touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(touches.size>=2){e.preventDefault();e.stopImmediatePropagation();if(!shouldNavigateWithTouch())return;onTouchNavigationStart();touchNavigation=true;viewport.setPointerCapture(e.pointerId);const [a,b]=[...touches.values()].slice(0,2);pinch={distance:Math.hypot(b.x-a.x,b.y-a.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};fitMode=false;viewport.classList.add('panning');return;}
   if(isHandTool()){e.preventDefault();e.stopImmediatePropagation();onTouchNavigationStart();touchNavigation=true;drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,panX,panY};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');return;}
   if(!shouldDrawWithTouch(e)){e.preventDefault();e.stopImmediatePropagation();return;}
   drawingTouches.add(e.pointerId);
   return;
  }
  if(!(e.button===1||(e.button===0&&(space||isHandTool()))))return;
  e.preventDefault();e.stopImmediatePropagation();fitMode=false;apply();drag={x:e.clientX,y:e.clientY,panX,panY};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');
 },true);
 viewport.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch'&&touches.has(e.pointerId)){
   touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(touches.size>=2){e.preventDefault();e.stopImmediatePropagation();if(!touchNavigation||!shouldNavigateWithTouch())return;const [a,b]=[...touches.values()].slice(0,2),distance=Math.hypot(b.x-a.x,b.y-a.y),center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(pinch&&pinch.distance>0){setZoom(zoom*distance/pinch.distance,{clientX:pinch.center.x,clientY:pinch.center.y});panX+=center.x-pinch.center.x;panY+=center.y-pinch.center.y;apply();}pinch={distance,center};return;}
   if(drag?.pointerId===e.pointerId){e.preventDefault();e.stopImmediatePropagation();panX=drag.panX+e.clientX-drag.x;panY=drag.panY+e.clientY-drag.y;apply();return;}
   if(touchNavigation||!drawingTouches.has(e.pointerId)){e.preventDefault();e.stopImmediatePropagation();return;}
   return;
  }
  if(!drag)return;e.stopImmediatePropagation();panX=drag.panX+e.clientX-drag.x;panY=drag.panY+e.clientY-drag.y;apply();
 },true);
 const stop=e=>{
  if(e.pointerType==='touch'&&touches.has(e.pointerId)){const consumed=touchNavigation||drag?.pointerId===e.pointerId;touches.delete(e.pointerId);drawingTouches.delete(e.pointerId);if(drag?.pointerId===e.pointerId)drag=null;if(touches.size<2)pinch=null;if(!touches.size){touchNavigation=false;viewport.classList.remove('panning');}if(consumed){e.stopImmediatePropagation();return;}return;}
  if(!drag)return;drag=null;viewport.classList.remove('panning');e.stopImmediatePropagation();
 };
 viewport.addEventListener('pointerup',stop,true);viewport.addEventListener('pointercancel',stop,true);viewport.addEventListener('lostpointercapture',stop,true);
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&!editable(e)){e.preventDefault();space=true;apply();}});
 document.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;apply();}});window.addEventListener('blur',()=>{space=false;drag=null;viewport.classList.remove('panning');apply();});
 const observer=new ResizeObserver(()=>{if(fitMode)fit();});observer.observe(viewport);
 fit();
 return {toCanvas,setZoom,get zoom(){return zoom;},setAngle(value){fitMode=false;angle=Number.isFinite(value)?((value+180)%360+360)%360-180:0;apply();},reset(){fitMode=true;angle=0;fit();},refresh:apply};
}
