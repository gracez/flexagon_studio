/**
 * EXPERIMENTAL FOLDING TABLES — edit this file to correct physical geometry.
 * Each placement identifies a physical leaf SIDE, its slot, and local rotation.
 * Rotations are in radians. Orientations deliberately reuse the same side IDs.
 * printOrder is independent of face layout: each item is one physical leaf,
 * with explicit front/back side IDs and rotations. PDF page geometry is kept
 * separately in PDF_LAYOUTS below so each model can be tuned independently.
 * Square net and face memberships transcribed from the supplied eight-square
 * reference. Exact folded arrangements/rotations still need a folding sequence.
 */
const TAU = Math.PI * 2;
export const HEXAGON_START_ANGLE = -2 * Math.PI / 3;
export const SQUARE = [[0, 0], [1, 0], [1, 1], [0, 1]];
export const TRIANGLE = [[0, 0], [1, 0], [.5, Math.sqrt(3) / 2]];
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
  // Side membership follows the user's top/underneath labels. A/B placements
  // below are PROVISIONAL: the net alone does not verify their slot or rotation.
  tetra: [
    {
      name: 'Face 1', orientations: [
        orientation('A', [0, 6, 14, 8], [-Math.PI / 2, Math.PI / 2, -Math.PI / 2, Math.PI / 2]),
        orientation('B', [6, 0, 8, 14], [Math.PI / 2, -Math.PI / 2, Math.PI / 2, -Math.PI / 2]),
      ]
    },
    {
      name: 'Face 2', orientations: [
        orientation('A', [3, 9, 1, 11], [0, Math.PI, 0, Math.PI]),
        orientation('B', [9, 3, 11, 1], [Math.PI, 0, Math.PI, 0]),
      ]
    },
    {
      name: 'Face 3', orientations: [
        orientation('A', [12, 2, 10, 4], [-Math.PI / 2, Math.PI / 2, -Math.PI / 2, Math.PI / 2]),
        orientation('B', [2, 12, 4, 10], [Math.PI / 2, -Math.PI / 2, Math.PI / 2, -Math.PI / 2]),
      ]
    },
    {
      name: 'Face 4', orientations: [
        orientation('A', [7, 13, 5, 15], [0, Math.PI, 0, Math.PI]),
        orientation('B', [13, 7, 15, 5], [Math.PI, 0, Math.PI, 0]),
      ]
    },
  ],
  trihexa: [
    {
      name: 'Face 1', orientations: [
        orientation('A', [0, 2, 7, 9, 12, 14], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [14, 12, 9, 7, 2, 0], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
    {
      name: 'Face 2', orientations: [
        orientation('A', [16, 1, 4, 6, 11, 13], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [13, 11, 6, 4, 1, 16], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
    {
      name: 'Face 3', orientations: [
        orientation('A', [15, 17, 3, 5, 8, 10], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [10, 8, 5, 3, 17, 15], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
  ],
  hexahexa: [
    {
      name: 'Face 1', orientations: [
        orientation('A', [0, 30, 24, 18, 12, 6], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
        orientation('B', [18, 12, 6, 0, 30, 24], [2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3]),
        orientation('C', [6, 12, 18, 24, 30, 0], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
        orientation('D', [6, 0, 30, 24, 18, 12], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
      ]
    },
    {
      name: 'Face 2', orientations: [
        orientation('A', [4, 34, 28, 22, 16, 10], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
        orientation('B', [22, 16, 10, 4, 34, 28], [2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3]),
        orientation('C', [10, 16, 22, 28, 34, 4], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
        orientation('D', [10, 4, 34, 28, 22, 16], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
      ]
    },
    {
      name: 'Face 3', orientations: [
        orientation('A', [8, 2, 32, 26, 20, 14], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
        orientation('B', [26, 20, 14, 8, 2, 32], [2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3]),
        orientation('C', [14, 20, 26, 32, 2, 8], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
        orientation('D', [14, 8, 2, 32, 26, 20], [-2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0, -2 * Math.PI / 3, 0]),
      ]
    },
    {
      name: 'Face 4', orientations: [
        orientation('A', [9, 7, 33, 31, 21, 19], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [7, 9, 19, 21, 31, 33], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
    {
      name: 'Face 5', orientations: [
        orientation('A', [13, 11, 1, 35, 25, 23], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [11, 13, 23, 25, 35, 1], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
    {
      name: 'Face 6', orientations: [
        orientation('A', [17, 15, 5, 3, 29, 27], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [15, 17, 27, 29, 3, 5], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
  ],
};

const colors = ['#d76c49', '#598675', '#7183ba', '#cba34e', '#a47797', '#5b9ba5'];
function model(id, name, shape, leafCount) {
  return {
    id, name, shape, leafCount,
    faces: FACE_MAPS[id].map((face, index) => ({ ...face, color: colors[index] })),
    experimental: true,
    // Independent draft print order. Correct against a physical folding template.
    printOrder: Array.from({ length: leafCount }, (_, i) => ({
      leaf: i,
      front: { side: i * 2, rotation: 0 },
      back: { side: i * 2 + 1, rotation: 0 },
    })),
    note: shape === 'square'
      ? 'Eight-square stair-step net and face memberships follow the supplied reference. Folded slot permutations, rotations, and flap closure still require verification.'
      : 'Draft permutations and strip ordering. Validate with a paper prototype before final artwork.',
  };
}

// Compatibility for project files saved before the model-ID rename.
export function canonicalModelId(id) {
  return id === 'tri' ? 'trihexa' : id === 'hexa' ? 'hexahexa' : id;
}

export const MODELS = {
  tetra: model('tetra', 'Tetraflexagon', 'square', 8),
  trihexa: model('trihexa', 'Trihexaflexagon', 'triangle', 9),
  hexahexa: model('hexahexa', 'Hexahexaflexagon', 'triangle', 18),
};

// EDIT PDF_LAYOUTS to tune the printable page for each model independently.
// mode: 'side' always reserves a side column; 'bands' uses top/bottom text;
// 'auto' chooses whichever gives the template more space.
// For landscape short-edge duplex printing, the back net is reflected across
// the full page width. Keep the front/back rails on opposite page edges so the
// reserved text area follows that same reflection.
export const PDF_LAYOUTS = {
  tetra: {
    mode: 'side', margin: 10, railWidth: 52, railGap: 6,
    frontRail: 'right', backRail: 'left', duplexFlip: 'short-edge',
    repeatInstructionsOnBack: false,
  },
  trihexa: {
    mode: 'auto', margin: 10, railWidth: 52, railGap: 6,
    frontRail: 'right', backRail: 'left', duplexFlip: 'short-edge',
  },
  hexahexa: {
    mode: 'bands', margin: 10, railWidth: 52, railGap: 6,
    frontRail: 'right', backRail: 'left', duplexFlip: 'short-edge',
  },
};

// Physical leaf indices run from the lower-left end to the upper-right end.
// front = circled/top numbers; back = uncircled/underneath numbers.
// Artwork rotation on the net is provisional until folded views are supplied.
export const TETRA_NET = [
  { x: 0, y: 4, topFace: 1, underneathFace: 2 },
  { x: 0, y: 3, topFace: 3, underneathFace: 2 },
  { x: 1, y: 3, topFace: 3, underneathFace: 4 },
  { x: 1, y: 2, topFace: 1, underneathFace: 4 },
  { x: 2, y: 2, topFace: 1, underneathFace: 2 },
  { x: 2, y: 1, topFace: 3, underneathFace: 2 },
  { x: 3, y: 1, topFace: 3, underneathFace: 4 },
  { x: 3, y: 0, topFace: 1, underneathFace: 4 },
];
MODELS.tetra.printOrder = TETRA_NET.map((cell, leaf) => ({
  leaf, x: cell.x, y: cell.y,
  front: { side: leaf * 2, rotation: 0, face: cell.topFace },
  back: { side: leaf * 2 + 1, rotation: 0, face: cell.underneathFace },
}));
MODELS.tetra.glueFlap = { x: 4, y: 0 }; // Extension at the upper-right endpoint.
MODELS.tetra.traversal = [1, 2, 3, 4, 1];
MODELS.tetra.orientationStatus = 'unverified';
// Glue closure keeps artwork on its original print side. `first` refers to the
// first original leaf and `cap` is the added endpoint leaf. Moving F1 to the cap
// leaves a front flap at the start and a back flap at the added endpoint.
MODELS.tetra.glueMoves = [
  { from: { at: 'first', side: 'front' }, to: { at: 'cap', side: 'front' } },
];
MODELS.trihexa.glueMoves = [
  // Move 1B to the added front endpoint. The front sheet then contains
  // 1F–9F followed by 1B; the back sheet has blank endpoints around 9B–2B.
  { from: { at: 'first', side: 'back' }, to: { at: 'cap', side: 'front' } },
];
MODELS.hexahexa.glueMoves = [
  { from: { at: 'first', side: 'front' }, to: { at: 'cap', side: 'front' } },
];
// The 18-leaf hexahexaflexagon prints as two balanced strips. When glue is
// enabled, a separate overlapping tab reconnects the strips before folding.
// On the back sheet, 10B moves to that upper tab and its original position
// becomes the corresponding glue panel. This move remains model-specific;
// triangular-strip parity is deliberately not inferred by shared code.
MODELS.hexahexa.printSplit = {
  after: 9,
  rowGap: .5,
  surfaceMoves: [
    { from: { at: 'chain', index: 9, side: 'back' }, to: { at: 'splitTab', side: 'back' } },
  ],
};

// Print polygons in units of one leaf edge. Base ordering is shared by both
// closure modes; the optional glue step below never mutates model.printOrder.
function trianglePrintPoints(index) {
  const x = index / 2, h = Math.sqrt(3) / 2;
  return index % 2 === 0
    ? [[x, h], [x + 1, h], [x + .5, 0]]
    : [[x, 0], [x + 1, 0], [x + .5, h]];
}
function basePrintLayout(model) {
  return model.printOrder.map((cell, index) => ({
    ...cell, chainIndex: index,
    points: model.shape === 'square'
      ? SQUARE.map(([x, y]) => [x + cell.x, y + cell.y])
      : trianglePrintPoints(index),
  }));
}
function endCap(model) {
  if (model.shape === 'square') {
    return {
      ...model.glueFlap, chainIndex: model.printOrder.length,
      points: SQUARE.map(([x, y]) => [x + model.glueFlap.x, y + model.glueFlap.y]),
    };
  }
  return { chainIndex: model.printOrder.length, points: trianglePrintPoints(model.printOrder.length) };
}

// Move artwork between already-created physical panels. The caller owns the
// topology and resolves model-specific location names to concrete panels.
function applySurfaceMoves(entries, moves, resolve) {
  const result = entries.map(entry => ({ ...entry }));
  const resolved = moves.map(move => ({ move, from: resolve(result, move.from), to: resolve(result, move.to) }));
  if (resolved.some(({ from, to }) => !from || !to)) throw Error('Invalid printable surface move.');
  const captured = resolved.map(({ from, move }) => from[move.from.side]);
  resolved.forEach(({ from, move }) => { from[move.from.side] = undefined; });
  resolved.forEach(({ to, move }, index) => { to[move.to.side] = captured[index]; });
  return result.map(entry => ({ ...entry, glueSides: ['front', 'back'].filter(side => !entry[side]) }));
}

// Add the closure cap, then apply only the moves declared by this model.
export function applyGlueEndShift(baseLayout, cap, moves = []) {
  if (!baseLayout.length) return [];
  const first = baseLayout[0];
  let points = cap.points;
  if (points.length === 3) {
    const winding = p => (p[1][0] - p[0][0]) * (p[2][1] - p[0][1])
      - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]);
    // A triangle at the new endpoint may point the opposite way. Preserve
    // artwork handedness: rotate it into that triangle rather than mirror it.
    if (winding(points) * winding(first.points) < 0) points = [points[1], points[0], points[2]];
  }
  const entries = [...baseLayout, { ...cap, points }];
  return applySurfaceMoves(entries, moves, (result, location) =>
    location.at === 'first' ? result[0]
      : location.at === 'last' ? result[baseLayout.length - 1]
        : location.at === 'cap' ? result.at(-1) : undefined);
}

function splitTriangleLayout(layout, { after, rowGap, surfaceMoves = [] }, addGlueFlap) {
  let entries = layout;
  if (addGlueFlap) {
    // This triangle overlaps the first leaf of row two when the strips join.
    const splitTab = {
      chainIndex: after,
      points: trianglePrintPoints(after),
      splitGlue: true,
    };
    entries = applySurfaceMoves([...layout, splitTab], surfaceMoves, (result, location) =>
      location.at === 'splitTab' ? result.find(entry => entry.splitGlue)
        : location.at === 'chain' ? result.find(entry => !entry.splitGlue && entry.chainIndex === location.index) : undefined);
  }
  const firstRow = entries.filter(entry => entry.splitGlue || entry.chainIndex < after);
  const secondRow = entries.filter(entry => !entry.splitGlue && entry.chainIndex >= after);
  const h = Math.sqrt(3) / 2;
  const placeRow = (entries, y) => {
    const minX = Math.min(...entries.flatMap(entry => entry.points.map(point => point[0])));
    return entries.map(entry => ({
      ...entry,
      points: entry.points.map(([x, py]) => [x - minX, py + y]),
    }));
  };
  return [
    ...placeRow(firstRow, 0),
    ...placeRow(secondRow, h + rowGap),
  ];
}

export function printLayout(model, { addGlueFlap = false } = {}) {
  const base = basePrintLayout(model);
  const layout = addGlueFlap
    ? applyGlueEndShift(base, endCap(model), model.glueMoves)
    : base;
  return model.printSplit
    ? splitTriangleLayout(layout, model.printSplit, addGlueFlap)
    : layout;
}

export function slotPolygon(shape, slot) {
  if (shape === 'square') { const x = 180 + (slot % 2) * 180, y = 180 + Math.floor(slot / 2) * 180; return [[x, y], [x + 180, y], [x + 180, y + 180], [x, y + 180]]; }
  const a = HEXAGON_START_ANGLE + slot * TAU / 6, b = a + TAU / 6; return [[360, 360], [360 + 270 * Math.cos(a), 360 + 270 * Math.sin(a)], [360 + 270 * Math.cos(b), 360 + 270 * Math.sin(b)]];
}
// Affine transform from a canonical square/triangle to its face slot.
export function placementMatrix(shape, placement) {
  const p = slotPolygon(shape, placement.slot), h = Math.sqrt(3) / 2;
  let m = shape === 'square' ? [p[1][0] - p[0][0], p[1][1] - p[0][1], p[3][0] - p[0][0], p[3][1] - p[0][1], p[0][0], p[0][1]] : [p[1][0] - p[0][0], p[1][1] - p[0][1], (p[2][0] - (p[0][0] + p[1][0]) / 2) / h, (p[2][1] - (p[0][1] + p[1][1]) / 2) / h, p[0][0], p[0][1]];
  const r = placement.rotation || 0; if (!r) return m;
  const cx = .5, cy = shape === 'square' ? .5 : h / 3, c = Math.cos(r), s = Math.sin(r), [a, b, d, e, x, y] = m;
  return [a * c + d * s, b * c + e * s, -a * s + d * c, -b * s + e * c, x + a * (cx - c * cx + s * cy) + d * (cy - s * cx - c * cy), y + b * (cx - c * cx + s * cy) + e * (cy - s * cx - c * cy)];
}
export function inverse(m, x, y) { const [a, b, c, d, e, f] = m, det = a * d - b * c; return [(d * (x - e) - c * (y - f)) / det, (-b * (x - e) + a * (y - f)) / det]; }
