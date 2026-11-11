# Geometry and orientation operations

Use `node "$SKILL_ROOT/scripts/spatial/cli.js" <scene.json|http://127.0.0.1:5173> '<request>' [output.json]`. `@request.json` can replace inline JSON. Runtime setup is in [setup.md](setup.md).

| Operation | Fields | Result |
| --- | --- | --- |
| `describe-scene` | none | scene measurement and style declaration |
| `list` | none | object names/UUIDs/types |
| `inspect-object` | `id` | local TRS, world matrix/position, world AABB |
| `inspect-dimensions` | `id` | unscaled local geometry and world AABB size |
| `transform-point` | `point`, `from`, `to` | conversion between object frames or `world` |
| `measure-distance` | `a`, `b`, `mode: origin` or `aabb`, optional `unit` | origin distance or AABB lower-bound separation |
| `check-overlap` | `a`, `b` | world AABB overlap, including touching |
| `raycast` | world `origin`, world `direction` | first 100 material-sided mesh intersections |
| `apply-transform` | `id`, local `position`, `quaternion`, `scale` | updated object description |
| `inspect-orientation` | `id`, optional local `front`/`up` | local axes/quaternion and actual world axes/position |
| `measure-angle` | `a`, `b`, optional world `about` normal | unsigned 3D angle or signed projected heading |
| `orient-toward` | `id`, target point, optional `frame`, `mode`, `worldUp` | verified front alignment |
| `align-axis` | `id`, `axis`, target `direction`, optional `frame`/`mode` | verified axis alignment |
| `check-constraints` | `constraints` array, 1..100 | per-constraint errors and overall pass |
| `export-scene` | none | complete Three.js JSON snapshot |

Default world lengths are scene-unit, never presumed meters. `measure-distance` may request `unit: meter` if calibration is known. Local transforms remain parent-local; use frame conversion rather than treating them as world meters. Quaternion order is `[x,y,z,w]`; rotations/tolerances use radians. Matrix arrays are Three.js column-major.

Object names must be unique or use UUIDs. Geometry operations generally use names/UUIDs. `inspect-dimensions` and orientation operations additionally accept semantic IDs with one whole-object binding (the registered root can identify itself). `resolve-part` returns runtime IDs for other operations. Multi-object/fused parts require a chosen concrete transform.

Offline `apply-transform`, `orient-toward`, `align-axis` and `update-procedural` require an explicit output scene path. Subsequent queries must read that output. Other commands write their response to the optional output path. For live mutations that path saves only the response; use `export-scene` to save the actual scene.

## Direction conventions

Declare local `orientation: {front,up}` on semantic parts or object `userData`. Query precedence is request overrides → object metadata → unique semantic declaration → engine default (+Z/+Y objects, -Z/+Y cameras). Defaults are labeled `engine-default-assumption`; imported model front is not verified by that label. Front/up must be nonzero and perpendicular.

`measure-angle` descriptors are `{id,axis: 'front'|'up'|[x,y,z]}` or `{direction:[x,y,z],frame:'world'|objectId}`. Without `about`, measure full unsigned 3D angle. With `about`, project onto its perpendicular plane and return signed [-π,π] heading. Right-hand positive +Z toward +X around +Y is +90°. Degenerate directions/projections fail.

`orient-toward` defaults to `yaw`: the object must be upright, and the target direction is projected perpendicular to `worldUp` (default world +Y). A target directly above/below has no heading. Free mode aligns full front and constrains roll by projecting worldUp; choose another worldUp when parallel to the target direction.

`align-axis` defaults to free minimal-twist alignment of one local axis; roll is otherwise unconstrained. Yaw is available for suitable horizontal axes. Rotation tools require positive uniform scale and automatic local/world matrix updates throughout the ancestor chain. They convert world orientation back into parent-local quaternion, verify angular error and position drift, and roll back failures. Other component clearance and swept collisions require separate checks.

## Constraints

- `world-position`: `id`, world `target`.
- `origin-distance`: `a`, `b`, nonnegative `distance`.
- `world-aabb-size`: `id`, positive X/Y/Z `target`; uses maximum component error.
- `face-target`: `id`, world target point, optional local `axis`; defaults to semantic front.
- `upright`: `id`, optional world `up` direction.
- `aabb-no-overlap`: `a`, `b`; broad phase only.

Length constraints accept `unit: scene-unit` (default) or `meter`; target/error/tolerance use that unit. Default length tolerance is 0.001 scene units, not universally one millimeter. Angular constraints use radians with default tolerance 0.01; face-target's target coordinates are still scene units. For yaw-only comparisons use projected heading, because full face-target error includes vertical difference.

AABBs are conservative and include descendants. Ray hits depend on mesh material sides and do not prove visibility/physical collision. Static dimension measurements reject instancing, skinning and active morph targets; shaders/deformation need specialized adapters. Relations and whole completeness have separate requirements in [relations.md](relations.md).
