import test from 'node:test';
import assert from 'node:assert/strict';
import {MODELS,printLayout,SQUARE,TRIANGLE} from './models.js';
import {printArtworkMatrix} from './print-artwork.js';
for(const model of Object.values(MODELS))test(`${model.name}: artwork retains handedness on both sheets, with and without glue`,()=>{
 for(const glue of [false,true])for(const page of [0,1])for(const entry of printLayout(model,{addGlueFlap:glue})){
  const points=entry.points.map(([x,y])=>[page?20-x:x,y]);
  for(const rotation of [0,Math.PI/2,Math.PI]){
   const m=printArtworkMatrix(model.shape,points,rotation);
   assert.ok(m.every(Number.isFinite));assert.ok(m[0]*m[3]-m[1]*m[2]>0,'Artwork transform must not reflect');
  }
  const m=printArtworkMatrix(model.shape,points);
  const mapped=(model.shape==='square'?SQUARE:TRIANGLE).map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);
  for(const vertex of mapped)assert.ok(points.some(p=>Math.hypot(p[0]-vertex[0],p[1]-vertex[1])<1e-10));
 }
});
