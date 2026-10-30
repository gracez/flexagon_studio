// Actual libmypaint WASM computes stroke dynamics and emits dabs. This Canvas
// surface adapter renders those dabs; it is not a replacement brush simulation.
let runtimePromise;
function loadRuntime() {
  if (!runtimePromise) runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}vendor/libmypaint/engine.js`;
    script.onload = () => window.createLibMyPaintModule({
      locateFile: name => `${import.meta.env.BASE_URL}vendor/libmypaint/${name}`,
    }).then(resolve, reject);
    script.onerror = () => reject(new Error('Could not load the MyPaint brush engine.'));
    document.head.append(script);
  });
  return runtimePromise;
}
function hsv(hex) {
  const [r,g,b]=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255),max=Math.max(r,g,b),d=max-Math.min(r,g,b);
  let h=d===0?0:max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;
  return [(h/6+1)%1,max===0?0:d/max,max];
}
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export async function createMyPaintEngine(layer, surface) {
  const module = await loadRuntime(),ctx=layer.getContext('2d'),surfaceCtx=surface.getContext('2d',{willReadFrequently:true});
  let dabCount=0;
  function paintDab(target,x,y,radius,r,g,b,alpha,hardness,aspect,angle,erase) {
    if (!(radius>0&&alpha>0)||!Number.isFinite(radius)) return;
    target.save();target.globalCompositeOperation=erase?'destination-out':'source-over';
    target.translate(x,y);target.rotate(angle*Math.PI/180);target.scale(1,1/Math.max(1,aspect));
    const rgba=`rgba(${clamp(r,0,1)*255},${clamp(g,0,1)*255},${clamp(b,0,1)*255},${clamp(alpha,0,1)})`;
    if(hardness>=.999)target.fillStyle=rgba;
    else {const grad=target.createRadialGradient(0,0,0,0,0,radius);grad.addColorStop(clamp(hardness,0,.999),rgba);grad.addColorStop(1,'rgba(0,0,0,0)');target.fillStyle=grad;}
    target.beginPath();target.arc(0,0,radius,0,Math.PI*2);target.fill();target.restore();
  }
  const drawDab=(x,y,radius,r,g,b,a,hardness,alphaEraser,aspect,angle)=>{
    dabCount++;
    // The layer is a coverage mask for erasing; the sampled surface is erased.
    paintDab(ctx,x,y,radius,r,g,b,a,hardness,aspect,angle,false);
    paintDab(surfaceCtx,x,y,radius,r,g,b,a,hardness,aspect,angle,alphaEraser===0);
    return 1;
  };
  const getColor=(x,y,radius,rp,gp,bp,ap)=>{
    const pixel=surfaceCtx.getImageData(clamp(Math.floor(x),0,surface.width-1),clamp(Math.floor(y),0,surface.height-1),1,1).data;
    for(const [i,ptr] of [rp,gp,bp,ap].entries())module.HEAPF32[ptr>>2]=pixel[i]/255;
    return 0;
  };
  module._init(module.addFunction(drawDab,'ifffffffffffff'),module.addFunction(getColor,'vfffiiii'));
  const base=(name,value)=>module.ccall('set_brush_base_value',null,['string','number'],[name,value]);
  const mapping=(name,input,points)=>{
    module.ccall('set_brush_mapping_n',null,['string','string','number'],[name,input,points.length]);
    points.forEach(([x,y],i)=>module.ccall('set_brush_mapping_point',null,['string','string','number','number','number'],[name,input,i,x,y]));
  };
  function configure({tool,color,size,opacity,softness,preset}) {
    module._new_brush();
    const settings={opaque:opacity,opaque_multiply:0,opaque_linearize:.9,radius_logarithmic:Math.log(size/2),hardness:1-softness,
      dabs_per_actual_radius:2,dabs_per_basic_radius:3,dabs_per_second:120,elliptical_dab_ratio:1,anti_aliasing:1,
      speed1_gamma:4,speed2_gamma:4,speed1_slowness:.04,speed2_slowness:.8,
      smudge_length:.5,stroke_duration_logarithmic:4,eraser:tool==='eraser'?1:0};
    if(tool==='pencil')Object.assign(settings,{opaque:opacity*.65,dabs_per_basic_radius:5,radius_by_random:.25,offset_by_random:.22,tracking_noise:.12,hardness:.65*(1-softness)+.2});
    if(tool==='wash')Object.assign(settings,{opaque:opacity*.18,dabs_per_basic_radius:5,hardness:Math.min(.3,1-softness),radius_by_random:.08});
    Object.assign(settings,preset?.settings||{});
    settings.opaque*=preset?.opacityMultiplier??1;
    const [h,s,v]=hsv(color);Object.assign(settings,{color_h:h,color_s:s,color_v:v});
    for(const [name,value] of Object.entries(settings))base(name,value);
    mapping('opaque_multiply','pressure',[[0,0],[.2,.5],[1,1]]);
    mapping('radius_logarithmic','pressure',[[0,preset?.radiusPressure??-.8],[1,0]]);
    module._reset_brush();
  }
  return {
    configure,
    begin(x,y){module._reset_brush();module._stroke_to(x,y,0,0,0,1);},
    stroke(x,y,pressure,tiltX=0,tiltY=0,seconds=1/60){
      ctx.clearRect(0,0,layer.width,layer.height);
      module._stroke_to(x,y,clamp(pressure,0,1),clamp(tiltX/90,-1,1),clamp(tiltY/90,-1,1),clamp(seconds,.001,.1));
    },
    preview(preset){
      const result=document.createElement('canvas');result.width=180;result.height=48;const target=result.getContext('2d');
      surfaceCtx.clearRect(0,0,surface.width,surface.height);
      configure({tool:preset.tool,color:'#304e40',size:Math.min(20,preset.size),opacity:.9,softness:preset.softness,preset});
      module._reset_brush();module._stroke_to(15,24,0,0,0,1);
      for(let i=0;i<=40;i++){
        ctx.clearRect(0,0,layer.width,layer.height);
        module._stroke_to(15+i*3.7,24+Math.sin(i/40*Math.PI*2)*9,.7,0,0,1/60);
        target.drawImage(layer,0,0);
      }
      return result;
    },
    get dabCount(){return dabCount;},
  };
}
