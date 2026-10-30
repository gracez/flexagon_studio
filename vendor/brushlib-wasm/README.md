# Vendored libmypaint WebAssembly engine

Upstream: https://github.com/eliot-akira/brushlib-wasm
Pinned commit: 0953a920e090b1058e02142df28e109273e22f91
Embedded libmypaint version: 1.3.0 (see upstream readme).
License: ISC; the embedded C library's complete notice is in
`src/libmypaint/COPYING` and `public/vendor/libmypaint/LICENSE`.

The upstream prebuilt WASM binary is copied unchanged. `engine.js` contains only
the upstream Emscripten module factory, renamed `createLibMyPaintModule`, without
the UMD wrapper or upstream Painter class. Our adapter implements surface callbacks
in `src/mypaint-engine.js`; it does not use the upstream Painter implementation.
All engine files are served locally. No CDN or runtime network dependency.

Rebuilding requires isolated Emscripten 3.1.26. From this directory, the upstream
compile command is recorded in `upstream-package.json` under `wasm:common`;
run that command with an output path in a scratch directory, then copy the
resulting WASM and module factory to `public/vendor/libmypaint/`. No SDK is
needed for normal app installation, development, or production builds.
