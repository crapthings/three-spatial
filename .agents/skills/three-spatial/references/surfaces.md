# Missing surfaces and apparent clipping

Use when wells, columns, roofs, or other solids look hollow, disappear from one side, or appear to intersect. Establish whether the user reports a defect or requests an intentional cutaway before changing visibility.

## Diagnose the symptom

| Symptom | First checks |
| --- | --- |
| One side disappears as the camera moves | Triangle winding, material side, mirrored transforms |
| A rim or end is absent from every angle | Missing cap, wall thickness, incomplete generator topology |
| Geometry is sliced when the camera approaches | Camera near plane, camera position, explicit clipping planes |
| Surfaces flicker or alternate | Duplicate/coplanar faces and depth precision |
| One solid protrudes through another | Actual geometry intersection, placement, or missing Boolean cleanup |

Backface culling rejects triangles by their facing. Clipping removes geometry or fragments outside a volume/plane. Neither term alone establishes the cause of a reported “see-through” object.

## Repair the source geometry

- **Wells and hollow vessels:** build outer and inner walls plus an annular top rim with consistent winding. Add a bottom only where the design requires one. An open-ended cylinder supplies no rim surface; a full disk would incorrectly seal the opening. Close the annulus edges against both walls without coplanar duplicates.
- **Columns and other solids:** check top/bottom caps and all side surfaces. For a section intended to be closed, match boundary edges and avoid holes or degenerate triangles. At assembly junctions, verify actual contact; remove internal faces when forming a unified shell.
- **Wrong facing:** inspect indexed triangle order or non-indexed vertex order, with transformed facing for mirrored instances. Reverse incorrectly wound triangles at the generator/import source and regenerate normals afterward. `computeVertexNormals()` changes shading normals, not triangle winding.
- **Material sides:** Three.js defaults to `FrontSide`. `DoubleSide` can help diagnose sidedness or represent intentionally thin two-sided sheets, but it does not create caps, thickness, or missing triangles. Do not apply it globally to hide a broken solid.
- **Overlapping solids:** fix placement or construct the intended union/difference. Hiding surfaces, disabling depth testing, or changing render order does not repair interpenetration. Use polygon offset only for deliberately layered surfaces, not duplicate structural faces.

## Check camera and visibility separately

If the camera enters a solid or crosses its near plane, correct the camera path/collision or choose suitable near/far distances and update the projection matrix. Avoid an unnecessarily tiny near plane or huge depth range. Inspect configured clipping planes before changing geometry.

When the user requests a camera cutaway, hide/fade selected occluding wall or roof sections, or use an explicit clipping plane. Keep this presentation policy separate from physical topology. Define picking, collision, shadow, and restoration behavior; clipping does not automatically cap cut surfaces. For WebGLRenderer, material clipping planes require `localClippingEnabled`; other backends need their supported clipping path.

## Evidence

Inspect cap options, triangle indices, degeneracy, transforms, and material settings in code. For closed components, check boundary-edge coverage using geometric positions rather than assuming duplicate vertices are holes. Scope checks around intentional openings and assembly interfaces. Sample rays from both sides where useful, accounting for material sidedness; ordinary mesh rays do not reproduce shader clipping or transparency.

The bundled CLI has no topology or rendered-visibility audit. Add focused geometry checks and report the component and verified scope. Keep final appearance unverified when visual tools are unavailable or prohibited.

References: [Material](https://threejs.org/docs/pages/Material.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html).
