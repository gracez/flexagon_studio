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

## Painting and projects

Choose a flexagon, click a face orientation, and draw. The Sample design toggle
shows colored, numbered pat references with directional marks in the canvas and
all previews. The sample is a separate reference overlay, excluded from
project saves, undo history, and PDF exports. Ink, pencil, soft wash,
and eraser support size, opacity, and pen pressure. Softness controls radial
falloff. Brushes are native Canvas approximations, not a full natural-media
painting engine. A future high-quality engine could integrate
[libmypaint](https://github.com/mypaint/libmypaint) through WebAssembly, with
its license and build requirements reviewed for distribution.

Import PNG, WebP, or JPEG; alpha is preserved. Drag, scale, and rotate the image,
then Place to commit it into pat artwork. Image placement becomes rasterized;
there is no editable image layer after placement. Undo restores prior artwork.
History stores the last 16 edits for the current model and resets on model change.
Model artwork survives switching models. Save project downloads all model banks;
Open restores them. Closing the tab without saving loses work; the app prompts
on unsaved edits. There is no automatic persistent storage.

## Correcting the folding logic

**All physical folding tables are experimental.** This app does not claim a
verified hexahexaflexagon simulation or a fold-tested construction template.
The provided mappings demonstrate the editing architecture and must be checked
against a real paper model before final production.

Edit `src/models.js`, independently of UI and brush code:

- `patCount`: physical double-sided pats, excluding the glue flap.
- `FACE_MAPS`: separate literal tables for `tetra`, `tri`, and `hexa`, each
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
- `exportPDF` in `src/main.js`: strip topology (alternating triangular chain or
  straight square strip), blank end flap, reflected back sheet, and paper sizing.

Square ambiguity: the requested 16 double-sided squares provide 32 sides, while
four 2×2 square faces consume 16 sides. Current draft maps sides 0–15 and preserves
16–31 as blank hidden surfaces. A reference folding diagram is needed to resolve
this mismatch. Trihexaflexagon is assumed for “triflexagon”; it uses 9 pats,
3 hexagonal faces, 2 draft orientations per face. Hexahexaflexagon uses 18 pats,
6 hexagonal faces, and the requested orientation counts 2/2/2/4/4/4.

The renderer uses a 512×512 transparent canonical canvas per pat side. Face-space
brush marks are transformed back to these canvases with inverse affine mappings.
Every preview reads the same bank, so rearrangement is immediate. PDF raster
artwork is composited at 152 dpi (6 pixels/mm); page labels and the scale check
are vector text. Print fronts and backs separately at 100%, align matching cut
outlines back-to-back, then glue. This is not an automatic duplex template.

## Validation

`npm run test:browser` runs Playwright end-to-end checks (install its Chromium
browser first with `npx playwright install chromium --only-shell`). To keep the
browser isolated, set `PLAYWRIGHT_BROWSERS_PATH` to a temporary directory on both
installation and test commands.

`npm test` checks side counts, index bounds, orientation side-set conservation,
print coverage, and inverse transform round trips. Physical folding remains
unverified. Brush behavior and exports should also be checked in a real browser.
