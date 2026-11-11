---
name: three-spatial
description: Build, inspect, and edit Three.js or React Three Fiber scenes, including procedural worlds, component placement, dimensions, support connections, layout, and color/material design. Includes offline geometry and semantic-index tools.
---

# Three Spatial

This folder is self-contained. Resolve bundled paths relative to this file; `SKILL_ROOT` means its absolute directory. Keep generated scenes and project-specific generators in the user's project.

## Choose a representation

- Semantic JSON index: `node "$SKILL_ROOT/scripts/spatial-index/cli.js" index.json '<request>'`. Requires Node >=24, no packages.
- Three.js scene JSON or an existing live bridge: read [setup.md](references/setup.md) for runtime installation and integration.
- Other engines: reuse the index and design workflow with a project-owned geometry adapter; none is bundled.

Use existing scenes or offline files. Do not start a development server automatically. Respect the user's tool restrictions, including restrictions on visual review.

## Workflow

1. Establish units, coordinate frames, intended roles, editable sources, and protected dimensions. Object scale is dimensionless; meters require an explicit conversion.
2. Read [workflow.md](references/workflow.md) for construction or combined edits. Change generators/source parameters for durable edits; re-resolve generated members afterward.
3. Verify the final state against the task. Report measured failures and unverified aspects separately; geometry validity does not prove visual quality. Persist generator parameters or export scene changes.

## Load only relevant references

| Task | Reference |
| --- | --- |
| Units, size frames, style protections | [spatial-contract.md](references/spatial-contract.md) |
| CLI requests, orientation, constraints, limitations | [operations.md](references/operations.md) |
| Part-whole structure, PCG selection and identities | [semantic-index.md](references/semantic-index.md) |
| Composition, padding, density and circulation | [layout.md](references/layout.md) |
| Support chains, mounting and component completeness | [relations.md](references/relations.md) |
| Missing caps, disappearing faces, apparent clipping | [surfaces.md](references/surfaces.md) |
| Palette, material response, lighting and seeded color | [color.md](references/color.md) |
| Dependencies, examples and optional live bridge | [setup.md](references/setup.md) |
