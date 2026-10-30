// Sheet geometry may be reflected to align front/back cutouts. Artwork must
// retain its handedness, so choose a positive-orientation local frame before
// applying the pat's explicitly configured rotation.
export function printArtworkMatrix(shape, points, rotation = 0) {
  let p = points;
  const cross = (p[1][0]-p[0][0])*(p[2][1]-p[0][1])
    - (p[1][1]-p[0][1])*(p[2][0]-p[0][0]);
  if (cross < 0) p = shape === 'square'
    ? [p[1],p[0],p[3],p[2]] : [p[1],p[0],p[2]];
  const h = Math.sqrt(3)/2;
  const a=p[1][0]-p[0][0],b=p[1][1]-p[0][1];
  const c=shape==='square'?p[3][0]-p[0][0]:(p[2][0]-(p[0][0]+p[1][0])/2)/h;
  const d=shape==='square'?p[3][1]-p[0][1]:(p[2][1]-(p[0][1]+p[1][1])/2)/h;
  const cx=.5,cy=shape==='square'?.5:h/3,cos=Math.cos(rotation),sin=Math.sin(rotation);
  return [a*cos+c*sin,b*cos+d*sin,-a*sin+c*cos,-b*sin+d*cos,
    p[0][0]+a*(cx-cos*cx+sin*cy)+c*(cy-sin*cx-cos*cy),
    p[0][1]+b*(cx-cos*cx+sin*cy)+d*(cy-sin*cx-cos*cy)];
}
export function drawPrintArtwork(ctx, shape, points, artwork, rotation=0, background='#fffef9') {
  ctx.save();ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  if(background){ctx.fillStyle=background;ctx.fill();}
  ctx.transform(...printArtworkMatrix(shape,points,rotation));
  ctx.drawImage(artwork,0,0,1,1);ctx.restore();
}
