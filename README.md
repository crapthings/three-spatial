# Three Spatial

Help your coding agent build 3D scenes that fit together.

**Three Spatial** helps coding agents create, continue, and refine Three.js and React Three Fiber scenes. It connects creative direction with shape, proportions, layout, materials, and geometry checks—whether you have a rough idea or an existing scene that needs a focused fix.

## Get started

Install it from your project directory:

```sh
npx skills add crapthings/three-spatial
```

Choose your coding agent when prompted. To install directly for Codex:

```sh
npx skills add crapthings/three-spatial --skill three-spatial -a codex
```

Add `-g` if you want it available across your projects.

Then ask your agent to use **three-spatial**. You don't need to learn the bundled commands to get started.

## Pick up wherever you are

You can install the skill at any stage. It starts with your current scene and request, preserves established choices, and loads the guidance needed for the next decision.

| Your task | Where the agent starts |
| --- | --- |
| A rough idea or a new scene | Develop a concept, establish primary forms and spatial relationships, then add detail. |
| Work already in progress | Inspect the existing design and continue from the unresolved decision. |
| Visual refinement | Identify the weak relationship and adjust the relevant shape, proportion, layout, or material choices. |
| A defect or measurement request | Diagnose the symptom or query the geometry directly. |

These are entry points, not a fixed sequence or ranking. Findings can change the route: an apparent proportion issue may come from the camera, and a color problem may come from lighting. The agent follows your scope and constraints, resolves dependencies for the current task, and rechecks affected relationships.

## Try asking

> Use three-spatial to build a procedural haunted estate with a clear entrance, sloped grounds, and a coherent low-poly palette.

> Check this porch. Fix any gaps between the stairs, landing, columns, and canopy without changing the doorway clearance.

> Arrange these objects on the shelves. Preserve their sizes, leave useful margins, and keep the display readable from the camera.

> Turn this model toward the doorway, then check its orientation and clearance in the final position.

## What it helps with

- **Creative direction and refinement:** develop a coherent concept from a rough idea, then refine its hierarchy, rhythm, and character.
- **Form and shape language:** develop silhouettes, connected masses, and purposeful openings before adding detail.
- **Placement and proportions:** units, coordinate frames, pivots, orientation, and functional clearances.
- **Connected assemblies:** support chains, mounting points, openings, and the relationships between parts.
- **Procedural worlds:** repeatable recipes, stable member identities, and edits that survive regeneration.
- **Layout and color:** visual hierarchy, usable space, palette roles, material response, and controlled variation.
- **Verification:** offline tools for dimensions, transforms, raycasts, constraints, and declared relationships.

The skill follows your project's art direction and tool restrictions. It works with scene JSON; a live Three.js bridge is optional. Geometry checks provide evidence for specific requirements, while visual quality still needs an appropriate review.

## Optional: use the tools yourself

The bundled scripts require **Node.js 24 or later**. Installing the skill does not install its runtime dependencies.

For semantic-index queries, no extra packages are needed. For geometry queries, install the pinned Three.js dependency inside the installed skill's `scripts` folder. For a default project installation:

```sh
export SKILL_ROOT="$PWD/.agents/skills/three-spatial"
(cd "$SKILL_ROOT/scripts" && npm ci --ignore-scripts --no-audit --no-fund)

# Generate a small example scene.
node "$SKILL_ROOT/scripts/create-example.js" artifacts

# Measure the example block.
node "$SKILL_ROOT/scripts/spatial/cli.js" artifacts/example-scene.json \
  '{"op":"inspect-dimensions","id":"example.block"}'
```

If you installed globally or in another location, set `SKILL_ROOT` to that folder instead. Your application does not need React or Vite to use the offline tools.

## Explore the skill

Start with [SKILL.md](.agents/skills/three-spatial/SKILL.md). Detailed references are loaded as needed:

- [Creative direction](.agents/skills/three-spatial/references/creative-direction.md) and [aesthetic refinement](.agents/skills/three-spatial/references/aesthetics.md)
- [Setup and integration](.agents/skills/three-spatial/references/setup.md)
- [Geometry and orientation commands](.agents/skills/three-spatial/references/operations.md)
- [Procedural collections and semantic indexes](.agents/skills/three-spatial/references/semantic-index.md)
- [Surface integrity and visibility](.agents/skills/three-spatial/references/surfaces.md)
- [Form and shape language](.agents/skills/three-spatial/references/form.md)
- [Proportions and scale relationships](.agents/skills/three-spatial/references/proportions.md)
- [Layout](.agents/skills/three-spatial/references/layout.md), [support and connections](.agents/skills/three-spatial/references/relations.md), and [color](.agents/skills/three-spatial/references/color.md)

The complete skill lives in `.agents/skills/three-spatial` and can also be copied into another project. It includes its own scripts, references, example index, and license.

## Contributing

Edit the skill in `.agents/skills/three-spatial`. Keep general guidance in its references and project-specific generators in the consuming project. Run the same checks as CI:

```sh
node scripts/check-skill.js
npm ci --prefix .agents/skills/three-spatial/scripts --ignore-scripts --no-audit --no-fund
node --test test/runtime.test.js
```

The runtime tests check measured results, persisted edits, validation exit codes, and unsupported contact evidence. They do not score creativity or visual quality.

## License

[MIT](LICENSE). Issues and improvements are welcome.
