import './style.css';
import {createAutosave} from './autosave.js';
import {drawPrintArtwork} from './print-artwork.js';
import {BRUSH_PRESETS} from './brush-presets.js';
import {setupCanvasView} from './canvas-view.js';
import {createLasso} from './lasso.js';
import {createMyPaintEngine} from './mypaint-engine.js';
import {setupPanelResizers} from './panel-resizers.js';
import {createIcons, FolderOpen, Save, Download, SlidersHorizontal, Paintbrush, Pencil, Droplets, Eraser, Palette, ImagePlus, Undo2, Redo2, Trash2, LassoSelect, Pipette, Hand} from 'lucide';
const icons={ FolderOpen, Save, Download, SlidersHorizontal, Paintbrush, Pencil, Droplets, Eraser, Palette, ImagePlus, Undo2, Redo2, Trash2, LassoSelect, Pipette, Hand};
import {MODELS, PDF_LAYOUTS, SQUARE, TRIANGLE, HEXAGON_START_ANGLE, placementMatrix, inverse, printLayout, canonicalModelId} from './models.js';
const $=s=>document.querySelector(s), N=512, SIZE=720;
let model=MODELS.hexahexa,face=0,orientation=0,tool='ink',color='#cf6d4d',size=18,opacity=.85,softness=.15,guides=true,patLabels=false,sampleDesign=false;
let autosave=null,activity=0;
document.addEventListener('pointerdown',()=>activity++,true);document.addEventListener('keydown',()=>activity++,true);document.addEventListener('input',()=>activity++,true);
let presetId='ink',lastPaintPreset='ink';
const presetPreviews=new Map();
let banks={},faceBackgrounds={},history=[],future=[],drawing=false,last=null,frame=0,previewCursor=0,pendingImage=null,dragging=false,imageX=360,imageY=360,imageScale=1,imageRotation=0;
const palette=['#cf6d4d','#d59a70','#e1c789','#8d9d78','#587f72','#7184a3','#a489a8','#e8d7bd','#6b6258','#334b40','#f9f7ed','#232823'];
$('#app').innerHTML=`
<header><div class="brandmark"><img src="./hexaflexagon.svg" alt="" aria-hidden="true"></div><div class="brand">flexagon studio</div><div class="header-actions"><span class="save-status" id="saveStatus">New project</span><button class="btn" id="openProject"><i data-lucide="folder-open"></i> Open</button><button class="btn" id="saveProject"><i data-lucide="save"></i> Save project</button><button class="btn primary" id="export"><i data-lucide="download"></i> Export PDF</button></div></header>
<div class="projectbar"><div><div class="model-info" id="modelInfo"></div></div><label class="sample-toggle" title="Reference overlay. Included in PDF exports only while this is turned on; never stored in project artwork."><input type="checkbox" id="sampleDesign"> Sample design</label><label class="panel-swap-toggle" title="Place previews on the left and tools on the right"><input type="checkbox" id="swapPanels"> Swap side panels</label><select id="model" aria-label="Flexagon type"><option value="tetra">Tetraflexagon</option><option value="trihexa">Trihexaflexagon</option><option value="hexahexa" selected>Hexahexaflexagon</option></select></div>
<div id="recoveryBanner" class="hidden" role="status"><span id="recoveryBannerText"></span><div><button class="btn" id="restoreSession">Restore</button><button class="btn" id="newSession">Start new</button><button class="iconbtn" id="dismissRecovery" aria-label="Dismiss recovery notice">×</button></div></div><div class="workspace-scroll"><div class="workspace"><aside id="toolsPanel"><div class="section-title">Tools</div><button id="brushPickerButton" class="brush-picker-button" popovertarget="brushPicker" aria-label="Choose brush"><canvas id="currentBrushPreview" width="180" height="48"></canvas><span id="currentBrushName">Round ink</span><span aria-hidden="true">▾</span></button><div class="tools">${[['ink','paintbrush','Brush'],['eraser','eraser','Eraser'],['lasso','lasso-select','Lasso'],['eyedropper','pipette','Eyedropper']].map(([id,icon,name])=>`<button class="tool ${id==='ink'?'active':''}" data-tool="${id}"><i data-lucide="${icon}"></i>${name}</button>`).join('')}</div><div class="labelrow"><label for="size">Brush size</label><span class="value" id="sizeValue">18 px</span></div><input id="size" type="range" min="1" max="120" value="18"><div class="labelrow"><label for="opacity">Opacity</label><span class="value" id="opacityValue">85%</span></div><input id="opacity" type="range" min="1" max="100" value="85"><div class="labelrow"><label for="softness">Softness</label><span class="value" id="softnessValue">15%</span></div><input id="softness" type="range" min="0" max="100" value="15"><div class="divider"></div><div class="section-title">Color palette <i data-lucide="palette"></i></div><div class="swatches">${palette.map((c,i)=>`<button class="swatch ${i===0?'active':''}" style="--color:${c}" data-color="${c}" aria-label="Color ${c}"></button>`).join('')}</div><label class="custom-color"><input type="color" id="color" value="${color}"> <span id="hex">${color.toUpperCase()}</span></label><div class="divider"></div><div class="section-title">Recent colors</div><div id="recentColors" class="swatches"></div><div class="divider"></div><div class="section-title">Images</div><button class="btn full" id="importImage"><i data-lucide="image-plus"></i> Import image</button><p class="hint">PNG, JPEG & WebP<br>Transparency supported.</p><div class="divider"></div><p class="hint"><span class="key">⌘ Z</span> undo &nbsp; <span class="key">B</span> brush</p></aside>
<div class="panel-resizer" id="toolsDivider" role="separator" tabindex="0" aria-orientation="vertical" aria-label="Tools panel width" aria-controls="toolsPanel" title="Drag to resize tools. Double-click to reset."></div><main class="main" id="canvasPanel"><div class="canvasbar"><span class="face-dot" id="faceDot"></span><strong id="faceTitle"></strong><span class="pill" id="orientationTitle"></span><div class="canvas-view-controls"><div class="view-control-group" aria-label="Zoom controls"><button class="iconbtn" id="zoomOut" aria-label="Zoom out">−</button><label class="zoom-input" title="Type a zoom percentage"><input id="zoomValue" type="number" min="25" max="800" step="5" value="100" aria-label="Zoom percentage"><span>%</span></label><button class="iconbtn" id="zoomIn" aria-label="Zoom in">+</button><button class="btn" id="fitView">Fit</button></div><div class="view-control-group" aria-label="Rotation controls"><button class="iconbtn" id="angleDown" aria-label="Rotate view counterclockwise">−</button><label class="angle-input" title="Type a view angle"><input id="viewRotation" type="number" min="-180" max="180" step="15" value="0" aria-label="Canvas view rotation"><span>°</span></label><button class="iconbtn" id="angleUp" aria-label="Rotate view clockwise">+</button><button class="btn" id="resetAngle">Reset</button></div><button class="btn tool" data-tool="hand" id="handTool" aria-label="Toggle pan tool"><i data-lucide="hand"></i> Pan</button></div><div class="canvas-actions"><button class="iconbtn" id="undo" title="Undo" aria-label="Undo"><i data-lucide="undo-2"></i></button><button class="iconbtn" id="redo" title="Redo" aria-label="Redo"><i data-lucide="redo-2"></i></button><button class="iconbtn" id="clear" title="Clear this face" aria-label="Clear this face"><i data-lucide="trash-2"></i></button></div></div><div id="selectionControls" class="hidden"><div class="selection-mode" role="group" aria-label="Selection shape"><button class="btn" data-selection-mode="freeform" aria-pressed="true">Freeform</button><button class="btn" data-selection-mode="rectangle" aria-pressed="false">Rectangle</button></div><button class="btn" id="copySelection" disabled>Copy</button><button class="btn" id="cutSelection" disabled>Cut</button><button class="btn" id="pasteSelection" disabled>Paste</button><button class="btn" id="deselect" disabled>Deselect</button><details id="selectionTransform"><summary>Transform</summary><div class="transform-options"><label>Scale <input id="selectionScale" type="number" min="10" max="300" step="5" value="100" disabled>%</label><label>Rotate <input id="selectionRotation" type="number" min="-180" max="180" step="15" value="0" disabled>°</label><button class="btn" id="flipSelectionX" aria-pressed="false" disabled>Flip horizontal</button><button class="btn" id="flipSelectionY" aria-pressed="false" disabled>Flip vertical</button><button class="btn primary" id="applySelectionTransform" disabled>Apply</button><button class="btn" id="cancelSelectionTransform" disabled>Cancel</button></div></details></div><div id="imageControls" class="hidden"><span>Drag image to position</span><label>Scale <input id="imageScale" type="range" min="10" max="250" value="100"></label><label>Rotate <input id="imageRotation" type="range" min="-180" max="180" value="0"></label><button class="btn primary" id="placeImage">Place</button><button class="btn" id="cancelImage">Cancel</button></div><div class="canvas-space"><div class="canvas-wrap"><canvas id="canvas" width="720" height="720" aria-label="Paint your selected flexagon face"></canvas></div></div><div class="canvasfooter"><label><input type="checkbox" id="guides" checked> Fold guides</label><label><input type="checkbox" id="patLabels"> Pat labels</label><div class="background-controls"><label>Background <input type="color" id="backgroundColor" value="#fffef9"></label><label><input type="checkbox" id="backgroundTransparent"> Transparent</label><button class="btn" id="applyBackgroundAll">Apply to all faces</button></div><span id="brushEngineStatus" role="status">Loading MyPaint…</span></div></main>
<div class="panel-resizer" id="previewDivider" role="separator" tabindex="0" aria-orientation="vertical" aria-label="Preview panel width" aria-controls="previewPanel" title="Drag to resize previews. Double-click to reset."></div><section class="preview-panel" id="previewPanel"><div class="preview-head"><h2>Face orientations</h2><p>Select an orientation to edit.</p></div><div class="previews" id="previews"></div></section></div></div><footer class="bottom"><button id="mappingInfo">Experimental folding maps · View notes</button><span id="patCount"></span></footer>
<div id="brushPicker" popover><div class="brush-picker-head"><strong>Brushes</strong><button class="btn" popovertarget="brushPicker" popovertargetaction="hide">Close</button></div><label class="brush-category">Category <select id="brushCategory"><option>All</option>${[...new Set(BRUSH_PRESETS.map(p=>p.category))].map(c=>`<option>${c}</option>`).join('')}</select></label><div id="brushList"></div></div><input type="file" id="imageFile" accept="image/png,image/jpeg,image/webp" hidden><input type="file" id="projectFile" accept=".json,application/json" hidden><dialog id="dialog"></dialog><dialog id="recoveryDialog" aria-labelledby="recoveryTitle"><h2 id="recoveryTitle">Local recovery copies</h2></dialog><div class="toast hidden" role="status" id="toast"></div>`;
createIcons({icons});
setupPanelResizers();
const view=setupCanvasView({canvas:$('#canvas'),wrap:$('.canvas-wrap'),viewport:$('.canvas-space'),size:SIZE,isHandTool:()=>tool==='hand',fitScale:()=>model.shape==='square'?1.8:1.25,onChange:({zoom,angle})=>{
 $('#zoomValue').value=Math.round(zoom*100);$('#viewRotation').value=angle;
}});
$('#zoomIn').onclick=()=>view.setZoom(view.zoom*1.25);$('#zoomOut').onclick=()=>view.setZoom(view.zoom/1.25);$('#zoomValue').onchange=e=>{const value=+e.target.value;if(Number.isFinite(value)&&value>0)view.setZoom(value/100);else e.target.value=Math.round(view.zoom*100);};$('#fitView').onclick=()=>view.reset();$('#viewRotation').oninput=e=>view.setAngle(+e.target.value);$('#angleDown').onclick=()=>view.setAngle(+$('#viewRotation').value-15);$('#angleUp').onclick=()=>view.setAngle(+$('#viewRotation').value+15);$('#resetAngle').onclick=()=>view.setAngle(0);

function makeCanvas(w=N,h=N){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function bank(){return banks[model.id]??=Array.from({length:model.patCount*2},()=>makeCanvas());}
function backgrounds(id=model.id){return faceBackgrounds[id]??=Array(MODELS[id].faces.length).fill('#fffef9');}
function faceForSide(side){return model.faces.findIndex(f=>f.orientations.some(o=>o.placements.some(p=>p.side===side)));}
// Reference canvases stay separate from artwork, history, projects, and PDFs.
// Each sample starts as one symmetric face and is then projected onto its pats.
const sampleBanks={};
const samplePalettes=[
 ['#315b52','#d77a61','#e8c26a','#f6ecd8'],['#526a46','#c78b52','#ead39a','#f5efe1'],
 ['#485b80','#b77888','#d8b65c','#f3eadb'],['#74546d','#cf8065','#e7c680','#f5ebdf'],
 ['#356b70','#739d82','#e1b86c','#f3ead8'],['#695e48','#a97758','#d9b978','#f4ebdb'],
];
function sampleFaceArtwork(faceIndex){
 const c=makeCanvas(SIZE,SIZE),ctx=c.getContext('2d'),[ink,accent,gold,paper]=samplePalettes[faceIndex%samplePalettes.length];
 ctx.fillStyle=paper;ctx.fillRect(0,0,SIZE,SIZE);ctx.translate(SIZE/2,SIZE/2);ctx.lineCap='round';ctx.lineJoin='round';
 if(model.shape==='square'){
  ctx.strokeStyle=ink;ctx.lineWidth=9;ctx.strokeRect(-174,-174,348,348);
  for(let i=0;i<4;i++){
   ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillStyle=accent;ctx.beginPath();ctx.moveTo(0,-30);ctx.bezierCurveTo(82,-55,105,-125,0,-164);ctx.bezierCurveTo(-105,-125,-82,-55,0,-30);ctx.fill();
   ctx.fillStyle=gold;ctx.beginPath();ctx.arc(126,-126,25,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.fillStyle=paper;ctx.beginPath();ctx.arc(0,0,66,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=8;ctx.stroke();
  ctx.fillStyle=gold;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.arc(Math.cos(a)*38,Math.sin(a)*38,9,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle=ink;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();
 }else if(model.id==='hexahexa'){
  // The asymmetric two-color order makes pat rearrangements visible without
  // adding more ornament than the trihexa mandala.
  const colors=[accent,accent,gold,accent,gold,gold];
  ctx.strokeStyle=ink;ctx.lineWidth=8;
  for(let i=0;i<6;i++){
   ctx.save();ctx.rotate(i*Math.PI/3);ctx.fillStyle=colors[i];ctx.beginPath();ctx.moveTo(0,-28);ctx.bezierCurveTo(64,-58,76,-145,0,-224);ctx.bezierCurveTo(-76,-145,-64,-58,0,-28);ctx.fill();ctx.stroke();
   ctx.fillStyle=ink;ctx.beginPath();ctx.arc(0,-243,12,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.strokeStyle=accent;ctx.lineWidth=11;ctx.beginPath();ctx.arc(0,0,151,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=paper;ctx.beginPath();ctx.arc(0,0,74,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=8;ctx.stroke();
  ctx.fillStyle=accent;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*42,Math.sin(a)*42,13,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle=gold;ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();
 }else{
  ctx.rotate(faceIndex*Math.PI/18);ctx.strokeStyle=ink;ctx.lineWidth=8;
  for(let i=0;i<6;i++){
   ctx.save();ctx.rotate(i*Math.PI/3);ctx.fillStyle=i%2?accent:gold;ctx.beginPath();ctx.moveTo(0,-28);ctx.bezierCurveTo(64,-58,76,-145,0,-224);ctx.bezierCurveTo(-76,-145,-64,-58,0,-28);ctx.fill();ctx.stroke();
   ctx.fillStyle=ink;ctx.beginPath();ctx.arc(0,-243,12,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.strokeStyle=accent;ctx.lineWidth=11;ctx.beginPath();ctx.arc(0,0,151,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=paper;ctx.beginPath();ctx.arc(0,0,74,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=8;ctx.stroke();
  ctx.fillStyle=accent;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*42,Math.sin(a)*42,13,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle=gold;ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();
 }
 return c;
}
function buildSampleBank(){
 const result=Array.from({length:model.patCount*2},()=>makeCanvas());
 model.faces.forEach((faceDefinition,faceIndex)=>{
  const artwork=sampleFaceArtwork(faceIndex);
  faceDefinition.orientations[0].placements.forEach(p=>{
   const m=placementMatrix(model.shape,p),det=m[0]*m[3]-m[1]*m[2],ctx=result[p.side].getContext('2d');
   ctx.save();patPath(ctx);ctx.clip();ctx.setTransform(N*m[3]/det,-N*m[1]/det,-N*m[2]/det,N*m[0]/det,N*(m[2]*m[5]-m[3]*m[4])/det,N*(m[1]*m[4]-m[0]*m[5])/det);ctx.drawImage(artwork,0,0);ctx.restore();
  });
 });
 return result;
}
function samplePat(side){return (sampleBanks[model.id]??=buildSampleBank())[side];}
function placements(){return model.faces[face].orientations[orientation].placements;}
function polygon(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
function patPath(ctx){polygon(ctx,(model.shape==='square'?SQUARE:TRIANGLE).map(([x,y])=>[x*N,y*N]));}
function renderFace(target,f,o,withGuides=false,labels=false){
 const isPreview=target.classList.contains('orientation-preview'),ctx=target.getContext('2d',isPreview?undefined:{desynchronized:true}),scale=target.width/SIZE;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,target.width,target.height);ctx.scale(scale,scale);
 if(isPreview){const previewScale=model.shape==='square'?1.72:1.2;ctx.translate(SIZE/2,SIZE/2);ctx.scale(previewScale,previewScale);ctx.translate(-SIZE/2,-SIZE/2);}
 model.faces[f].orientations[o].placements.forEach(p=>{
  const m=placementMatrix(model.shape,p);ctx.save();ctx.transform(m[0]/N,m[1]/N,m[2]/N,m[3]/N,m[4],m[5]);patPath(ctx);ctx.clip();const background=backgrounds()[f];if(background){ctx.fillStyle=background;ctx.fillRect(0,0,N,N);}ctx.drawImage(bank()[p.side],0,0);if(sampleDesign){ctx.globalAlpha=.85;ctx.drawImage(samplePat(p.side),0,0);}ctx.restore();
  if(withGuides){ctx.save();ctx.transform(m[0]/N,m[1]/N,m[2]/N,m[3]/N,m[4],m[5]);patPath(ctx);ctx.restore();ctx.strokeStyle='#a5ad9660';ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);}
  if(labels){const cy=model.shape==='square'?.5:Math.sqrt(3)/6,x=m[0]*.5+m[2]*cy+m[4],y=m[1]*.5+m[3]*cy+m[5];ctx.fillStyle='#617450';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(`${Math.floor(p.side/2)+1}${p.side%2?'B':'F'}`,x,y);}
 });
}
function renderPreviews(live=false){
 const previews=[...document.querySelectorAll('.preview canvas')];
 if(!live){previews.forEach(c=>renderFace(c,+c.dataset.face,+c.dataset.orientation));previewCursor=0;return;}
 // Spread expensive preview work across frames while keeping every card live.
 for(let i=0;i<Math.min(3,previews.length);i++){
  const c=previews[previewCursor++%previews.length];renderFace(c,+c.dataset.face,+c.dataset.orientation);
 }
}
function draw(){frame=0;renderFace($('#canvas'),face,orientation,guides,patLabels);if(pendingImage){const ctx=$('#canvas').getContext('2d');ctx.save();clipFace(ctx);drawImageLayer(ctx);ctx.restore();}if(tool==='lasso')lasso.draw($('#canvas').getContext('2d'));renderPreviews(drawing);$('#undo').disabled=!history.length;$('#redo').disabled=!future.length;}
function requestDraw(){if(!frame)frame=requestAnimationFrame(draw);}
function updateUI(){
 const orientationCount=model.faces.reduce((total,currentFace)=>total+currentFace.orientations.length,0);
 $('#model').value=model.id;$('#modelInfo').textContent=`${model.faces.length} faces with ${orientationCount} orientations`;
 $('#patCount').textContent=`${model.patCount} double-sided pats`;
 $('#faceTitle').textContent=model.faces[face].name;$('#faceDot').style.background=model.faces[face].color;$('#orientationTitle').textContent=`Orientation ${model.faces[face].orientations[orientation].name}`;
 const background=backgrounds()[face];$('#backgroundTransparent').checked=!background;$('#backgroundColor').disabled=!background;$('#backgroundColor').value=background||'#fffef9';
 $('#previews').innerHTML=model.faces.map((f,fi)=>`<div class="face-group"><div class="face-label"><span><b class="face-dot" style="background:${f.color}"></b>${f.name}</span><span>${f.orientations.length} orientations</span></div><div class="orientation-grid">${f.orientations.map((o,oi)=>`<button class="preview ${fi===face&&oi===orientation?'selected':''}" data-face="${fi}" data-orientation="${oi}" aria-label="${f.name}, orientation ${o.name}" aria-pressed="${fi===face&&oi===orientation}"><canvas class="orientation-preview" width="360" height="360" data-face="${fi}" data-orientation="${oi}"></canvas>Orientation ${o.name}</button>`).join('')}</div></div>`).join('');draw();
}
let toastTimer;function toast(message){$('#toast').textContent=message;$('#toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.add('hidden'),4500);}
function snapshot(sides=[...new Set(placements().map(p=>p.side))]){return sides.map(side=>({side,data:bank()[side].getContext('2d').getImageData(0,0,N,N)}));}
function remember(data=snapshot()){history.push(data);if(history.length>16)history.shift();future=[];}
function backgroundSnapshot(id=model.id){return {type:'background',model:id,values:[...backgrounds(id)]};}
function rememberBackground(){history.push(backgroundSnapshot());if(history.length>16)history.shift();future=[];}
function restore(data){data.forEach(({side,data:im})=>bank()[side].getContext('2d').putImageData(im,0,0));requestDraw();markDirty();}
function restoreBackground(action){faceBackgrounds[action.model]=[...action.values];if(action.model===model.id)updateUI();else requestDraw();markDirty();}
function markDirty(){$('#saveStatus').textContent=autosave?.unavailable?'Local save failed · download a project':'Unsaved changes';autosave?.markChanged();}
function reverseHistory(from,to){
 lasso.clear();if(!from.length)return;const action=from.pop();
 if(action.type==='background'){to.push(backgroundSnapshot(action.model));restoreBackground(action);}
 else{to.push(snapshot(action.map(p=>p.side)));restore(action);}
}
function undo(){reverseHistory(history,future);}
function redo(){reverseHistory(future,history);}
function clipFace(ctx){const pts=model.shape==='square'?[[180,180],[540,180],[540,540],[180,540]]:Array.from({length:6},(_,i)=>[360+270*Math.cos(HEXAGON_START_ANGLE+i*Math.PI/3),360+270*Math.sin(HEXAGON_START_ANGLE+i*Math.PI/3)]);polygon(ctx,pts);ctx.clip();}
// Project one face-space layer back into every physical pat used by this view.
function applyLayer(layer,erase=false,transient=false){placements().forEach(p=>{const m=placementMatrix(model.shape,p),det=m[0]*m[3]-m[1]*m[2],a=m[3]/det,b=-m[1]/det,c=-m[2]/det,d=m[0]/det,e=(m[2]*m[5]-m[3]*m[4])/det,f=(m[1]*m[4]-m[0]*m[5])/det,ctx=bank()[p.side].getContext('2d');ctx.save();patPath(ctx);ctx.clip();ctx.globalCompositeOperation=erase?'destination-out':'source-over';ctx.setTransform(N*a,N*b,N*c,N*d,N*e,N*f);ctx.drawImage(layer,0,0);ctx.restore();});if(!transient)markDirty();requestDraw();}
const brushLayer=makeCanvas(SIZE,SIZE),brushSurface=makeCanvas(SIZE,SIZE);
let brushEngine=null,lastEngineTime=0;
createMyPaintEngine(brushLayer,brushSurface).then(engine=>{
 brushEngine=engine;for(const preset of BRUSH_PRESETS)presetPreviews.set(preset.id,engine.preview(preset));renderBrushPicker();updateBrushTile();$('#canvas').dataset.brushEngine='libmypaint';$('#brushEngineStatus').textContent='MyPaint · Pressure sensitive';
}).catch(error=>{console.error(error);$('#canvas').dataset.brushEngine='error';$('#brushEngineStatus').textContent='MyPaint failed to load';toast('MyPaint could not load. Reload the page to retry.');});
function readArtwork(){
 const result=makeCanvas(SIZE,SIZE),ctx=result.getContext('2d');
 for(const p of placements()){const m=placementMatrix(model.shape,p);ctx.save();ctx.transform(m[0]/N,m[1]/N,m[2]/N,m[3]/N,m[4],m[5]);patPath(ctx);ctx.clip();ctx.drawImage(bank()[p.side],0,0);ctx.restore();}
 return result;
}
function prepareBrush(e){
 const ctx=brushSurface.getContext('2d');ctx.clearRect(0,0,SIZE,SIZE);ctx.drawImage(readArtwork(),0,0);
 brushEngine.configure({tool,color,size,opacity,softness,preset:BRUSH_PRESETS.find(p=>p.id===presetId)});lastEngineTime=e.timeStamp;
}
const lasso=createLasso({size:SIZE,readArtwork,remember,snapshot,
 restorePixels:data=>data.forEach(({side,data:im})=>bank()[side].getContext('2d').putImageData(im,0,0)),
 applyLayer,previewLayer:(layer,erase)=>applyLayer(layer,erase,true),commitEdit:original=>{remember(original);markDirty();},redraw:requestDraw,onChange:({selected,copied,transforming})=>{
  $('#copySelection').disabled=$('#cutSelection').disabled=$('#deselect').disabled=!selected;$('#pasteSelection').disabled=!copied;
  for(const id of ['selectionScale','selectionRotation','flipSelectionX','flipSelectionY'])$('#'+id).disabled=!selected;
  $('#applySelectionTransform').disabled=$('#cancelSelectionTransform').disabled=!transforming;
  if(!transforming){$('#selectionScale').value=100;$('#selectionRotation').value=0;$('#flipSelectionX').setAttribute('aria-pressed','false');$('#flipSelectionY').setAttribute('aria-pressed','false');}
 }});
for(const button of document.querySelectorAll('[data-selection-mode]'))button.onclick=()=>{
 lasso.setMode(button.dataset.selectionMode);
 document.querySelectorAll('[data-selection-mode]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));
};
$('#copySelection').onclick=()=>{if(lasso.copy())toast('Selection copied within the studio.');};
$('#cutSelection').onclick=()=>lasso.cut();$('#pasteSelection').onclick=()=>lasso.paste();$('#deselect').onclick=()=>lasso.clear();
function updateSelectionTransform(){lasso.transform({scale:Math.max(.1,Math.min(3,+$('#selectionScale').value/100||1)),angle:+$('#selectionRotation').value||0,flipX:$('#flipSelectionX').getAttribute('aria-pressed')==='true',flipY:$('#flipSelectionY').getAttribute('aria-pressed')==='true'});}
$('#selectionScale').oninput=$('#selectionRotation').oninput=updateSelectionTransform;
for(const id of ['flipSelectionX','flipSelectionY'])$('#'+id).onclick=()=>{$('#'+id).setAttribute('aria-pressed',String($('#'+id).getAttribute('aria-pressed')!=='true'));updateSelectionTransform();};
$('#applySelectionTransform').onclick=()=>lasso.commitTransform();$('#cancelSelectionTransform').onclick=()=>lasso.cancelTransform();
function paintSamples(events){
 brushEngine.clearLayer();
 for(const event of events){
  const to=point(event),now=event.timeStamp??performance.now(),pressure=event.pointerType==='pen'?event.pressure:.75;
  brushEngine.stroke(to.x,to.y,pressure,event.tiltX,event.tiltY,(now-lastEngineTime)/1000||1/60);
  lastEngineTime=now;last=to;
 }
 applyLayer(brushLayer,tool==='eraser',true);
}
function segment(from,to,pressure,event={}){
 const now=event.timeStamp??performance.now();
 brushEngine.clearLayer();
 brushEngine.stroke(to.x,to.y,pressure,event.tiltX,event.tiltY,(now-lastEngineTime)/1000||1/60);
 lastEngineTime=now;applyLayer(brushLayer,tool==='eraser',true);
}
function point(e){return view.toCanvas(e);}
function inside(p){return placements().some(pl=>{const [x,y]=inverse(placementMatrix(model.shape,pl),p.x,p.y);return model.shape==='square'?x>=0&&x<=1&&y>=0&&y<=1:y>=0&&y<=Math.sqrt(3)/2&&x>=y/Math.sqrt(3)&&x<=1-y/Math.sqrt(3);});}
$('#canvas').addEventListener('pointerdown',e=>{if(e.button!==0||e.pointerType==='touch')return;const p=point(e);$('#canvas').setPointerCapture(e.pointerId);if((e.altKey||tool==='eyedropper')&&!pendingImage){pickColor(p);if(tool==='eyedropper')selectTool('ink');return;}if(pendingImage){dragging=true;last=p;return;}if(tool==='lasso'){lasso.down(p);return;}if(!inside(p))return;if(!brushEngine){toast('MyPaint is still loading. Please wait.');return;}remember();prepareBrush(e);brushEngine.begin(p.x,p.y);drawing=true;last=p;segment(p,p,e.pointerType==='pen'?e.pressure:.75,e);});
$('#canvas').addEventListener('pointermove',e=>{const p=point(e);if(tool==='lasso'&&!pendingImage){lasso.move(p);return;}if(dragging){imageX+=p.x-last.x;imageY+=p.y-last.y;last=p;requestDraw();}if(!drawing)return;paintSamples(e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e]);});
function stop(){if(tool==='lasso')lasso.up();if(drawing&&tool!=='eraser')setColor(color);const finishedStroke=drawing;drawing=false;dragging=false;last=null;if(finishedStroke){markDirty();requestDraw();}}$('#canvas').addEventListener('pointerup',stop);$('#canvas').addEventListener('pointercancel',stop);$('#canvas').addEventListener('lostpointercapture',stop);
$('#previews').addEventListener('click',e=>{const b=e.target.closest('.preview');if(!b)return;if(pendingImage){toast('Place or cancel your image before switching views.');return;}lasso.clear();face=+b.dataset.face;orientation=+b.dataset.orientation;updateUI();autosave?.markChanged({warn:false});});
$('#model').onchange=e=>{if(pendingImage){e.target.value=model.id;toast('Place or cancel your image first.');return;}lasso.clear();model=MODELS[e.target.value];face=orientation=0;history=[];future=[];updateUI();view.reset();autosave?.markChanged({warn:false});};
function updateToolUI(){
 document.querySelectorAll('.tool').forEach(b=>{const active=b.dataset.tool===tool||(b.dataset.tool==='ink'&&['ink','pencil','wash'].includes(tool));b.classList.toggle('active',active);if(b.dataset.tool==='hand')b.setAttribute('aria-pressed',String(active));});
 $('#selectionControls').classList.toggle('hidden',tool!=='lasso');$('.canvas-space').dataset.tool=tool;view.refresh();requestDraw();
}
function selectTool(t){
 lasso.clear();
 if(t==='ink'){presetId=lastPaintPreset;tool=BRUSH_PRESETS.find(p=>p.id===presetId).tool;}
 else if(t==='eraser'){if(BRUSH_PRESETS.find(p=>p.id===presetId).tool!=='eraser')presetId='eraser';tool='eraser';}
 else tool=t;
 updateBrushTile();updateToolUI();
}
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool==='hand'&&tool==='hand'?'ink':b.dataset.tool));
function updateBrushTile(){
 const preset=BRUSH_PRESETS.find(p=>p.id===presetId);$('#currentBrushName').textContent=preset.name;
 const ctx=$('#currentBrushPreview').getContext('2d');ctx.clearRect(0,0,180,48);if(presetPreviews.has(presetId))ctx.drawImage(presetPreviews.get(presetId),0,0);
}
function choosePreset(id){
 const preset=BRUSH_PRESETS.find(p=>p.id===id);lasso.clear();presetId=id;tool=preset.tool;if(tool!=='eraser')lastPaintPreset=id;
 size=preset.size;softness=preset.softness;$('#size').value=size;$('#sizeValue').textContent=size+' px';$('#softness').value=Math.round(softness*100);$('#softnessValue').textContent=Math.round(softness*100)+'%';
 updateBrushTile();updateToolUI();renderBrushPicker();$('#brushPicker').hidePopover();
}
function renderBrushPicker(){
 const category=$('#brushCategory').value;
 $('#brushList').innerHTML=BRUSH_PRESETS.filter(p=>category==='All'||p.category===category).map(p=>`<button class="brush-card" data-preset="${p.id}" aria-pressed="${p.id===presetId}"><canvas width="180" height="48"></canvas><span>${p.name}</span></button>`).join('');
 for(const button of $('#brushList').querySelectorAll('button')){const preview=presetPreviews.get(button.dataset.preset);if(preview)button.querySelector('canvas').getContext('2d').drawImage(preview,0,0);button.onclick=()=>choosePreset(button.dataset.preset);}
}
$('#brushCategory').onchange=renderBrushPicker;
$('#brushPicker').addEventListener('beforetoggle',e=>{if(e.newState==='open'){const r=$('#brushPickerButton').getBoundingClientRect();$('#brushPicker').style.left=Math.max(8,Math.min(r.left,window.innerWidth-350))+'px';$('#brushPicker').style.top=Math.max(8,Math.min(r.bottom+8,window.innerHeight-460))+'px';}});
renderBrushPicker();
let recentColors=[];
try{recentColors=JSON.parse(localStorage.getItem('flexagon-studio-recent-colors')||'[]').filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,8);}catch{}
function renderRecentColors(){
 $('#recentColors').innerHTML=recentColors.length?recentColors.map(c=>`<button class="swatch ${c===color?'active':''}" style="--color:${c}" data-recent-color="${c}" aria-label="Recent color ${c}"></button>`).join(''):'<span class="hint">No recent colors</span>';
 $('#recentColors').querySelectorAll('button').forEach(b=>b.onclick=()=>setColor(b.dataset.recentColor));
}
function setColor(c,rememberColor=true){
 color=c.toLowerCase();$('#color').value=color;$('#hex').textContent=color.toUpperCase();document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',b.dataset.color===color||b.dataset.recentColor===color));
 if(rememberColor){recentColors=[color,...recentColors.filter(v=>v!==color)].slice(0,8);try{localStorage.setItem('flexagon-studio-recent-colors',JSON.stringify(recentColors));}catch{}renderRecentColors();}
}
function pickColor(p){
 if(!inside(p)||p.x<0||p.y<0||p.x>=SIZE||p.y>=SIZE)return;
 const pixel=readArtwork().getContext('2d').getImageData(Math.floor(p.x),Math.floor(p.y),1,1).data;
 if(!pixel[3]){toast('No painted color at this point.');return;}
 setColor('#'+Array.from(pixel.slice(0,3),v=>v.toString(16).padStart(2,'0')).join(''));
}
renderRecentColors();
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>setColor(b.dataset.color));$('#color').oninput=e=>setColor(e.target.value,false);$('#color').onchange=e=>setColor(e.target.value);
$('#size').oninput=e=>{size=+e.target.value;$('#sizeValue').textContent=size+' px';};$('#opacity').oninput=e=>{opacity=+e.target.value/100;$('#opacityValue').textContent=e.target.value+'%';};$('#softness').oninput=e=>{softness=+e.target.value/100;$('#softnessValue').textContent=e.target.value+'%';};
$('#sampleDesign').onchange=e=>{sampleDesign=e.target.checked;requestDraw();};
$('#guides').onchange=e=>{guides=e.target.checked;requestDraw();};$('#patLabels').onchange=e=>{patLabels=e.target.checked;requestDraw();};$('#undo').onclick=undo;$('#redo').onclick=redo;
function selectedBackground(){return $('#backgroundTransparent').checked?null:$('#backgroundColor').value;}
function setFaceBackground(value){if(backgrounds()[face]===value)return;rememberBackground();backgrounds()[face]=value;$('#backgroundColor').disabled=!value;markDirty();requestDraw();}
$('#backgroundColor').onchange=e=>setFaceBackground(e.target.value);
$('#backgroundTransparent').onchange=e=>setFaceBackground(e.target.checked?null:$('#backgroundColor').value);
$('#applyBackgroundAll').onclick=()=>{const value=selectedBackground();if(backgrounds().every(background=>background===value))return;rememberBackground();backgrounds().fill(value);markDirty();requestDraw();toast('Background applied to every face in this flexagon.');};
function showDialog(html){$('#dialog').innerHTML=html;$('#dialog').showModal();$('#dialog').querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#dialog').close());}
$('#clear').onclick=()=>{lasso.clear();showDialog('<h2>A fresh start?</h2><p>Clear the pat sides used by this face. Every orientation using those sides will update. You can undo this.</p><div class="actions"><button class="btn" data-close>Keep artwork</button><button class="btn primary" id="confirmClear">Clear face</button></div>');$('#confirmClear').onclick=()=>{remember();placements().forEach(p=>bank()[p.side].getContext('2d').clearRect(0,0,N,N));markDirty();requestDraw();$('#dialog').close();};};
$('#importImage').onclick=()=>{selectTool('ink');$('#imageFile').click();};$('#imageFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;activity++;try{if(file.size>30*1024*1024)throw Error('Choose an image under 30 MB.');pendingImage=await createImageBitmap(file);imageX=imageY=360;imageScale=1;imageRotation=0;$('#imageScale').value=100;$('#imageRotation').value=0;$('#imageControls').classList.remove('hidden');requestDraw();}catch(err){toast('Could not import image. '+err.message);}e.target.value='';};
function drawImageLayer(ctx){ctx.save();ctx.translate(imageX,imageY);ctx.rotate(imageRotation);const s=Math.min(430/pendingImage.width,430/pendingImage.height)*imageScale;ctx.drawImage(pendingImage,-pendingImage.width*s/2,-pendingImage.height*s/2,pendingImage.width*s,pendingImage.height*s);ctx.restore();}
$('#imageScale').oninput=e=>{imageScale=+e.target.value/100;requestDraw();};$('#imageRotation').oninput=e=>{imageRotation=+e.target.value*Math.PI/180;requestDraw();};
function cancelImage(){pendingImage?.close();pendingImage=null;$('#imageControls').classList.add('hidden');requestDraw();}$('#cancelImage').onclick=cancelImage;$('#placeImage').onclick=()=>{if(!pendingImage)return;remember();const c=makeCanvas(SIZE,SIZE);drawImageLayer(c.getContext('2d'));applyLayer(c);cancelImage();};
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function projectMetadata(){return {format:'fold-studio',version:1,model:model.id,face,orientation,faceBackgrounds};}
function downloadProject(){
 lasso.commitTransform();
 const data={...projectMetadata(),banks:Object.fromEntries(Object.entries(banks).map(([id,cs])=>[id,cs.map(c=>c.toDataURL('image/png'))]))};
 download(new Blob([JSON.stringify(data)],{type:'application/json'}),'flexagon-studio-project.json');
 autosave?.noteDownloaded();$('#saveStatus').textContent='Project downloaded';
}
async function captureLocalProject(){
 const metadata=projectMetadata();
 const entries=Object.entries(banks).map(([id,cs])=>[id,cs.map(c=>new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not encode artwork.')),'image/png')))]);
 return {...metadata,banks:Object.fromEntries(await Promise.all(entries.map(async([id,images])=>[id,await Promise.all(images)])))};
}
async function restoreProject(data,{canApply=()=>true}={}){
 if(!data||data.format!=='fold-studio'||data.version!==1||!data.banks||typeof data.banks!=='object')throw Error('Unsupported project format.');
 const modelId=canonicalModelId(data.model);if(!Object.hasOwn(MODELS,modelId))throw Error('Unknown flexagon model.');
 const next={};
 for(const [savedId,images] of Object.entries(data.banks)){
  const id=canonicalModelId(savedId);if(Object.hasOwn(next,id))throw Error('Duplicate model bank.');
  if(id==='tetra'&&Array.isArray(images)&&images.length===32)throw Error('This project uses the obsolete 16-pat square template. Keep the original file; it cannot be safely remapped automatically to the corrected eight-pat net.');
  if(!Object.hasOwn(MODELS,id)||!Array.isArray(images)||images.length!==MODELS[id].patCount*2)throw Error('Invalid pat bank.');
  next[id]=await Promise.all(images.map(async source=>{
   let image;
   if(source instanceof Blob&&source.type==='image/png')image=await createImageBitmap(source);
   else if(typeof source==='string'&&source.startsWith('data:image/png;base64,'))image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Invalid image.'));im.src=source;});
   else throw Error('Invalid pat image.');
   const c=makeCanvas();c.getContext('2d').drawImage(image,0,0,N,N);image.close?.();return c;
  }));
 }
 const nextBackgrounds={};
 if(data.faceBackgrounds!==undefined){
  if(!data.faceBackgrounds||typeof data.faceBackgrounds!=='object'||Array.isArray(data.faceBackgrounds))throw Error('Invalid face backgrounds.');
  for(const [savedId,values] of Object.entries(data.faceBackgrounds)){
   const id=canonicalModelId(savedId);
   if(!MODELS[id]||!Array.isArray(values)||values.length!==MODELS[id].faces.length||values.some(value=>value!==null&&!(typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))))throw Error('Invalid face backgrounds.');
   nextBackgrounds[id]=[...values];
  }
 }
 if(!Number.isInteger(data.face)||!Number.isInteger(data.orientation)||!MODELS[modelId].faces[data.face]?.orientations[data.orientation])throw Error('Invalid selected face.');
 if(!canApply())return false;
 // Swap only after every image and metadata field has validated successfully.
 lasso.clear();cancelImage();banks=next;faceBackgrounds=nextBackgrounds;model=MODELS[modelId];face=data.face;orientation=data.orientation;history=[];future=[];updateUI();view.reset();return true;
}
$('#saveProject').onclick=downloadProject;
$('#openProject').onclick=()=>$('#projectFile').click();
$('#projectFile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;activity++;
 try{if(file.size>80*1024*1024)throw Error('Project exceeds 80 MB.');await restoreProject(JSON.parse(await file.text()));autosave?.markChanged();$('#saveStatus').textContent='Project opened';toast('Project opened.');}
 catch(error){toast('Could not open project: '+error.message);}e.target.value='';
};
document.addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||document.querySelector('dialog[open]'))return;
 const key=e.key.toLowerCase(),command=e.metaKey||e.ctrlKey;
 if(command&&key==='z'){e.preventDefault();e.shiftKey?redo():undo();}
 else if(command&&['c','x','v'].includes(key)&&!pendingImage){
  if(key==='v'){if(tool!=='lasso')selectTool('lasso');if(lasso.paste())e.preventDefault();}
  else if(tool==='lasso'){e.preventDefault();key==='c'?lasso.copy():lasso.cut();}
 }else if(!command){
  if(key==='b')selectTool('ink');if(key==='e')selectTool('eraser');if(key==='l')selectTool('lasso');if(key==='i')selectTool('eyedropper');if(key==='h')selectTool('hand');
  if(key==='+'||key==='=')view.setZoom(view.zoom*1.25);if(key==='-')view.setZoom(view.zoom/1.25);if(key==='0')view.reset();
  if(tool==='lasso'&&key==='escape'){if(lasso.transforming)lasso.cancelTransform();else lasso.clear();}
  if(tool==='lasso'&&(key==='delete'||key==='backspace')){e.preventDefault();lasso.remove();}
 }
});
window.addEventListener('beforeunload',e=>{if(autosave?.hasUnsavedChanges()||pendingImage||lasso.transforming){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void autosave?.flush();});
window.addEventListener('pagehide',()=>{void autosave?.flush();});
$('#mappingInfo').onclick=()=>showDialog(`<h2>Folding maps</h2><p>${model.note}</p><p>These are editable draft views, not a verified physical simulation. Orientation counts follow the requested specification: square 2/2/2/2, trihexaflexagon 2/2/2, hexahexaflexagon 4/4/4/2/2/2.</p><p>Developers: edit <code>src/models.js</code> for face placements, pat-side IDs, rotations, and print order. Each physical pat has a front (F) and back (B). The square net has eight double-sided pats; its exact folded orientations remain provisional.</p><p>Painting uses the open-source <a href="https://github.com/mypaint/libmypaint" target="_blank" rel="noreferrer">libmypaint</a> 1.3.0 engine compiled to WebAssembly, with a Canvas surface adapter.</p><div class="actions"><button class="btn primary" data-close>Close</button></div>`);
$('#export').onclick=()=>{lasso.commitTransform();if(pendingImage){toast('Place or cancel your image before exporting.');return;}showDialog(`<h2>Export PDF</h2><p>Print the two-page PDF <strong>double-sided in landscape orientation</strong>. Select <strong>Flip on short edge</strong> and <strong>Actual size / 100%</strong>; turn off Fit, Shrink, or Scale to page. Alternatively, print the pages separately, cut out both sides, and glue them together. Leave glue flaps off to join the ends with tape as a flexible joint.</p><p><strong>Experimental template:</strong> ${model.note} Make a small plain-paper test before using your final artwork.</p><label>Paper size <select id="paper"><option value="a3">A3 landscape · larger artwork</option><option value="a4">A4 landscape</option><option value="letter" selected>US Letter landscape</option></select></label><label><input id="addGlueFlap" type="checkbox" checked> Include glue flaps</label><p class="hint">${model.printSplit?'Off: join the two strips with flexible tape. On: move the first front artwork to the added front endpoint, leaving one front and one back closure flap, and add an overlapping tab to reconnect the split strips.':model.id==='trihexa'?'Off: join the ends with tape. On: move 1B to the added front endpoint, leaving a glue flap at each end of the back sheet and none on the front.':'Off: join the ends with tape. On: move the first front artwork to the added front endpoint, leaving a front flap at the start and a back flap at the far end.'}</p><label><input id="exportLabels" type="checkbox"> Include pat IDs for checking the folding order</label><div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="downloadPDF">Download 2-page PDF</button></div>`);$('#downloadPDF').onclick=async()=>{const b=$('#downloadPDF');b.disabled=true;b.textContent='Generating PDF…';try{await new Promise(r=>setTimeout(r,30));await exportPDF($('#paper').value,$('#exportLabels').checked,$('#addGlueFlap').checked);$('#dialog').close();toast('PDF downloaded. Print double-sided, landscape, flip on short edge, at actual size.');}catch(err){b.disabled=false;b.textContent='Try again';toast('Export failed: '+err.message);}};};
async function exportPDF(format,labels,addGlueFlap){
 const {jsPDF}=await import('jspdf');
 const pdf=new jsPDF({orientation:'landscape',unit:'mm',format}),w=pdf.internal.pageSize.getWidth(),h=pdf.internal.pageSize.getHeight(),layout=printLayout(model,{addGlueFlap});
 const printArtwork=sampleDesign?bank().map((artwork,side)=>{const c=makeCanvas(),ctx=c.getContext('2d');ctx.drawImage(artwork,0,0);ctx.globalAlpha=.85;ctx.drawImage(samplePat(side),0,0);return c;}):bank();
 const points=layout.flatMap(cell=>cell.points),minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),netWidth=Math.max(...points.map(p=>p[0]))-minX,netHeight=Math.max(...points.map(p=>p[1]))-minY;
 // Put the instructions beside the net when that produces a larger template.
 // Very wide nets keep compact top/bottom bands so the text never costs useful scale.
 const pdfLayout=PDF_LAYOUTS[model.id],{margin,railWidth,railGap}=pdfLayout;
 const railScale=Math.min((w-margin*2-railWidth-railGap)/netWidth,(h-margin*2)/netHeight);
 const bandScale=Math.min((w-24)/netWidth,(h-58)/netHeight);
 const useRail=pdfLayout.mode==='side'||(pdfLayout.mode==='auto'&&railScale>bandScale),side=useRail?railScale:bandScale;
 const cutting=model.printSplit
  ? addGlueFlap?'Solid lines: cut outline. Dashed lines: crease. Glue the overlapping split tab to make one long strip; use the end flap after folding.':'Solid lines: cut outline. Dashed lines: crease. Join the two strips with flexible tape.'
  : addGlueFlap?'Solid lines: cut outline. Dashed lines: crease. Blank end pats: glue flaps.':'Solid lines: cut outline. Dashed lines: crease. Join the ends with tape as a flexible joint.';
 const netAreaWidth=useRail?w-margin*2-railWidth-railGap:w;
 const left=useRail?margin+(netAreaWidth-netWidth*side)/2:(w-netWidth*side)/2;
 const top=useRail?margin+(h-margin*2-netHeight*side)/2:29+(h-58-netHeight*side)/2;
 for(let page=0;page<2;page++){
  if(page)pdf.addPage();
  if(!useRail){pdf.setTextColor(49,79,64);pdf.setFontSize(14);pdf.text('flexagon studio / '+model.name,12,12);pdf.setFontSize(9);pdf.text(page?'BACK':'FRONT',12,20);pdf.setTextColor(120,125,110);pdf.setFontSize(7);pdf.text(`Print actual size (100%)  |  Pat edge ${side.toFixed(1)} mm`,12,25);}
  const resolution=6,c=makeCanvas(Math.round(w*resolution),Math.round(h*resolution)),ctx=c.getContext('2d');ctx.scale(resolution,resolution);const edges=new Map();
  for(const entry of layout){
   let p=entry.points.map(([x,y])=>[left+(x-minX)*side,top+(y-minY)*side]);
   // Landscape + short-edge duplex: reflect the complete back net across the
   // page width. The printer's duplex flip brings these positions into register.
   if(page)p=p.map(([x,y])=>[w-x,y]);
   const item=entry[page?'back':'front'];
   if(item)drawPrintArtwork(ctx,model.shape,p,printArtwork[item.side],item.rotation||0,backgrounds()[faceForSide(item.side)]);
   else{ctx.save();polygon(ctx,p);ctx.fillStyle='#f0f1e9';ctx.fill();ctx.restore();}
   for(let j=0;j<p.length;j++){const e=[p[j],p[(j+1)%p.length]],key=e.map(v=>v.map(n=>n.toFixed(3)).join(',')).sort().join('|');const found=edges.get(key);if(found)found.count++;else edges.set(key,{points:e,count:1});}
   if(labels){const x=p.reduce((v,a)=>v+a[0],0)/p.length,y=p.reduce((v,a)=>v+a[1],0)/p.length;ctx.fillStyle='#546347';ctx.font=`${Math.max(1.2,Math.min(2.3,side*.11))}px sans-serif`;ctx.textAlign='center';ctx.fillText(item?`${Math.floor(item.side/2)+1}${item.side%2?'B':'F'}${item.face?' / Face '+item.face:''}`:'GLUE',x,y);}
  }
  edges.forEach(({points,count})=>{ctx.beginPath();ctx.moveTo(...points[0]);ctx.lineTo(...points[1]);ctx.strokeStyle=count>1?'#929b84':'#45523b';ctx.lineWidth=count>1?.15:.22;ctx.setLineDash(count>1?[1.2,1]:[]);ctx.stroke();});
  pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,w,h);
  if(useRail){
   const railSide=page?pdfLayout.backRail:pdfLayout.frontRail;
   const railX=railSide==='left'?margin:w-margin-railWidth,textX=railX+4,textWidth=railWidth-8;
   const showDetails=!page||pdfLayout.repeatInstructionsOnBack!==false;
   pdf.setTextColor(49,79,64);
   if(showDetails){pdf.setFontSize(10);pdf.text(pdf.splitTextToSize('flexagon studio / '+model.name,textWidth),textX,16);pdf.setFontSize(9);pdf.text(page?'BACK':'FRONT',textX,32);pdf.setTextColor(120,125,110);pdf.setFontSize(7);pdf.text(pdf.splitTextToSize(`Print actual size (100%)\nPat edge ${side.toFixed(1)} mm`,textWidth),textX,42);
    pdf.setDrawColor(85,102,72);pdf.setLineWidth(.25);pdf.line(textX+4,57,textX+4,107);pdf.line(textX+2,57,textX+6,57);pdf.line(textX+2,107,textX+6,107);pdf.text('50 mm scale check',textX+10,84);
    pdf.text(pdf.splitTextToSize(cutting,textWidth),textX,124);pdf.text(pdf.splitTextToSize('Print double-sided in landscape. Flip on short edge. Use Actual size / 100% and turn off page scaling. Alternatively, print separately and glue the sides together after cutting them out.',textWidth),textX,157);
   }else{pdf.setFontSize(9);pdf.text('BACK',textX,16);}
  }else{
   pdf.setDrawColor(85,102,72);pdf.setLineWidth(.25);pdf.line(12,h-26,62,h-26);pdf.line(12,h-28,12,h-24);pdf.line(62,h-28,62,h-24);pdf.setFontSize(7);pdf.text('50 mm scale check',12,h-20);pdf.text(pdf.splitTextToSize(cutting,w-86),74,h-20);pdf.text('Print double-sided in landscape · Flip on short edge · Actual size / 100% · Turn off page scaling',12,h-12);
  }
 }
 pdf.save(`flexagon-studio-${model.id}-front-back.pdf`);
}
updateUI();

function recoveryTime(timestamp){return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(timestamp));}
const initialActivity=activity;
let recoveryNoticeTimer=null;
function showRecoveryBanner(text,{restore=false,temporary=false}={}){
 clearTimeout(recoveryNoticeTimer);$('#recoveryBannerText').textContent=text;$('#restoreSession').classList.toggle('hidden',!restore);$('#recoveryBanner').classList.remove('hidden');
 if(temporary)recoveryNoticeTimer=setTimeout(()=>$('#recoveryBanner').classList.add('hidden'),12000);
}
async function chooseRecovery(copies){
 for(const record of [copies.latest,copies.previous].filter(Boolean)){
  if(activity!==initialActivity||drawing||lasso.busy||pendingImage)break;
  try{
   const restored=await restoreProject(record.project,{canApply:()=>activity===initialActivity&&!drawing&&!lasso.busy&&!pendingImage});
   if(restored){showRecoveryBanner(record.id==='previous'?'Previous session restored from the backup copy.':'Previous session restored.',{temporary:true});return {action:'recovered',record};}
   break;
  }catch(error){console.warn('Recovery copy could not be restored:',error);}
 }
 showRecoveryBanner('Previous session found. Your current work has been kept.',{restore:true});
 return {action:'pending'};
}
async function showRecoveryCopies(){
 if(!autosave.ready){toast('Local recovery is still loading. You can continue working.');return;}
 const records=await autosave.copies(),copies=Object.fromEntries(records.map(r=>[r.id,r]));
 if(!records.length){toast('No local recovery copies yet.');return;}
 const dialog=$('#recoveryDialog');
 dialog.innerHTML=`<h2 id="recoveryTitle">Local recovery copies</h2><p>Restore a saved session. Download the current project first to keep a portable copy.</p><label>Recovery copy <select id="recoveryChoice"></select></label><label><input id="backupBeforeRecovery" type="checkbox"> Download current project before restoring</label><p id="recoveryError" role="alert"></p><div class="actions"><button class="btn" id="startNewFromRecovery">Start new</button><button class="btn" id="cancelRecovery">Cancel</button><button class="btn primary" id="recoverProject">Restore</button></div>`;
 for(const id of ['latest','previous'])if(copies[id]){const option=document.createElement('option');option.value=id;option.textContent=`${id==='latest'?'Latest':'Previous'} · ${recoveryTime(copies[id].timestamp)}`;$('#recoveryChoice').append(option);}
 $('#cancelRecovery').onclick=()=>dialog.close();$('#startNewFromRecovery').onclick=()=>{dialog.close();$('#newSession').click();};
 $('#recoverProject').onclick=async()=>{
  const button=$('#recoverProject');button.disabled=true;
  try{if($('#backupBeforeRecovery').checked)downloadProject();const record=copies[$('#recoveryChoice').value];await restoreProject(record.project);await autosave.acceptRecovery(record);dialog.close();showRecoveryBanner('Previous session restored.',{temporary:true});}
  catch(error){$('#recoveryError').textContent='Could not restore this copy: '+error.message;button.disabled=false;}
 };dialog.showModal();
}
$('#restoreSession').onclick=()=>{void showRecoveryCopies();};
$('#dismissRecovery').onclick=()=>{$('#recoveryBanner').classList.add('hidden');autosave.continueCurrent();};
$('#saveStatus').title='Click to view local recovery copies';$('#saveStatus').setAttribute('role','button');$('#saveStatus').tabIndex=0;
$('#saveStatus').onclick=()=>{void showRecoveryCopies();};$('#saveStatus').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();void showRecoveryCopies();}};
$('#newSession').onclick=()=>{
 showDialog('<h2>Start a new project?</h2><p>This clears the canvas and local recovery copies. Downloaded project files are kept.</p><label><input type="checkbox" id="backupBeforeNew"> Download current project first</label><div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="confirmNewSession">Start new</button></div>');
 $('#confirmNewSession').onclick=async()=>{
  const button=$('#confirmNewSession');button.disabled=true;
  try{if($('#backupBeforeNew').checked)downloadProject();lasso.cancelTransform();lasso.clear();await autosave.clearRecovery();cancelImage();banks={};faceBackgrounds={};history=[];future=[];face=orientation=0;updateUI();view.reset();$('#saveStatus').textContent='New project';$('#recoveryBanner').classList.add('hidden');$('#dialog').close();}
  catch(error){button.disabled=false;toast('Could not clear local recovery: '+error.message);}
 };
};
autosave=createAutosave({capture:captureLocalProject,isBusy:()=>drawing||lasso.busy,chooseRecovery,
 onStatus:(state,{timestamp,error}={})=>{
  if(state==='saved')$('#saveStatus').textContent='Saved locally · '+new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(timestamp));
  else if(state==='saving')$('#saveStatus').textContent='Saving locally…';
  else if(state==='pending')$('#saveStatus').textContent='Unsaved changes';
  else if(state==='recovered')$('#saveStatus').textContent='Recovered · '+recoveryTime(timestamp);
  else if(state==='error'){$('#saveStatus').textContent='Local save failed · download a project';console.error('Local autosave:',error);toast('Local saving is unavailable. Use Save project to keep a downloadable copy.');}
 },onReady:()=>{}
});
