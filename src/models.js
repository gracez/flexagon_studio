/**
 * EXPERIMENTAL FOLDING TABLES — edit this file to correct physical geometry.
 * Each placement identifies a physical pat SIDE, its slot, and local rotation.
 * Rotations are in radians. Orientations deliberately reuse the same side IDs.
 * printOrder is independent of face layout: each item is one physical pat,
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
      name: 'Face 01', orientations: [
        orientation('A', [0, 6, 14, 8], [-Math.PI / 2, Math.PI / 2, -Math.PI / 2, Math.PI / 2]),
        orientation('B', [6, 0, 8, 14], [Math.PI / 2, -Math.PI / 2, Math.PI / 2, -Math.PI / 2]),
      ]
    },
    {
      name: 'Face 02', orientations: [
        orientation('A', [3, 9, 1, 11], [0, Math.PI, 0, Math.PI]),
        orientation('B', [9, 3, 11, 1], [Math.PI, 0, Math.PI, 0]),
      ]
    },
    {
      name: 'Face 03', orientations: [
        orientation('A', [12, 2, 10, 4], [-Math.PI / 2, Math.PI / 2, -Math.PI / 2, Math.PI / 2]),
        orientation('B', [2, 12, 4, 10], [Math.PI / 2, -Math.PI / 2, Math.PI / 2, -Math.PI / 2]),
      ]
    },
    {
      name: 'Face 04', orientations: [
        orientation('A', [7, 13, 5, 15], [0, Math.PI, 0, Math.PI]),
        orientation('B', [13, 7, 15, 5], [Math.PI, 0, Math.PI, 0]),
      ]
    },
  ],
  trihexa: [
    {
      name: 'Face 01', orientations: [
        orientation('A', [0, 2, 7, 9, 12, 14], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [14, 12, 9, 7, 2, 0], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
    {
      name: 'Face 02', orientations: [
        orientation('A', [16, 1, 4, 6, 11, 13], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [13, 11, 6, 4, 1, 16], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
    {
      name: 'Face 03', orientations: [
        orientation('A', [15, 17, 3, 5, 8, 10], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
        orientation('B', [10, 8, 5, 3, 17, 15], [0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3, 0, 2 * Math.PI / 3]),
      ]
    },
  ],
  hexahexa: [
    {
      name: 'Face 01', orientations: [
        orientation('A', [0, 1, 2, 3, 4, 5], [0, 0, 0, 0, 0, 0]),
        orientation('B', [2, 3, 4, 5, 0, 1], [0, 0, 0, 0, 0, 0]),
        orientation('C', [4, 5, 0, 1, 2, 3], [0, 0, 0, 0, 0, 0]),
        orientation('D', [1, 0, 3, 2, 5, 4], [0, 0, 0, 0, 0, 0]),
      ]
    },
    {
      name: 'Face 02', orientations: [
        orientation('A', [6, 7, 8, 9, 10, 11], [0, 0, 0, 0, 0, 0]),
        orientation('B', [8, 9, 10, 11, 6, 7], [0, 0, 0, 0, 0, 0]),
        orientation('C', [10, 11, 6, 7, 8, 9], [0, 0, 0, 0, 0, 0]),
        orientation('D', [7, 6, 9, 8, 11, 10], [0, 0, 0, 0, 0, 0]),
      ]
    },
    {
      name: 'Face 03', orientations: [
        orientation('A', [12, 13, 14, 15, 16, 17], [0, 0, 0, 0, 0, 0]),
        orientation('B', [14, 15, 16, 17, 12, 13], [0, 0, 0, 0, 0, 0]),
        orientation('C', [16, 17, 12, 13, 14, 15], [0, 0, 0, 0, 0, 0]),
        orientation('D', [13, 12, 15, 14, 17, 16], [0, 0, 0, 0, 0, 0]),
      ]
    },
    {
      name: 'Face 04', orientations: [
        orientation('A', [18, 19, 20, 21, 22, 23], [0, 0, 0, 0, 0, 0]),
        orientation('B', [20, 21, 22, 23, 18, 19], [0, 0, 0, 0, 0, 0]),
      ]
    },
    {
      name: 'Face 05', orientations: [
        orientation('A', [24, 25, 26, 27, 28, 29], [0, 0, 0, 0, 0, 0]),
        orientation('B', [26, 27, 28, 29, 24, 25], [0, 0, 0, 0, 0, 0]),
      ]
    },
    {
      name: 'Face 06', orientations: [
        orientation('A', [30, 31, 32, 33, 34, 35], [0, 0, 0, 0, 0, 0]),
        orientation('B', [32, 33, 34, 35, 30, 31], [0, 0, 0, 0, 0, 0]),
      ]
    },
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

// Physical pat indices run from the lower-left end to the upper-right end.
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
MODELS.tetra.printOrder = TETRA_NET.map((cell, pat) => ({
  pat, x: cell.x, y: cell.y,
  front: { side: pat * 2, rotation: 0, face: cell.topFace },
  back: { side: pat * 2 + 1, rotation: 0, face: cell.underneathFace },
}));
MODELS.tetra.glueFlap = { x: 4, y: 0 }; // Extension at the upper-right endpoint.
MODELS.tetra.traversal = [1, 2, 3, 4, 1];
MODELS.tetra.orientationStatus = 'unverified';
// Glue closure keeps artwork on its original print side. `first` refers to the
// first original pat and `cap` is the added endpoint pat. Moving F1 to the cap
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
// The 18-pat hexahexaflexagon prints as two balanced strips. When glue is
// enabled, a separate overlapping tab reconnects the strips before folding.
MODELS.hexahexa.printSplit = { after: 9, rowGap: .5 };

// Print polygons in units of one pat edge. Base ordering is shared by both
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

// Apply declared surface moves simultaneously without mutating printOrder.
// The generic form keeps closure geometry editable if a model changes later.
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
  const result = [...baseLayout.map(entry => ({ ...entry })), { ...cap, points }];
  const indexFor = at => at === 'first' ? 0 : at === 'last' ? baseLayout.length - 1 : result.length - 1;
  const captured = moves.map(move => result[indexFor(move.from.at)][move.from.side]);
  moves.forEach(move => { result[indexFor(move.from.at)][move.from.side] = undefined; });
  moves.forEach((move, index) => { result[indexFor(move.to.at)][move.to.side] = captured[index]; });
  return result.map(entry => ({
    ...entry,
    glueSides: ['front', 'back'].filter(side => !entry[side]),
  }));
}

function splitTriangleLayout(layout, { after, rowGap }, addGlueFlap) {
  const firstRow = layout.filter(entry => entry.chainIndex < after);
  const secondRow = layout.filter(entry => entry.chainIndex >= after);
  if (addGlueFlap) {
    // This blank triangle overlaps the first pat of row two when the two strips
    // are joined. It is one physical tab with a blank front and back surface.
    firstRow.push({
      chainIndex: after,
      points: trianglePrintPoints(after),
      glueSides: ['front', 'back'],
      splitGlue: true,
    });
  }
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
