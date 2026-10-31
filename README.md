# flexagon studio

A browser-only painting studio with live recombined pat previews, image import,
project downloads, and front/back PDF templates. No server or account required.

## Run

```sh
npm install
npm run dev
npm test
npm run build
```

The production build is in `dist/`. Deploy this directory to GitHub Pages,
Cloudflare Pages, Netlify, or another static host. Vite uses relative asset URLs,
so repository subpaths work. Streamlit needs a Python server and cannot itself
be hosted on GitHub Pages; the canvas-based app avoids that limitation.

Pushes to `main` deploy automatically through
`.github/workflows/deploy-pages.yml`. The published site is available at
`https://gracez.github.io/flexagon_studio/`.

## Painting and projects

Choose a flexagon, click a face orientation, and draw. The Sample design toggle
shows symmetric reference artwork in the canvas and all previews. The sample is
a separate overlay excluded from project saves and undo history; PDF exports
include it only while the toggle is on.

Painting uses the actual **libmypaint 1.3.0 C engine compiled to WebAssembly**,
through the pinned brushlib-wasm port. The locally served WASM engine computes
stroke dynamics, pressure response, spacing, randomness, and dab properties.
`src/mypaint-engine.js` supplies a Canvas 2D surface to render its dabs. Ink,
pencil, soft wash, and eraser are studio-defined libmypaint presets; size,
opacity, softness, pen pressure, and tilt are passed into the engine. Presets
currently do not map tilt to a visual effect. No simulated fallback brush is
used if WASM fails to load; the UI reports the load error.

This is a brush-engine integration, not the complete desktop MyPaint app.
Arbitrary `.myb` brush import, MyPaint's fixed-point tiled renderer, layers,
lock-alpha/colorize modes, and arbitrary image-stamp tips are not implemented.
The brush picker contains 13 studio-defined presets across Ink, Dry media,
Paint, Texture, and Erasers. Its stroke thumbnails are rendered with libmypaint;
preset settings are in `src/brush-presets.js`.
The vendored source, provenance, and rebuild instructions are in
`vendor/brushlib-wasm/README.md`; runtime and ISC license notices are in
`public/vendor/libmypaint/`. Normal builds do not require Emscripten.

Select **Lasso** (L), draw a closed freehand region, then drag inside it to move
its pixels. Copy, Cut, Paste, and Deselect buttons appear above the canvas;
Cmd/Ctrl+C/X/V, Escape, and Delete/Backspace also work. Paste centers the copied
region in the current face, including across models and orientations. Clipboard
contents are internal to the studio tab, not the operating system clipboard.
Selections capture actual transparent artwork, excluding the sample and guides.
Moves and pastes update all orientations and support undo/redo. Selection and
clipboard state are temporary and are not saved with a project.

Import PNG, WebP, or JPEG; alpha is preserved. Drag, scale, and rotate the image,
then Place to commit it into pat artwork. Image placement becomes rasterized;
there is no editable image layer after placement. Undo restores prior artwork.
History stores the last 16 edits for the current model and resets on model change.
Model artwork survives switching models. Save project downloads all model banks;
Open restores them. Local autosave stores a browser recovery copy after edits;
Save project remains the portable backup. The app prompts before leaving if the
latest artwork has neither been saved locally nor downloaded, or an image or
selection transform is still uncommitted.

## Correcting the folding logic

**All physical folding tables are experimental.** This app does not claim a
verified hexahexaflexagon simulation or a fold-tested construction template.
The provided mappings demonstrate the editing architecture and must be checked
against a real paper model before final production.

Edit `src/models.js`, independently of UI and brush code:

- `patCount`: physical double-sided pats, excluding the glue flap.
- `FACE_MAPS`: separate literal tables for `tetra`, `trihexa`, and `hexahexa`, each
  containing its own named faces and orientations.
- `orientation(name, sideIds, rotations)`: one absolute side ID and one rotation
  per destination slot. For example, `orientation('B', [2, 3, 4, 5, 0, 1],
  [0, 0, 0, 0, 0, 0])` places side 2 in slot 0, side 3 in slot 1, etc.
  Change any face independently; models do not share orientation rules.
- `faces[].orientations[].placements`: the resulting `{side, slot, rotation}` records.
  `side = patIndex * 2 + (back ? 1 : 0)`. Rotations use radians.
  All orientations of a face currently reuse its side IDs with draft permutations.
- `slotPolygon` and `placementMatrix`: geometric face assembly.
- `printOrder`: ordered physical pats with explicit `front` and `back` side IDs
  and rotations. Replace the generated draft array with literal records as needed.
- `TETRA_NET`: eight stair-step square coordinates with circled/top and
  uncircled/underneath face numbers from the supplied reference.
- `printLayout` in `src/models.js`: square net or alternating triangle chain
  with an optional glue end-shift. `exportPDF` in `src/main.js` fits it to the paper and
  reflects the back-sheet positions across the full page for landscape,
  short-edge duplex alignment. Artwork is
  drawn with a positive-orientation local transform so its contents are never
  mirrored; configured pat rotations still apply.

The square model now follows the supplied eight-square reference: eight
physical double-sided pats (16 surfaces), four faces, and two provisional views
per face. Starting at the bottom-left and moving along the stair-step chain,
the top/underneath pairs are 1/2, 3/2, 3/4, 1/4, repeated twice. The traversal
is 1 → 2 → 3 → 4 → 1. When glue is enabled, an extra square extends the upper-right end.
The reference establishes the net and face memberships, but does not establish
the exact slot permutations or artwork rotations in the folded views. Those
remain provisional in `FACE_MAPS.tetra` and the net's rotation fields. The user
can replace these manually. Older 32-surface square projects are rejected with
a specific message rather than silently losing or misassigning their artwork.
Trihexaflexagon uses 9 pats, 3 faces, and 2 draft orientations per face.
Hexahexaflexagon uses 18 pats, 6 faces, and orientation counts 4/4/4/2/2/2.
Its printable net is split after pat 9 into two balanced rows so the pats can
print substantially larger. With glue flaps enabled, one additional overlapping
triangle reconnects the rows before folding; the original closure flap remains.
With glue flaps disabled, the two rows are rejoined with flexible tape.

The renderer uses a 512×512 transparent canonical canvas per pat side. Face-space
brush marks are transformed back to these canvases with inverse affine mappings.
Every preview reads the same bank, so rearrangement is immediate. PDF raster
artwork is composited at 152 dpi (6 pixels/mm); page labels and the scale check
are vector text. Print the two-page PDF double-sided in landscape orientation,
choose short-edge flipping, and use Actual size / 100% with page scaling off.
As an alternative, print the pages separately at the same scale, cut out both
sides, and glue them together.

## Validation

`npm run test:browser` runs Playwright end-to-end checks (install its Chromium
browser first with `npx playwright install chromium --only-shell`). To keep the
browser isolated, set `PLAYWRIGHT_BROWSERS_PATH` to a temporary directory on both
installation and test commands.

`npm test` checks side counts, index bounds, orientation side-set conservation,
print coverage, and inverse transform round trips. Physical folding remains
unverified. Brush behavior and exports should also be checked in a real browser.

## Export closure options

US Letter landscape is the default. “Include glue flaps” is on by default. With it
off, the
base template has no extra pat and its ends are joined with tape as a flexible
joint. Tetraflexagon and hexahexaflexagon move the first front image to the
added front endpoint without crossing print sides. Trihexaflexagon instead
moves 1B to the added front endpoint. This keeps every front position filled
while leaving the first and added back positions blank. These relocations are declared in each
model's `glueMoves` table and run after reading each model's
single `printOrder`; do not maintain
separate glue and tape orders. The moved artwork retains its configured local
rotation. Triangle end placement preserves handedness when its direction flips.

Model IDs are `tetra`, `trihexa`, and `hexahexa`. Open automatically maps older
project IDs `tri` and `hexa` to the new names; new downloads use the new IDs.

## Artist controls

- Click the current brush tile to open the categorized preset picker. Brush size,
  opacity, and softness remain in the sidebar.
- Scroll over the canvas to zoom around the pointer (25–800%). Use Space + drag,
  the Pan tool (H), or the middle mouse button to pan. The View angle field
  rotates the working view. Fit (0) resets pan/rotation and calculates a zoom
  that fits the available canvas viewport. Fit mode automatically adapts to
  window, toolbar, and divider resizing. Manual zoom/pan/rotation exits Fit mode
  and preserves those settings until Fit is clicked again. These view
  transforms do not alter any pat artwork or printed output. Pointer positions
  are inverse-transformed so painting, lasso, image placement, and picking remain
  aligned. Zoom-in/out buttons and +/− shortcuts are also available.
- Eyedropper (I), or Alt-click with a drawing tool, samples actual artwork under
  the pointer, excluding the sample design and fold guides. The last eight chosen
  colors appear under Recent colors and persist locally between sessions.
- With a lasso selection, expand Transform to scale uniformly, rotate, and flip
  horizontally or vertically about the selection bounds' center. Changes preview
  in all orientations from the original pixels. Apply makes one undoable edit;
  Cancel (or Escape during a transform) restores the original exactly. Changing tools/views, moving/copying the
  selection, saving, or exporting commits a pending transform. Transformed artwork
  is clipped to the face. Selection transformations change artwork; View angle
  changes only how you see it.

## Local autosave and recovery

After about two seconds without edits, IndexedDB stores transparent PNG blobs
for every model bank plus the selected model, face, and orientation. Encoding
happens after painting stops, not on each pointer movement. `src/autosave.js`
rotates the latest snapshot into a previous snapshot in the same transaction;
a failed write keeps the prior recovery data. Writes are serialized, and edits
made during a save remain pending until another snapshot succeeds.

The studio opens immediately, with no startup dialog. A background check
restores the latest valid session automatically and briefly shows a Previous
session restored banner. If the latest copy is invalid, the previous copy is
tried automatically. If the user interacts before recovery finishes, the
current work is kept and a nonblocking Restore banner appears instead. Pending
recovery copies are not overwritten until that notice is dismissed or a copy
is explicitly restored.

Click the local-save status to inspect latest/previous copies, restore a
particular copy, or start new. Manual restore offers to download the current
project first. Recovery validates all metadata and images before replacing
in-memory artwork, and checks again that no user interaction occurred during
an automatic decode. Recovering Previous promotes it to a new latest snapshot.
Start new explicitly clears the canvas and both local recovery copies, with an
option to download the current project first. Downloaded files are kept.
An unavailable database or failed write is shown
in the status area, and manual downloads remain available.

Autosave excludes sample designs, undo history, clipboard, unplaced imported
images, and unfinished selection transforms. It waits for strokes, lasso moves,
and pending transforms to finish. View/navigation changes are saved once there
is a project to preserve. Tab hiding/page exit requests a best-effort flush,
but the final two seconds are not guaranteed to save if the browser crashes or
is force-closed. Watch for Saved locally before relying on the recovery copy.

Storage belongs to the same browser profile and origin (protocol, hostname,
and port). For local development, use the same URL/port each time; localhost
and 127.0.0.1 have separate storage. Clearing site data or browser eviction can
remove recovery, and private browsing may not retain it. This is local recovery,
not cloud sync; continue downloading project files for durable backups.

The studio fills the browser viewport without shrinking its controls. Tools and
previews scroll independently. The three panes remain side by side; narrow
windows can scroll the workspace horizontally. Header, model selector, and
footer stay outside the pane scroll areas. The canvas fits the remaining
visible area initially, so it does not center inside an oversized page.
