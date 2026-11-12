# Form and shape language

Use when developing geometry from a concept, refining silhouettes, or replacing an assembly that reads as unrelated primitives. Form concerns three-dimensional masses and their relationships; shape includes the outlines and negative spaces they produce. Preserve the user's established design when making a narrow repair.

## Translate intent into a form vocabulary

Choose qualities that support the [creative direction](creative-direction.md): rounded or angular, compact or extended, tapered or flared, continuous or segmented. Relate them to function, material, construction, and the intended experience. These are choices, not universal meanings; round does not always mean friendly, nor angular hostile.

Use a coherent vocabulary across related components, allowing deliberate exceptions for contrast or function. Do not force every object into the same primitive or distort protected dimensions to maintain a motif.

## Establish silhouette and mass hierarchy

Build the primary mass and recognizable outline before secondary forms and surface detail. Give secondary masses a clear relationship to the whole: extend, support, interrupt, frame, or balance it. Reserve small features for articulation and identity rather than using ornament to conceal a weak silhouette.

Consider the intended view or range of views, including overlap and the spaces between masses. For explorable objects, avoid a silhouette that works only from one favorable angle. A monochrome or silhouette review can isolate form when visual tools are permitted; code-only inspection cannot establish perceptual recognition.

## Shape connections and voids deliberately

Choose how forms meet: continuous transition, articulated joint, visible layering, inset, or separation. Primitives are useful construction tools, but their intersections should express the intended assembly. Use profiles, sections, taper, bevels, unions, or differences where they improve that relationship; more complex geometry is not inherently better.

Treat negative space as authored geometry: openings, recesses, slots, and gaps affect recognition as much as solid masses. Distinguish a surface marking from a recess and a recess from a through-opening. Preserve wall thickness, support, and usable clearance when cutting or reshaping.

For relative dimensions use [proportions.md](proportions.md); for watertightness, winding, and intersections use [surfaces.md](surfaces.md). An intentional articulated seam need not become a Boolean union, while a continuous solid should not retain unexplained internal faces.

## Simplify and generate families

Preserve the features that carry identity and function at the intended viewing scale. Spend geometry on silhouette, meaningful section changes, and important transitions before tiny surface features. Simplification can remove or merge details without replacing every shape with a generic box or cylinder.

For PCG, define related profiles, section changes, connection rules, and bounded variations at the generator source. Vary selected traits while preserving family identity and functional requirements; independent random axis scaling is not a shape language.

Reassess the whole with [aesthetics.md](aesthetics.md) after local changes. Distinguish authored form intent and verified geometry from visual judgments. There is no bundled silhouette-quality or shape-recognition score; leave appearance unverified when visual review is prohibited or unavailable.
