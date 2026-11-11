# Proportions and scale relationships

Use when establishing a scene's scale language, choosing component dimensions, or correcting something that feels too tall, squat, heavy, or small. Dimensions describe size; proportions describe relationships between sizes. Uniformly scaling a whole preserves its internal ratios but changes its relationship to the surroundings.

## Establish reference and intent

Choose a relevant reference: an actor, a known component, a usable container span, or a dominant assembly dimension. Use the brief's occupants and function rather than assuming human scale. Keep unknown physical scale unknown; relative proportions can still be designed within a consistent scene frame.

Identify what the relationships should communicate: slenderness, mass, hierarchy, repetition, or deliberate exaggeration. Preserve explicit dimensions and functional clearances. Separate fixed requirements from adjustable aesthetic choices; neither lowpoly geometry nor a generic “stylized” label authorizes arbitrary distortion. Ratios such as the golden ratio are optional design choices, not defaults.

## Review three scopes

| Scope | Relationships to consider |
| --- | --- |
| Within a component | Height/width/depth, thickness/span, taper, positive mass versus openings |
| Within an assembly | Part-to-whole size, supporting versus supported elements, relative prominence of siblings |
| Within the scene | Object-to-zone and object-to-actor scale, dominant versus supporting masses, repeated scale cues |

Review the affected scopes, then return to the whole. A plausible component can be oversized within its assembly; individually plausible assemblies can still conflict in scene scale. Use [layout.md](layout.md) for placement, density, and clearance rather than treating those as proportion errors.

## Express only useful relationships

For a ratio `A / B`, identify both measured spans, their parts/regions, frame, and purpose; use a positive nonzero denominator. Compare compatible units and distinguish external extent, usable interior, opening, and traversable clearance. Measure intrinsic proportions in an appropriate object/design frame: rotating an object changes its world AABB without changing its shape.

Record a target or range only when supplied by the brief or justified for the design. Describe qualitative intent when a number adds no useful constraint. Do not invent universal thickness ratios or infer engineering capacity from visual balance. Store relationships in project generator parameters or existing descriptions; the index has no dedicated proportion-constraint fields or solver.

## Edit coupled dimensions deliberately

Choose the dimension that drives the design and derive dependent dimensions where appropriate. Keep protected thicknesses, clearances, and sparse overrides independent. Changing one span may require redistributing repeats or changing their count rather than stretching every child. For PCG, sample related dimensions from shared constraints instead of independently randomizing each axis.

Edit the generator/source, regenerate, and re-resolve members. Recheck the changed relationships, contact chain, fit, and neighboring scale cues. Check whether the perceived problem comes from camera projection or occlusion before distorting correct geometry.

## Evidence limits

Dimension queries can support custom ratio checks, not judge “good proportions.” Separate configured targets from measured ratios and visual findings. Projected screen proportions depend on viewpoint and are not intrinsic shape measurements. Leave visual balance unverified when visual tools are prohibited or unavailable.
