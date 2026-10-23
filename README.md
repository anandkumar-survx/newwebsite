# TRINETRA interactive helmet showcase — starter

Frontend-only Vite + React + Three.js / React Three Fiber experience.

## Run locally
1. Install Node.js (current LTS).
2. Extract this folder.
3. In a terminal opened inside the folder:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL printed by Vite.

## Current prototype
- Loads the supplied `public/models/helmet.glb`.
- Fixed 3D viewer with scroll-driven model rotations.
- Drag-to-inspect using OrbitControls.
- Chapter cards for conformal antenna, audio system, night-vision mount, and shielding concept.
- Responsive layout intended for QR visitors on phones.
- No backend.

## Important model limitation
The supplied GLB contains one mesh (`obj1.001`) with one material, not separately selectable antenna/microphone/speaker/mount meshes. Current hotspots are approximate visual placeholders. Accurate labels, part-specific highlighting, and a real shell-opening animation require either a revised GLB with named/separated objects or geometry/animation authored from the real design. The shielding reveal in this starter is explicitly schematic.

## First iteration checklist
- Confirm the model's orientation/scale in a browser.
- Adjust camera and rotation keyframes in `src/main.jsx`.
- Replace approximate hotspots with positions matching the model.
- Add approved, verified descriptions and imagery.
- Run `npm run build` before deployment.
