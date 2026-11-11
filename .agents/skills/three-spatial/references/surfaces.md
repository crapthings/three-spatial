# Surface integrity and visibility

Use for missing faces, unexpected transparency, apparent clipping, or interpenetration. Establish the intended geometry and visibility before choosing a repair; an intentional opening or cutaway is not a missing-face defect.

## Classify the structure

| Structure | Required surface relationships |
| --- | --- |
| Closed solid | A closed, consistently oriented boundary, without unintended holes or degenerate faces |
| Open shell with thickness | Inner and outer surfaces joined around exposed opening edges; preserve the intended opening |
| Thin sheet | An intentional zero-thickness surface with a defined viewing-side policy |
| Assembly | Correct contact and junctions between components; remove internal/coplanar duplicates when forming a unified solid |

For example, a well rim is an opening-edge connection in a thick shell, while a solid column needs a closed boundary. Choose the structural category from design intent, not the object name or primitive constructor. Mixed assemblies can contain several categories.

## Diagnose the failure

- **Missing surface:** inspect generator coverage, cap options, boundary loops, and thickness. Close only unintended boundaries. A full cap can incorrectly seal a deliberate opening; a two-sided material cannot supply missing geometry.
- **Incorrect facing:** inspect triangle winding and final transforms, including reflections. Correct winding at the generator/import source, then regenerate shading normals. `computeVertexNormals()` does not reverse triangles. Three.js defaults to `FrontSide`; use `DoubleSide` for an intended two-sided sheet or a scoped diagnostic, not as a global solid-repair policy.
- **Interpenetration:** verify actual surface intersection and placement. Repair dimensions/placement or construct the intended union/difference; hiding fragments does not repair topology. AABB overlap alone is insufficient evidence of penetration.
- **Depth conflict:** distinguish duplicate/coplanar surfaces from insufficient depth precision. Remove structural duplicates. Reserve polygon offset for intentional layering; disabling depth tests or changing render order can conceal defects and create others.

Backface culling rejects triangles by facing. Clipping removes geometry/fragments outside a volume or plane. Neither term identifies the cause of a “see-through” report by itself.

## Separate camera and presentation policy

If slicing occurs as the camera approaches, inspect camera position, near/far planes, and explicit clipping planes. Correct camera paths/collision or choose suitable distances and update the projection matrix. Avoid an unnecessarily tiny near plane or huge depth range.

For a requested camera cutaway, hide/fade selected occluders or use a clipping plane. Define picking, collision, shadow, and restoration behavior separately from physical geometry. Clipping does not automatically cap cut surfaces. WebGLRenderer material clipping planes require `localClippingEnabled`; other backends need their supported path.

## Verify at the appropriate level

Inspect indices, degeneracy, boundary coverage, transforms, and material settings. Account for split vertices at normal/UV seams when checking geometric edge connectivity. Scope closure checks to intended closed regions; a thin sheet has legitimate boundaries. Closure alone does not prove valid volume: check orientation, non-manifold connections, and self-intersections when relevant.

Use bidirectional rays where useful, with material sidedness accounted for; ordinary mesh rays do not reproduce shader clipping or transparency. The bundled CLI has no topology or rendered-visibility audit. Add focused geometry checks, state their scope, and leave final appearance unverified when visual tools are unavailable or prohibited.

References: [Material](https://threejs.org/docs/pages/Material.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html).
