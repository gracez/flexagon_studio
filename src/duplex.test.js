import test from 'node:test';
import assert from 'node:assert/strict';
import {shortEdgeBackPoint} from './duplex.js';

// This is the viewing transform after a landscape sheet is flipped on its
// short edge: PDF back coordinates appear mirrored across the page width.
function viewedFromFront([x,y],pageWidth){return [pageWidth-x,y];}

test('short-edge duplex mapping puts uncorrected back artwork in register',()=>{
 const front=[37,61],width=279.4;
 assert.deepEqual(viewedFromFront(shortEdgeBackPoint(front,width),width),front);
});

test('calibration measurements move the visible back artwork in the correcting direction',()=>{
 const front=[37,61],width=279.4;
 // If a test sheet shows the back 1.2 mm right and 0.7 mm down, the final
 // back artwork must move 1.2 mm left and 0.7 mm up when viewed from front.
 const corrected=viewedFromFront(shortEdgeBackPoint(front,width,{horizontal:1.2,vertical:.7}),width);
 assert.ok(Math.abs(corrected[0]-35.8)<1e-9);
 assert.ok(Math.abs(corrected[1]-60.3)<1e-9);
});
