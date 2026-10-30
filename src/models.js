/**
 * EXPERIMENTAL FOLDING TABLES — edit this file to correct physical geometry.
 * Each placement identifies a physical pat SIDE, its slot, and local rotation.
 * Rotations are in radians. Orientations deliberately reuse the same side IDs.
 * printOrder is independent of face layout: each item is one physical pat,
 * with explicit front/back side IDs and rotations. Back is reflected at export
 * as a complete sheet, for separately printed sheets glued back-to-back.
 * Square model: only 16/32 sides are assigned to visible faces. Remaining sides
 * are retained and exported blank until a reference folding model is supplied.
 */
const TAU = Math.PI * 2;
export const SQUARE = [[0,0],[1,0],[1,1],[0,1]];
export const TRIANGLE = [[0,0],[1,0],[.5,Math.sqrt(3)/2]];
// EDIT FACE_MAPS below: each model owns its own faces and orientations.
// orientation(name, sideIds, rotations): array index is the destination slot.
// sideIds are ABSOLUTE physical side IDs, not offsets relative to a face.
// rotations supplies one local rotation per slot, in radians.
// Triangle slots: upper-right wedge first, then clockwise.
// Square slots: top-left, top-right, bottom-left, bottom-right.
// These initial permutations preserve the prior draft behavior. They are NOT
// verified folding rules; edit each face independently using a paper reference.
function orientation(name, sideIds, rotations) {
  return {
    name,
    placements: sideIds.map((side, slot) => ({
      side,
      slot,
      rotation: rotations[slot],
    })),
  };
}

export const FACE_MAPS = {
  tetra: [
    { name: 'Face 01', orientations: [
      orientation('A', [0, 1, 2, 3], [0, 0, 0, 0]),
      orientation('B', [1, 2, 3, 0], [Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2]),
    ] },
    { name: 'Face 02', orientations: [
      orientation('A', [4, 5, 6, 7], [0, 0, 0, 0]),
      orientation('B', [5, 6, 7, 4], [Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2]),
    ] },
    { name: 'Face 03', orientations: [
      orientation('A', [8, 9, 10, 11], [0, 0, 0, 0]),
      orientation('B', [9, 10, 11, 8], [Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2]),
    ] },
    { name: 'Face 04', orientations: [
      orientation('A', [12, 13, 14, 15], [0, 0, 0, 0]),
      orientation('B', [13, 14, 15, 12], [Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2]),
    ] },
  ],
  tri: [
    { name: 'Face 01', orientations: [
      orientation('A', [0, 1, 2, 3, 4, 5], [0, 0, 0, 0, 0, 0]),
      orientation('B', [2, 3, 4, 5, 0, 1], [0, 0, 0, 0, 0, 0]),
    ] },
    { name: 'Face 02', orientations: [
      orientation('A', [6, 7, 8, 9, 10, 11], [0, 0, 0, 0, 0, 0]),
      orientation('B', [8, 9, 10, 11, 6, 7], [0, 0, 0, 0, 0, 0]),
    ] },
    { name: 'Face 03', orientations: [
      orientation('A', [12, 13, 14, 15, 16, 17], [0, 0, 0, 0, 0, 0]),
      orientation('B', [14, 15, 16, 17, 12, 13], [0, 0, 0, 0, 0, 0]),
    ] },
  ],
  hexa: [
    { name: 'Face 01', orientations: [
      orientation('A', [0, 1, 2, 3, 4, 5], [0, 0, 0, 0, 0, 0]),
      orientation('B', [2, 3, 4, 5, 0, 1], [0, 0, 0, 0, 0, 0]),
    ] },
    { name: 'Face 02', orientations: [
      orientation('A', [6, 7, 8, 9, 10, 11], [0, 0, 0, 0, 0, 0]),
      orientation('B', [8, 9, 10, 11, 6, 7], [0, 0, 0, 0, 0, 0]),
    ] },
    { name: 'Face 03', orientations: [
      orientation('A', [12, 13, 14, 15, 16, 17], [0, 0, 0, 0, 0, 0]),
      orientation('B', [14, 15, 16, 17, 12, 13], [0, 0, 0, 0, 0, 0]),
    ] },
    { name: 'Face 04', orientations: [
      orientation('A', [18, 19, 20, 21, 22, 23], [0, 0, 0, 0, 0, 0]),
      orientation('B', [20, 21, 22, 23, 18, 19], [0, 0, 0, 0, 0, 0]),
      orientation('C', [22, 23, 18, 19, 20, 21], [0, 0, 0, 0, 0, 0]),
      orientation('D', [19, 18, 21, 20, 23, 22], [0, 0, 0, 0, 0, 0]),
    ] },
    { name: 'Face 05', orientations: [
      orientation('A', [24, 25, 26, 27, 28, 29], [0, 0, 0, 0, 0, 0]),
      orientation('B', [26, 27, 28, 29, 24, 25], [0, 0, 0, 0, 0, 0]),
      orientation('C', [28, 29, 24, 25, 26, 27], [0, 0, 0, 0, 0, 0]),
      orientation('D', [25, 24, 27, 26, 29, 28], [0, 0, 0, 0, 0, 0]),
    ] },
    { name: 'Face 06', orientations: [
      orientation('A', [30, 31, 32, 33, 34, 35], [0, 0, 0, 0, 0, 0]),
      orientation('B', [32, 33, 34, 35, 30, 31], [0, 0, 0, 0, 0, 0]),
      orientation('C', [34, 35, 30, 31, 32, 33], [0, 0, 0, 0, 0, 0]),
      orientation('D', [31, 30, 33, 32, 35, 34], [0, 0, 0, 0, 0, 0]),
    ] },
  ],
};

const colors = ['#d76c49', '#598675', '#7183ba', '#cba34e', '#a47797', '#5b9ba5'];
function model(id, name, shape, patCount) {
  return {
    id, name, shape, patCount,
    faces: FACE_MAPS[id].map((face, index) => ({ ...face, color: colors[index] })),
    experimental: true,
    // Independent draft print order. Correct against a physical folding template.
    printOrder: Array.from({ length: patCount }, (_, i) => ({
      pat: i,
      front: { side: i * 2, rotation: 0 },
      back: { side: i * 2 + 1, rotation: 0 },
    })),
    note: shape === 'square'
      ? 'Square draft: 16 of 32 pat sides mapped. A reference template is needed to resolve the remaining sides.'
      : 'Draft permutations and strip ordering. Validate with a paper prototype before final artwork.',
  };
}

export const MODELS = {
  tetra: model('tetra', 'Tetraflexagon', 'square', 16),
  tri: model('tri', 'Trihexaflexagon', 'triangle', 9),
  hexa: model('hexa', 'Hexahexaflexagon', 'triangle', 18),
};

export function slotPolygon(shape,slot){
 if(shape==='square'){const x=180+(slot%2)*180,y=180+Math.floor(slot/2)*180;return [[x,y],[x+180,y],[x+180,y+180],[x,y+180]];}
 const a=-Math.PI/2+slot*TAU/6,b=a+TAU/6;return [[360,360],[360+270*Math.cos(a),360+270*Math.sin(a)],[360+270*Math.cos(b),360+270*Math.sin(b)]];
}
// Affine transform from a canonical square/triangle to its face slot.
export function placementMatrix(shape,placement){
 const p=slotPolygon(shape,placement.slot),h=Math.sqrt(3)/2;
 let m=shape==='square'?[p[1][0]-p[0][0],p[1][1]-p[0][1],p[3][0]-p[0][0],p[3][1]-p[0][1],p[0][0],p[0][1]]:[p[1][0]-p[0][0],p[1][1]-p[0][1],(p[2][0]-(p[0][0]+p[1][0])/2)/h,(p[2][1]-(p[0][1]+p[1][1])/2)/h,p[0][0],p[0][1]];
 const r=placement.rotation||0;if(!r)return m;
 const cx=.5,cy=shape==='square'?.5:h/3,c=Math.cos(r),s=Math.sin(r),[a,b,d,e,x,y]=m;
 return [a*c+d*s,b*c+e*s,-a*s+d*c,-b*s+e*c,x+a*(cx-c*cx+s*cy)+d*(cy-s*cx-c*cy),y+b*(cx-c*cx+s*cy)+e*(cy-s*cx-c*cy)];
}
export function inverse(m,x,y){const [a,b,c,d,e,f]=m,det=a*d-b*c;return [(d*(x-e)-c*(y-f))/det,(-b*(x-e)+a*(y-f))/det];}
