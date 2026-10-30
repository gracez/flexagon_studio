// Raster selection in face coordinates. Samples/guides are never captured.
export function createLasso({size,readArtwork,remember,snapshot,restorePixels,applyLayer,previewLayer,commitEdit,redraw,onChange}) {
  let points=[],selection=null,clipboard=null,gesture=null,transformState=null;
  const canvas=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
  function path(ctx,ps){ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
  function shifted(source,dx,dy){const c=canvas();c.getContext('2d').drawImage(source,dx,dy);return c;}
  function capture(ps){
    const mask=canvas(),ctx=mask.getContext('2d');path(ctx,ps);ctx.fillStyle='white';ctx.fill();
    const pixels=canvas(),pctx=pixels.getContext('2d');pctx.drawImage(readArtwork(),0,0);pctx.globalCompositeOperation='destination-in';pctx.drawImage(mask,0,0);
    return {points:ps.map(p=>({...p})),mask,pixels};
  }
  function notify(){onChange({selected:!!selection,copied:!!clipboard,transforming:!!transformState});redraw();}
  function clear(){commitTransform();points=[];selection=null;gesture=null;notify();}
  function hit(p){if(!selection)return false;const ctx=selection.mask.getContext('2d');path(ctx,selection.points);return ctx.isPointInPath(p.x,p.y);}
  function down(p){
    commitTransform();
    if(hit(p)){gesture={type:'move',start:p,moved:false};}
    else{selection=null;points=[p];gesture={type:'select'};notify();}
  }
  function move(p){
    if(!gesture)return;
    if(gesture.type==='select'){points.push(p);redraw();return;}
    const dx=Math.round(p.x-gesture.start.x),dy=Math.round(p.y-gesture.start.y);
    if(!gesture.moved){if(Math.hypot(dx,dy)<2)return;remember();applyLayer(selection.mask,true);gesture.erased=snapshot();gesture.moved=true;}
    restorePixels(gesture.erased);applyLayer(shifted(selection.pixels,dx,dy));gesture.dx=dx;gesture.dy=dy;redraw();
  }
  function up(){
    if(!gesture)return;
    if(gesture.type==='select'){
      if(points.length>=3){const xs=points.map(p=>p.x),ys=points.map(p=>p.y);if(Math.max(...xs)-Math.min(...xs)>3&&Math.max(...ys)-Math.min(...ys)>3)selection=capture(points);}
      points=[];
    }else if(gesture.moved){selection=capture(selection.points.map(p=>({x:p.x+gesture.dx,y:p.y+gesture.dy})));}
    gesture=null;notify();
  }
  function copy(){commitTransform();if(!selection)return false;clipboard={pixels:selection.pixels,points:selection.points.map(p=>({...p}))};notify();return true;}
  function cut(){if(!copy())return;remember();applyLayer(selection.mask,true);clear();}
  function paste(){
    commitTransform();if(!clipboard)return false;
    const xs=clipboard.points.map(p=>p.x),ys=clipboard.points.map(p=>p.y),dx=size/2-(Math.min(...xs)+Math.max(...xs))/2,dy=size/2-(Math.min(...ys)+Math.max(...ys))/2;
    remember();applyLayer(shifted(clipboard.pixels,dx,dy));selection=capture(clipboard.points.map(p=>({x:p.x+dx,y:p.y+dy})));notify();return true;
  }
  function remove(){commitTransform();if(!selection)return;remember();applyLayer(selection.mask,true);clear();}
  function transform({scale=1,angle=0,flipX=false,flipY=false}){
    if(!selection)return;
    if(!transformState){
      transformState={original:snapshot(),source:selection};
      previewLayer(selection.mask,true);transformState.erased=snapshot();
    }
    const source=transformState.source,xs=source.points.map(p=>p.x),ys=source.points.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
    const r=angle*Math.PI/180,sx=scale*(flipX?-1:1),sy=scale*(flipY?-1:1),c=Math.cos(r),sn=Math.sin(r);
    const map=p=>({x:cx+c*(p.x-cx)*sx-sn*(p.y-cy)*sy,y:cy+sn*(p.x-cx)*sx+c*(p.y-cy)*sy});
    const pixels=canvas(),ctx=pixels.getContext('2d');ctx.translate(cx,cy);ctx.rotate(r);ctx.scale(sx,sy);ctx.translate(-cx,-cy);ctx.drawImage(source.pixels,0,0);
    restorePixels(transformState.erased);previewLayer(pixels);
    selection={...source,points:source.points.map(map)};notify();
  }
  function commitTransform(){
    if(!transformState)return;
    commitEdit(transformState.original);selection=capture(selection.points);transformState=null;notify();
  }
  function cancelTransform(){
    if(!transformState)return;
    restorePixels(transformState.original);selection=transformState.source;transformState=null;notify();
  }
  function draw(ctx){
    let ps=gesture?.type==='select'?points:selection?.points;if(!ps?.length)return;
    if(gesture?.type==='move'&&gesture.moved)ps=ps.map(p=>({x:p.x+gesture.dx,y:p.y+gesture.dy}));
    ctx.save();path(ctx,ps);ctx.lineWidth=2;ctx.strokeStyle='white';ctx.stroke();ctx.setLineDash([5,5]);ctx.strokeStyle='#304e40';ctx.stroke();ctx.restore();
  }
  return {down,move,up,clear,copy,cut,paste,remove,draw,transform,commitTransform,cancelTransform,get transforming(){return !!transformState;},get busy(){return !!gesture||!!transformState;}};
}
