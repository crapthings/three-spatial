# Color, materials, and lighting

Use for scene creation, style changes, or palette review. Preserve the user's art direction; retro or lowpoly geometry does not prescribe darkness, saturation, or particular swatches.

## Define color roles

Choose roles for the background, subjects, supporting structures, accents, and functional cues. Adapt them to the brief rather than requiring a fixed color count or area ratio.

Establish where attention should go. Review scene → zone → assembly → detail; a local accent should support the overall hierarchy. Combine value, hue, saturation, material response, and placement. Different hues can merge under lighting or when their values are similar. Preserve useful separation of silhouettes, entrances, and walking surfaces; reinforce functional color cues with shape or placement.

## Diagnose appearance at its source

Distinguish material base color from appearance under lights, environment, fog, exposure, and tone mapping. Check input/output color-space handling and distinguish color textures from data maps before compensating for dark or washed-out results.

Select roughness, metalness, and surface variation for the intended material and stylization. A shared palette need not make stone, wood, and metal respond identically. Emissive surfaces do not by themselves illuminate neighbors; avoid using emission to brighten every unclear object.

Change the relevant layer: palette, material, lighting, fog, or renderer settings. Preserve project lighting restrictions and task scope. Check shared material ownership before recoloring in place.

## Keep PCG coherent

Store palette roles and bounded variation in project-owned material/generator recipes. Vary by material, zone, or collection rather than unrestricted per-object RGB unless disorder is intended.

Use stable member keys or an independent color random stream so palette edits do not alter placement. Preserve sparse overrides and reproducibility. Sample representative seeds for accent distribution and material-family consistency; exact accent counts are necessary only when specified. Re-resolve members after regeneration. The index has no formal palette fields; use existing descriptions or project configuration.

## Evidence limits

Code can verify assignments, parameter ranges, shared materials, render settings, and seeded generation. State what a numerical comparison measures: base-color luminance or distance is not rendered contrast, and encodings must be compatible. UI text contrast thresholds do not automatically apply to lit surfaces.

There is no bundled palette audit or aesthetic-scoring operation. Use only permitted visual tools; when visual review is prohibited or unavailable, report final appearance as unverified. Separate configured intent, measured evidence, and visual findings.

For example, a horror estate may use cool stone and selective warm lamps. The reusable goal is entrance recognition, controlled accents, and separation from the surroundings—not a mandatory horror palette.
