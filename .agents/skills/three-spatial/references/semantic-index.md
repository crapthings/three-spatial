# Engine-independent semantic index

The index is JSON with `schemaVersion: 1`, a nonnegative `revision`, optional coordinate/style metadata and a `parts` array. It is a semantic/recipe catalog, not a mesh database or spatial acceleration tree.

Part kinds are `assembly`, `component`, and `procedural-set`. `partOf` is a stable semantic parent ID. `bindings: [{objectName, scope: 'object'}]` resolves an actual object through the Three.js adapter. `shared-geometry` with a declared `region: {min,max}` describes intent inside a fused mesh; it is not extracted faces or an independently editable transform.

| Operation | Fields | Result |
| --- | --- | --- |
| `describe-part` | `id` | role, parent, children, generator/identity policy |
| `describe-spatial-intent` | `id` | units, component dimensions, inherited style |
| `expand-part` | `id`, `depth` default 1, max 8 | semantic hierarchy without expanding atoms |
| `resolve-part` | `id`, `includeChildren` default true | descriptors; live adapter adds world positions/AABBs |
| `select-members` | `id`, optional `selector`, `offset`, `limit` default 20/max 100 | bounded member page and revision-bound selection |
| `resolve-selection` | `selection` | re-resolved member keys at the same revision |
| `validate-index` | none | unique IDs, parents, cycles, generator/intent/role validation |
| `inspect-relations` | optional exact `id` | author-declared incoming/outgoing relations |
| `convert-length` | `value`, `from`, `to` | explicit physical conversion |

Use the index CLI for these engine-free operations. `check-relations`, `export-index` and `update-procedural` are engine-side operations. A custom generator callback is required for updates; see [setup.md](setup.md).

## Procedural sets

Supported generator descriptions:

- `linear`: `count`, `origin`, `step`, optional `size`, `overrides`.
- `placements`: explicit `items: [{key,position}]` where those anchors are actual source inputs.
- `text`: `text`, `origin`, `step`; characters may be logical members without separate geometry.
- `polyline`: `points`, `maxSpacing`; derive stations from a compact open path with shared corners.

Generators may include a declared `frame` and `bindingTemplates` with `{index}`/`{key}` substitutions. Do not create semantic nodes for every generated bulb, leaf, pixel or fence spike. Explicit placements and sparse overrides still take storage; compact distributions should remain recipes.

Use one selector: `index`, `key`, half-open `range: [start,end]`, or `region: {min,max}`. Regions test recipe **anchor positions in the declared frame**, not world mesh intersection. `positionSource: generator-recipe` distinguishes those positions from measured live state.

A selection is `{part, revision, keys}`. Old revisions fail after regeneration. Index positions or array offsets are not automatically durable identities: define an identity policy. Slot keys can survive count changes while their world positions move; explicit placement keys can survive reordering. Decide whether inactive overrides are retained or removed in the domain recipe. The generic runtime does not decide that for an application.

Selection responses are bounded, but the implementation scans candidates in several query paths and validates the current graph on each request. Deep/large indexes need profiling before assuming scale. The skill does not install a database. Exact geometry, collision, visibility and runtime binding validity require the appropriate engine backend.
