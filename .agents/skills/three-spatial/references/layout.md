# Layout and visual hierarchy

Use when constructing scenes, fitting contents, or reviewing crowding and circulation. Collision-free geometry alone does not establish a readable layout.

## Review across scales

- **Scene:** intended viewpoint, focal element, supporting zones, circulation, and deliberate empty space.
- **Assembly:** fit within its functional zone and effect on nearby fixtures.
- **Contents:** usable interior bounds, edge padding, headroom, sibling spacing, alignment, and rhythm.

Return to the whole after a local change. `partOf` expresses composition, not geometric containment or visual grouping. Preserve intentional density: a market and a sparse gallery need different layouts. Lowpoly style does not justify crowding or exaggerated proportions.

## Distinguish clearances

Physical clearance concerns access and function. Visual clearance concerns projected separation, readable margins, occlusion, and hierarchy. A usable world-space gap can disappear from the intended camera; deliberate overlap can be appropriate when its purpose remains clear.

Identify the content, usable container/region, common frame, permitted edits, and review viewpoint. Specify which margins matter: supported contents need headroom and side clearance, not an empty gap below their support.

Useful custom measurements:

- **Padding:** compare content extrema and usable container boundaries in container-local coordinates. A world AABB is conservative for rotated or irregular shapes.
- **Relative clearance:** divide a gap by a declared content dimension or usable span; state the denominator.
- **Row occupancy:** compare summed content widths with usable row width, alongside edge margins and sibling gaps. Occupancy alone cannot prove containment.
- **Projected overlap:** assess silhouettes and legibility from intended views, only when visual tools are permitted.

Choose targets for the brief. Aesthetic ratios are heuristics unless declared requirements.

## Correct the source

For crowding, consider count, rows, spacing, container dimensions, or simpler decoration. Preserve functional sizes instead of uniformly shrinking children. For sparsity, check purpose before adding objects.

Store collection-level span, spacing, edge margins, and sparse exceptions in the generator; regenerate and re-resolve. Local layout requirements take precedence over scene defaults.

## Evidence limits

The CLI provides dimensions, transforms, and pairwise geometry queries, but no built-in padding, occupancy, projected-overlap, or aesthetic-scoring operation. Use project configuration for layout intent and custom measurements for evidence; descriptions do not enforce constraints.

Report functional failures separately from visual findings and unverified appearance. A clear collision report does not establish layout quality. See [relations.md](relations.md) for support and mounting checks.
