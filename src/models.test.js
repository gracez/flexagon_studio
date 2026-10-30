import test from 'node:test';
import assert from 'node:assert/strict';
import {MODELS,placementMatrix,inverse} from './models.js';
for(const m of Object.values(MODELS)){
 test(`${m.name}: orientation maps preserve sides and transforms`,()=>{
  for(const f of m.faces){assert.equal(new Set(f.orientations.map(o=>JSON.stringify(o.placements))).size,f.orientations.length);const expected=f.orientations[0].placements.map(p=>p.side).sort((a,b)=>a-b);
   for(const o of f.orientations){assert.deepEqual(o.placements.map(p=>p.side).sort((a,b)=>a-b),expected);assert.equal(new Set(o.placements.map(p=>p.side)).size,o.placements.length);
    for(const p of o.placements){assert.ok(p.side>=0&&p.side<m.patCount*2);const a=placementMatrix(m.shape,p),x=.4,y=.2,X=a[0]*x+a[2]*y+a[4],Y=a[1]*x+a[3]*y+a[5],back=inverse(a,X,Y);assert.ok(Math.abs(back[0]-x)<1e-10);assert.ok(Math.abs(back[1]-y)<1e-10);}
   }
  }
 });
 test(`${m.name}: print table covers every physical side exactly once`,()=>{const ids=m.printOrder.flatMap(p=>[p.front.side,p.back.side]);assert.equal(ids.length,m.patCount*2);assert.deepEqual([...ids].sort((a,b)=>a-b),Array.from({length:m.patCount*2},(_,i)=>i));});
}

test('hexahexaflexagon has three two-orientation and three four-orientation faces',()=>{
 assert.deepEqual(MODELS.hexa.faces.map(f=>f.orientations.length).sort(),[2,2,2,4,4,4]);
 assert.equal(MODELS.hexa.faces.reduce((n,f)=>n+f.orientations.length,0),18);
});
test('faces and models own independent placements with complete destination slots',()=>{
 const seen=new Set();
 for(const model of Object.values(MODELS))for(const face of model.faces)for(const orientation of face.orientations){
  const count=model.shape==='square'?4:6;
  assert.deepEqual(orientation.placements.map(p=>p.slot).sort(),Array.from({length:count},(_,i)=>i));
  for(const placement of orientation.placements){assert.ok(!seen.has(placement));seen.add(placement);assert.ok(Number.isFinite(placement.rotation));}
 }
});
