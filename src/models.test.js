import test from 'node:test';
import assert from 'node:assert/strict';
import {MODELS,placementMatrix,inverse,printLayout,TETRA_NET,canonicalModelId} from './models.js';
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
 assert.deepEqual(MODELS.hexahexa.faces.map(f=>f.orientations.length).sort(),[2,2,2,4,4,4]);
 assert.equal(MODELS.hexahexa.faces.reduce((n,f)=>n+f.orientations.length,0),18);
});
test('faces and models own independent placements with complete destination slots',()=>{
 const seen=new Set();
 for(const model of Object.values(MODELS))for(const face of model.faces)for(const orientation of face.orientations){
  const count=model.shape==='square'?4:6;
  assert.deepEqual(orientation.placements.map(p=>p.slot).sort(),Array.from({length:count},(_,i)=>i));
  for(const placement of orientation.placements){assert.ok(!seen.has(placement));seen.add(placement);assert.ok(Number.isFinite(placement.rotation));}
 }
});

test('square net matches the reference top/underneath labels and covers all 16 sides',()=>{
 assert.equal(MODELS.tetra.patCount,8);
 assert.deepEqual(TETRA_NET.map(p=>[p.x,p.y]),[[0,4],[0,3],[1,3],[1,2],[2,2],[2,1],[3,1],[3,0]]);
 assert.deepEqual(TETRA_NET.map(p=>[p.topFace,p.underneathFace]),[[1,2],[3,2],[3,4],[1,4],[1,2],[3,2],[3,4],[1,4]]);
 for(let f=1;f<=4;f++){
  const expected=MODELS.tetra.printOrder.flatMap(p=>[p.front,p.back]).filter(p=>p.face===f).map(p=>p.side).sort((a,b)=>a-b);
  assert.equal(expected.length,4);
  for(const o of MODELS.tetra.faces[f-1].orientations)assert.deepEqual(o.placements.map(p=>p.side).sort((a,b)=>a-b),expected);
 }
 assert.deepEqual(MODELS.tetra.traversal,[1,2,3,4,1]);
 assert.equal(MODELS.tetra.orientationStatus,'unverified');
});
test('square glue net has a connected staircase with staggered blank surfaces',()=>{
 const layout=printLayout(MODELS.tetra,{addGlueFlap:true});
 assert.equal(layout.length,9);
 assert.equal(new Set(layout.map(p=>`${p.x},${p.y}`)).size,9);
 for(let i=1;i<layout.length;i++)assert.equal(Math.abs(layout[i].x-layout[i-1].x)+Math.abs(layout[i].y-layout[i-1].y),1);
 assert.deepEqual(layout[8].points,[[4,0],[5,0],[5,1],[4,1]]);
 assert.equal(layout[0].front,undefined);assert.equal(layout[8].front.side,0);assert.equal(layout[8].back,undefined);assert.deepEqual(layout[0].glueSides,['front']);assert.deepEqual(layout[8].glueSides,['back']);
});

for(const model of Object.values(MODELS))test(`${model.name}: tape layout has every pat and no glue flap`,()=>{
 const layout=printLayout(model,{addGlueFlap:false});
 assert.equal(layout.length,model.patCount);
 assert.ok(layout.every(cell=>!cell.flap));
 assert.deepEqual(layout.map(cell=>cell.pat).sort((a,b)=>a-b),Array.from({length:model.patCount},(_,i)=>i));
});

for(const model of Object.values(MODELS))test(`${model.name}: glue end shift preserves all artwork, separates flaps and leaves the base order unchanged`,()=>{
 const before=JSON.stringify(model.printOrder),tape=printLayout(model),glue=printLayout(model,{addGlueFlap:true});
 const core=glue.filter(p=>!p.splitGlue);
 assert.equal(glue.length,tape.length+1+(model.printSplit?1:0));
 const find=(layout,at)=>at==='first'?layout.find(p=>p.chainIndex===0):at==='last'?layout.find(p=>p.chainIndex===model.patCount-1):layout.find(p=>p.chainIndex===model.patCount);
 for(const move of model.glueMoves)assert.deepEqual(find(core,move.to.at)[move.to.side],find(tape,move.from.at)[move.from.side]);
 assert.deepEqual(glue.flatMap(p=>[p.front,p.back]).filter(Boolean).map(p=>p.side).sort((a,b)=>a-b),tape.flatMap(p=>[p.front,p.back]).map(p=>p.side).sort((a,b)=>a-b));
 assert.equal(glue.reduce((count,p)=>count+!p.front+!p.back,0),2+(model.printSplit?2:0));
 assert.equal(JSON.stringify(model.printOrder),before);
 // Editing the single base order propagates to both closure modes.
 const move=model.glueMoves[0],sourceIndex=move.from.at==='first'?0:model.patCount-1,sourceSide=move.from.side;
 const changed={...model,printOrder:model.printOrder.map((p,i)=>i!==sourceIndex?p:{...p,[sourceSide]:{...p[sourceSide],rotation:Math.PI}})};
 assert.equal(printLayout(changed)[sourceIndex][sourceSide].rotation,Math.PI);
 const changedGlue=printLayout(changed,{addGlueFlap:true}).filter(p=>!p.splitGlue);
 assert.equal(find(changedGlue,move.to.at)[move.to.side].rotation,Math.PI);
});

test('renamed model IDs support legacy project names without duplicating models',()=>{
 assert.deepEqual(Object.keys(MODELS),['tetra','trihexa','hexahexa']);
 assert.equal(MODELS.trihexa.id,'trihexa');assert.equal(MODELS.hexahexa.id,'hexahexa');
 assert.equal(canonicalModelId('tri'),'trihexa');assert.equal(canonicalModelId('hexa'),'hexahexa');
 for(const id of Object.keys(MODELS))assert.equal(canonicalModelId(id),id);
});
