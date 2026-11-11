# Construction and editing

Identify meaningful assemblies, their roles, and editable sources. Semantic composition is not transform parenting. Keep repeated details in collection recipes.

## Develop and refine the design

For open-ended creation, read [creative-direction.md](creative-direction.md): grow a coherent concept and connected details from the user's cues. Use [aesthetics.md](aesthetics.md) during construction and refinement to evaluate how those choices express the concept. Alternate invention and judgment as needed; narrow repairs retain the established direction.

Establish the whole at coarse resolution before expanding detail: primary masses, major openings, circulation, and a provisional viewing setup. Check those relationships first, then develop assemblies and repeated decoration. Use the permitted evidence at each stage; code-level checks do not establish rendered appearance. Revisit the coarse design when details expose a conflict instead of accumulating patches.

## Plan and edit

- Establish units, coordinate frames, position anchors, semantic front/up, and pivots. An origin need not be a bottom, center, or front surface. Inspect declared and measured dimensions; see [spatial-contract.md](spatial-contract.md).
- For scale or proportion decisions, read [proportions.md](proportions.md). Establish a reference and fixed versus adjustable relationships before choosing dimensions.
- Set final size and orientation before surface placement, then recalculate contact offsets. For origin placement, convert world points to parent-local coordinates. Facing a fixed target depends on final position.
- For architectural shells, remove internal and overlapping coplanar faces at joins. Model openings through the full wall thickness; decorative door/window panels do not establish passage.
- For missing surfaces, apparent clipping, or see-through solids, read [surfaces.md](surfaces.md). Diagnose topology and facing before changing material sidedness or camera clipping.
- Model actual hinge transforms when needed. Bundled rotation tools rotate around the object origin.
- Edit source/generator dimensions rather than stretching an assembly with protected clearances. After regeneration, re-resolve members and reject stale selections; preserve sparse overrides.
- For scene construction, review [layout.md](layout.md), [relations.md](relations.md), and [color.md](color.md). For narrow edits, load the affected topic only. Establish palette roles before material generation and support connections before decoration.

## Verify and persist

Check final position, orientation, dimensions, clearances, and affected neighbors together. Rotation can move descendants or introduce collisions. Review scene → zone → assembly → contents, then return to the whole.

Use actual geometry for functional requirements and permitted visual evidence for appearance. Report the checked scope and remaining uncertainty. A successful command alone is not task acceptance. Keep benchmark claims separate from engineering self-tests.

Offline mutations need an explicit output scene path; query that output next. Live mutations require an export to persist. Save project generator changes at their source.

```sh
node "$SKILL_ROOT/scripts/spatial/cli.js" artifacts/example-scene.json '{"op":"apply-transform","id":"block","position":[0,0.4,0]}' artifacts/placed.json
node "$SKILL_ROOT/scripts/spatial/cli.js" artifacts/placed.json '{"op":"orient-toward","id":"example.block","target":[2,0.4,2],"mode":"yaw"}' artifacts/final.json
```

These example positions are parent-local; the demo parent is identity. Operation-specific identifier rules and verification requests are in [operations.md](operations.md).
