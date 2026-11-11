# Roles, support, and connections

Use for scene construction, component completeness, mounting, or floating-object defects. Identify what each meaningful assembly requires and what carries it before decoration. A porch may require columns and a beam; a wall lamp requires a mount. Treat deliberately floating effects as explicit exceptions.

## Index declarations

- Part `role`: semantic function.
- Part `requiresRoles: [{role,min}]`: required counts among direct children.
- Scene `roleRules`: role → `{requiresOutgoing: [relationType]}`.
- Scene `relations`: `{id,type,from,to,anchors?,tolerance?}` using part IDs.

Relation types are `attached-to`, `supports`, `connects`, and `defines-boundary`. `supports` points from carrier to carried part; `attached-to` points from mounted part to host. Anchors `{from:[x,y,z],to:[x,y,z]}` are endpoint-local; positive tolerance is in scene units. These declarations express project intent, not universal structural laws.

`validate-index` checks references, roles, and required relation types. `inspect-relations` lists declared relations for an optional exact part ID. `check-relations` requires a whole-object binding per endpoint and measures anchor coincidence plus distance to static triangles. Unsupported geometry or qualitative checks remain `unverified`.

## Support and mounting audit

1. Classify the assembly: ground-supported, resting, wall-mounted, suspended, cantilevered through a connector, or intentionally floating.
2. Locate contact regions and intermediate connectors. Check both ends of brackets, hangers, and backing panels.
3. Trace the chain to terrain or an established host, including components inside Groups. Parenting, whole-object overlap, and support cycles do not establish grounding.
4. Measure actual geometry in a common frame. Horizontal supports need contact coverage at the authored footprint; wall or sloped attachments need surface checks in the mounting direction. One coincident point or a ray hitting a remote support is insufficient. Small intentional insets may avoid numerical gaps; deep interpenetration cannot replace connectors.
5. Choose tolerance from units and modeling precision. Report measured separation separately; recheck contacts after size, pose, or generator edits.
6. Use permitted visual evidence for ambiguous connections. If unavailable, leave visual review unverified. Distinguish shadow or aliasing artifacts from measured gaps before moving geometry.

For signage, separately check glyph fit against the backing and backing attachment to its host. Merging disconnected geometry does not create physical support. For repeated structures, check grounding, rail continuity, corner/endpoint termination, and intended entrance gaps without persisting a node per post.

## Evidence and reporting

`check-relations` does not discover undeclared floating parts, trace support chains, check full footprints, or prove load capacity. Add scene-specific geometry checks where needed. Missing relations are missing evidence, not a pass.

For defects, report the assembly, intended carrier, missing link or contact gap, method, and outcome: `pass`, `fail`, or `unverified` (overall reports may be `needs-review`). Measured missing contact is a failure. State which support regions were checked; selected checks do not establish that the entire scene has no floating objects.

Review the whole against its intended role, including unexplained stubs, missing components, and opening/path alignment. Use [layout.md](layout.md) for content fit and density; supported assemblies can still be overcrowded.
